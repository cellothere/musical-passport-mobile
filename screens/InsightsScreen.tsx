import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Modal, Animated, Dimensions, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FLAGS } from '../constants/flags';
import { MODERN_REGIONS } from '../constants/regions';
import { InsightsPick, StampRecord } from '../services/api';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { FloatingNav } from '../components/FloatingNav';
import { CountrySavesSheet } from '../components/CountrySavesSheet';
import { haptics } from '../utils/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STAMP_W = (SCREEN_W - 52) / 2;

// ── Continent definitions ────────────────────────────────
const CONTINENT_COLORS: Record<string, string> = {
  'North America': '#3b82f6',
  'Latin America': '#10b981',
  'Europe': '#8b5cf6',
  'Africa': '#f59e0b',
  'Middle East': '#f97316',
  'Asia': '#ec4899',
  'Oceania': '#06b6d4',
};

const CONTINENTS: Record<string, { color: string; countries: string[] }> = Object.fromEntries(
  MODERN_REGIONS.map(region => [
    region.name,
    {
      color: CONTINENT_COLORS[region.name] ?? Colors.purple,
      countries: region.countries,
    },
  ])
);

// ── Flag colors ─────────────────────────────────────────
const STAMP_COLORS: Record<string, string> = {
  'USA': '#B22234', 'Canada': '#FF0000',
  'Brazil': '#009C3B', 'Argentina': '#74ACDF', 'Colombia': '#FCD116',
  'Mexico': '#006847', 'Cuba': '#002A8F', 'Jamaica': '#FED100',
  'Chile': '#D52B1E', 'Peru': '#D91023', 'Venezuela': '#CF142B',
  'Dominican Republic': '#002D62', 'Puerto Rico': '#0F4D92',
  'Panama': '#003893', 'Bolivia': '#007A3D', 'Ecuador': '#FFD100',
  'Uruguay': '#5EB6E4', 'Paraguay': '#D52B1E', 'Costa Rica': '#002B7F',
  'Guatemala': '#4997D0', 'Honduras': '#009BDE', 'Haiti': '#00209F',
  'Trinidad & Tobago': '#CE1126', 'Barbados': '#00267F',
  'El Salvador': '#0F47AF', 'Nicaragua': '#3E6EB4',
  'France': '#003189', 'Germany': '#DD0000', 'UK': '#CF142B',
  'England': '#CF142B', 'Spain': '#C60B1E', 'Italy': '#009246',
  'Portugal': '#006600', 'Netherlands': '#AE1C28', 'Belgium': '#FAE042',
  'Sweden': '#006AA7', 'Norway': '#EF2B2D', 'Denmark': '#C60C30',
  'Finland': '#003580', 'Switzerland': '#FF0000', 'Austria': '#ED2939',
  'Poland': '#DC143C', 'Ukraine': '#005BBB', 'Greece': '#0D5EAF',
  'Turkey': '#E30A17', 'Romania': '#002B7F', 'Serbia': '#C6363C',
  'Croatia': '#FF0000', 'Hungary': '#CE2939', 'Czechia': '#D7141A',
  'Scotland': '#003F87', 'Ireland': '#169B62', 'Iceland': '#003897',
  'Slovakia': '#EE1C25', 'Slovenia': '#003DA5', 'Bulgaria': '#00966E',
  'Bosnia': '#002395', 'Albania': '#E41E20', 'North Macedonia': '#CE2028',
  'Kosovo': '#244AA5', 'Montenegro': '#D4AF37', 'Lithuania': '#006A44',
  'Latvia': '#9E3039', 'Estonia': '#0072CE', 'Luxembourg': '#EF3340',
  'Nigeria': '#008751', 'Ghana': '#006B3F', 'Senegal': '#00853F',
  'South Africa': '#007A4D', 'Ethiopia': '#078930', 'Kenya': '#006600',
  'Egypt': '#CE1126', 'Morocco': '#C1272D', 'Algeria': '#006233',
  'Tunisia': '#E70013', 'Angola': '#CC0000', 'Congo': '#007FFF',
  'Tanzania': '#1EB53A', 'Ivory Coast': '#F77F00', 'Cameroon': '#007A5E',
  'Rwanda': '#20603D', 'Uganda': '#000000', 'Mozambique': '#009A44',
  'Zimbabwe': '#006400', 'Burkina Faso': '#EF2B2D',
  'Lebanon': '#CC2529', 'Iran': '#239F40', 'Israel': '#003399',
  'Saudi Arabia': '#006C35', 'UAE': '#00732F', 'Iraq': '#CE1126',
  'Jordan': '#007A3D', 'Syria': '#007A3D', 'Kuwait': '#007A3D',
  'Qatar': '#8D1B3D', 'Bahrain': '#CE1126', 'Oman': '#DB161B',
  'Japan': '#BC002D', 'South Korea': '#003478', 'China': '#DE2910',
  'India': '#FF9933', 'Indonesia': '#CE1126', 'Thailand': '#003087',
  'Philippines': '#0038A8', 'Vietnam': '#DA251D', 'Malaysia': '#CC0001',
  'Pakistan': '#01411C', 'Bangladesh': '#006A4E', 'Taiwan': '#FE0000',
  'Azerbaijan': '#0092BC', 'Armenia': '#D90012', 'Georgia': '#E30A17',
  'Kazakhstan': '#00AFCA', 'Uzbekistan': '#1EB53A',
  'Australia': '#00008B', 'New Zealand': '#00247D', 'Fiji': '#68BFE5',
  'Papua New Guinea': '#000000', 'Hong Kong': '#DE2910',
};

