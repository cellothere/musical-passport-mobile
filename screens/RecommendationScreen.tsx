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
import {
  fetchRecommendations, fetchTimeMachine,
  RecommendationResponse, TimeMachineResponse, Track,
} from '../services/api';
import { ArtistCard } from '../components/ArtistCard';
import { GlobeOverlay } from '../components/GlobeOverlay';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

const FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Greece': '🇬🇷',
  'Poland': '🇵🇱', 'Iceland': '🇮🇸', 'Finland': '🇫🇮', 'Ireland': '🇮🇪',
  'Netherlands': '🇳🇱', 'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦',
  'Hungary': '🇭🇺', 'Czechia': '🇨🇿', 'Turkey': '🇹🇷',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Cuba': '🇨🇺',
  'Mexico': '🇲🇽', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Jamaica': '🇯🇲',
  'Venezuela': '🇻🇪', 'Bolivia': '🇧🇴', 'Ecuador': '🇪🇨', 'Panama': '🇵🇦',
  'Nigeria': '🇳🇬', 'Ghana': '🇬🇭', 'Senegal': '🇸🇳', 'Mali': '🇲🇱',
  'Ethiopia': '🇪🇹', 'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'Cameroon': '🇨🇲',
  'Congo': '🇨🇩', 'Kenya': '🇰🇪', 'Algeria': '🇩🇿', 'Morocco': '🇲🇦',
  'Tanzania': '🇹🇿', 'Lebanon': '🇱🇧', 'Iran': '🇮🇷', 'Israel': '🇮🇱',
  'Saudi Arabia': '🇸🇦', 'Armenia': '🇦🇲', 'Azerbaijan': '🇦🇿', 'Georgia': '🇬🇪',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'India': '🇮🇳', 'China': '🇨🇳',
  'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Philippines': '🇵🇭',
  'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Taiwan': '🇹🇼', 'Mongolia': '🇲🇳',
  'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'Papua New Guinea': '🇵🇬', 'Fiji': '🇫🇯',
  'USA': '🇺🇸', 'Canada': '🇨🇦', 'Haiti': '🇭🇹', 'Trinidad & Tobago': '🇹🇹', 'Barbados': '🇧🇧',
  'Yugoslavia': '🏳', 'Soviet Union': '☭', 'Czechoslovakia': '🏳',
  'East Germany': '🏳', 'Ottoman Empire': '🌙', 'British India': '🏳',
};

const FLAG_IMAGES: Record<string, any> = {
  'Republic of South Vietnam': require('../assets/SouthVietnam.png'),
};

interface StampsHook {
  stamps: Set<string>;
  addStamp: (country: string) => Promise<void>;
}

interface FavoritesHook {
  isSaved: (country: string, type: SavedDiscovery['type'], decade?: string) => boolean;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  findSaved: (country: string, type: SavedDiscovery['type'], decade?: string) => SavedDiscovery | undefined;
}

