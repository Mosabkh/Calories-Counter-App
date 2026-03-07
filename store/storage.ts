import type { StateStorage } from 'zustand/middleware';

// In-memory storage for Expo Go compatibility.
// When using a development build (expo prebuild), replace with react-native-mmkv:
//
//   import { MMKV } from 'react-native-mmkv';
//   const mmkv = new MMKV({ id: 'calobite-storage' });
//   export const zustandStorage: StateStorage = {
//     getItem: (name) => mmkv.getString(name) ?? null,
//     setItem: (name, value) => mmkv.set(name, value),
//     removeItem: (name) => mmkv.delete(name),
//   };

const memoryStore = new Map<string, string>();

export const zustandStorage: StateStorage = {
  getItem: (name: string) => memoryStore.get(name) ?? null,
  setItem: (name: string, value: string) => { memoryStore.set(name, value); },
  removeItem: (name: string) => { memoryStore.delete(name); },
};
