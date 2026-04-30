import { getDistanceMeters } from './location';
import { MemoryItem, MemoryLocation, TriggeredMemory } from '../types/memory';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOCATION_RADIUS_M = 80;

export const findTriggeredMemory = (
  memories: MemoryItem[],
  now: Date,
  currentLocation?: MemoryLocation,
): TriggeredMemory | null => {
  for (const memory of memories) {
    if (memory.lastResurfacedAt) {
      continue;
    }

    const memoryAgeMs = now.getTime() - new Date(memory.createdAt).getTime();
    const requiredAgeMs = memory.resurfaceAfterDays * DAY_MS;

    if (memoryAgeMs >= requiredAgeMs) {
      return { memory, reason: 'time' };
    }

    if (currentLocation) {
      const distance = getDistanceMeters(memory.location, currentLocation);
      if (distance <= DEFAULT_LOCATION_RADIUS_M) {
        return { memory, reason: 'location' };
      }
    }
  }

  return null;
};
