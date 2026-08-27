"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  comparePrice?: number | null;
  brand?: string | null;
};

type WishlistStore = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  count: () => number;
  clear: () => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.id === item.id);
        if (exists) {
          set({ items: get().items.filter((i) => i.id !== item.id) });
        } else {
          set({ items: [item, ...get().items] });
        }
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      has: (id) => get().items.some((i) => i.id === id),
      count: () => get().items.length,
      clear: () => set({ items: [] }),
    }),
    { name: "htp-wishlist" }
  )
);
