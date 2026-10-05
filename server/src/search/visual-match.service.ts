import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { PrismaService } from "../prisma/prisma.service";

export type VisualScore = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  score: number;
  hashDistance: number;
  colorScore: number;
  exact: boolean;
};

type VisualRecord = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  hash: string;
  grid: number[];
};

type VisualIndex = {
  version: 2;
  signature: string;
  builtAt: string;
  records: VisualRecord[];
};

const INDEX_PATH = path.join(process.cwd(), ".cache", "visual-index.json");
const INDEX_VERSION = 2;
const SIGNATURE_TTL_MS = 60_000;
const BUILD_BATCH = 5_000;

function hamming(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let dist = 0;
  for (let i = 0; i < len; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
  }
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

function colorScore(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = (a[i] - b[i]) / 255;
    sum += d * d;
  }
  const rms = Math.sqrt(sum / n);
  return Math.max(0, 1 - rms);
}

function thumbRemote(url: string): string {
  if (!url.includes("images.unsplash.com")) return url;
  return url
    .replace(/([?&])w=\d+/g, "$1w=160")
    .replace(/([?&])h=\d+/g, "$1h=160")
    .replace(/([?&])q=\d+/g, "$1q=70");
}

@Injectable()
export class VisualMatchService {
  private memoryIndex: VisualIndex | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async fingerprintBuffer(buf: Buffer): Promise<{
    hash: string;
    grid: number[];
    width: number;
    height: number;
  }> {
    const meta = await sharp(buf, { failOn: "none" }).rotate().metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    const hashRaw = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize(9, 8, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();

    let bits = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        bits += hashRaw[y * 9 + x] > hashRaw[y * 9 + x + 1] ? "1" : "0";
      }
    }
    let hash = "";
    for (let i = 0; i < 64; i += 4) {
      hash += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }

    const gridRaw = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize(4, 4, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer();

    return { hash, grid: Array.from(gridRaw), width, height };
  }

  async normalizeSearchImage(buf: Buffer): Promise<{
    jpeg: Buffer;
    width: number;
    height: number;
  }> {
    const image = sharp(buf, { failOn: "none" }).rotate();
    const meta = await image.metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;
    if (width < 16 || height < 16) {
      throw new Error(
        "Image is too small or empty. Please upload a clear product photo.",
      );
    }
    const jpeg = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    const out = await sharp(jpeg).metadata();
    return {
      jpeg,
      width: out.width || width,
      height: out.height || height,
    };
  }

