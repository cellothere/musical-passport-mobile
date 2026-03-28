import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../constants/colors';
import { fetchArtistTracks, Track } from '../services/api';
import { resolveService } from '../utils/defaultService';
import type { Artist } from '../services/api';
import type { AuthService } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { TrackOptionsSheet } from './TrackOptionsSheet';
import { haptics } from '../utils/haptics';

interface TrackFavoritesHook {
  isTrackSaved: (trackId: string) => boolean;
  findSavedTrack: (trackId: string) => SavedDiscovery | undefined;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

interface Props {
  artist: Artist;
  service: AuthService;
  accessToken: string | null;
  favoritesHook?: TrackFavoritesHook;
  country?: string;
  onNeedAuth?: () => void;
  autoExpand?: boolean;
  highlightTrack?: string;
  onSearchSimilar?: (name: string) => void;
  onGenrePress?: (genre: string) => void;
  isTester?: boolean;
  testerUserId?: string | null;
}

function eraColors(era: string): { bg: string; border: string; text: string } {
  const e = era.toLowerCase();
  if (e.includes('pioneer')) return { bg: Colors.goldBg, border: Colors.goldBorder, text: Colors.gold };
  if (e.includes('golden')) return { bg: Colors.blueBg, border: Colors.blueBorder, text: Colors.blue };
  return { bg: Colors.purpleBg, border: Colors.purpleBorder, text: Colors.purple };
}

export function ArtistCard({
  artist, service, accessToken, favoritesHook, country,
  onNeedAuth, autoExpand, highlightTrack,
  onSearchSimilar, onGenrePress, isTester, testerUserId,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tracksLoaded, setTracksLoaded] = useState(false);
  const scaleX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (autoExpand) doFlip();
  }, []);

  const loadTracks = async () => {
    if (tracksLoaded) return;
    setLoading(true);
    try {
      const data = await fetchArtistTracks(artist.name, resolveService(service), accessToken || undefined);
      setTracks(data.tracks);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tracks');
    } finally {
      setLoading(false);
      setTracksLoaded(true);
    }
  };

  const doFlip = () => {
    const toBack = !flipped;
    haptics.light();
    Animated.timing(scaleX, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }).start(() => {
      setFlipped(f => !f);
      if (toBack && !tracksLoaded) loadTracks();
      Animated.timing(scaleX, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.4)),
      }).start();
    });
  };

  const era = eraColors(artist.era);

  return (
    <Animated.View style={[styles.card, { transform: [{ scaleX }] }]}>
      {!flipped ? (
        // ── Front ──────────────────────────────────────────
        <TouchableOpacity style={styles.front} onPress={doFlip} activeOpacity={0.88}>
          <View style={styles.frontTop}>
            <View style={styles.frontTopLeft}>
              {onSearchSimilar ? (
                <TouchableOpacity
                  onPress={() => onSearchSimilar(artist.name)}
                  activeOpacity={0.7}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Text style={[styles.artistName, styles.artistNameTappable]}>{artist.name}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.artistName}>{artist.name}</Text>
              )}
            </View>
            <View style={[styles.eraBadge, { backgroundColor: era.bg, borderColor: era.border }]}>
              <Text style={[styles.eraText, { color: era.text }]}>{artist.era}</Text>
            </View>
          </View>

          <View style={styles.frontBottom}>
            {onGenrePress ? (
              <TouchableOpacity
                onPress={() => onGenrePress(artist.genre)}
                activeOpacity={0.7}
                style={styles.genrePill}
              >
                <Text style={styles.genrePillText}>{artist.genre}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.artistGenre}>{artist.genre}</Text>
            )}
            <View style={styles.flipHint}>
              <Ionicons name="musical-notes" size={13} color={Colors.text3} />
              <Text style={styles.flipHintText}>Tap to explore</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        // ── Back ───────────────────────────────────────────
        <View style={styles.back}>
          <TouchableOpacity style={styles.backHeader} onPress={doFlip} activeOpacity={0.7}>
            <Text style={styles.backArtistName} numberOfLines={1}>{artist.name}</Text>
            <View style={styles.backCloseBtn}>
              <Ionicons name="chevron-up" size={18} color={Colors.text3} />
            </View>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.backLoading}>
              <ActivityIndicator size="small" color={Colors.gold} />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>⚠️ {error}</Text>
          ) : tracks.length === 0 ? (
            <TouchableOpacity
              style={styles.youtubeBtn}
              onPress={() => WebBrowser.openBrowserAsync(
                `https://www.youtube.com/results?search_query=${encodeURIComponent(artist.name + ' music')}`
              )}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-youtube" size={16} color="#FF0000" />
              <Text style={styles.youtubeBtnText}>Search on YouTube</Text>
            </TouchableOpacity>
          ) : (
            tracks.map((track, i) => (
              <TrackRow
                key={i}
                index={i + 1}
                track={track}
                favoritesHook={favoritesHook}
                country={country}
                onNeedAuth={onNeedAuth}
                artistGenre={artist.genre}
                highlighted={!!highlightTrack && track.title.toLowerCase() === highlightTrack.toLowerCase()}
                isTester={isTester}
                testerUserId={testerUserId}
              />
            ))
          )}
        </View>
      )}
    </Animated.View>
  );
}


