import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Share,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchGenreSpotlight, fetchGenreDeeper, Track } from '../services/api';
import { resolveService } from '../utils/defaultService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { TrackOptionsSheet } from '../components/TrackOptionsSheet';
import type { AuthService, AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { FloatingNav } from '../components/FloatingNav';
import { haptics } from '../utils/haptics';

interface FavoritesHook {
  isTrackSaved: (trackId: string) => boolean;
  findSavedTrack: (trackId: string) => SavedDiscovery | undefined;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  favorites: SavedDiscovery[];
}

interface Props {
  navigation: any;
  route: { params: { genre: string; country: string; deeperReason?: string; visitedGenres?: string[]; relatedArtistNames?: string[] } };
  service: AuthService;
  favoritesHook: FavoritesHook;
  auth: AuthState;
}

export function GenreSpotlightScreen({ navigation, route, service, favoritesHook, auth }: Props) {
  const { genre, country, deeperReason, visitedGenres = [], relatedArtistNames = [] } = route.params;
  const insets = useSafeAreaInsets();
  const { currentTrackTitle } = useAudioPlayer();
  const contentBottomPad = insets.bottom + 76 + (currentTrackTitle ? 72 : 0);
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [suggestedGenres, setSuggestedGenres] = useState<string[]>([]);
  const [hasLocalScene, setHasLocalScene] = useState(true);
  const [isNicheWorldGenre, setIsNicheWorldGenre] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deeperLoading, setDeeperLoading] = useState(false);

  const handleTakeDeeper = async () => {
    setDeeperLoading(true);
    haptics.light();
    try {
      const alreadySeen = [...visitedGenres, genre];
      const deeper = await fetchGenreDeeper(genre, country, resolveService(service), alreadySeen);
      haptics.success();
      navigation.push('GenreSpotlight', {
        genre: deeper.genre,
        country: deeper.country,
        deeperReason: deeper.reason,
        visitedGenres: alreadySeen,
      });
    } catch {
      // silently fail
    } finally {
      setDeeperLoading(false);
    }
  };

  const shareGenre = async () => {
    haptics.light();
    const deepLink = `musical-passport://genre/${encodeURIComponent(genre)}?country=${encodeURIComponent(country)}`;
    await Share.share({
      title: `${genre} – ${country}`,
      message: `Check out this genre I discovered on Musical Passport!\n\n🎵 ${genre} from ${country}\n\n${deepLink}`,
    });
  };

  useEffect(() => {
    fetchGenreSpotlight(genre, country, resolveService(service), undefined, relatedArtistNames)
      .then(data => {
        const niche = data.isNicheWorldGenre === true;
        setIsNicheWorldGenre(niche);
        setHasLocalScene(data.hasLocalScene !== false);
        setTracks(data.hasLocalScene === false ? [] : data.tracks);
        setSuggestedGenres(data.suggestedGenres ?? []);
        haptics.success();
      })
      .catch(err => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [genre, country]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading spotlight…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: contentBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroGenre}>{genre}</Text>
            {isNicheWorldGenre ? (
              <View style={styles.worldwideChip}>
                <Ionicons name="globe-outline" size={12} color={Colors.purple} />
                <Text style={styles.worldwideChipText}>worldwide</Text>
              </View>
            ) : country ? (
              <TouchableOpacity
                style={styles.countryChip}
                onPress={() => navigation.push('Recommendations', { country })}
                activeOpacity={0.7}
              >
                <Text style={styles.countryChipText}>{country}</Text>
                <Ionicons name="arrow-forward" size={11} color={Colors.blue} />
              </TouchableOpacity>
            ) : null}

            {deeperReason && (
              <View style={styles.deeperReasonCard}>
                <Ionicons name="footsteps" size={14} color={Colors.purple} />
                <Text style={styles.deeperReasonText}>{deeperReason}</Text>
              </View>
            )}
          </View>


          {/* Tracks */}
          <View style={styles.tracksSection}>
            <Text style={styles.tracksLabel}>Essential Tracks</Text>

            {tracks.length === 0 ? (
              <View style={styles.noTracksState}>
                <Ionicons name="musical-notes-outline" size={40} color={Colors.text3} />
                <Text style={styles.noTracksTitle}>
                  We couldn't find {genre} in {country} — try these artists instead:
                </Text>
                <TouchableOpacity
                  style={styles.worldwideBtn}
                  onPress={() => navigation.replace('GenreArtists', { genre })}
                  activeOpacity={0.82}
                >
                  <Ionicons name="globe-outline" size={18} color={Colors.bg} />
                  <Text style={styles.worldwideBtnText}>
                    Check out {genre} artists worldwide
                  </Text>
                </TouchableOpacity>
                {suggestedGenres.length > 0 && (
                  <>
                    <Text style={styles.orTryText}>or try {country}'s genres:</Text>
                    <View style={styles.suggestedRow}>
                      {suggestedGenres.map(g => (
                        <TouchableOpacity
                          key={g}
                          style={styles.suggestedPill}
                          onPress={() => navigation.replace('GenreSpotlight', { genre: g, country })}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="musical-notes" size={13} color={Colors.purple} />
                          <Text style={styles.suggestedPillText}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.trackList}>
                {tracks.map((track, i) => (
                  <SpotlightTrack
                    key={i}
                    index={i + 1}
                    track={track}
                    genre={genre}
                    country={country}
                    favoritesHook={favoritesHook}
                    isTester={auth.isTester}
                    testerUserId={auth.testerUserId ?? null}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Take deeper */}
          {hasLocalScene && (<TouchableOpacity
            style={styles.deeperBtn}
            onPress={handleTakeDeeper}
            disabled={deeperLoading}
            activeOpacity={0.8}
          >
            {deeperLoading ? (
              <ActivityIndicator size="small" color={Colors.purple} />
            ) : (
              <>
                <Ionicons name="footsteps" size={18} color={Colors.purple} />
                <Text style={styles.deeperBtnText}>Go deeper into this genre</Text>
              </>
            )}
          </TouchableOpacity>)}
        </ScrollView>
      )}

      <FloatingNav
        navigation={navigation}
        auth={auth}
        favorites={favoritesHook.favorites}
        onShare={!loading && !error ? shareGenre : undefined}
      />
    </SafeAreaView>
  );
}

function SpotlightTrack({ track, index, genre, country, favoritesHook, isTester, testerUserId }: {
  track: Track;
  index: number;
  genre: string;
  country: string;
  favoritesHook: FavoritesHook;
  isTester: boolean;
  testerUserId: string | null;
}) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const trackId = track.spotifyId || track.appleId || track.deezerId || `${track.title}-${track.artist ?? ''}`;
  const isThisTrack = currentTrackId === trackId;

  const openUrl = (track.deezerUrl ?? null)
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

  const isSaved = favoritesHook.isTrackSaved(trackId);
  const toggleSave = async () => {
    if (isSaved) {
      const entry = favoritesHook.findSavedTrack(trackId);
      if (entry) await favoritesHook.remove(entry.id);
    } else {
      haptics.light();
      await favoritesHook.save({ type: 'track', country, data: { trackId, track, genre, country } });
    }
  };

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
    <View style={styles.track}>
      <Text style={styles.trackNumber}>{index}</Text>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        {track.artist && <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>}
      </View>
      <View style={styles.trackActions}>
        <TouchableOpacity
          style={[styles.playBtn, isThisTrack && !isYouTubeOnly && styles.playBtnActive, isYouTubeOnly && styles.playBtnYouTube]}
          onPress={handlePlay}
        >
          {isThisTrack && isLoading ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : isYouTubeOnly ? (
            <Ionicons name="logo-youtube" size={18} color="#FF0000" />
          ) : (
            <Ionicons
              name={isThisTrack && isPlaying ? 'pause' : 'play'}
              size={18}
              color={isThisTrack ? Colors.gold : Colors.text2}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.heartBtn, isSaved && styles.heartBtnActive]} onPress={toggleSave}>
          <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={Colors.red} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} onPress={() => setOptionsVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={18} color={Colors.text2} />
        </TouchableOpacity>
      </View>
      <TrackOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        track={track}
        country={country}
        genre={genre}
        openUrl={openUrl}
        isExpertTester={isTester}
        userId={testerUserId ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
  },
  loadingText: { color: Colors.text3, fontSize: 14 },
  errorText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  retryBtnText: { color: Colors.text, fontSize: 15, fontWeight: '600' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },

  // ── Hero ───────────────────────────────────────────────────
  hero: {
    paddingTop: 4,
    paddingBottom: 20,
    gap: 8,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.blueBg,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countryChipText: {
    color: Colors.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  worldwideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  worldwideChipText: {
    color: Colors.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  heroGenre: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  deeperReasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  deeperReasonText: {
    flex: 1,
    color: Colors.purple,
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Tracks ────────────────────────────────────────────────
  tracksSection: { marginBottom: 8 },
  tracksLabel: {
    color: Colors.text3,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  trackList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  trackNumber: { color: Colors.text3, fontSize: 13, fontWeight: '700', width: 20, textAlign: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 13, marginTop: 2 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  playBtnYouTube: { backgroundColor: 'rgba(255,0,0,0.08)', borderColor: 'rgba(255,0,0,0.25)' },
  heartBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(240,101,101,0.08)', borderWidth: 1, borderColor: 'rgba(240,101,101,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(240,101,101,0.2)', borderColor: 'rgba(240,101,101,0.4)',
  },
  moreBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },

  noTracksState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 14,
  },
  noTracksTitle: {
    color: Colors.text2,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  worldwideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.purple,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  worldwideBtnText: {
    color: Colors.bg,
    fontSize: 15,
    fontWeight: '700',
  },
  orTryText: {
    color: Colors.text3,
    fontSize: 13,
    marginTop: 4,
  },
  suggestedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestedPillText: {
    color: Colors.purple,
    fontSize: 14,
    fontWeight: '700',
  },
  youtubeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8,
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.25)',
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12,
  },
  youtubeBtnText: { color: '#FF0000', fontSize: 15, fontWeight: '700' },

  // ── Deeper button ─────────────────────────────────────────
  deeperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 16,
    paddingVertical: 16,
  },
  deeperBtnText: { color: Colors.purple, fontSize: 15, fontWeight: '700' },
});
