import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchDecadeSpotlight, Artist } from '../services/api';
import { resolveService } from '../utils/defaultService';
import { ArtistCard } from '../components/ArtistCard';
import { FloatingNav } from '../components/FloatingNav';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { haptics } from '../utils/haptics';
import type { AuthService, AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

// Maps a 2-letter ISO country code to a broad region bucket
function regionForCode(code: string | undefined): string {
  if (!code) return 'Other';
  const c = code.toUpperCase();

  const AFRICA = new Set([
    'NG','GH','KE','ZA','ET','CM','SN','TZ','UG','ZW','CD','CI','AO','MZ','MG',
    'BJ','BF','ML','NE','TD','SD','SS','RW','BI','DJ','SO','ER','MR','GM','GW',
    'SL','LR','GN','TG','GQ','GA','CG','CF','MW','ZM','MU','SC','CV','ST','KM',
    'SZ','LS','BW','NA','RE','TN','MA','DZ','LY','EG',
  ]);
  const MIDDLE_EAST = new Set([
    'SA','AE','IR','IQ','SY','LB','JO','KW','QA','BH','OM','YE','IL','PS',
  ]);
  const LATIN_AMERICA = new Set([
    'BR','MX','AR','CO','CL','PE','VE','CU','PR','JM','BO','EC','UY','GT','HN',
    'SV','NI','CR','PA','DO','HT','TT','GY','SR','BZ','BB','LC','VC','GD','AG',
    'DM','KN',
  ]);
  const EUROPE = new Set([
    'DE','FR','GB','IT','ES','PT','NL','BE','SE','NO','DK','FI','PL','CZ','AT',
    'CH','GR','RU','UA','RO','HU','BG','SK','SI','HR','BA','RS','ME','MK','AL',
    'LT','LV','EE','BY','MD','GE','AM','AZ','IS','IE','LU','MT','CY','TR',
  ]);
  const ASIA = new Set([
    'IN','CN','JP','KR','PK','ID','TH','VN','PH','MY','BD','MM','AF','UZ','KZ',
    'TM','TJ','KG','MN','NP','LK','BT','MV','KH','LA','TW','HK','SG','BN',
  ]);
  const NORTH_AMERICA = new Set(['US','CA']);

  if (NORTH_AMERICA.has(c)) return 'N. America';
  if (LATIN_AMERICA.has(c)) return 'Latin America';
  if (MIDDLE_EAST.has(c)) return 'Middle East';
  if (AFRICA.has(c)) return 'Africa';
  if (EUROPE.has(c)) return 'Europe';
  if (ASIA.has(c)) return 'Asia';
  return 'Other';
}

const REGION_ORDER = ['N. America', 'Latin America', 'Europe', 'Africa', 'Middle East', 'Asia', 'Other'];

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
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
  route: { params: { decade: string } };
  service: AuthService;
  favoritesHook: FavoritesHook;
  auth: AuthState;
}

export function DecadeSpotlightScreen({ navigation, route, service, favoritesHook, auth }: Props) {
  const { decade } = route.params;
  const insets = useSafeAreaInsets();
  const { currentTrackTitle } = useAudioPlayer();
  const contentBottomPad = insets.bottom + 76 + (currentTrackTitle ? 72 : 0);

  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDecadeSpotlight(decade, resolveService(service));
      const sorted = [...data.artists].sort((a, b) => {
        if (a.hasVerifiedTracks && !b.hasVerifiedTracks) return -1;
        if (!a.hasVerifiedTracks && b.hasVerifiedTracks) return 1;
        return 0;
      });
      setArtists(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load decade spotlight');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [decade]);

  const availableRegions = useMemo(() => {
    const seen = new Set(artists.map(a => regionForCode(a.countryCode)));
    return ['All', ...REGION_ORDER.filter(r => seen.has(r))];
  }, [artists]);

  const filtered = useMemo(() =>
    regionFilter === 'All' ? artists : artists.filter(a => regionForCode(a.countryCode) === regionFilter),
    [artists, regionFilter]
  );

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
          <Text style={styles.loadingText}>Scanning the globe for {decade} artists…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Try Again</Text>
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
            <View style={styles.heroBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.gold} />
              <Text style={styles.heroBadgeText}>Decade Spotlight</Text>
            </View>
            <Text style={styles.heroDecade}>{decade}</Text>
            <Text style={styles.heroSub}>
              {artists.length} artists from around the world
            </Text>
          </View>

          {/* Region filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
          >
            {availableRegions.map(region => (
              <TouchableOpacity
                key={region}
                style={[styles.filterChip, regionFilter === region && styles.filterChipActive]}
                onPress={() => { haptics.light(); setRegionFilter(region); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, regionFilter === region && styles.filterChipTextActive]}>
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Artist cards */}
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={36} color={Colors.text3} />
              <Text style={styles.emptyText}>No {regionFilter} artists found</Text>
            </View>
          ) : (
            filtered.map((artist, i) => (
              <View key={`${artist.name}-${i}`} style={styles.artistWrapper}>
                {(artist.country || artist.countryCode) && (
                  <View style={styles.artistMeta}>
                    {artist.countryCode && (
                      <Text style={styles.artistFlag}>{flagEmoji(artist.countryCode)}</Text>
                    )}
                    {artist.country && (
                      <Text style={styles.artistCountry}>{artist.country.toUpperCase()}</Text>
                    )}
                  </View>
                )}
                <ArtistCard
                  artist={artist}
                  service={service}
                  favoritesHook={favoritesHook}
                  onNeedAuth={undefined}
                  onSearchSimilar={name => navigation.push('ArtistSearch', { initialQuery: name })}
                  onGenrePress={(g, artistName) => navigation.push('GenreSpotlight', { genre: g, country: '', seedArtist: artistName })}
                  isTester={false}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites} />
    </SafeAreaView>
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

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },

  hero: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroDecade: {
    color: Colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 50,
  },
  heroSub: {
    color: Colors.text3,
    fontSize: 14,
  },

  filterScroll: { marginBottom: 20 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: Colors.goldBg,
    borderColor: Colors.goldBorder,
  },
  filterChipText: {
    color: Colors.text2,
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.gold,
  },

  artistWrapper: { marginBottom: 4 },
  artistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  artistFlag: { fontSize: 20 },
  artistCountry: {
    color: Colors.text3,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    color: Colors.text3,
    fontSize: 15,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
  },
  loadingText: {
    color: Colors.text3,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.text2,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
