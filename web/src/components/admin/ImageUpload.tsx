"use client";

import { useCallback, useRef, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Image from "next/image";
import { ImagePlus, Loader2, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  onChange: (url: string) => void;
  folder?:
    | "products"
    | "doctors"
    | "brands"
    | "categories"
    | "lab"
    | "banners"
    | "vendors"
    | "misc";
  label?: string;
  className?: string;
  aspect?: "square" | "portrait" | "wide";
};

function isLocalOrRemote(src: string) {
  return src.startsWith("/") || src.startsWith("http");
}

export function ImageUpload({
  value,
  onChange,
  folder = "misc",
  label = "Image",
  className,
  aspect = "square",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await adminFetch("/admin/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        onChange(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  function onFile(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    void upload(file);
  }

  const boxH =
    aspect === "portrait"
      ? "h-40"
      : aspect === "wide"
        ? "h-28"
        : "h-36";

  return (
    <div className={cn("block text-xs", className)}>
      {label && (
        <span className="mb-1.5 block font-semibold text-[var(--ink-muted)]">
          {label}
        </span>
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed transition",
          dragOver
            ? "border-[var(--forest)] bg-[var(--brand-soft)]"
            : "border-[var(--line)] bg-[var(--ivory)]",
          boxH
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
      >
        {value && isLocalOrRemote(value) ? (
          <>
            <Image
              src={value}
              alt="Upload preview"
              fill
              className="object-cover"
              sizes="280px"
              unoptimized={value.startsWith("/uploads/")}
            />
            <div className="absolute inset-0 bg-black/0 transition hover:bg-black/30" />
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold shadow"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg bg-white/95 p-1 shadow"
                title="Remove"
              >
                <X className="h-3.5 w-3.5 text-red-600" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-[var(--ink-muted)]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
                <span className="font-semibold">Uploading…</span>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <ImagePlus className="h-5 w-5 text-[var(--forest)]" />
                </div>
                <span className="font-bold text-[var(--ink)]">
                  Click or drag image
                </span>
                <span className="text-[10px]">JPG, PNG, WebP · max 5MB</span>
              </>
            )}
          </button>
        )}

        {uploading && value && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-700">
          {error}
        </p>
      )}

      {value && (
        <p className="mt-1 truncate text-[10px] text-[var(--ink-muted)]">
          {value.startsWith("/uploads/") ? (
            <span className="inline-flex items-center gap-1">
              <Upload className="h-3 w-3" /> Uploaded
            </span>
          ) : (
            value
          )}
        </p>
      )}
    </div>
  );
}

/** Multiple images (gallery) */
export function MultiImageUpload({
  values,
  onChange,
  folder = "products",
  label = "Gallery images",
  max = 6,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: "products" | "misc" | "banners";
  label?: string;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    if (values.length + list.length > max) {
      setError(`Max ${max} images`);
      return;
    }
    setUploading(true);
    setError(null);
    const next = [...values];
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await adminFetch("/admin/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        next.push(data.url);
      }
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="text-xs">
      <span className="mb-1.5 block font-semibold text-[var(--ink-muted)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {values.map((url, i) => (
          <div
            key={url + i}
            className="relative h-20 w-20 overflow-hidden rounded-lg border border-[var(--line)]"
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized={url.startsWith("/uploads/")}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="absolute right-0.5 top-0.5 rounded bg-white/90 p-0.5 shadow"
            >
              <X className="h-3 w-3 text-red-600" />
            </button>
          </div>
        ))}
        {values.length < max && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--forest)]"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="mt-0.5 text-[9px] font-bold">Add</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="mt-1 text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}
