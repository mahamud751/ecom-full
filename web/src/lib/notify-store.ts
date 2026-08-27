"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LocalNotify = {
  id: string; // server id if synced, else local
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  type: "STOCK" | "PRICE";
  contact: string;
  contactType: "phone" | "email";
  targetPrice?: number | null;
  priceWhenSet?: number;
  status: "ACTIVE" | "READY" | "SENT" | "CANCELLED";
  createdAt: string;
};

type NotifyStore = {
  items: LocalNotify[];
  add: (item: LocalNotify) => void;
  remove: (id: string) => void;
  removeByProduct: (productId: string, type?: string) => void;
  has: (productId: string, type?: string) => boolean;
  count: () => number;
  markReady: (productId: string, type?: string) => void;
  clear: () => void;
};

export const useNotifyStore = create<NotifyStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const filtered = get().items.filter(
          (i) =>
            !(
              i.productId === item.productId &&
              i.type === item.type &&
              i.status === "ACTIVE"
            )
        );
        set({ items: [item, ...filtered] });
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      removeByProduct: (productId, type) =>
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.productId === productId &&
                (!type || i.type === type) &&
                i.status === "ACTIVE"
              )
          ),
        }),
      has: (productId, type) =>
        get().items.some(
          (i) =>
            i.productId === productId &&
            i.status === "ACTIVE" &&
            (!type || i.type === type)
        ),
      count: () =>
        get().items.filter((i) => i.status === "ACTIVE" || i.status === "READY")
          .length,
      markReady: (productId, type) =>
        set({
          items: get().items.map((i) =>
            i.productId === productId &&
            i.status === "ACTIVE" &&
            (!type || i.type === type)
              ? { ...i, status: "READY" as const }
              : i
          ),
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "htp-notifies" }
  )
);
