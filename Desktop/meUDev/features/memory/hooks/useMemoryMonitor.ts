import { useEffect } from 'react';
import { AppState } from 'react-native';

import * as Location from 'expo-location';

import { findTriggeredMemory } from '../../../utils/memoryTriggers';
import { useMemoryStore } from '../../../store/memoryStore';

const CHECK_INTERVAL_MS = 60 * 1000;

export const useMemoryMonitor = () => {
  const memories = useMemoryStore((state) => state.memories);
  const activeMemoryId = useMemoryStore((state) => state.activeMemoryId);
  const setActiveMemory = useMemoryStore((state) => state.setActiveMemory);

  useEffect(() => {
    if (activeMemoryId) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const runCheck = async () => {
      const locationPermission = await Location.getForegroundPermissionsAsync();
      const currentLocation =
        locationPermission.status === 'granted'
          ? await Location.getCurrentPositionAsync({})
          : undefined;

      const triggered = findTriggeredMemory(memories, new Date(),
        currentLocation
          ? {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }
          : undefined,
      );

      if (triggered) {
        setActiveMemory(triggered.memory.id, triggered.reason);
      }
    };

    const onAppStateChange = (state: string) => {
      if (state === 'active') {
        runCheck().catch(() => undefined);
      }
    };

    runCheck().catch(() => undefined);
    intervalId = setInterval(() => {
      runCheck().catch(() => undefined);
    }, CHECK_INTERVAL_MS);

    const appStateSubscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      appStateSubscription.remove();
    };
  }, [activeMemoryId, memories, setActiveMemory]);
};
