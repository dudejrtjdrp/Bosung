import * as Location from 'expo-location';

import { MemoryLocation } from '../../types/memory';

export const getCurrentMemoryLocation = async (): Promise<MemoryLocation | null> => {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return null;
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
};
