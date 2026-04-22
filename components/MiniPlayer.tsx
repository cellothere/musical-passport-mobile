import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated,
  Modal, Image, Share, Linking, Alert, Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Path, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { Colors } from '../constants/colors';
import { haptics } from '../utils/haptics';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import type { TrackMeta, PreviewSource } from '../contexts/AudioPlayerContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number) {
  if (!isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TrackFavoritesHook {
  isTrackSaved: (trackId: string) => boolean;
  findSavedTrack: (trackId: string) => SavedDiscovery | undefined;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

interface MiniPlayerProps { favoritesHook?: TrackFavoritesHook; onNeedAuth?: () => void; }


// ── Preview source badge ──────────────────────────────────────────────────────

function PreviewSourceBadge({ source }: { source: PreviewSource }) {
  if (source === 'spotify') {
    return <FontAwesome5 name="spotify" size={11} color="#1DB954" brand style={{ opacity: 0.85 }} />;
  }
  if (source === 'deezer') {
    return <DeezerLogo size={11} color="#a238ff" />;
  }
  return null;
}

function previewSourceLabel(source: PreviewSource): string | null {
  if (source === 'spotify') return 'Preview provided by Spotify';
  if (source === 'apple') return 'Preview provided by Apple Music';
  if (source === 'deezer') return 'Preview provided by Deezer';
  return null;
}

// ── Deezer logo ───────────────────────────────────────────────────────────────

function DeezerLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0.5 115 115">
      <G fill={color}>
        <Path d="m100.804 7.99168c-1.7301.00606-3.2894 3.88512-4.3536 10.05142-1.7235-10.63022-4.5283-17.5431-7.6826-17.5431-3.756 0-7.0079 9.7742-8.5445 23.9668-1.5121-10.3285-3.7966-16.91534-6.3493-16.91534-3.5853 0-6.634 12.95354-7.764 31.01834-2.1219-9.2607-5.195-15.0731-8.6013-15.0731-3.4064 0-6.4795 5.8124-8.6014 15.0731-1.13-18.0648-4.1787-31.01834-7.7639-31.01834-2.5609 0-4.8454 6.58684-6.3494 16.91534-1.5447-14.1926-4.7966-23.9668-8.5526-23.9668-3.1625 0-5.9591 6.91288-7.6827 17.5431-1.0731-6.1629-2.6259-10.05143-4.3575-10.05143-3.2276 0-5.84536 13.45893-5.84536 30.06453s2.61776 30.0645 5.84536 30.0645c1.3251 0 2.5527-2.2744 3.5283-6.114 1.5528 14.0214 4.7803 23.657 8.5119 23.657 2.8942 0 5.4795-5.7879 7.2193-14.9181 1.1951 17.3637 4.1787 29.6814 7.6745 29.6814 2.2032 0 4.2031-4.8831 5.6746-12.8312 1.7723 16.4102 5.8941 27.9042 10.6907 27.9042s8.9103-11.494 10.6907-27.9042c1.4796 7.9481 3.4796 12.8312 5.6746 12.8312 3.4958 0 6.4876-12.3177 7.6746-29.6814 1.7397 9.1302 4.3332 14.9181 7.2192 14.9181 3.7316 0 6.9591-9.6356 8.5119-23.657.9837 3.8314 2.2032 6.114 3.5285 6.114 3.227 0 5.845-13.4589 5.845-30.0645 0-16.5986-2.615-30.05323-5.841-30.06452z" />
        <Path d="m3.31727 48.5447c1.83207 0 3.31726-6.018 3.31726-13.4415 0-7.4236-1.48519-13.4416-3.31726-13.4416-1.83208 0-3.31727 6.018-3.31727 13.4416 0 7.4235 1.48519 13.4415 3.31727 13.4415z" />
        <Path d="m115 35.1032c0 7.4235-1.485 13.4415-3.317 13.4415s-3.318-6.018-3.318-13.4415c0-7.4236 1.486-13.4416 3.318-13.4416s3.317 6.018 3.317 13.4416z" />
      </G>
    </Svg>
  );
}

// ── Equalizer bars ────────────────────────────────────────────────────────────

