import { createReadStream } from "fs";
import { mkdir, rename, stat } from "fs/promises";
import { dirname, join, normalize, sep } from "path";
import type { NextFunction, Request, Response } from "express";
import sharp from "sharp";

/**
 * On-the-fly thumbnails for uploaded media: `/uploads/x.jpg?w=400` returns a
 * 400px-wide WebP instead of the full original (product photos are up to
 * ~300KB; a card renders them ~170dp wide). Resized files are written once to
 * `uploads/.thumbs/` and streamed from disk afterwards; the response is
 * immutable, so Cloudflare and the app's image cache keep them too.
 *
 * Widths are snapped to a fixed set so clients can't fill the disk with
 * arbitrary sizes. Requests without `?w` fall through to the static handler.
 */
const WIDTHS = [160, 240, 360, 480, 640, 960];
const RESIZABLE = /\.(jpe?g|png|webp)$/i;

// Concurrent requests for the same thumbnail share one sharp job.
const inflight = new Map<string, Promise<void>>();

function snapWidth(raw: unknown): number | null {
  const w = Number(raw);
  if (!Number.isFinite(w) || w <= 0) return null;
  return WIDTHS.find((x) => x >= w) ?? WIDTHS[WIDTHS.length - 1];
}

async function exists(path: string) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function render(src: string, out: string, width: number) {
  await mkdir(dirname(out), { recursive: true });
  const tmp = `${out}.${process.pid}.tmp`;
  await sharp(src)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 74, effort: 4 })
    .toFile(tmp);
  await rename(tmp, out);
}

export function thumbnailMiddleware(uploadsRoot: string) {
  const root = normalize(uploadsRoot + sep);
  const cacheRoot = join(uploadsRoot, ".thumbs");

  return async (req: Request, res: Response, next: NextFunction) => {
    const width = snapWidth(req.query.w);
    if (!width || (req.method !== "GET" && req.method !== "HEAD"))
      return next();

    let rel: string;
    try {
      rel = decodeURIComponent(req.path);
    } catch {
      return next();
    }
    if (!RESIZABLE.test(rel)) return next();

    const src = normalize(join(uploadsRoot, rel));
    if (!src.startsWith(root) || rel.includes(`${sep}.`)) return next();

    const out = join(cacheRoot, `w${width}`, `${rel}.webp`);
    try {
      if (!(await exists(out))) {
        if (!(await exists(src))) return next();
        let job = inflight.get(out);
        if (!job) {
          job = render(src, out, width).finally(() => inflight.delete(out));
          inflight.set(out, job);
        }
        await job;
      }
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      res.setHeader("Vary", "Accept-Encoding");
      if (req.method === "HEAD") return res.end();
      createReadStream(out).on("error", next).pipe(res);
    } catch {
      // Corrupt/unsupported source: serve the original instead of failing.
      next();
    }
  };
}
