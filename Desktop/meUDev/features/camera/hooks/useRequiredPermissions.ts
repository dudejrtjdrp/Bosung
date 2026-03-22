import { useEffect, useState } from 'react';

import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

export const useRequiredPermissions = () => {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const requestPermissions = async () => {
    setIsLoading(true);
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    const locationStatus = await Location.requestForegroundPermissionsAsync();

    setCameraGranted(cameraStatus.status === 'granted');
    setLocationGranted(locationStatus.status === 'granted');
    setIsLoading(false);
  };

  useEffect(() => {
    requestPermissions().catch(() => {
      setIsLoading(false);
    });
  }, []);

  return {
    cameraGranted,
    locationGranted,
    isLoading,
    requestPermissions,
  };
};
