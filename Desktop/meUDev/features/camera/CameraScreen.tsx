import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CameraType, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';

import { useRequiredPermissions } from './hooks/useRequiredPermissions';
import { useMemoryStore } from '../../store/memoryStore';
import { MemoryItem } from '../../types/memory';

const DEFAULT_RESURFACE_DAYS = '7';

export const CameraScreen = () => {
  const cameraRef = useRef<CameraView | null>(null);
  const addMemory = useMemoryStore((state) => state.addMemory);

  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [resurfaceAfterDays, setResurfaceAfterDays] = useState(DEFAULT_RESURFACE_DAYS);

  const { cameraGranted, locationGranted, isLoading, requestPermissions } = useRequiredPermissions();

  const toggleFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const capture = async () => {
    if (!cameraRef.current) {
      return;
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
      skipProcessing: true,
    });

    if (photo?.uri) {
      setCapturedUri(photo.uri);
    }
  };

  const saveMemory = async () => {
    if (!capturedUri) {
      return;
    }

    if (!locationGranted) {
      Alert.alert('Location needed', 'Enable location permission to save memory metadata.');
      return;
    }

    setIsSaving(true);

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const id = Date.now().toString();
      const safeDocumentDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      const memoryDir = `${safeDocumentDir}memories/`;
      const targetUri = `${memoryDir}${id}.jpg`;

      const dirInfo = await FileSystem.getInfoAsync(memoryDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(memoryDir, { intermediates: true });
      }

      await FileSystem.copyAsync({
        from: capturedUri,
        to: targetUri,
      });

      const memory: MemoryItem = {
        id,
        imageUri: targetUri,
        createdAt: new Date().toISOString(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        resurfaceAfterDays: Number(resurfaceAfterDays) || 7,
      };

      addMemory(memory);
      setCapturedUri(null);
      setResurfaceAfterDays(DEFAULT_RESURFACE_DAYS);
      Alert.alert('Saved', 'Memory saved. MU will resurface it when conditions match.');
    } catch {
      Alert.alert('Save failed', 'Could not save memory right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0E1A2D" />
      </View>
    );
  }

  if (!cameraGranted || !locationGranted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>Camera and location permissions are required.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermissions}>
          <Text style={styles.primaryButtonText}>Grant permissions</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedUri ? (
        <>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.cameraControls}>
              <Pressable style={styles.ghostButton} onPress={toggleFacing}>
                <Text style={styles.ghostButtonText}>Flip</Text>
              </Pressable>
            </View>
          </CameraView>

          <View style={styles.bottomBar}>
            <Pressable style={styles.captureButton} onPress={capture} />
          </View>
        </>
      ) : (
        <>
          <Image source={{ uri: capturedUri }} style={styles.previewImage} />
          <View style={styles.previewActions}>
            <Text style={styles.previewLabel}>Resurface after days</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={resurfaceAfterDays}
              onChangeText={setResurfaceAfterDays}
            />

            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryButton} onPress={() => setCapturedUri(null)}>
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={saveMemory} disabled={isSaving}>
                <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save memory'}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020408',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#F4F6F8',
  },
  permissionTitle: {
    textAlign: 'center',
    color: '#0E1A2D',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 64,
    paddingHorizontal: 16,
  },
  ghostButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  ghostButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomBar: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#020408',
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: '#DDE4EE',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewActions: {
    padding: 16,
    gap: 12,
    backgroundColor: '#0B1323',
  },
  previewLabel: {
    color: '#DDE4EE',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#33415C',
    borderRadius: 10,
    color: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2A7FFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#5E7391',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#D7E0ED',
    fontWeight: '700',
  },
});
