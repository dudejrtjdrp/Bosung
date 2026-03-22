import { StyleSheet, Text, View } from 'react-native';

import { useMemoryStore } from '../../../store/memoryStore';

export const MemoryHomeScreen = () => {
  const memories = useMemoryStore((state) => state.memories);
  const resurfacedCount = memories.filter((m) => m.lastResurfacedAt).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MU</Text>
      <Text style={styles.subtitle}>Moments that return when time and place align.</Text>

      <View style={styles.statsCard}>
        <Text style={styles.statLabel}>Saved memories</Text>
        <Text style={styles.statValue}>{memories.length}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statLabel}>Resurfaced</Text>
        <Text style={styles.statValue}>{resurfacedCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    padding: 20,
    gap: 14,
  },
  title: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '800',
    color: '#0D1B2A',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#33415C',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDE4EF',
    gap: 6,
  },
  statLabel: {
    color: '#4D6481',
    fontSize: 13,
  },
  statValue: {
    color: '#132238',
    fontSize: 30,
    fontWeight: '700',
  },
});
