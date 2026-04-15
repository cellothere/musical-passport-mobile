import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Modal, Dimensions, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { FLAGS } from '../constants/flags';
import { useAudioPlayer, buildTrackMeta } from '../contexts/AudioPlayerContext';
import { haptics } from '../utils/haptics';
import type { SavedDiscovery } from '../hooks/useFavorites';
import type { Track } from '../services/api';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  country: string | null;
  saves: SavedDiscovery[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function CountrySavesSheet({ visible, country, saves, onClose, onRemove }: Props) {
  const insets = useSafeAreaInsets();
  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      sheetAnim.setValue(SCREEN_H);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 14 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible || !country) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: sheetAnim }],
            paddingBottom: insets.bottom + 16,
            maxHeight: SCREEN_H * 0.85,
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.flag}>{FLAGS[country] ?? '🌐'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Saved from {country}</Text>
            <Text style={styles.sub}>
              {saves.length} {saves.length === 1 ? 'track' : 'tracks'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={20} color={Colors.text2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {saves.length === 0 ? (
            <Text style={styles.empty}>No saves yet from this country.</Text>
          ) : (
            saves.map((fav, i) => (
              <SavedTrackRow
                key={fav.id}
                index={i + 1}
                fav={fav}
                onRemove={() => onRemove(fav.id)}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function SavedTrackRow({
  fav,
  index,
  onRemove,
}: {
  fav: SavedDiscovery;
  index: number;
  onRemove: () => void;
}) {
  const { play, togglePlay, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const data = fav.data as any;
  const track: Track | undefined = data?.track;
  const trackId: string =
    data?.trackId ?? track?.spotifyId ?? track?.appleId ?? track?.previewUrl ?? fav.id;
  const title: string = track?.title ?? data?.title ?? data?.trackTitle ?? 'Unknown track';
  const artist: string = track?.artist ?? data?.artist ?? '';
  const artworkUrl: string | undefined = data?.artistImageUrl ?? undefined;
  const isThisTrack = currentTrackId === trackId;

  const embedUrl = track?.deezerId
    ? `https://widget.deezer.com/widget/dark/track/${track.deezerId}`
    : track?.spotifyId
    ? `https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator`
    : track?.appleId
    ? `https://embed.music.apple.com/us/album/${track.appleId}`
    : null;

  const youtubeUrl =
    track?.youtubeUrl ??
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`;

  const handlePlay = async () => {
    haptics.light();
    if (isThisTrack) {
      togglePlay();
      return;
    }
    if (!track) {
      WebBrowser.openBrowserAsync(youtubeUrl);
      return;
    }
    const hasIds = !!(track.deezerId || track.appleId || track.spotifyId);
    if (hasIds) {
      const started = await play(trackId, undefined, title, artist, artworkUrl, buildTrackMeta(track));
      if (!started && embedUrl) WebBrowser.openBrowserAsync(embedUrl);
      else if (!started) WebBrowser.openBrowserAsync(youtubeUrl);
    } else if (embedUrl) {
      WebBrowser.openBrowserAsync(embedUrl);
    } else {
      WebBrowser.openBrowserAsync(youtubeUrl);
    }
  };

  const handleUnsave = () => {
    haptics.error();
    onRemove();
  };

  return (
    <View style={styles.row}>
      <View style={styles.artworkWrap}>
        {artworkUrl ? (
          <Image source={{ uri: artworkUrl }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <Text style={styles.indexText}>{index}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {artist ? (
          <Text style={styles.rowArtist} numberOfLines={1}>
            {artist}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
        {isThisTrack && isLoading ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : (
          <Ionicons
            name={isThisTrack && isPlaying ? 'pause' : 'play'}
            size={20}
            color={Colors.gold}
          />
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.heartBtn} onPress={handleUnsave}>
        <Ionicons name="heart" size={18} color={Colors.red} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  flag: { fontSize: 36 },
  title: { color: Colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sub: { color: Colors.text3, fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { marginHorizontal: -4 },
  empty: { color: Colors.text3, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  artworkWrap: { width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0 },
  artwork: { width: 44, height: 44 },
  artworkPlaceholder: {
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { color: Colors.text3, fontSize: 14, fontWeight: '700' },
  info: { flex: 1 },
  rowTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  rowArtist: { color: Colors.text2, fontSize: 13, marginTop: 2 },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(240,101,101,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(240,101,101,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
