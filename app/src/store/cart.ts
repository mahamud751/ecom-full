/**
 * Persistent shopping cart (MMKV via zustand persist).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "../lib/storage";
import type { CartItem } from "../types";

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: string, variantId: string | null | undefined, qty: number) => void;
  remove: (productId: string, variantId?: string | null) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

const keyOf = (i: { productId: string; variantId?: string | null }) =>
  `${i.productId}:${i.variantId ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item, qty = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => keyOf(i) === keyOf(item));
        if (idx >= 0) {
          items[idx] = { ...items[idx], qty: Math.min(items[idx].qty + qty, item.stock || 99) };
        } else {
          items.push({ ...item, qty: Math.min(qty, item.stock || 99) });
        }
        set({ items });
      },

      setQty: (productId, variantId, qty) => {
        const items = get()
          .items.map((i) =>
            keyOf(i) === `${productId}:${variantId ?? ""}` ? { ...i, qty } : i,
          )
          .filter((i) => i.qty > 0);
        set({ items });
      },

      remove: (productId, variantId) => {
        set({
          items: get().items.filter(
            (i) => keyOf(i) !== `${productId}:${variantId ?? ""}`,
          ),
        });
      },

      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.price * i.qty, 0),
    }),
    {
      name: "ahona-cart",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
