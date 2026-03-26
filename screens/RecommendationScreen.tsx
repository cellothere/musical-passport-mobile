import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Linking, Modal, FlatList, Platform, Image,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { DECADES } from '../constants/regions';
import { FLAGS } from '../constants/flags';
import { haptics } from '../utils/haptics';
import {
  fetchRecommendations, fetchTimeMachine,
  RecommendationResponse, TimeMachineResponse, Track,
} from '../services/api';
import { resolveService } from '../utils/defaultService';
import { ArtistCard } from '../components/ArtistCard';
import { GlobeOverlay } from '../components/GlobeOverlay';
import { FloatingNav } from '../components/FloatingNav';
import { ServiceModal } from '../components/ServiceModal';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { TrackOptionsSheet } from '../components/TrackOptionsSheet';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

const FLAG_IMAGES: Record<string, any> = {
  'Republic of South Vietnam': require('../assets/SouthVietnam.png'),
  'Quebec': require('../assets/QuebecFlag.png'),
  'East Germany': require('../assets/EastGermany.png'),
  'Zaire': require('../assets/ZaireFlag.png')
};

interface StampsHook {
  stamps: Set<string>;
  addStamp: (country: string) => Promise<void>;
}

interface FavoritesHook {
  isTrackSaved: (trackId: string) => boolean;
  findSavedTrack: (trackId: string) => SavedDiscovery | undefined;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  favorites: SavedDiscovery[];
}

interface Props {
  navigation: any;
  route: { params: { country: string; decade?: string; savedData?: RecommendationResponse | TimeMachineResponse; highlightArtist?: string; highlightTrack?: string } };
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
  stampsHook: StampsHook;
  favoritesHook: FavoritesHook;
}

// ── Decade picker modal ────────────────────────────────────
function DecadePickerModal({ visible, selected, onClose, onSelect }: {
  visible: boolean;
  selected: string;
  onClose: () => void;
  onSelect: (decade: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const items = ['', ...DECADES];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.bg, paddingBottom: insets.bottom }}>
        <View style={pickerStyles.header}>
          {Platform.OS === 'ios' && <View style={pickerStyles.handle} />}
          <View style={pickerStyles.headerRow}>
            <Text style={pickerStyles.title}>Select a Decade</Text>
            <TouchableOpacity onPress={onClose} style={pickerStyles.doneBtn}>
              <Text style={pickerStyles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={items}
          keyExtractor={d => d || '__any'}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                style={[pickerStyles.row, isSelected && pickerStyles.rowSelected]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.6}
              >
                <View style={pickerStyles.rowIcon}>
                  {item === '' && <Ionicons name="shuffle" size={18} color={isSelected ? Colors.gold : Colors.text3} />}
                </View>
                <Text style={[pickerStyles.rowLabel, isSelected && pickerStyles.rowLabelSelected]}>
                  {item || 'Any era'}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color={Colors.gold} />}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={pickerStyles.sep} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </Modal>
  );
}

