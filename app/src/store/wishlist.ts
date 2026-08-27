/** Wishlist ids persisted locally; live status fetched from the API. */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from '../lib/storage';

type WishlistState = {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: productId => {
        const ids = get().ids;
        set({
          ids: ids.includes(productId)
            ? ids.filter(i => i !== productId)
            : [...ids, productId],
        });
      },
      has: productId => get().ids.includes(productId),
    }),
    {
      name: 'ahona-wishlist',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
