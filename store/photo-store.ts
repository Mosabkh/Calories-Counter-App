import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

export interface ProgressPhoto {
  id: string;
  date: string;       // 'YYYY-MM-DD'
  timestamp: number;
  uri: string;
  note?: string;
}

interface PhotoState {
  photos: ProgressPhoto[]; // sorted by timestamp descending

  addPhoto: (photo: ProgressPhoto) => void;
  removePhoto: (id: string) => void;
  getLatest: () => ProgressPhoto | undefined;
  reset: () => void;
}

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set, get) => ({
      photos: [],

      addPhoto: (photo) =>
        set((s) => ({
          photos: [photo, ...s.photos].sort((a, b) => b.timestamp - a.timestamp),
        })),

      removePhoto: (id) =>
        set((s) => ({
          photos: s.photos.filter((p) => p.id !== id),
        })),

      getLatest: () => get().photos[0],

      reset: () => set({ photos: [] }),
    }),
    {
      name: 'calobite-photos',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