function TrackRow({ track, index, favoritesHook, country, onNeedAuth, artistGenre, highlighted, isTester, testerUserId }: {
  track: Track;
  index: number;
  favoritesHook?: TrackFavoritesHook;
  country?: string;
  onNeedAuth?: () => void;
  artistGenre?: string;
  highlighted?: boolean;
  isTester?: boolean;
  testerUserId?: string | null;
}) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const trackId = track.spotifyId || track.appleId || track.previewUrl || `${track.title}-${index}`;
  const isSaved = favoritesHook?.isTrackSaved(trackId) ?? false;

  const toggleSave = async () => {
    if (onNeedAuth) { onNeedAuth(); return; }
    if (!favoritesHook) return;
    if (isSaved) {
      const entry = favoritesHook.findSavedTrack(trackId);
      if (entry) await favoritesHook.remove(entry.id);
    } else {
      await favoritesHook.save({ type: 'track', country: country ?? '', data: { trackId, track, genre: artistGenre ?? '', country: country ?? '' } });
    }
  };

  const isThisTrack = currentTrackId === trackId;

  const openUrl = track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const embedUrl = track.spotifyId
    ? `https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator`
    : track.appleId
    ? `https://embed.music.apple.com/us/album/${track.appleId}`
    : null;

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const handlePlay = () => {
    if (track.previewUrl) {
      play(trackId, track.previewUrl, track.title, track.artist);
    } else if (embedUrl) {
      WebBrowser.openBrowserAsync(embedUrl);
    } else {
      WebBrowser.openBrowserAsync(youtubeUrl);
    }
  };

  const isYouTubeOnly = !track.previewUrl && !embedUrl;

  return (
    <View style={[styles.track, highlighted && styles.trackHighlighted]}>
      <TrackOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        track={track}
        country={country ?? ''}
        genre={artistGenre}
        openUrl={openUrl}
        isExpertTester={isTester ?? false}
        userId={testerUserId ?? undefined}
      />
      <Text style={styles.trackNumber}>{index}</Text>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        {track.artist && <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>}
      </View>
      <View style={styles.trackActions}>
        <TouchableOpacity
          style={[styles.playBtn, isYouTubeOnly && styles.playBtnYouTube]}
          onPress={handlePlay}
        >
          {isThisTrack && isLoading ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : isYouTubeOnly ? (
            <Ionicons name="logo-youtube" size={18} color="#FF0000" />
          ) : (
            <Ionicons
              name={isThisTrack && isPlaying ? 'pause' : 'play'}
              size={20}
              color={Colors.gold}
            />
          )}
        </TouchableOpacity>
        {favoritesHook && (
          <TouchableOpacity style={[styles.heartBtn, isSaved && styles.heartBtnActive]} onPress={toggleSave}>
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={Colors.red} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.moreBtn} onPress={() => setOptionsVisible(true)}>
          <Text style={styles.moreBtnText}>•••</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },

  // ── Front ────────────────────────────────────────────────
  front: {
    padding: 16,
    gap: 12,
  },
  frontTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  frontTopLeft: { flex: 1 },
  artistName: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.1 },
  artistNameTappable: { color: Colors.blue },
  artistGenre: { color: Colors.text2, fontSize: 15 },
  eraBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexShrink: 0,
  },
  eraText: { fontSize: 13, fontWeight: '700' },

  frontBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genrePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  genrePillText: { color: Colors.purple, fontSize: 13, fontWeight: '700' },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flipHintText: { color: Colors.text3, fontSize: 12 },

  // ── Back ─────────────────────────────────────────────────
  back: {
    paddingBottom: 8,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  backArtistName: {
    flex: 1,
    color: Colors.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  backCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  youtubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 14,
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.25)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  youtubeBtnText: { color: '#FF0000', fontSize: 14, fontWeight: '700' },

  // ── Track rows ───────────────────────────────────────────
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  trackHighlighted: {
    backgroundColor: Colors.goldBg,
  },
  trackNumber: {
    color: Colors.text3,
    fontSize: 14,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 14, marginTop: 3 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.goldBg,
    borderWidth: 1, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnYouTube: {
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderColor: 'rgba(255,0,0,0.25)',
  },
  heartBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(240,101,101,0.08)',
    borderWidth: 1, borderColor: 'rgba(240,101,101,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(240,101,101,0.18)',
    borderColor: 'rgba(240,101,101,0.4)',
  },
  moreBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  moreBtnText: { color: Colors.text3, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  errorText: { color: Colors.red, fontSize: 14, padding: 16 },
});
