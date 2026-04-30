import { useMemo, useState, useRef, useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';

import { useMemoryStore } from '../../../store/memoryStore';

type DisplayCapsule = {
  id: string;
  name: string;
  icon: string;
  coverUri?: string;
  memoryCount: number;
  isLocked: boolean;
  progress: number;
  daysLeft: number;
};

type HomePage = 'home' | 'saved' | 'locked' | 'favorite-settings';

const DAY_MS = 24 * 60 * 60 * 1000;
const RING_DOT_COUNT = 36;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const getOpenUrgency = (capsule: DisplayCapsule) =>
  capsule.isLocked ? capsule.daysLeft : Number.MAX_SAFE_INTEGER;

const ProgressRing = ({
  progress,
  size = 88,
  dotSize = 4,
  padding = 2,
}: {
  progress: number;
  size?: number;
  dotSize?: number;
  padding?: number;
}) => {
  const radius = size / 2;
  const ringRadius = radius - padding - dotSize / 2;
  const activeDots = Math.round(clamp01(progress) * RING_DOT_COUNT);

  return (
    <View pointerEvents="none" style={styles.progressRingWrap}>
      {Array.from({ length: RING_DOT_COUNT }, (_, index) => {
        const angle = (index / RING_DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
        const x = radius + Math.cos(angle) * ringRadius;
        const y = radius + Math.sin(angle) * ringRadius;
        const isActive = index < activeDots;

        return (
          <View
            key={`ring-dot-${index}`}
            style={[
              styles.progressDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                left: x - dotSize / 2,
                top: y - dotSize / 2,
                backgroundColor: isActive ? '#4CA3FF' : '#2C3544',
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MemoryHomeScreen = ({ setPagerScrollEnabled }: { setPagerScrollEnabled?: (v: boolean) => void }) => {
    // 전체 fade-in 애니메이션
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.96)).current;
    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);
  const memories = useMemoryStore((state) => state.memories);
  const capsules = useMemoryStore((state) => state.capsules);
  const favoriteCapsuleIds = useMemoryStore((state) => state.favoriteCapsuleIds);
  const toggleFavoriteCapsule = useMemoryStore((state) => state.toggleFavoriteCapsule);
  const [page, setPage] = useState<HomePage>('home');

  const displayCapsules = useMemo<DisplayCapsule[]>(() => {
    if (capsules.length) {
      return capsules.map((capsule) => {
        const nowMs = Date.now();
        const createdAtMs = new Date(capsule.createdAt).getTime();
        const openAtMs = capsule.openAt ? new Date(capsule.openAt).getTime() : null;
        const fallbackOpenAtMs = createdAtMs + capsule.openAfterDays * DAY_MS;
        const targetMs = openAtMs ?? fallbackOpenAtMs;
        const isLocked = targetMs > nowMs;
        const totalWindow = Math.max(1, targetMs - createdAtMs);
        const elapsed = clamp01((nowMs - createdAtMs) / totalWindow);
        const progress = isLocked ? elapsed : 1;
        const daysLeft = isLocked ? Math.max(1, Math.ceil((targetMs - nowMs) / DAY_MS)) : 0;

        return {
          id: capsule.id,
          name: capsule.name,
          icon: capsule.icon,
          coverUri: capsule.coverUri,
          memoryCount: capsule.memoryIds.length,
          isLocked,
          progress,
          daysLeft,
        };
      });
    }

    const grouped = memories.reduce<Record<string, typeof memories>>((acc, memory) => {
      const dateKey = memory.createdAt.slice(0, 10);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(memory);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([dateKey, items]) => ({
        id: dateKey,
        name: `Capsule ${dateKey.replace(/-/g, '.')}`,
        icon: '📦',
        memoryCount: items.length,
        coverUri: items[0]?.imageUri,
        isLocked: false,
        progress: 1,
        daysLeft: 0,
      }));
  }, [capsules, memories]);

  const sortedCapsules = useMemo(() => {
    const favoriteSet = new Set(favoriteCapsuleIds);
    return displayCapsules
      .filter((capsule) => capsule.isLocked || favoriteSet.has(capsule.id))
      .sort((a, b) => {
      const aFav = favoriteSet.has(a.id) ? 1 : 0;
      const bFav = favoriteSet.has(b.id) ? 1 : 0;
      if (aFav !== bFav) {
        return bFav - aFav;
      }

      const urgencyDiff = getOpenUrgency(a) - getOpenUrgency(b);
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }

      if (a.progress !== b.progress) {
        return b.progress - a.progress;
      }

      return a.name.localeCompare(b.name);
    });
  }, [displayCapsules, favoriteCapsuleIds]);

  const savedCapsules = useMemo(() => sortedCapsules.filter((capsule) => !capsule.isLocked), [sortedCapsules]);
  const lockedCapsules = useMemo(() => sortedCapsules.filter((capsule) => capsule.isLocked), [sortedCapsules]);

  const favoriteFirstCapsules = sortedCapsules;

  const renderTopBar = (title: string, subtitle: string) => (
    <View style={styles.pageTopBar}>
      <Pressable style={styles.backButton} onPress={() => setPage('home')}>
        <Ionicons name="chevron-back" size={20} color="#EDF1F8" />
      </Pressable>
      <View style={styles.pageTopTextWrap}>
        <Text style={styles.pageTopTitle}>{title}</Text>
        <Text style={styles.pageTopSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderCapsuleListPage = (items: DisplayCapsule[], title: string, subtitle: string) => (
    <View style={styles.container}>
      {renderTopBar(title, subtitle)}

      <ScrollView contentContainerStyle={styles.pageListWrap}>
        {items.length ? (
          items.map((capsule) => {
            const isFavorite = favoriteCapsuleIds.includes(capsule.id);
            return (
              <View key={capsule.id} style={styles.pageListItem}>
                <View style={styles.pageListOrbWrap}>
                  <View style={styles.pageListOrb}>
                    {capsule.coverUri ? (
                      <Image source={{ uri: capsule.coverUri }} style={styles.pageListOrbImage} />
                    ) : (
                      <View style={[styles.pageListOrbImage, styles.orbFallback]} />
                    )}
                    <BlurView intensity={26} tint="dark" style={styles.orbBlur}>
                      <Text style={styles.orbEmoji}>{capsule.icon}</Text>
                    </BlurView>
                  </View>
                  <ProgressRing progress={capsule.progress} size={52} dotSize={3} padding={1.5} />
                </View>

                <View style={styles.pageListMeta}>
                  <Text style={styles.pageListTitle}>{capsule.name}</Text>
                  <Text style={styles.pageListSub}>
                    {capsule.memoryCount}장 · {capsule.isLocked ? `${capsule.daysLeft}일 남음` : '열림'}
                  </Text>
                  <Text style={styles.pageListProgress}>오픈 진행률 {Math.round(capsule.progress * 100)}%</Text>
                </View>

                <Pressable style={styles.favoriteButton} onPress={() => toggleFavoriteCapsule(capsule.id)}>
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={17}
                    color={isFavorite ? '#D94848' : '#8D939C'}
                  />
                </Pressable>
              </View>
            );
          })
        ) : (
          <View style={styles.panelEmpty}>
            <Text style={styles.panelEmptyTitle}>표시할 타임캡슐이 없습니다.</Text>
            <Text style={styles.panelEmptyText}>캡슐을 만든 뒤 다시 확인해 주세요.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  if (page === 'saved') {
    return renderCapsuleListPage(savedCapsules, '저장한 타임캡슐', '열어볼 수 있는 캡슐 목록');
  }

  if (page === 'locked') {
    return renderCapsuleListPage(lockedCapsules, '잠겨있는 타임캡슐', '오픈까지 남은 기간을 확인하세요');
  }

  if (page === 'favorite-settings') {
    return (
      <View style={styles.container}>
        {renderTopBar('즐겨찾기 설정', '원하는 캡슐을 선택하세요')}

        <ScrollView contentContainerStyle={styles.pageListWrap}>
          {displayCapsules.length ? (
            displayCapsules.map((capsule) => {
              const isFavorite = favoriteCapsuleIds.includes(capsule.id);
              return (
                <Pressable key={capsule.id} style={styles.settingsItem} onPress={() => toggleFavoriteCapsule(capsule.id)}>
                  <View style={styles.settingsLeft}>
                    <View style={styles.settingsEmojiWrap}>
                      <Text style={styles.settingsEmoji}>{capsule.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.settingsTitle}>{capsule.name}</Text>
                      <Text style={styles.settingsSubtitle}>{capsule.memoryCount}장</Text>
                    </View>
                  </View>

                  <View style={[styles.settingsToggle, isFavorite && styles.settingsToggleOn]}>
                    <Ionicons name={isFavorite ? 'checkmark' : 'add'} size={16} color={isFavorite ? '#FFFFFF' : '#8A93A2'} />
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.panelEmpty}>
              <Text style={styles.panelEmptyTitle}>설정할 타임캡슐이 없습니다.</Text>
              <Text style={styles.panelEmptyText}>먼저 타임캡슐을 만들어 주세요.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }


  // 중앙 강조 오브 리스트 구현
  const scrollX = useState(() => new Animated.Value(0))[0];
  const ORB_SIZE = 112;
  const ORB_MIN = 72;
  const ORB_GAP = 18;
  const ORB_VISIBLE = 3; // 중앙+양옆

  const renderOrb = (capsule: DisplayCapsule, idx: number) => {
    const inputRange = [
      (idx - 1) * (ORB_SIZE + ORB_GAP),
      idx * (ORB_SIZE + ORB_GAP),
      (idx + 1) * (ORB_SIZE + ORB_GAP),
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });
    // 중앙 오브만 zIndex 1, 나머지 0
    const centerIdx = Math.round(((scrollX as any).__getValue?.() || 0) / (ORB_SIZE + ORB_GAP));
    const isCenter = idx === centerIdx;
    // shadowRadius도 중앙만 10, 나머지 2
    const shadowRadius = isCenter ? 10 : 2;
    const zIndex = isCenter ? 1 : 0;
    return (
      <Animated.View
        key={capsule.id}
        style={[
          styles.orbItem,
          {
            width: ORB_SIZE,
            height: ORB_SIZE + 24,
            marginHorizontal: ORB_GAP / 2,
            transform: [{ scale }],
            opacity,
            shadowColor: '#4CA3FF',
            shadowOpacity: 0.18,
            shadowRadius,
            shadowOffset: { width: 0, height: 4 },
            zIndex,
          },
        ]}
      >
        <Pressable onPress={() => setPage(capsule.isLocked ? 'locked' : 'saved')} style={{ alignItems: 'center' }}>
          <View style={[styles.orbRingWrap, { width: ORB_SIZE, height: ORB_SIZE }]}> 
            <View style={[styles.orbOuter, { width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2 }]}> 
              {capsule.coverUri ? (
                <Image source={{ uri: capsule.coverUri }} style={[styles.orbImage, { width: ORB_SIZE, height: ORB_SIZE }]} />
              ) : (
                <View style={[styles.orbImage, styles.orbFallback, { width: ORB_SIZE, height: ORB_SIZE }]} />
              )}
              <BlurView intensity={26} tint="dark" style={styles.orbBlur}>
                <Text style={styles.orbEmoji}>{capsule.icon}</Text>
              </BlurView>
            </View>
            <ProgressRing progress={capsule.progress} size={ORB_SIZE} dotSize={4} padding={2} />
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{Math.round(capsule.progress * 100)}%</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}> 
      {/* 상단 타이틀 + 총 개수 */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
        <View style={styles.pixelHeaderWrap}>
          <Text style={styles.pixelHeaderTitle}>저장된 타임캡슐 <Text style={styles.pixelHeaderCount}>{displayCapsules.length}</Text>개</Text>
        </View>
      </Animated.View>
      {/* 검색창 */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <View style={styles.pixelSearchBar}>
          <Feather name="search" size={18} color="#AEB6C3" style={{ marginRight: 8 }} />
          <Text style={styles.pixelSearchPlaceholder}>검색</Text>
        </View>
      </Animated.View>

      {/* 중앙 강조 오브 리스트 */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.orbList}
        snapToInterval={ORB_SIZE + ORB_GAP}
        decelerationRate={0.92}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={{ marginBottom: 8, opacity: fadeAnim }}
      >
        {favoriteFirstCapsules.length ? (
          favoriteFirstCapsules.map((capsule, idx) => renderOrb(capsule, idx))
        ) : (
          <View style={styles.emptyOrb}>
            <Text style={styles.emptyOrbText}>아직 캡슐이 없어요</Text>
          </View>
        )}
      </Animated.ScrollView>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <View style={styles.pixelCardGrid}>
          <Pressable style={[styles.pixelCard, styles.pixelCardSaved]} onPress={() => setPage('saved')}>
            <Ionicons name="albums-outline" size={22} color="#F07A5D" style={{ marginBottom: 2 }} />
            <Text style={styles.pixelCardTitle}>저장한 캡슐</Text>
            <Text style={styles.pixelCardCount}>{savedCapsules.length}개</Text>
          </Pressable>
          <Pressable style={[styles.pixelCard, styles.pixelCardLocked]} onPress={() => setPage('locked')}>
            <Ionicons name="lock-closed-outline" size={22} color="#F1D85F" style={{ marginBottom: 2 }} />
            <Text style={styles.pixelCardTitle}>잠긴 캡슐</Text>
            <Text style={styles.pixelCardCount}>{lockedCapsules.length}개</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.pixelCard, styles.pixelCardFavorite]} onPress={() => setPage('favorite-settings')}>
          <Feather name="heart" size={20} color="#D94848" style={{ marginBottom: 2 }} />
          <Text style={styles.pixelCardTitle}>즐겨찾기 설정</Text>
          <Text style={styles.pixelCardCount}>캡슐 선택</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050608',
    paddingTop: 56,
    paddingHorizontal: 14,
  },
  pixelHeaderWrap: {
    marginTop: 4,
    marginBottom: 6,
  },
  pixelHeaderTitle: {
    color: '#F3F6FB',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pixelHeaderCount: {
    color: '#4CA3FF',
    fontSize: 26,
    fontWeight: '900',
  },
  pixelSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181C23',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
  },
  pixelSearchPlaceholder: {
    color: '#AEB6C3',
    fontSize: 15,
    fontWeight: '500',
  },
  orbList: {
    marginTop: 18,
    paddingRight: 8,
    alignItems: 'flex-start',
    minHeight: 112,
  },
  orbItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: 0,
    height: 120,
  },
  orbOuter: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#4CA3FF',
    backgroundColor: '#20242D',
  },
  orbRingWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbImage: {
    borderRadius: 999,
    resizeMode: 'cover',
  },
  orbFallback: {
    backgroundColor: '#2A2F38',
  },
  orbBlur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingWrap: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  progressDot: {
    position: 'absolute',
  },
  progressBadge: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#101521',
    borderWidth: 1,
    borderColor: '#253048',
  },
  progressBadgeText: {
    color: '#8DC2FF',
    fontSize: 10,
    fontWeight: '700',
  },
  orbEmoji: {
    fontSize: 32,
  },
  emptyOrb: {
    width: 180,
    height: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2C313A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOrbText: {
    color: '#AEB6C3',
    fontSize: 13,
    fontWeight: '600',
  },
  pixelCardGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  pixelCard: {
    flex: 1,
    backgroundColor: '#181C23',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 8,
  },
  pixelCardSaved: {
    borderWidth: 2,
    borderColor: '#F07A5D',
  },
  pixelCardLocked: {
    borderWidth: 2,
    borderColor: '#F1D85F',
  },
  pixelCardFavorite: {
    borderWidth: 2,
    borderColor: '#D94848',
    marginBottom: 0,
  },
  pixelCardTitle: {
    color: '#F3F6FB',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  pixelCardCount: {
    color: '#AEB6C3',
    fontSize: 13,
    fontWeight: '600',
  },
  pageTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#2C3443',
    backgroundColor: '#10131A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTopTextWrap: {
    gap: 2,
  },
  pageTopTitle: {
    color: '#EFF3FA',
    fontSize: 18,
    fontWeight: '800',
  },
  pageTopSubtitle: {
    color: '#95A1B3',
    fontSize: 12,
  },
  pageListWrap: {
    gap: 10,
    paddingVertical: 14,
  },
  pageListItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D3340',
    backgroundColor: '#131721',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageListOrbWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pageListOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  pageListOrbImage: {
    width: '100%',
    height: '100%',
  },
  pageListMeta: {
    flex: 1,
    gap: 2,
  },
  pageListTitle: {
    color: '#F3F6FB',
    fontSize: 14,
    fontWeight: '700',
  },
  pageListSub: {
    color: '#9AA5B7',
    fontSize: 12,
    fontWeight: '600',
  },
  pageListProgress: {
    color: '#7CB7FF',
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1A1F28',
    borderWidth: 1,
    borderColor: '#2E3441',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D3340',
    backgroundColor: '#131721',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1B2230',
    borderWidth: 1,
    borderColor: '#2F3848',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsEmoji: {
    fontSize: 20,
  },
  settingsTitle: {
    color: '#EEF2F8',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsSubtitle: {
    color: '#95A1B3',
    fontSize: 12,
    marginTop: 2,
  },
  settingsToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374052',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151B26',
  },
  settingsToggleOn: {
    borderColor: '#2E7FE2',
    backgroundColor: '#2E7FE2',
  },
  panelEmpty: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E3441',
    backgroundColor: '#121722',
    padding: 14,
    gap: 6,
  },
  panelEmptyTitle: {
    color: '#EAF0FA',
    fontSize: 14,
    fontWeight: '700',
  },
  panelEmptyText: {
    color: '#93A1B6',
    fontSize: 12,
    lineHeight: 18,
  },
});