// ── Track row (for time-machine mode) ─────────────────────
function TrackRow({ track, index, favoritesHook, country, genre, onNeedAuth, isTester, testerUserId }: {
  track: Track;
  index: number;
  favoritesHook?: FavoritesHook;
  country?: string;
  genre?: string;
  onNeedAuth?: () => void;
  isTester?: boolean;
  testerUserId?: string | null;
}) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const trackId = track.spotifyId || track.appleId || track.previewUrl || `${track.title}-${index}`;
  const isThisTrack = currentTrackId === trackId;
  const isSaved = favoritesHook?.isTrackSaved(trackId) ?? false;
  const toggleSave = async () => {
    if (onNeedAuth) { onNeedAuth(); return; }
    if (!favoritesHook) return;
    if (isSaved) {
      const entry = favoritesHook.findSavedTrack(trackId);
      if (entry) await favoritesHook.remove(entry.id);
    } else {
      await favoritesHook.save({ type: 'track', country: country ?? '', data: { trackId, track, genre: '', country: country ?? '' } });
    }
  };

  const openUrl = track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const embedUrl = track.spotifyId
    ? `https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator`
    : track.appleId ? `https://embed.music.apple.com/us/album/${track.appleId}` : null;

  const handlePlay = () => {
    if (track.previewUrl) {
      play(trackId, track.previewUrl, track.title, track.artist);
    } else if (embedUrl) {
      WebBrowser.openBrowserAsync(embedUrl);
    }
  };

  const canPlay = !!(track.previewUrl || embedUrl);

  return (
    <View style={styles.track}>
      <Text style={styles.trackNumber}>{index}</Text>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        {track.artist && <Text style={styles.trackArtist}>{track.artist}</Text>}
      </View>
      <View style={styles.trackActions}>
        {canPlay ? (
          <TouchableOpacity
            style={[styles.playBtn, isThisTrack && styles.playBtnActive]}
            onPress={handlePlay}
          >
            {isThisTrack && isLoading
              ? <ActivityIndicator size="small" color={Colors.gold} />
              : <Ionicons name={isThisTrack && isPlaying ? 'pause' : 'play'} size={18} color={isThisTrack ? Colors.gold : Colors.text2} />
            }
          </TouchableOpacity>
        ) : (
          <View style={[styles.playBtn, styles.playBtnDisabled]}>
            <Ionicons name="play" size={18} color={Colors.text3} />
          </View>
        )}
        {favoritesHook && (
          <TouchableOpacity style={[styles.heartBtn, isSaved && styles.heartBtnActive]} onPress={toggleSave}>
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={Colors.red} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.openBtn} onPress={() => setOptionsVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={18} color={Colors.text2} />
        </TouchableOpacity>
      </View>
      <TrackOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        track={track}
        country={country ?? ''}
        openUrl={openUrl}
        isExpertTester={isTester ?? false}
        userId={testerUserId ?? undefined}
        genre={genre}
      />
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────
export function RecommendationScreen({ navigation, route, auth, stampsHook, favoritesHook }: Props) {
  const { country, decade: initialDecade, savedData, highlightArtist, highlightTrack } = route.params;
  const { stamps, addStamp } = stampsHook;
  const insets = useSafeAreaInsets();
  const { currentTrackTitle } = useAudioPlayer();
  const contentBottomPad = insets.bottom + 76 + (currentTrackTitle ? 72 : 0);

  const [selectedDecade, setSelectedDecade] = useState(initialDecade ?? '');
  const [decadePickerVisible, setDecadePickerVisible] = useState(false);

  // Globe state
  const [globeVisible, setGlobeVisible] = useState(true);
  const [globeCountry, setGlobeCountry] = useState(country);
  const [globeDecade, setGlobeDecade] = useState(initialDecade ?? '');

  // Content state
  const [recs, setRecs] = useState<RecommendationResponse | null>(
    savedData && !('tracks' in savedData) ? savedData as RecommendationResponse : null
  );
  const [tmData, setTmData] = useState<TimeMachineResponse | null>(
    savedData && 'tracks' in savedData ? savedData as TimeMachineResponse : null
  );
  const [loading, setLoading] = useState(!savedData);
  const [error, setError] = useState<string | null>(null);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [dykExpanded, setDykExpanded] = useState(false);

  const pendingFetch = useRef<Promise<any> | null>(null);
  const pendingResult = useRef<any>(null);
  const pendingError = useRef<string | null>(null);
  const exploreScrollRef = useRef<any>(null);
  const highlightedY = useRef<number | null>(null);

  const fetchContent = (c: string, d: string) => {
    setLoading(true);
    setError(null);
    setRecs(null);
    setTmData(null);
    pendingResult.current = null;
    pendingError.current = null;
    setDykExpanded(false);

    const promise = d
      ? fetchTimeMachine(c, d, resolveService(auth.service), auth.accessToken || undefined)
      : fetchRecommendations(c, auth.accessToken || undefined);

    pendingFetch.current = promise
      .then(data => { pendingResult.current = data; })
      .catch(err => {
        const msg = err.message || '';
        pendingError.current = msg.toLowerCase().includes('overload')
          ? 'Our servers are busy right now. Try again in a moment.'
          : msg || 'Something went wrong';
      });
  };

  // Initial load — kick off fetch in parallel with globe animation
  useEffect(() => {
    if (!savedData) fetchContent(country, initialDecade ?? '');
  }, []);

  // Scroll to highlighted artist after expand animation settles
  useEffect(() => {
    if (!highlightArtist || !recs) return;
    const timer = setTimeout(() => {
      if (highlightedY.current !== null) {
        exploreScrollRef.current?.scrollTo({ y: Math.max(0, highlightedY.current - 100), animated: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recs]);

  const handleGlobeDone = async () => {
    setGlobeVisible(false);
    if (savedData) { setLoading(false); return; }
    try {
      if (pendingFetch.current) await pendingFetch.current;
      if (pendingError.current) {
        setError(pendingError.current);
      } else if (pendingResult.current) {
        const data = pendingResult.current;
        if ('tracks' in data) {
          setTmData(data);
          addStamp(country);
        } else {
          setRecs(data);
          addStamp(country);
        }
        haptics.success();
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError(pendingError.current ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDecadeChange = (decade: string) => {
    setSelectedDecade(decade);
    setGlobeCountry(country);
    setGlobeDecade(decade);
    setGlobeVisible(true);
    fetchContent(country, decade);
  };

  const isStamped = stamps.has(country);
  const flag = FLAGS[country] ?? '🌐';


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <View style={styles.headerTitleRow}>
            {FLAG_IMAGES[country]
              ? <Image source={FLAG_IMAGES[country]} style={styles.countryFlagImg} />
              : <Text style={styles.countryFlag}>{flag}</Text>}
            <Text style={styles.countryName}>{country}</Text>
          </View>
        </View>

      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
            <Text style={styles.goBackBtnText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      ) : tmData ? (
        // ── Time Machine mode ────────────────────────────────
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.genreBadgeWrap}>
            <TouchableOpacity
              style={styles.genreBadge}
              onPress={() => navigation.navigate('GenreSpotlight', { genre: tmData.genre, country })}
              activeOpacity={0.7}
            >
              <Text style={styles.genreBadgeText}>{tmData.genre}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tracksHeading}>Essential tracks</Text>
          {tmData.tracks.map((track, i) => (
            <TrackRow
              key={i}
              track={track}
              index={i + 1}
              favoritesHook={favoritesHook}
              country={country}
              genre={tmData.genre}
              onNeedAuth={undefined}
              isTester={auth.isTester}
              testerUserId={auth.testerUserId}
            />
          ))}
          <View style={{ height: contentBottomPad }} />
        </ScrollView>
      ) : recs ? (
        // ── Explore mode ─────────────────────────────────────
        <ScrollView ref={exploreScrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {recs.genres?.length > 0 && (
            <View style={styles.genresRow}>
              <View style={styles.genres}>
                {recs.genres.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={styles.genreTag}
                    onPress={() => navigation.navigate('GenreSpotlight', { genre: g, country })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.genreText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.genreActions}>
                <TouchableOpacity
                  style={[styles.decadePill, selectedDecade ? styles.decadePillActive : null]}
                  onPress={() => setDecadePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={26} color={Colors.gold} />
                  {selectedDecade ? <Text style={styles.decadePillTextActive}>{selectedDecade}</Text> : null}
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Artists to discover</Text>
            <Text style={styles.sectionHint}>Tap any artist to reveal tracks</Text>
          </View>
          {(recs.artists || []).map((artist, i) => {
            const isHighlighted = !!highlightArtist && artist.name.toLowerCase() === highlightArtist.toLowerCase();
            return (
              <View
                key={i}
                onLayout={isHighlighted ? (e) => { highlightedY.current = e.nativeEvent.layout.y; } : undefined}
              >
                <ArtistCard
                  artist={artist}
                  service={auth.service}
                  accessToken={auth.accessToken}
                  favoritesHook={favoritesHook}
                  country={country}
                  onNeedAuth={undefined}
                  autoExpand={isHighlighted}
                  highlightTrack={isHighlighted ? highlightTrack : undefined}
                  onSearchSimilar={(name) => navigation.navigate('ArtistSearch', { prefillArtist: name })}
                  isTester={auth.isTester}
                  testerUserId={auth.testerUserId}
                />
              </View>
            );
          })}
          {recs.didYouKnow && (
            <TouchableOpacity
              style={styles.dyk}
              onPress={() => { haptics.light(); setDykExpanded(e => !e); }}
              activeOpacity={0.8}
            >
              <View style={styles.dykHeader}>
                <Text style={styles.dykLabel}>💡 Did you know</Text>
                <Ionicons
                  name={dykExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.gold}
                />
              </View>
              {dykExpanded && <Text style={styles.dykText}>{recs.didYouKnow}</Text>}
            </TouchableOpacity>
          )}
          <View style={{ height: contentBottomPad }} />
        </ScrollView>
      ) : null}

      <GlobeOverlay
        visible={globeVisible}
        country={globeCountry}
        decade={globeDecade}
        onDone={handleGlobeDone}
      />

      <DecadePickerModal
        visible={decadePickerVisible}
        selected={selectedDecade}
        onClose={() => setDecadePickerVisible(false)}
        onSelect={handleDecadeChange}
      />
      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites ?? []} />
      <ServiceModal visible={serviceModalVisible} onClose={() => setServiceModalVisible(false)} auth={auth} />
    </SafeAreaView>
  );
}

// ── Picker styles ──────────────────────────────────────────
const pickerStyles = StyleSheet.create({
  header: {
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 18, paddingBottom: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  title: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  doneBtn: {
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
  },
  doneBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 15, gap: 14,
  },
  rowSelected: { backgroundColor: Colors.goldBg },
  rowIcon: { width: 24, alignItems: 'center' },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowLabelSelected: { color: Colors.gold, fontWeight: '600' },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 56 },
});

// ── Screen styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  backIcon: { color: Colors.blue, fontSize: 32, lineHeight: 32, fontWeight: '300' },
  headerMid: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryFlag: { fontSize: 26 },
  countryFlagImg: { width: 34, height: 22, borderRadius: 3 },
  countryName: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  decadePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.text3,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  decadePillActive: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  decadePillText: { color: Colors.text3, fontSize: 12, fontWeight: '600' },
  decadePillTextActive: { color: Colors.gold },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  errorIcon: { fontSize: 40 },
  errorText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  goBackBtn: {
    marginTop: 8, backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  goBackBtnText: { color: Colors.text, fontSize: 15, fontWeight: '600' },

  scroll: { flex: 1 },
  content: { padding: 18 },

  // Explore mode
  genresRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 20 },
  genres: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  genreActions: { flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 2 },
  genreTag: {
    backgroundColor: Colors.purpleBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  genreText: { color: Colors.purple, fontSize: 13, fontWeight: '600' },
  sectionHeader: { marginBottom: 14 },
  sectionHeading: { color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  sectionHint: { color: Colors.text3, fontSize: 13 },
  dyk: { backgroundColor: Colors.goldBg, borderRadius: 14, padding: 16, marginTop: 10 },
  dykHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dykLabel: { color: Colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  dykText: { color: Colors.text, fontSize: 15, lineHeight: 23, marginTop: 10 },

  // Time Machine mode
  genreBadgeWrap: { marginBottom: 14 },
  genreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  genreBadgeText: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  tmDesc: { color: Colors.text2, fontSize: 14, lineHeight: 21, marginBottom: 20 },
  tracksHeading: { color: Colors.text3, fontSize: 12, fontWeight: '500', marginBottom: 10 },
  track: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12,
  },
  trackNumber: { color: Colors.text3, fontSize: 14, fontWeight: '700', width: 24, textAlign: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 14, marginTop: 3 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  playBtnDisabled: { opacity: 0.35 },
  heartBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(240,101,101,0.08)', borderWidth: 1, borderColor: 'rgba(240,101,101,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(240,101,101,0.18)', borderColor: 'rgba(240,101,101,0.4)',
  },
  openBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.blueBg, borderWidth: 1, borderColor: Colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  bottomPad: { height: 48 },
});
