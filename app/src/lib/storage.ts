/**
 * MMKV-backed persistence for Zustand stores.
 */
import { createMMKV, type MMKV } from 'react-native-mmkv';
import { type StateStorage } from 'zustand/middleware';

export const storage: MMKV = createMMKV({ id: 'ahona-app' });

export const mmkvStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: name => storage.getString(name) ?? null,
  removeItem: name => storage.remove(name),
};
