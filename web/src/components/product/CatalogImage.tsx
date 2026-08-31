"use client";

import Image from "next/image";
import { cn, isLocalMedia } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  onError?: () => void;
};

/** Local pack files (SVG/JPEG under /uploads) must use <img> — next/image
 *  treats SVG naturalWidth as 0 and fires onError, which showed "No photo". */
export function CatalogImage({
  src,
  alt,
  className,
  sizes,
  fill,
  width,
  height,
  priority,
  quality = 90,
  onError,
}: Props) {
  if (isLocalMedia(src) || src.endsWith(".svg")) {
    return (
      // Native img: do not set width/height=480 — that overflow-clips
      // to a blank corner inside the 158px product tile.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(
          fill ? "absolute inset-0 h-full w-full" : "h-auto w-full",
          className,
        )}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      priority={priority}
      quality={quality}
      onError={onError}
    />
  );
}
