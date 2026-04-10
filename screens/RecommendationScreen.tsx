import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Linking, Modal, FlatList, Platform, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { DECADES } from '../constants/regions';
import { FLAGS } from '../constants/flags';
import { haptics } from '../utils/haptics';
import {
  fetchRecommendations, enrichDecade, fetchStreamingFloors,
  RecommendationResponse,
} from '../services/api';
import { resolveService } from '../utils/defaultService';
import { ArtistCard } from '../components/ArtistCard';
import { GlobeOverlay } from '../components/GlobeOverlay';
import { FloatingNav } from '../components/FloatingNav';
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
  addStamp: (country: string, opts?: { source?: string; genre?: string }) => Promise<void>;
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
  route: { params: { country: string; filterDecade?: string; savedData?: RecommendationResponse; highlightArtist?: string; highlightTrack?: string } };
  auth: AuthState;
  stampsHook: StampsHook;
  favoritesHook: FavoritesHook;
}

// ── Decade picker modal ────────────────────────────────────
function DecadePickerModal({ visible, selected, onClose, onSelect, floor }: {
  visible: boolean;
  selected: string;
  onClose: () => void;
  onSelect: (decade: string) => void;
  floor?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const floorIdx = floor ? DECADES.indexOf(floor) : -1;
  const items = ['', ...DECADES.filter((_d, i) => floorIdx < 0 || i >= floorIdx)];
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

// ── Main screen ────────────────────────────────────────────
export function RecommendationScreen({ navigation, route, auth, stampsHook, favoritesHook }: Props) {
  const { country, filterDecade, savedData, highlightArtist, highlightTrack } = route.params;
  const { stamps, addStamp } = stampsHook;
  const insets = useSafeAreaInsets();
  const { currentTrackTitle } = useAudioPlayer();
  const contentBottomPad = insets.bottom + 76 + (currentTrackTitle ? 72 : 0);

  const [selectedDecade, setSelectedDecade] = useState('');
  const [decadePickerVisible, setDecadePickerVisible] = useState(false);

  // Globe state — skip if data was pre-fetched by the caller (e.g. LandingScreen spin)
  const [globeVisible, setGlobeVisible] = useState(!savedData);
  const [globeCountry, setGlobeCountry] = useState(country);

  // Content state
  const [recs, setRecs] = useState<RecommendationResponse | null>(savedData ?? null);
  const [loading, setLoading] = useState(!savedData);
  const [error, setError] = useState<string | null>(null);
  const [dykExpanded, setDykExpanded] = useState(false);
  const [fetchDone, setFetchDone] = useState(!!savedData);

  const pendingFetch = useRef<Promise<any> | null>(null);
  const pendingResult = useRef<any>(null);
  const pendingError = useRef<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [localDecadeFilter, setLocalDecadeFilter] = useState<string | undefined>(filterDecade);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingDone, setEnrichingDone] = useState(false);
  const [enrichingMsg, setEnrichingMsg] = useState('');
  const [streamingFloor, setStreamingFloor] = useState<string | null>(null);
  const exploreScrollRef = useRef<any>(null);
  const highlightedY = useRef<number | null>(null);

  const fetchContent = (c: string) => {
    setLoading(true);
    setError(null);
    setRecs(null);
    pendingResult.current = null;
    pendingError.current = null;
    setIsFromCache(false);
    setVisibleCount(4);
    setDykExpanded(false);
    setFetchDone(false);

    const promise = fetchRecommendations(c);

    pendingFetch.current = promise
      .then(data => {
        pendingResult.current = data;
        if ((data as RecommendationResponse).fromCache) setIsFromCache(true);
      })
      .catch(err => {
        const msg = err.message || '';
        pendingError.current = msg.toLowerCase().includes('overload')
          ? 'Our servers are busy right now. Try again in a moment.'
          : msg || 'Something went wrong';
      })
      .finally(() => { setFetchDone(true); });
  };

  // Initial load — kick off fetch in parallel with globe animation
  useEffect(() => {
    if (!savedData) fetchContent(country);
    fetchStreamingFloors().then(floors => setStreamingFloor(floors[country] ?? null)).catch(() => {});
  }, []);

  // Decade enrichment — if 0 matches, show loading globe and poll; if < 5, fire-and-forget
  useEffect(() => {
    if (!localDecadeFilter || !recs?.artists || loading || isEnriching) return;
    // Skip enrichment if this decade is below the streaming floor for this country
    if (streamingFloor) {
      const floorIdx = DECADES.indexOf(streamingFloor);
      const decadeIdx = DECADES.indexOf(localDecadeFilter);
      if (decadeIdx < floorIdx) return;
    }
    const decadeYear = localDecadeFilter.slice(0, 4);
    const matchCount = recs.artists.filter(a => a.era && a.era.includes(decadeYear)).length;
    if (matchCount === 0) {
      // Nothing cached yet — start enrichment with visible loading UX
      setIsEnriching(true);
      setEnrichingDone(false);
      enrichDecade(country, localDecadeFilter);
    } else if (matchCount < 5) {
      // Some results — silently enrich in background for next time
      enrichDecade(country, localDecadeFilter);
    }
  }, [recs?.artists?.length, localDecadeFilter, loading]);

  // Poll for results while enriching
  useEffect(() => {
    if (!isEnriching || !localDecadeFilter) return;
    const decadeYear = localDecadeFilter.slice(0, 4);
    let attempts = 0;
    const MAX_ATTEMPTS = 10;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const fresh = await fetchRecommendations(country);
        const count = fresh.artists?.filter((a: any) => a.era && a.era.includes(decadeYear)).length ?? 0;
        if (count > 0 || attempts >= MAX_ATTEMPTS) {
          clearInterval(poll);
          if (count > 0) setRecs(fresh);
          setEnrichingDone(true);
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(poll);
          setEnrichingDone(true);
        }
      }
    }, 3500);
    return () => clearInterval(poll);
  }, [isEnriching, localDecadeFilter]);

  // Rotate enrichment messages
  useEffect(() => {
    if (!isEnriching || !localDecadeFilter) return;
    const msgs = [
      'Hang tight, we\'re researching this...',
      `Digging into ${country}'s ${localDecadeFilter} music scene...`,
      `Researching ${country} in the ${localDecadeFilter}...`,
      'Verifying tracks on streaming platforms...',
      `Looking for hidden gems from ${country}...`,
      'Cross-referencing our music sources...',
      `Almost there — sourcing ${localDecadeFilter} artists...`,
      ...(recs?.didYouKnow ? [`Did you know?\n${recs.didYouKnow}`] : ['Scouring the archives for you...']),
    ];
    let idx = 0;
    setEnrichingMsg(msgs[0]);
    const rotate = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setEnrichingMsg(msgs[idx]);
    }, 3000);
    return () => clearInterval(rotate);
  }, [isEnriching]);

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
        setRecs(data);
        addStamp(country, { source: 'recommendation', genre: data.genres?.[0] });
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
    setLocalDecadeFilter(decade || undefined);
    setVisibleCount(4);
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
            <Text style={styles.countryName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{country}</Text>
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
      ) : recs ? (
        // ── Explore mode ─────────────────────────────────────
        <ScrollView ref={exploreScrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>Artists to discover</Text>
              <Text style={styles.sectionHint}>Tap any artist to reveal tracks</Text>
            </View>
            <TouchableOpacity
              style={[styles.decadePill, localDecadeFilter ? styles.decadePillActive : null]}
              onPress={() => setDecadePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={22} color={Colors.gold} />
              {localDecadeFilter ? <Text style={styles.decadePillTextActive}>{localDecadeFilter}</Text> : null}
            </TouchableOpacity>
          </View>
          {(() => {
            const sortedArtists = [...(recs.artists || [])].sort((a, b) => {
              if (a.hasVerifiedTracks && !b.hasVerifiedTracks) return -1;
              if (!a.hasVerifiedTracks && b.hasVerifiedTracks) return 1;
              return 0;
            });
            const eraFiltered = localDecadeFilter
              ? sortedArtists.filter(a => a.era && a.era.includes(localDecadeFilter.slice(0, 4)))
              : sortedArtists;
            const artistPool = eraFiltered;
            const totalArtists = artistPool.length;
            const visibleArtists = artistPool.slice(0, visibleCount);
            const canShowMore = visibleCount < totalArtists && visibleCount < 12;
            const canShowLess = visibleCount > 4;
            return (
              <>
                {visibleArtists.map((artist, i) => {
                  const isHighlighted = !!highlightArtist && artist.name.toLowerCase() === highlightArtist.toLowerCase();
                  return (
                    <View
                      key={i}
                      onLayout={isHighlighted ? (e) => { highlightedY.current = e.nativeEvent.layout.y; } : undefined}
                    >
                      <ArtistCard
                        artist={artist}
                        service={auth.service}
                        favoritesHook={favoritesHook}
                        country={country}
                        onNeedAuth={undefined}
                        autoExpand={isHighlighted}
                        highlightTrack={isHighlighted ? highlightTrack : undefined}
                        onSearchSimilar={(name) => navigation.navigate('ArtistSearch', { prefillArtist: name, skipConfirm: true })}
                        onGenrePress={(genre, artistName) => navigation.navigate('GenreSpotlight', {
                          genre,
                          country,
                          seedArtist: artistName,
                          relatedArtistNames: recs.artists?.filter(a => a.genre === genre).map(a => a.name) ?? [],
                        })}
                        isTester={auth.isTester}
                        testerUserId={auth.testerUserId}
                      />
                    </View>
                  );
                })}
                {(canShowMore || canShowLess) && (
                  <View style={styles.showMoreRow}>
                    {canShowMore && (
                      <TouchableOpacity
                        style={styles.showMoreBtn}
                        onPress={() => { haptics.light(); setVisibleCount(c => Math.min(c + 4, 12)); }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.showMoreBtnText}>Show More</Text>
                        <Ionicons name="chevron-down" size={14} color={Colors.blue} />
                      </TouchableOpacity>
                    )}
                    {canShowLess && (
                      <TouchableOpacity
                        style={styles.showMoreBtn}
                        onPress={() => { haptics.light(); setVisibleCount(4); }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.showMoreBtnText}>Show Less</Text>
                        <Ionicons name="chevron-up" size={14} color={Colors.blue} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            );
          })()}
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
        visible={globeVisible || isEnriching}
        country={isEnriching ? country : globeCountry}
        decade={isEnriching ? (localDecadeFilter ?? '') : ''}
        onDone={isEnriching
          ? () => { setIsEnriching(false); setEnrichingDone(false); }
          : handleGlobeDone}
        onCancel={isEnriching
          ? () => setIsEnriching(false)
          : () => navigation.goBack()}
        dataReady={isEnriching ? enrichingDone : fetchDone}
        instant={isEnriching ? false : isFromCache}
        subtitle={isEnriching ? enrichingMsg : undefined}
      />

      <DecadePickerModal
        visible={decadePickerVisible}
        selected={selectedDecade}
        onClose={() => setDecadePickerVisible(false)}
        onSelect={handleDecadeChange}
        floor={streamingFloor}
      />
      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites ?? []} />
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
    paddingLeft: 16, paddingRight: 120, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  backIcon: { color: Colors.blue, fontSize: 32, lineHeight: 32, fontWeight: '300' },
  headerMid: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryFlag: { fontSize: 26 },
  countryFlagImg: { width: 34, height: 22, borderRadius: 3 },
  countryName: { flex: 1, color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
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

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionHeading: { color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  sectionHint: { color: Colors.text3, fontSize: 13 },
  dyk: { backgroundColor: Colors.goldBg, borderRadius: 14, padding: 16, marginTop: 10 },
  dykHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dykLabel: { color: Colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  dykText: { color: Colors.text, fontSize: 15, lineHeight: 23, marginTop: 10 },

  bottomPad: { height: 48 },

  showMoreRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8, marginBottom: 4,
  },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  showMoreBtnText: { color: Colors.blue, fontSize: 14, fontWeight: '600' },
});
