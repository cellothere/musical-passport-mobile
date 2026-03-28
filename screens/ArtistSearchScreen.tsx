import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import {
  findArtist, fetchSimilarArtists,
  type FoundArtist, type ArtistMatch, type Artist,
} from '../services/api';
import { ArtistCard } from '../components/ArtistCard';
import { FloatingNav } from '../components/FloatingNav';
import { ServiceModal } from '../components/ServiceModal';
import { haptics } from '../utils/haptics';
import type { AuthService, AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

interface FavoritesHook {
  isTrackSaved: (trackId: string) => boolean;
  findSavedTrack: (trackId: string) => SavedDiscovery | undefined;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  favorites: SavedDiscovery[];
}

interface Props {
  navigation: any;
  route?: { params?: { prefillArtist?: string; skipConfirm?: boolean } };
  service: AuthService;
  accessToken: string | null;
  favoritesHook: FavoritesHook;
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
}

type Phase = 'search' | 'confirm' | 'loading' | 'results';

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M followers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K followers`;
  return `${n} followers`;
}

export function ArtistSearchScreen({ navigation, route, service, accessToken, favoritesHook, auth }: Props) {
  const insets = useSafeAreaInsets();
  const { currentTrackTitle } = useAudioPlayer();
  const contentBottomPad = insets.bottom + 76 + (currentTrackTitle ? 72 : 0);
  const prefill = route?.params?.prefillArtist ?? '';
  const skipConfirm = route?.params?.skipConfirm ?? false;
  const [query, setQuery] = useState(prefill);
  const [phase, setPhase] = useState<Phase>('search');
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [foundArtist, setFoundArtist] = useState<FoundArtist | null>(null);
  const [sonicSummary, setSonicSummary] = useState('');
  const [matches, setMatches] = useState<ArtistMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem('artist_search_history')
      .then(val => { if (val) setHistory(JSON.parse(val)); })
      .catch(() => {});
  }, []);

  // Auto-trigger search when arriving via cross-navigation
  useEffect(() => {
    if (prefill) {
      if (skipConfirm) searchDirect(prefill);
      else handleSearch();
    }
  }, []);

  const saveToHistory = async (name: string) => {
    const updated = [name, ...history.filter(h => h.toLowerCase() !== name.toLowerCase())].slice(0, 6);
    setHistory(updated);
    await AsyncStorage.setItem('artist_search_history', JSON.stringify(updated)).catch(() => {});
  };

  // Skip findArtist confirmation — used when artist name comes from a trusted source (ArtistCard tap)
  const searchDirect = async (name: string) => {
    setQuery(name);
    setPhase('loading');
    setError(null);
    setFoundArtist({ name, genres: [], followers: 0, spotifyId: '' });
    try {
      const data = await fetchSimilarArtists(name);
      setSonicSummary(data.sonicSummary);
      setMatches(data.artists);
      setPhase('results');
      haptics.success();
      saveToHistory(name);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setPhase('search');
    }
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setError(null);
    setPhase('confirm');
    try {
      const artist = await findArtist(q);
      setFoundArtist(artist);
    } catch (err: any) {
      setError(err.message || 'Artist not found');
      setPhase('search');
    }
  };

  const handleConfirm = async () => {
    if (!foundArtist) return;
    setPhase('loading');
    setError(null);
    try {
      const data = await fetchSimilarArtists(foundArtist.name);
      setSonicSummary(data.sonicSummary);
      setMatches(data.artists);
      setPhase('results');
      haptics.success();
      saveToHistory(foundArtist.name);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setPhase('confirm');
    }
  };

  const handleReset = () => {
    setPhase('search');
    setQuery('');
    setFoundArtist(null);
    setMatches([]);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>Sound-Alike Search</Text>
          <Text style={styles.headerSub}>Find global artists like the ones you love</Text>
        </View>
      </View>

      {/* Search bar — always visible unless loading/results */}
      {(phase === 'search' || phase === 'confirm') && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.searchRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="e.g. Bruno Mars, Beyoncé, ABBA…"
              placeholderTextColor={Colors.text3}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.searchBtn, !query.trim() && styles.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={!query.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={20} color={query.trim() ? Colors.gold : Colors.text3} />
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorBanner}>{error}</Text>}
          {!query.trim() && history.length > 0 && (
            <View style={styles.historyRow}>
              <Text style={styles.historyLabel}>Recent</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyChips}>
                {history.map((name, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.historyChip}
                    onPress={() => { setQuery(name); setTimeout(handleSearch, 50); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time-outline" size={13} color={Colors.text3} />
                    <Text style={styles.historyChipText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* Confirm artist */}
      {phase === 'confirm' && foundArtist && (
        <View style={styles.confirmCard}>
          <View style={styles.confirmInfo}>
            <Text style={styles.confirmName}>{foundArtist.name}</Text>
            {foundArtist.genres.length > 0 && (
              <Text style={styles.confirmMeta}>
                {foundArtist.genres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' · ')}
              </Text>
            )}
            <Text style={styles.confirmFollowers}>{formatFollowers(foundArtist.followers)}</Text>
          </View>
          <Text style={styles.confirmQuestion}>Is this who you meant?</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.yesBtn} onPress={handleConfirm} activeOpacity={0.8}>
              <Text style={styles.yesBtnText}>Yes, find similar artists</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noBtn} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.noBtnText}>Search again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Confirm loading state */}
      {phase === 'confirm' && !foundArtist && !error && (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={styles.centerText}>Finding artist…</Text>
        </View>
      )}

      {/* Full loading state */}
      {phase === 'loading' && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingTitle}>Searching the world…</Text>
          <Text style={styles.loadingSubtitle}>
            Asking our music expert to find artists similar to {foundArtist?.name} from around the world.
          </Text>
        </View>
      )}

      {/* Results */}
      {phase === 'results' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsBadge}>
              Artists like {foundArtist?.name}
            </Text>
            <TouchableOpacity onPress={handleReset} style={styles.newSearchBtn} activeOpacity={0.7}>
              <Ionicons name="search" size={14} color={Colors.blue} />
              <Text style={styles.newSearchText}>New search</Text>
            </TouchableOpacity>
          </View>

          {sonicSummary ? (
            <Text style={styles.sonicSummary}>{sonicSummary}</Text>
          ) : null}

          {matches.map((match, i) => (
            <View key={i} style={styles.matchWrapper}>
              <View style={styles.matchMeta}>
                <Text style={styles.matchFlag}>{flagEmoji(match.countryCode)}</Text>
                <Text style={styles.matchCountry}>{match.country}</Text>
              </View>
              <ArtistCard
                artist={matchToArtist(match)}
                service={service}
                accessToken={accessToken}
                favoritesHook={favoritesHook}
                country={match.country}
                onNeedAuth={undefined}
                onSearchSimilar={(name) => searchDirect(name)}
                onGenrePress={(genre) => navigation.navigate('GenreSpotlight', { genre, country: match.country })}
              />
            </View>
          ))}
          <View style={{ height: contentBottomPad }} />
        </ScrollView>
      )}
      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites} currentScreen="ArtistSearch" />
      <ServiceModal visible={serviceModalVisible} onClose={() => setServiceModalVisible(false)} auth={auth} />
    </SafeAreaView>
  );
}

function matchToArtist(match: ArtistMatch): Artist {
  return {
    name: match.name,
    genre: match.genre,
    era: match.era,
    similarTo: `${flagEmoji(match.countryCode)} ${match.country}`,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerMid: { flex: 1 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { color: Colors.text3, fontSize: 13, marginTop: 2 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: 16,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },

  errorBanner: {
    color: Colors.red,
    fontSize: 14,
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 8,
  },

  historyRow: { marginTop: -4, marginBottom: 8 },
  historyLabel: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginHorizontal: 16, marginBottom: 8,
  },
  historyChips: { paddingHorizontal: 16, gap: 8 },
  historyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border2,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  historyChipText: { color: Colors.text2, fontSize: 14 },

  confirmCard: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  confirmInfo: { gap: 4 },
  confirmName: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  confirmMeta: { color: Colors.text2, fontSize: 15 },
  confirmFollowers: { color: Colors.text3, fontSize: 13 },
  confirmQuestion: { color: Colors.text2, fontSize: 15 },
  confirmActions: { gap: 10 },
  yesBtn: {
    backgroundColor: Colors.greenBg,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  yesBtnText: { color: Colors.green, fontSize: 16, fontWeight: '700' },
  noBtn: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  noBtnText: { color: Colors.text2, fontSize: 15 },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  centerText: { color: Colors.text2, fontSize: 15 },
  loadingTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  loadingSubtitle: { color: Colors.text2, fontSize: 14, textAlign: 'center', lineHeight: 21 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsBadge: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  newSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.blueBg,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    borderRadius: 10,
  },
  newSearchText: { color: Colors.blue, fontSize: 13, fontWeight: '600' },

  sonicSummary: {
    color: Colors.text2,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
    fontStyle: 'italic',
  },

  matchWrapper: { marginBottom: 4 },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  matchFlag: { fontSize: 20 },
  matchCountry: { flex: 1, color: Colors.text3, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },

});
