import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MemoryItem } from '../types/memory';

type MemoryState = {
  memories: MemoryItem[];
  activeMemoryId?: string;
  activeReason?: 'time' | 'location';
  addMemory: (memory: MemoryItem) => void;
  setActiveMemory: (memoryId: string, reason: 'time' | 'location') => void;
  clearActiveMemory: () => void;
  markResurfaced: (memoryId: string) => void;
};

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],
      activeMemoryId: undefined,
      activeReason: undefined,
      addMemory: (memory) =>
        set((state) => ({
          memories: [memory, ...state.memories],
        })),
      setActiveMemory: (memoryId, reason) =>
        set({
          activeMemoryId: memoryId,
          activeReason: reason,
        }),
      clearActiveMemory: () =>
        set({
          activeMemoryId: undefined,
          activeReason: undefined,
        }),
      markResurfaced: (memoryId) =>
        set((state) => ({
          memories: state.memories.map((memory) =>
            memory.id === memoryId
              ? {
                  ...memory,
                  lastResurfacedAt: new Date().toISOString(),
                }
              : memory,
          ),
        })),
    }),
    {
      name: 'mu-memory-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        memories: state.memories,
      }),
    },
  ),
);
