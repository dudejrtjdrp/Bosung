export type MemoryLocation = {
  latitude: number;
  longitude: number;
};

export type MemoryItem = {
  id: string;
  imageUri: string;
  createdAt: string;
  location: MemoryLocation;
  resurfaceAfterDays: number;
  lastResurfacedAt?: string;
};

export type TriggerReason = 'time' | 'location';

export type TriggeredMemory = {
  memory: MemoryItem;
  reason: TriggerReason;
};
