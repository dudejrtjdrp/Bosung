import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMemoryMonitor } from './features/memory/hooks/useMemoryMonitor';
import { ResurfaceModal } from './features/memory/components/ResurfaceModal';
import { AppNavigator } from './navigation/AppNavigator';
import { useMemoryStore } from './store/memoryStore';

const MemoryDebugShortcut = () => {
  const memories = useMemoryStore((state) => state.memories);
  const setActiveMemory = useMemoryStore((state) => state.setActiveMemory);
  const latestMemory = memories[0];

  if (!latestMemory) {
    return null;
  }

  return (
    <View style={styles.debugWrap}>
      <Pressable style={styles.debugButton} onPress={() => setActiveMemory(latestMemory.id, 'time')}>
        <Text style={styles.debugButtonText}>Debug: Open latest memory</Text>
      </Pressable>
    </View>
  );
};

export default function App() {
  useMemoryMonitor();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AppNavigator />
      <MemoryDebugShortcut />
      <ResurfaceModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugWrap: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    left: 16,
    alignItems: 'center',
  },
  debugButton: {
    borderRadius: 999,
    backgroundColor: '#1C2D49',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  debugButtonText: {
    color: '#DDE7F8',
    fontSize: 12,
    fontWeight: '600',
  },
});