function EqualizerBars({ isPlaying, color = Colors.gold }: { isPlaying: boolean; color?: string }) {
  const bars = [
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.8)).current,
    useRef(new Animated.Value(0.5)).current,
  ];

  useEffect(() => {
    if (!isPlaying) {
      bars.forEach(b => b.stopAnimation());
      return;
    }
    const durations = [380, 540, 460];
    const anims = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b, { toValue: 1, duration: durations[i], useNativeDriver: false }),
          Animated.timing(b, { toValue: 0.15, duration: durations[i], useNativeDriver: false }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [isPlaying]);

  return (
    <View style={eqStyles.wrap}>
      {bars.map((val, i) => (
        <Animated.View
          key={i}
          style={[
            eqStyles.bar,
            {
              height: val.interpolate({ inputRange: [0, 1], outputRange: [3, 14] }),
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const eqStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: 20, height: 16 },
  bar: { width: 3, borderRadius: 2 },
});

// ── Streaming service config ──────────────────────────────────────────────────

const SERVICE_OPTIONS = [
  {
    key: 'apple',
    label: 'Apple Music',
    iconLib: 'fa5' as const,
    icon: 'apple' as const,
    color: '#fc3c44',
    getUrl: (meta: TrackMeta) =>
      meta.appleId ? `https://music.apple.com/song/${meta.appleId}` : null,
  },
  {
    key: 'spotify',
    label: 'Spotify',
    iconLib: 'fa5' as const,
    icon: 'spotify' as const,
    color: '#1DB954',
    getUrl: (meta: TrackMeta) =>
      meta.spotifyId ? `spotify:track:${meta.spotifyId}` : null,
  },
  {
    key: 'deezer',
    label: 'Deezer',
    iconLib: 'deezer' as const,
    icon: 'deezer' as const,
    color: '#a238ff',
    getUrl: (meta: TrackMeta) => {
      if (meta.deezerId) return `deezer://track/${meta.deezerId}`;
      if (meta.deezerUrl) {
        const id = meta.deezerUrl.match(/\/track\/(\d+)/)?.[1];
        if (id) return `deezer://track/${id}`;
      }
      return null;
    },
  },
];

async function openServiceUrl(url: string) {
  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (canOpen) {
    Linking.openURL(url);
  } else {
    const webUrl = url
      .replace(/^spotify:track:(.+)/, 'https://open.spotify.com/track/$1')
      .replace('spotify://', 'https://open.spotify.com/')
      .replace('deezer://', 'https://www.deezer.com/');
    Linking.openURL(webUrl).catch(() =>
      Alert.alert('Could not open link', 'No compatible app or browser found.')
    );
  }
}

// ── Full Player Modal ─────────────────────────────────────────────────────────

function PlayerModal({ onClose, favoritesHook, onNeedAuth }: { onClose: () => void; favoritesHook?: TrackFavoritesHook; onNeedAuth?: () => void }) {
  const {
    currentTrackId, currentTrackTitle, currentTrackArtist, currentArtworkUrl, currentTrackMeta,
    currentPreviewSource, isPlaying, isLoading, togglePlay, stop, currentTime, duration,
  } = useAudioPlayer();

  const isSaved = !!(currentTrackId && favoritesHook?.isTrackSaved(currentTrackId));

  const toggleSave = async () => {
    if (!currentTrackId) return;
    if (!favoritesHook) { onNeedAuth?.(); return; }
    if (isSaved) {
      haptics.error();
      const entry = favoritesHook.findSavedTrack(currentTrackId);
      if (entry) await favoritesHook.remove(entry.id);
    } else {
      haptics.success();
      const track = {
        title: currentTrackTitle ?? '',
        artist: currentTrackArtist ?? '',
        ...(currentTrackMeta ?? {}),
      };
      await favoritesHook.save({
        type: 'track',
        country: '',
        data: { trackId: currentTrackId, track, genre: '', country: '', artistImageUrl: currentArtworkUrl ?? null },
      });
    }
  };

  const insets = useSafeAreaInsets();
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Reanimated shared values for the sheet position
  const slideY = useSharedValue(40);
  const dragY = useSharedValue(0);

  useEffect(() => {
    slideY.value = withSpring(0, { damping: 20, stiffness: 200 });
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);

  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-5)
    .onUpdate((e) => {
      if (e.translationY > 0) dragY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 500) {
        dragY.value = withTiming(700, { duration: 220 }, () => runOnJS(onClose)());
      } else {
        dragY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    }), [onClose]);

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value + dragY.value }],
  }));

  const serviceOptions = useMemo(() => currentTrackMeta
    ? SERVICE_OPTIONS.map(s => ({ ...s, url: s.getUrl(currentTrackMeta) })).filter(s => s.url != null) as (typeof SERVICE_OPTIONS[number] & { url: string })[]
    : [], [currentTrackMeta]);

  const openUrl = useMemo(() => currentTrackMeta
    ? (currentTrackMeta.deezerUrl ?? currentTrackMeta.spotifyUrl ?? (currentTrackMeta.spotifyId ? `https://open.spotify.com/track/${currentTrackMeta.spotifyId}` : null) ?? (currentTrackMeta.appleId ? `https://music.apple.com/us/song/${currentTrackMeta.appleId}` : null))
    : null, [currentTrackMeta]);

  async function handleShare() {
    haptics.light();
    const text = [currentTrackTitle, currentTrackArtist].filter(Boolean).join(' · ');
    await Share.share({ message: openUrl ? `${text}\n${openUrl}` : text });
  }

  function handleStop() {
    haptics.light();
    stop();
    onClose();
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[modalStyles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <GestureDetector gesture={panGesture}>
          <Reanimated.View
            style={[
              modalStyles.sheet,
              { paddingBottom: insets.bottom + 24 },
              sheetAnimStyle,
            ]}
          >
          {/* Handle */}
          <View style={modalStyles.handle} />

          {/* Close row */}
          <View style={modalStyles.topRow}>
            <Text style={modalStyles.nowPlayingLabel}>NOW PLAYING</Text>
            <TouchableOpacity style={modalStyles.stopBtn} onPress={handleStop} hitSlop={12}>
              <Ionicons name="close" size={20} color={Colors.text3} />
            </TouchableOpacity>
          </View>

          {/* Artwork */}
          <View style={modalStyles.artworkWrap}>
            {currentArtworkUrl ? (
              <Image source={{ uri: currentArtworkUrl }} style={modalStyles.artwork} />
            ) : (
              <View style={modalStyles.artworkPlaceholder}>
                <Ionicons name="musical-notes" size={52} color={Colors.gold} />
              </View>
            )}
          </View>

          {/* Track info */}
          <View style={modalStyles.trackInfo}>
            <Text style={modalStyles.title} numberOfLines={2}>{currentTrackTitle}</Text>
            {currentTrackArtist && (
              <View style={modalStyles.artistRow}>
                <PreviewSourceBadge source={currentPreviewSource} />
                <Text style={modalStyles.artist} numberOfLines={1}>{currentTrackArtist}</Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          <View style={modalStyles.progressSection}>
            <View style={modalStyles.progressTrack}>
              <View style={[modalStyles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={modalStyles.timeRow}>
              <Text style={modalStyles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={modalStyles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Play controls */}
          <View style={modalStyles.controls}>
            <TouchableOpacity
              style={[modalStyles.playBtn, isLoading && modalStyles.playBtnDisabled]}
              onPress={() => { haptics.light(); togglePlay(); }}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.bg} />
              ) : (
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color={Colors.bg} />
              )}
            </TouchableOpacity>
          </View>

          {/* Streaming service buttons */}
          {serviceOptions.length > 0 && (
            <View style={modalStyles.servicesSection}>
              <View style={modalStyles.servicesRow}>
                {serviceOptions.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[modalStyles.serviceBtn, { borderColor: s.color + '44' }]}
                    onPress={() => { haptics.light(); openServiceUrl(s.url); onClose(); }}
                    activeOpacity={0.75}
                  >
                    {s.iconLib === 'deezer'
                      ? <DeezerLogo size={18} color={s.color} />
                      : <FontAwesome5 name={s.icon} size={18} color={s.color} brand />}
                    <Text style={[modalStyles.serviceBtnText, { color: s.color }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {previewSourceLabel(currentPreviewSource) && (
            <Text style={modalStyles.attribution}>
              {previewSourceLabel(currentPreviewSource)} · 30-second sample
            </Text>
          )}

          {/* Bottom actions */}
          <View style={modalStyles.bottomActions}>
            {favoritesHook && (
              <TouchableOpacity
                style={[modalStyles.heartBtn, isSaved && modalStyles.heartBtnActive]}
                onPress={() => { haptics.light(); toggleSave(); }}
                activeOpacity={0.75}
              >
                <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={22} color={Colors.red} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={modalStyles.shareBtn} onPress={handleShare} activeOpacity={0.75}>
              <Ionicons name="share-outline" size={18} color={Colors.text2} />
              <Text style={modalStyles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
          </Reanimated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  heartBtn: {
    width: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(240,101,101,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240,101,101,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(240,101,101,0.18)',
    borderColor: 'rgba(240,101,101,0.4)',
  },
  stopBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingLabel: {
    color: Colors.text3,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  artworkWrap: {
    alignSelf: 'center',
    marginBottom: 28,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  artwork: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  artworkPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  artist: {
    color: Colors.text2,
    fontSize: 15,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 28,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border2,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: Colors.text3,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    alignItems: 'center',
    marginBottom: 32,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  playBtnDisabled: { opacity: 0.6 },
  servicesSection: {
    marginBottom: 16,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  serviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.surface2,
  },
  serviceBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  shareBtnText: {
    color: Colors.text2,
    fontSize: 15,
    fontWeight: '500',
  },
  attribution: {
    color: Colors.text3,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
});

// ── Mini Player ───────────────────────────────────────────────────────────────

export function MiniPlayer({ favoritesHook, onNeedAuth }: MiniPlayerProps = {}) {
  const {
    currentTrackTitle, currentTrackArtist, currentArtworkUrl,
    currentPreviewSource, isPlaying, isLoading, togglePlay, stop,
    currentTime, duration,
  } = useAudioPlayer();

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const isVisible = !!currentTrackTitle;
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : 100,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {modalOpen && <PlayerModal onClose={() => setModalOpen(false)} favoritesHook={favoritesHook} onNeedAuth={onNeedAuth} />}

      <Animated.View
        style={[
          styles.container,
          { paddingBottom: insets.bottom + 4, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Tappable body */}
        <TouchableOpacity
          style={styles.inner}
          onPress={() => { haptics.light(); setModalOpen(true); }}
          activeOpacity={0.85}
        >
          {/* Artwork */}
          <View style={styles.artworkWrap}>
            {currentArtworkUrl ? (
              <Image source={{ uri: currentArtworkUrl }} style={styles.artwork} />
            ) : (
              <View style={styles.artworkPlaceholder}>
                <Ionicons name="musical-note" size={14} color={Colors.gold} />
              </View>
            )}
          </View>

          {/* Track info + equalizer */}
          <View style={styles.trackInfoWrap}>
            <View style={styles.titleRow}>
              <EqualizerBars isPlaying={isPlaying && !isLoading} />
              <Text style={styles.title} numberOfLines={1}>{currentTrackTitle}</Text>
            </View>
            {currentTrackArtist && (
              <View style={styles.artistRow}>
                <PreviewSourceBadge source={currentPreviewSource} />
                <Text style={styles.artist} numberOfLines={1}>{currentTrackArtist}</Text>
              </View>
            )}
          </View>

        </TouchableOpacity>

        {/* Controls — outside tappable body so they don't open modal */}
        <View style={styles.controlsRow}>
          {isLoading ? (
            <View style={styles.controlBtn}>
              <ActivityIndicator size="small" color={Colors.gold} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => { haptics.light(); togglePlay(); }}
              activeOpacity={0.7}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={19} color={Colors.gold} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => { haptics.light(); stop(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={17} color={Colors.text3} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const ARTWORK_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressTrack: {
    height: 2,
    backgroundColor: Colors.border2,
    width: '100%',
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.gold,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
    flex: 0,
    marginRight: 90,
  },
  artworkWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 8,
  },
  artworkPlaceholder: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfoWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  artist: {
    color: Colors.text2,
    fontSize: 11,
    flex: 1,
  },
  controlsRow: {
    position: 'absolute',
    right: 10,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
