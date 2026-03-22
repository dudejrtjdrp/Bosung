import { Modal, Pressable, StyleSheet, Text, View, Image } from 'react-native';

import { useMemoryStore } from '../../../store/memoryStore';

export const ResurfaceModal = () => {
  const memories = useMemoryStore((state) => state.memories);
  const activeMemoryId = useMemoryStore((state) => state.activeMemoryId);
  const activeReason = useMemoryStore((state) => state.activeReason);
  const clearActiveMemory = useMemoryStore((state) => state.clearActiveMemory);
  const markResurfaced = useMemoryStore((state) => state.markResurfaced);

  const activeMemory = memories.find((item) => item.id === activeMemoryId);

  if (!activeMemory) {
    return null;
  }

  const reasonText =
    activeReason === 'time'
      ? 'A moment waited long enough to find you again.'
      : 'You returned to a place that remembers this moment.';

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Memory Unlocked</Text>
          <Text style={styles.subtitle}>{reasonText}</Text>

          <Image source={{ uri: activeMemory.imageUri }} style={styles.image} />

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              markResurfaced(activeMemory.id);
              clearActiveMemory();
            }}
          >
            <Text style={styles.primaryText}>Take it in</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 15, 0.82)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#0C172A',
    padding: 16,
    gap: 10,
  },
  title: {
    color: '#EAF1FF',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#AFC4E6',
    fontSize: 14,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: '#2A7FFF',
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
