"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedOrder = {
  orderNumber: string;
  total: number;
  createdAt: string;
  itemCount: number;
  status?: string;
};

type OrdersStore = {
  orders: SavedOrder[];
  saveOrder: (order: SavedOrder) => void;
  clear: () => void;
};

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set, get) => ({
      orders: [],
      saveOrder: (order) => {
        const rest = get().orders.filter(
          (o) => o.orderNumber !== order.orderNumber
        );
        set({ orders: [order, ...rest].slice(0, 30) });
      },
      clear: () => set({ orders: [] }),
    }),
    { name: "htp-orders" }
  )
);
