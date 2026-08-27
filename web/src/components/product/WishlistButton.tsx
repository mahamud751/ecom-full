"use client";

import { Heart } from "lucide-react";
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function WishlistButton({
  item,
  className,
  size = "md",
}: {
  item: WishlistItem;
  className?: string;
  size?: "sm" | "md";
}) {
  const { toggle, has } = useWishlistStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted && has(item.id);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const was = has(item.id);
        toggle(item);
        toast(
          was ? "Removed from wishlist" : "Saved to wishlist",
          "wishlist"
        );
      }}
      className={cn(
        "flex items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition active:scale-90",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        active
          ? "border-red-200 text-red-500"
          : "border-[var(--line)] text-[var(--ink-muted)] hover:border-red-200 hover:text-red-500",
        className
      )}
    >
      <Heart
        className={cn(
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          active && "fill-red-500"
        )}
        strokeWidth={2}
      />
    </button>
  );
}
