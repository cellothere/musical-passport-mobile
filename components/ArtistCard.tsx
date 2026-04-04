import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Animated, Easing, Image,
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

function eraColors(era: string): { bg: string; border: string; text: string; accent: string } {
  const e = era.toLowerCase();
  if (e.includes('pioneer')) return { bg: Colors.goldBg, border: Colors.goldBorder, text: Colors.gold, accent: Colors.gold };
  if (e.includes('golden')) return { bg: Colors.blueBg, border: Colors.blueBorder, text: Colors.blue, accent: Colors.blue };
  const decade = parseInt(e);
  if (!isNaN(decade)) {
    if (decade < 1960) return { bg: Colors.goldBg, border: Colors.goldBorder, text: Colors.gold, accent: Colors.gold };
    if (decade < 2000) return { bg: Colors.blueBg, border: Colors.blueBorder, text: Colors.blue, accent: Colors.blue };
    return { bg: Colors.purpleBg, border: Colors.purpleBorder, text: Colors.purple, accent: Colors.purple };
  }
  return { bg: Colors.purpleBg, border: Colors.purpleBorder, text: Colors.purple, accent: Colors.purple };
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

export function ArtistCard({
  artist, service, favoritesHook, country,
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
      const data = await fetchArtistTracks(artist.name, resolveService(service));
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

  const era = eraColors(artist.era ?? '');

  return (
    <Animated.View style={[styles.card, { transform: [{ scaleX }] }]}>
      {!flipped ? (
        // ── Front ──────────────────────────────────────────
        <TouchableOpacity style={styles.front} onPress={doFlip} activeOpacity={0.82}>
          {/* Era accent strip */}
          <View style={[styles.eraStrip, { backgroundColor: era.accent }]} />

          <View style={styles.frontContent}>
            {/* Photo or initials */}
            <View style={[styles.thumbRing, { borderColor: era.border }]}>
              {artist.imageUrl ? (
                <Image source={{ uri: artist.imageUrl }} style={styles.artistThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.initialsCircle, { backgroundColor: era.bg }]}>
                  <Text style={[styles.initialsText, { color: era.accent }]}>{initials(artist.name)}</Text>
                </View>
              )}
            </View>

            {/* Info column */}
            <View style={styles.infoCol}>
              {/* Name row */}
              <View style={styles.nameRow}>
                {onSearchSimilar ? (
                  <TouchableOpacity
                    onPress={() => { haptics.light(); onSearchSimilar(artist.name); }}
                    activeOpacity={0.7}
                    style={styles.nameTouchable}
                  >
                    <Text style={[styles.artistName, styles.artistNameTappable]} numberOfLines={2}>
                      {artist.name}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.artistName} numberOfLines={2}>{artist.name}</Text>
                )}
                <View style={[styles.eraBadge, { backgroundColor: era.bg, borderColor: era.border }]}>
                  <Text style={[styles.eraText, { color: era.text }]}>{artist.era}</Text>
                </View>
              </View>

              {/* Genre + hint row */}
              <View style={styles.metaRow}>
                {onGenrePress ? (
                  <TouchableOpacity
                    onPress={() => { haptics.light(); onGenrePress(artist.genre); }}
                    activeOpacity={0.7}
                    style={styles.genreTouch}
                  >
                    <Ionicons name="musical-notes" size={11} color={Colors.text3} />
                    <Text style={styles.genreText} numberOfLines={1}>{artist.genre}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.genreTouch}>
                    <Ionicons name="musical-notes" size={11} color={Colors.text3} />
                    <Text style={styles.genreText} numberOfLines={1}>{artist.genre}</Text>
                  </View>
                )}
                <Text style={styles.tapHint}>tracks ›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        // ── Back ───────────────────────────────────────────
        <View style={styles.back}>
          <TouchableOpacity style={styles.backHeader} onPress={doFlip} activeOpacity={0.7}>
            <View style={[styles.thumbRingSmall, { borderColor: era.border }]}>
              {artist.imageUrl ? (
                <Image source={{ uri: artist.imageUrl }} style={styles.artistThumbSmall} resizeMode="cover" />
              ) : (
                <View style={[styles.initialsCircleSmall, { backgroundColor: era.bg }]}>
                  <Text style={[styles.initialsTextSmall, { color: era.accent }]}>{initials(artist.name)}</Text>
                </View>
              )}
            </View>
            <View style={styles.backHeaderInfo}>
              <Text style={styles.backArtistName} numberOfLines={1}>{artist.name}</Text>
              <Text style={styles.backGenre} numberOfLines={1}>{artist.genre}</Text>
            </View>
            <View style={styles.backCloseBtn}>
              <Ionicons name="chevron-up" size={16} color={Colors.text3} />
            </View>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.backLoading}>
              <ActivityIndicator size="small" color={Colors.gold} />
              <Text style={styles.loadingText}>Finding tracks…</Text>
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

  const openUrl = track.deezerUrl
    ?? track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const embedUrl = track.deezerId
    ? `https://widget.deezer.com/widget/dark/track/${track.deezerId}`
    : track.spotifyId
    ? `https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator`
    : track.appleId
    ? `https://embed.music.apple.com/us/album/${track.appleId}`
    : null;

  const youtubeUrl = track.youtubeUrl
    ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

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
          <Ionicons name="ellipsis-horizontal" size={16} color={Colors.text3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const THUMB = 64;
const THUMB_SM = 36;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },

  // ── Front ────────────────────────────────────────────────
  front: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 80,
  },
  eraStrip: {
    width: 3,
    borderRadius: 0,
    opacity: 0.7,
  },
  frontContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },

  // Photo / initials
  thumbRing: {
    width: THUMB, height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  artistThumb: {
    width: THUMB, height: THUMB,
  },
  initialsCircle: {
    width: THUMB, height: THUMB,
    alignItems: 'center', justifyContent: 'center',
  },
  initialsText: {
    fontSize: 22, fontWeight: '700', letterSpacing: -0.5,
  },

  // Info column
  infoCol: { flex: 1, gap: 5 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  nameTouchable: { flex: 1 },
  artistName: {
    flex: 1,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  artistNameTappable: { color: Colors.blue },

  eraBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  eraText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  genreTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  genreText: {
    color: Colors.text3,
    fontSize: 13,
    flex: 1,
  },
  tapHint: {
    color: Colors.text3,
    fontSize: 12,
    opacity: 0.6,
    flexShrink: 0,
  },

  // ── Back ─────────────────────────────────────────────────
  back: { paddingBottom: 4 },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  thumbRingSmall: {
    width: THUMB_SM, height: THUMB_SM,
    borderRadius: THUMB_SM / 2,
    borderWidth: 1.5,
    overflow: 'hidden',
    flexShrink: 0,
  },
  artistThumbSmall: { width: THUMB_SM, height: THUMB_SM },
  initialsCircleSmall: {
    width: THUMB_SM, height: THUMB_SM,
    alignItems: 'center', justifyContent: 'center',
  },
  initialsTextSmall: { fontSize: 13, fontWeight: '700' },
  backHeaderInfo: { flex: 1 },
  backArtistName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  backGenre: {
    color: Colors.text3,
    fontSize: 12,
    marginTop: 1,
  },
  backCloseBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  backLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: Colors.text3, fontSize: 13 },
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  trackHighlighted: { backgroundColor: Colors.goldBg },
  trackNumber: {
    color: Colors.text3,
    fontSize: 13,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 13, marginTop: 2 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.goldBg,
    borderWidth: 1, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnYouTube: {
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderColor: 'rgba(255,0,0,0.25)',
  },
  heartBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(240,101,101,0.08)',
    borderWidth: 1, borderColor: 'rgba(240,101,101,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(240,101,101,0.18)',
    borderColor: 'rgba(240,101,101,0.4)',
  },
  moreBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  errorText: { color: Colors.red, fontSize: 14, padding: 16 },
});
