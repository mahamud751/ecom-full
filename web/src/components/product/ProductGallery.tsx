"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  name,
  images,
  discount,
}: {
  name: string;
  images: string[];
  discount?: number;
}) {
  const gallery = images.length ? images : [];
  const [active, setActive] = useState(0);
  const current = gallery[active] || gallery[0];

  if (!current) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-8">
      <div className="relative">
        {discount && discount > 0 && (
          <span className="absolute left-0 top-0 z-10 rounded-xl bg-[var(--discount)] px-3 py-1.5 text-sm font-bold text-white shadow-lg">
            {discount}% OFF
          </span>
        )}
        <div className="relative mx-auto aspect-square max-w-lg overflow-hidden rounded-2xl bg-gradient-to-b from-[var(--ivory)] to-white">
          <Image
            src={current}
            alt={name}
            fill
            priority
            quality={95}
            className="object-contain p-4 transition duration-300"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 overflow-hidden rounded-xl border-2 transition md:h-20 md:w-20",
                i === active
                  ? "border-[var(--forest)] shadow-md"
                  : "border-[var(--line)] opacity-80 hover:opacity-100"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                quality={90}
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