interface Props {
  navigation: any;
  route: { params: { country: string; decade?: string; savedData?: RecommendationResponse | TimeMachineResponse } };
  auth: AuthState;
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
function TrackRow({ track, index }: { track: Track; index: number }) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const trackId = track.spotifyId || track.appleId || track.previewUrl || `${track.title}-${index}`;
  const isThisTrack = currentTrackId === trackId;

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
        {canPlay && (
          <TouchableOpacity
            style={[styles.playBtn, isThisTrack && styles.playBtnActive]}
            onPress={handlePlay}
          >
            {isThisTrack && isLoading
              ? <ActivityIndicator size="small" color={Colors.gold} />
              : <Ionicons name={isThisTrack && isPlaying ? 'pause' : 'play'} size={18} color={isThisTrack ? Colors.gold : Colors.text2} />
            }
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.openBtn} onPress={() => Linking.openURL(openUrl)}>
          <Ionicons name="open-outline" size={18} color={Colors.blue} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────
export function RecommendationScreen({ navigation, route, auth, stampsHook, favoritesHook }: Props) {
  const { country, decade: initialDecade, savedData } = route.params;
  const { stamps, addStamp } = stampsHook;
  const { isSaved, save, remove, findSaved } = favoritesHook;

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

  const pendingFetch = useRef<Promise<any> | null>(null);
  const pendingResult = useRef<any>(null);
  const pendingError = useRef<string | null>(null);

  const fetchContent = (c: string, d: string) => {
    setLoading(true);
    setError(null);
    setRecs(null);
    setTmData(null);
    pendingResult.current = null;
    pendingError.current = null;

    const promise = d
      ? fetchTimeMachine(c, d, auth.service || 'spotify', auth.accessToken || undefined)
      : fetchRecommendations(c, auth.accessToken || undefined);

    pendingFetch.current = promise
      .then(data => { pendingResult.current = data; return data; })
      .catch(err => { pendingError.current = err.message || 'Something went wrong'; throw err; });
  };

  // Initial load — kick off fetch in parallel with globe animation
  useEffect(() => {
    if (!savedData) fetchContent(country, initialDecade ?? '');
  }, []);

  const handleGlobeDone = async () => {
    setGlobeVisible(false);
    if (savedData) { setLoading(false); return; }
    try {
      if (pendingFetch.current) await pendingFetch.current;
      if (pendingResult.current) {
        const data = pendingResult.current;
        if ('tracks' in data) {
          setTmData(data);
          addStamp(country);
        } else {
          setRecs(data);
          addStamp(country);
        }
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

  // Save / heart logic — handles both types
  const currentType = tmData ? 'timemachine' : 'recommendation';
  const currentDecade = tmData ? selectedDecade : undefined;
  const saved = isSaved(country, currentType, currentDecade);

  const toggleSave = async () => {
    if (saved) {
      const entry = findSaved(country, currentType, currentDecade);
      if (entry) await remove(entry.id);
    } else if (tmData) {
      await save({ type: 'timemachine', country, decade: selectedDecade, data: tmData });
    } else if (recs) {
      await save({ type: 'recommendation', country, data: recs });
    }
  };

  const isStamped = stamps.has(country);
  const flag = FLAGS[country] ?? '🌐';
  const hasContent = !!(recs || tmData);

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
          {isStamped && (
            <View style={styles.stampedBadge}>
              <Text style={styles.stampedBadgeText}>✦ Stamped</Text>
            </View>
          )}
        </View>

        {/* Decade filter pill */}
        <TouchableOpacity
          style={[styles.decadePill, selectedDecade ? styles.decadePillActive : null]}
          onPress={() => setDecadePickerVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={26} color={Colors.gold} />
          {selectedDecade ? (
            <Text style={styles.decadePillTextActive}>{selectedDecade}</Text>
          ) : null}
        </TouchableOpacity>

        {hasContent && (
          <TouchableOpacity onPress={toggleSave} style={styles.heartBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color={Colors.red} />
          </TouchableOpacity>
        )}
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
          <Text style={styles.tmDesc}>{tmData.description}</Text>
          <Text style={styles.tracksHeading}>Essential tracks</Text>
          {tmData.tracks.map((track, i) => (
            <TrackRow key={i} track={track} index={i + 1} />
          ))}
          <View style={styles.bottomPad} />
        </ScrollView>
      ) : recs ? (
        // ── Explore mode ─────────────────────────────────────
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {recs.genres?.length > 0 && (
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
          )}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Artists to discover</Text>
            <Text style={styles.sectionHint}>Tap any artist to reveal tracks</Text>
          </View>
          {(recs.artists || []).map((artist, i) => (
            <ArtistCard key={i} artist={artist} service={auth.service} accessToken={auth.accessToken} />
          ))}
          {recs.didYouKnow && selectedDecade && (
            <View style={styles.dyk}>
              <Text style={styles.dykLabel}>💡 Did you know</Text>
              <Text style={styles.dykText}>{recs.didYouKnow}</Text>
            </View>
          )}
          <View style={styles.bottomPad} />
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
  heartBtn: { padding: 4 },
  headerMid: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryFlag: { fontSize: 26 },
  countryFlagImg: { width: 34, height: 22, borderRadius: 3 },
  countryName: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  stampedBadge: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2,
  },
  stampedBadgeText: { color: Colors.gold, fontSize: 11, fontWeight: '700' },

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
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 },
  genreTag: {
    backgroundColor: Colors.purpleBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  genreText: { color: Colors.purple, fontSize: 13, fontWeight: '600' },
  sectionHeader: { marginBottom: 14 },
  sectionHeading: { color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  sectionHint: { color: Colors.text3, fontSize: 13 },
  dyk: { backgroundColor: Colors.goldBg, borderRadius: 14, padding: 16, marginTop: 10 },
  dykLabel: { color: Colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 0.3, marginBottom: 8 },
  dykText: { color: Colors.text, fontSize: 15, lineHeight: 23 },

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
  openBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.blueBg, borderWidth: 1, borderColor: Colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  bottomPad: { height: 48 },
});
