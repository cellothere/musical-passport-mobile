import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { haptics } from '../utils/haptics';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

// ── Animated equalizer bars ───────────────────────────────
function EqualizerBars({ isPlaying }: { isPlaying: boolean }) {
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
            { height: val.interpolate({ inputRange: [0, 1], outputRange: [3, 14] }) },
          ]}
        />
      ))}
    </View>
  );
}

const eqStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    width: 20,
    height: 16,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
});

// ── Mini Player ───────────────────────────────────────────
export function MiniPlayer() {
  const { currentTrackTitle, currentTrackArtist, isPlaying, isLoading, togglePlay, stop, currentTime, duration } = useAudioPlayer();
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const isVisible = !!currentTrackTitle;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : 100,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 6, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.inner}>
        {/* Left: equalizer + track info */}
        <View style={styles.left}>
          <EqualizerBars isPlaying={isPlaying && !isLoading} />
          <View style={styles.trackInfo}>
            <Text style={styles.title} numberOfLines={1}>{currentTrackTitle}</Text>
            {currentTrackArtist && (
              <Text style={styles.artist} numberOfLines={1}>{currentTrackArtist}</Text>
            )}
          </View>
        </View>

        {/* Right: play/pause + close */}
        <View style={styles.controls}>
          {isLoading ? (
            <View style={styles.controlBtn}>
              <ActivityIndicator size="small" color={Colors.gold} />
            </View>
          ) : (
            <TouchableOpacity style={styles.controlBtn} onPress={() => { haptics.light(); togglePlay(); }} activeOpacity={0.7}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color={Colors.gold}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={stop} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={Colors.text3} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

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
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  trackInfo: { flex: 1 },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  artist: {
    color: Colors.text2,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