function stampColor(country: string): string {
  return STAMP_COLORS[country] ?? Colors.purple;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface StampDetailData {
  country: string;
  saveCount: number;
  savedTracks: string[];
  firstSaved: number | null;
  visitCount: number;
  stampedAt: string | null;
  genre: string | null;
}

interface Props {
  navigation: any;
  auth: AuthState;
  favoritesHook: {
    favorites: SavedDiscovery[];
    remove: (id: string) => Promise<void>;
  };
  stampsHook: { stamps: Set<string>; stampRecords: StampRecord[]; addStamp: (c: string) => void };
}

export function InsightsScreen({ navigation, auth, favoritesHook, stampsHook }: Props) {
  const insets = useSafeAreaInsets();
  const { favorites } = favoritesHook;
  const { stamps, stampRecords } = stampsHook;

  const [picks, setPicks] = useState<InsightsPick[]>([]);
  const [picksLoading, setPicksLoading] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

  // Stamp detail sheet
  const [detailData, setDetailData] = useState<StampDetailData | null>(null);
  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Country saves sheet (full playable list)
  const [savesSheetCountry, setSavesSheetCountry] = useState<string | null>(null);
  const savesForSheet = useMemo(
    () => (savesSheetCountry ? favorites.filter(f => f.country === savesSheetCountry) : []),
    [savesSheetCountry, favorites]
  );

  // Per-country stats from favorites
  const countryStats = useMemo(() => {
    const map: Record<string, { saveCount: number; savedTracks: string[]; firstSaved: number | null }> = {};
    for (const fav of favorites) {
      const c = fav.country;
      if (!c) continue;
      if (!map[c]) map[c] = { saveCount: 0, savedTracks: [], firstSaved: null };
      map[c].saveCount++;
      const title = (fav.data as any)?.title ?? (fav.data as any)?.trackTitle ?? null;
      if (title && map[c].savedTracks.length < 4) map[c].savedTracks.push(title);
      const ts = fav.savedAt;
      if (ts && (map[c].firstSaved === null || ts < map[c].firstSaved!)) map[c].firstSaved = ts;
    }
    return map;
  }, [favorites]);

  // All visited countries (stamps ∪ saves)
  const visitedSet = useMemo(() => {
    const s = new Set<string>(stampRecords.map(r => r.country));
    for (const c of Object.keys(countryStats)) s.add(c);
    return s;
  }, [stampRecords, countryStats]);

  const totalSaves = favorites.length;

  // Per-continent stats
  const continentStats = useMemo(() =>
    Object.entries(CONTINENTS).map(([name, { color, countries }]) => {
      const visited = countries.filter(c => visitedSet.has(c));
      const pct = Math.round((visited.length / countries.length) * 100);
      return { name, color, countries, visited, unvisited: countries.filter(c => !visitedSet.has(c)), pct };
    }),
    [visitedSet]
  );

  const openDetail = (country: string) => {
    haptics.light();
    const stats = countryStats[country] ?? { saveCount: 0, savedTracks: [], firstSaved: null };
    const record = stampRecords.find(s => s.country === country);
    setDetailData({
      country, ...stats,
      visitCount: record?.visitCount ?? 1,
      stampedAt: record?.stampedAt ?? null,
      genre: record?.genre ?? null,
    });
    sheetAnim.setValue(SCREEN_H);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 14 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeDetail = (onClosed?: () => void) => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setDetailData(null);
      onClosed?.();
    });
  };

  const openCountrySaves = (country: string) => {
    haptics.light();
    closeDetail(() => setSavesSheetCountry(country));
  };

  const continentData = selectedContinent ? continentStats.find(c => c.name === selectedContinent) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={selectedContinent ? () => { haptics.light(); setSelectedContinent(null); } : () => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedContinent ?? 'My Musical Passport'}
        </Text>
      </View>

      {selectedContinent && continentData ? (
        // ── Continent detail view ──────────────────────────
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress card */}
          <View style={[styles.progressCard, { borderColor: continentData.color + '40' }]}>
            <View style={styles.progressCardTop}>
              <View>
                <Text style={[styles.progressPct, { color: continentData.color }]}>
                  {continentData.pct}%
                </Text>
                <Text style={styles.progressSub}>
                  {continentData.visited.length} of {continentData.countries.length} countries explored
                </Text>
              </View>
              <View style={[styles.progressCircle, { borderColor: continentData.color + '40', backgroundColor: continentData.color + '12' }]}>
                <Text style={styles.progressCircleNum}>{continentData.visited.length}</Text>
                <Text style={[styles.progressCircleLabel, { color: continentData.color }]}>visited</Text>
              </View>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, {
                width: `${continentData.pct}%`,
                backgroundColor: continentData.color,
              }]} />
            </View>
          </View>

          {/* Visited stamps */}
          {continentData.visited.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>VISITED</Text>
              <View style={styles.stampsGrid}>
                {continentData.visited.map((country, i) => {
                  const color = stampColor(country);
                  const stats = countryStats[country] ?? { saveCount: 0 };
                  const record = stampRecords.find(s => s.country === country);
                  const visitCount = record?.visitCount ?? 1;
                  const rotation = i % 3 === 0 ? '1.4deg' : i % 3 === 1 ? '-1.1deg' : '0.5deg';
                  return (
                    <TouchableOpacity
                      key={country}
                      style={[styles.stamp, { backgroundColor: color + '12', borderColor: color + 'AA', transform: [{ rotate: rotation }] }]}
                      onPress={() => openDetail(country)}
                      activeOpacity={0.75}
                    >
                      {visitCount > 1 && (
                        <View style={[styles.visitBadge, { backgroundColor: color }]}>
                          <Text style={styles.visitBadgeText}>{visitCount}×</Text>
                        </View>
                      )}
                      <View style={[styles.stampInner, { borderColor: color + '55' }]}>
                        <Text style={styles.stampFlag}>{FLAGS[country] ?? '🌐'}</Text>
                        <Text style={[styles.stampCountry, { color }]} numberOfLines={1}>{country.toUpperCase()}</Text>
                        {stats.saveCount > 0 ? (
                          <View style={[styles.stampBadge, { backgroundColor: color + '22' }]}>
                            <Ionicons name="musical-note" size={10} color={color} />
                            <Text style={[styles.stampBadgeText, { color }]}>
                              {stats.saveCount} {stats.saveCount === 1 ? 'save' : 'saves'}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.stampBadge, { backgroundColor: color + '22' }]}>
                            <Ionicons name="checkmark" size={10} color={color} />
                            <Text style={[styles.stampBadgeText, { color }]}>Visited</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.noVisitsState}>
              <Text style={styles.noVisitsEmoji}>🗺️</Text>
              <Text style={styles.noVisitsText}>No countries explored here yet</Text>
              <TouchableOpacity
                style={[styles.noVisitsBtn, { backgroundColor: continentData.color }]}
                onPress={() => {
                  setSelectedContinent(null);
                  setTimeout(() => navigation.navigate('Explore'), 100);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.noVisitsBtnText}>Start Exploring</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Not yet visited */}
          {continentData.unvisited.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
                NOT YET VISITED · {continentData.unvisited.length}
              </Text>
              <View style={styles.unvisitedGrid}>
                {continentData.unvisited.map(country => (
                  <TouchableOpacity
                    key={country}
                    style={styles.unvisitedPill}
                    onPress={() => {
                      setSelectedContinent(null);
                      setTimeout(() => navigation.navigate('Recommendations', { country }), 100);
                    }}
                    activeOpacity={0.65}
                  >
                    <Text style={styles.unvisitedFlag}>{FLAGS[country] ?? '🌐'}</Text>
                    <Text style={styles.unvisitedName} numberOfLines={1}>{country}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        // ── Main passport view ─────────────────────────────
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Passport cover */}
          <View style={styles.passportCover}>
            <View style={styles.passportCoverTop}>
              <View>
                <Text style={styles.passportIssuer}>MUSICAL PASSPORT</Text>
                <Text style={styles.passportName}>World Music Explorer</Text>
              </View>
              <Image source={require('../assets/passport.png')} style={styles.passportImg} />
            </View>
            <View style={styles.passportDivider} />
            <View style={styles.passportStats}>
              <View style={styles.passportStat}>
                <Text style={styles.passportStatNum}>{visitedSet.size}</Text>
                <Text style={styles.passportStatLabel}>Countries</Text>
              </View>
              <View style={styles.passportStatDivider} />
              <View style={styles.passportStat}>
                <Text style={styles.passportStatNum}>{totalSaves}</Text>
                <Text style={styles.passportStatLabel}>Tracks Saved</Text>
              </View>
              <View style={styles.passportStatDivider} />
              <View style={styles.passportStat}>
                <Text style={styles.passportStatNum}>{stamps.size}</Text>
                <Text style={styles.passportStatLabel}>Explored</Text>
              </View>
            </View>
          </View>

          {/* Continent cards */}
          <Text style={styles.sectionLabel}>EXPLORE BY CONTINENT</Text>
          {continentStats.map(({ name, color, countries, visited, pct }) => {
            const previewFlags = visited.slice(0, 5);
            const remaining = visited.length - previewFlags.length;
            return (
              <TouchableOpacity
                key={name}
                style={styles.continentCard}
                onPress={() => { haptics.light(); setSelectedContinent(name); }}
                activeOpacity={0.75}
              >
                <View style={styles.continentCardTop}>
                  <View style={styles.continentCardLeft}>
                    <Text style={styles.continentName}>{name}</Text>
                    <Text style={styles.continentSub}>
                      {visited.length} of {countries.length} countries
                    </Text>
                  </View>
                  <View style={styles.continentCardRight}>
                    <Text style={[styles.continentPct, { color }]}>{pct}%</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.text3} />
                  </View>
                </View>

                {/* Flag strip */}
                {previewFlags.length > 0 && (
                  <View style={styles.flagStrip}>
                    {previewFlags.map(c => (
                      <Text key={c} style={styles.flagStripEmoji}>{FLAGS[c] ?? '🌐'}</Text>
                    ))}
                    {remaining > 0 && (
                      <View style={[styles.flagStripMore, { backgroundColor: color + '22' }]}>
                        <Text style={[styles.flagStripMoreText, { color }]}>+{remaining}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Progress bar */}
                <View style={styles.continentBarTrack}>
                  <View style={[styles.continentBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Picks for you */}
          {(picks.length > 0 || picksLoading) && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>EXPLORE NEXT</Text>
              {picksLoading ? (
                <ActivityIndicator size="small" color={Colors.gold} style={{ marginVertical: 16 }} />
              ) : picks.map((pick, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.pickCard}
                  onPress={() => pick.type === 'genre'
                    ? navigation.navigate('GenreSpotlight', { genre: pick.genre, country: pick.country })
                    : navigation.navigate('Recommendations', { country: pick.country })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickFlag}>{FLAGS[pick.country] ?? '🌐'}</Text>
                  <View style={styles.pickBody}>
                    <Text style={styles.pickTitle}>{pick.type === 'genre' ? pick.genre : pick.country}</Text>
                    {pick.type === 'genre' && <Text style={styles.pickSub}>{pick.country}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Stamp detail sheet */}
      {detailData && (
        <Modal visible transparent animationType="none" onRequestClose={() => closeDetail()}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => closeDetail()} />
          </Animated.View>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }], paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHero}>
              <Text style={styles.sheetFlag}>{FLAGS[detailData.country] ?? '🌐'}</Text>
              <View style={styles.sheetHeroText}>
                <Text style={styles.sheetCountry}>{detailData.country}</Text>
                {detailData.firstSaved && <Text style={styles.sheetSince}>Since {formatDate(detailData.firstSaved)}</Text>}
              </View>
              <View style={[styles.sheetStampMark, { borderColor: stampColor(detailData.country) + '99' }]}>
                <Text style={[styles.sheetStampMarkText, { color: stampColor(detailData.country) }]}>VISITED</Text>
              </View>
            </View>

            <View style={styles.sheetStats}>
              <View style={styles.sheetStat}>
                <Text style={[styles.sheetStatNum, { color: stampColor(detailData.country) }]}>{detailData.visitCount}</Text>
                <Text style={styles.sheetStatLabel}>Visits</Text>
              </View>
              <View style={styles.sheetStatDivider} />
              <View style={styles.sheetStat}>
                <Text style={[styles.sheetStatNum, { color: stampColor(detailData.country) }]}>{detailData.saveCount}</Text>
                <Text style={styles.sheetStatLabel}>Saves</Text>
              </View>
              {detailData.stampedAt && (
                <>
                  <View style={styles.sheetStatDivider} />
                  <View style={styles.sheetStat}>
                    <Text style={[styles.sheetStatNum, { color: stampColor(detailData.country), fontSize: 14 }]}>
                      {formatDate(new Date(detailData.stampedAt).getTime())}
                    </Text>
                    <Text style={styles.sheetStatLabel}>First Visit</Text>
                  </View>
                </>
              )}
            </View>

            {detailData.genre && (
              <View style={[styles.sheetGenreTag, { backgroundColor: stampColor(detailData.country) + '18', borderColor: stampColor(detailData.country) + '55' }]}>
                <Ionicons name="musical-notes-outline" size={13} color={stampColor(detailData.country)} />
                <Text style={[styles.sheetGenreText, { color: stampColor(detailData.country) }]}>{detailData.genre}</Text>
              </View>
            )}

            {detailData.saveCount > 0 && (
              <TouchableOpacity
                style={[styles.viewSavesRow, { borderColor: stampColor(detailData.country) + '55', backgroundColor: stampColor(detailData.country) + '12' }]}
                onPress={() => openCountrySaves(detailData.country)}
                activeOpacity={0.75}
              >
                <Ionicons name="musical-notes" size={18} color={stampColor(detailData.country)} />
                <View style={styles.viewSavesBody}>
                  <Text style={[styles.viewSavesTitle, { color: stampColor(detailData.country) }]}>
                    View all {detailData.saveCount} {detailData.saveCount === 1 ? 'save' : 'saves'}
                  </Text>
                  {detailData.savedTracks.length > 0 && (
                    <Text style={styles.viewSavesPreview} numberOfLines={1}>
                      {detailData.savedTracks.slice(0, 3).join(' · ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={stampColor(detailData.country)} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.sheetCta, { backgroundColor: stampColor(detailData.country) }]}
              onPress={() => { closeDetail(); setTimeout(() => navigation.navigate('Recommendations', { country: detailData.country }), 280); }}
              activeOpacity={0.85}
            >
              <Text style={styles.sheetCtaText}>Explore {detailData.country}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}

      <CountrySavesSheet
        visible={savesSheetCountry !== null}
        country={savesSheetCountry}
        saves={savesForSheet}
        onClose={() => setSavesSheetCountry(null)}
        onRemove={(id) => favoritesHook.remove(id)}
      />

      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites} currentScreen="Insights" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3, flex: 1 },

  content: { padding: 16 },

  sectionLabel: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
  },

  // ── Passport cover ──────────────────────────────────────
  passportCover: {
    backgroundColor: '#1a2744', borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: '#2d3d60',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  passportCoverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  passportIssuer: { color: '#a8b8d8', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  passportName: { color: '#e8d5a0', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  passportImg: { width: 44, height: 44, resizeMode: 'contain', tintColor: '#e8d5a0' },
  passportDivider: { height: 1, backgroundColor: '#2d3d60', marginBottom: 16 },
  passportStats: { flexDirection: 'row', alignItems: 'center' },
  passportStat: { flex: 1, alignItems: 'center' },
  passportStatNum: { color: '#e8d5a0', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  passportStatLabel: { color: '#6d7e9e', fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  passportStatDivider: { width: 1, height: 36, backgroundColor: '#2d3d60' },

  // ── Continent cards ─────────────────────────────────────
  continentCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, padding: 16, marginBottom: 10, gap: 12,
  },
  continentCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continentCardLeft: { flex: 1 },
  continentName: { color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  continentSub: { color: Colors.text3, fontSize: 13, marginTop: 2 },
  continentCardRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  continentPct: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  flagStrip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flagStripEmoji: { fontSize: 20 },
  flagStripMore: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  flagStripMoreText: { fontSize: 12, fontWeight: '700' },
  continentBarTrack: { height: 5, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' },
  continentBarFill: { height: '100%', borderRadius: 3 },

  // ── Continent detail ────────────────────────────────────
  progressCard: {
    backgroundColor: Colors.surface, borderWidth: 1,
    borderRadius: 16, padding: 20, marginBottom: 24, gap: 16,
  },
  progressCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressPct: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  progressSub: { color: Colors.text3, fontSize: 14, marginTop: 2 },
  progressCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  progressCircleNum: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  progressCircleLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressBarTrack: { height: 6, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // ── Stamps ──────────────────────────────────────────────
  stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  stamp: { width: STAMP_W, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 3 },
  visitBadge: { position: 'absolute', top: -6, right: -6, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, zIndex: 2 },
  visitBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  stampInner: { borderWidth: 1, borderRadius: 9, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', gap: 6 },
  stampFlag: { fontSize: 36, lineHeight: 42 },
  stampCountry: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center' },
  stampBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  stampBadgeText: { fontSize: 11, fontWeight: '600' },

  // ── Unvisited ───────────────────────────────────────────
  unvisitedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  unvisitedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
  },
  unvisitedFlag: { fontSize: 16 },
  unvisitedName: { color: Colors.text3, fontSize: 13, fontWeight: '500' },

  // ── No visits state ─────────────────────────────────────
  noVisitsState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  noVisitsEmoji: { fontSize: 48 },
  noVisitsText: { color: Colors.text2, fontSize: 15 },
  noVisitsBtn: { marginTop: 8, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  noVisitsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Picks ───────────────────────────────────────────────
  pickCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, padding: 16, marginBottom: 10, gap: 14,
  },
  pickFlag: { fontSize: 28 },
  pickBody: { flex: 1 },
  pickTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  pickSub: { color: Colors.text3, fontSize: 13, marginTop: 2 },

  // ── Stamp detail sheet ──────────────────────────────────
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: Colors.border, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  sheetFlag: { fontSize: 44 },
  sheetHeroText: { flex: 1 },
  sheetCountry: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  sheetSince: { color: Colors.text3, fontSize: 13, marginTop: 3 },
  sheetStampMark: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, transform: [{ rotate: '-8deg' }] },
  sheetStampMarkText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  sheetStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 16,
  },
  sheetStat: { flex: 1, alignItems: 'center' },
  sheetStatNum: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  sheetStatLabel: { color: Colors.text3, fontSize: 12, fontWeight: '600', marginTop: 2 },
  sheetStatDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  sheetGenreTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
  },
  sheetGenreText: { fontSize: 13, fontWeight: '600' },
  viewSavesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16,
  },
  viewSavesBody: { flex: 1 },
  viewSavesTitle: { fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  viewSavesPreview: { color: Colors.text3, fontSize: 12, marginTop: 2 },
  sheetCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  sheetCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