  private async loadBufferFromSrc(src: string): Promise<Buffer | null> {
    try {
      if (src.startsWith("/")) {
        // Local uploads live in <server>/uploads (served at /uploads)
        const file = path.join(process.cwd(), src.replace(/^\//, ""));
        return await fs.readFile(file);
      }
      const res = await fetch(thumbRemote(src), {
        headers: { "User-Agent": "AhonaImageSearch/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  /**
   * Cheap change detector for the catalog's images: active product count +
   * newest updatedAt (any image edit or (de)activation bumps updatedAt).
   * Checked at most once per SIGNATURE_TTL_MS.
   */
  private signatureAt = 0;
  private signatureValue: Promise<string> | null = null;
  private catalogSignature(): Promise<string> {
    if (
      this.signatureValue &&
      Date.now() - this.signatureAt < SIGNATURE_TTL_MS
    ) {
      return this.signatureValue;
    }
    this.signatureAt = Date.now();
    this.signatureValue = this.prisma.product
      .aggregate({
        where: { isActive: true },
        _count: { _all: true },
        _max: { updatedAt: true },
      })
      .then(
        (agg) =>
          `${agg._count._all}:${agg._max.updatedAt?.toISOString() ?? "-"}`,
      );
    this.signatureValue.catch(() => {
      this.signatureValue = null;
    });
    return this.signatureValue;
  }

  private async readIndexFile(): Promise<VisualIndex | null> {
    try {
      const raw = await fs.readFile(INDEX_PATH, "utf8");
      const data = JSON.parse(raw) as VisualIndex;
      if (data.version !== INDEX_VERSION || !Array.isArray(data.records)) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  private async writeIndexFile(index: VisualIndex) {
    await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true });
    await fs.writeFile(INDEX_PATH, JSON.stringify(index));
  }

  private rebuilding: Promise<VisualIndex> | null = null;

  /**
   * The current index. A stale index is served while a rebuild runs in the
   * background, so an image search never waits on re-fingerprinting the
   * catalog; only the very first build (no index in memory or on disk) is
   * awaited.
   */
  private async getVisualIndex(): Promise<VisualIndex> {
    const signature = await this.catalogSignature();
    if (!this.memoryIndex) this.memoryIndex = await this.readIndexFile();
    const current = this.memoryIndex;
    if (current && current.signature === signature) return current;

    if (!this.rebuilding) {
      this.rebuilding = this.buildIndex(signature, current).finally(() => {
        this.rebuilding = null;
      });
      this.rebuilding.catch((e) => console.error("Visual index build:", e));
    }
    return current ?? this.rebuilding;
  }

  /**
   * Fingerprints every active product image, reusing records from `previous`
   * for (product, image) pairs that haven't changed — so after the first
   * build only new or edited images are downloaded and hashed.
   */
  private async buildIndex(
    signature: string,
    previous: VisualIndex | null,
  ): Promise<VisualIndex> {
    const reusable = new Map(
      (previous?.records ?? []).map((r) => [`${r.productId}::${r.image}`, r]),
    );
    const records: VisualRecord[] = [];
    const jobs: {
      productId: string;
      slug: string;
      name: string;
      image: string;
    }[] = [];

    // Walk the catalog in id order, a batch at a time, instead of loading
    // every product row at once.
    let cursor: string | undefined;
    for (;;) {
      const batch = await this.prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true, image: true, images: true },
        orderBy: { id: "asc" },
        take: BUILD_BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (!batch.length) break;
      cursor = batch[batch.length - 1].id;

      for (const p of batch) {
        const urls = new Set([p.image, ...(p.images || [])].filter(Boolean));
        for (const image of urls) {
          const old = reusable.get(`${p.id}::${image}`);
          if (old) records.push({ ...old, slug: p.slug, name: p.name });
          else
            jobs.push({ productId: p.id, slug: p.slug, name: p.name, image });
        }
      }
    }

    const concurrency = 6;
    for (let i = 0; i < jobs.length; i += concurrency) {
      const chunk = jobs.slice(i, i + concurrency);
      const part = await Promise.all(
        chunk.map(async (job) => {
          const buf = await this.loadBufferFromSrc(job.image);
          if (!buf) return null;
          try {
            const fp = await this.fingerprintBuffer(buf);
            return {
              productId: job.productId,
              slug: job.slug,
              name: job.name,
              image: job.image,
              hash: fp.hash,
              grid: fp.grid,
            } satisfies VisualRecord;
          } catch {
            return null;
          }
        }),
      );
      for (const rec of part) if (rec) records.push(rec);
    }

    const index: VisualIndex = {
      version: INDEX_VERSION,
      signature,
      builtAt: new Date().toISOString(),
      records,
    };
    this.memoryIndex = index;
    await this.writeIndexFile(index).catch(() => undefined);
    return index;
  }

  async matchProductsByImage(
    imageBuf: Buffer,
    opts?: { limit?: number },
  ): Promise<VisualScore[]> {
    const limit = opts?.limit ?? 24;
    const fp = await this.fingerprintBuffer(imageBuf);
    const index = await this.getVisualIndex();

    const best = new Map<string, VisualScore>();

    for (const rec of index.records) {
      const dist = hamming(fp.hash, rec.hash);
      const cScore = colorScore(fp.grid, rec.grid);
      const hashScore = 1 - dist / 64;
      const exact = dist <= 8;
      const score = exact
        ? Math.max(0.9, 0.99 - dist * 0.008)
        : hashScore * 0.58 + cScore * 0.42;

      const prev = best.get(rec.productId);
      if (!prev || score > prev.score) {
        best.set(rec.productId, {
          productId: rec.productId,
          slug: rec.slug,
          name: rec.name,
          image: rec.image,
          score,
          hashDistance: dist,
          colorScore: cScore,
          exact,
        });
      }
    }

    const ranked = [...best.values()].sort((a, b) => b.score - a.score);
    if (!ranked.length) return [];

    const top = ranked[0];
    // Same photo / near-duplicate: return only that visual family
    if (top.exact || top.score >= 0.86) {
      return ranked
        .filter((r) => r.exact || r.score >= 0.82 || r.hashDistance <= 10)
        .slice(0, limit);
    }

    // Similar look (same product type / packaging)
    return ranked.filter((r) => r.score >= 0.62).slice(0, limit);
  }
}
