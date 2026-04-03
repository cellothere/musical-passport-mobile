import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchGenreArtists, Artist } from '../services/api';
import { resolveService } from '../utils/defaultService';
import { ArtistCard } from '../components/ArtistCard';
import { FloatingNav } from '../components/FloatingNav';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { haptics } from '../utils/haptics';
import type { AuthService, AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

const ERAS = ['All', 'Contemporary', 'Golden Era', 'Pioneer'] as const;

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}
type EraFilter = typeof ERAS[number];

interface FavoritesHook {
  isTrackSaved: (trackId: string) => boolean;
  findSavedTrack: (trackId: string) => SavedDiscovery | undefined;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  favorites: SavedDiscovery[];
}

interface Props {
  navigation: any;
  route: { params: { genre: string } };
  service: AuthService;
  favoritesHook: FavoritesHook;
  auth: AuthState;
}

export function GenreArtistsScreen({ navigation, route, service, favoritesHook, auth }: Props) {
  const { genre } = route.params;
  const insets = useSafeAreaInsets();
  const { currentTrackTitle } = useAudioPlayer();
  const contentBottomPad = insets.bottom + 76 + (currentTrackTitle ? 72 : 0);

  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eraFilter, setEraFilter] = useState<EraFilter>('All');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGenreArtists(genre, resolveService(service));
      const sorted = [...data.artists].sort((a, b) => {
        if (a.hasVerifiedTracks && !b.hasVerifiedTracks) return -1;
        if (!a.hasVerifiedTracks && b.hasVerifiedTracks) return 1;
        return 0;
      });
      setArtists(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [genre]);

  const filtered = useMemo(() =>
    eraFilter === 'All' ? artists : artists.filter(a => a.era === eraFilter),
    [artists, eraFilter]
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
          <Text style={styles.loadingText}>Finding artists worldwide…</Text>
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
              <Ionicons name="globe-outline" size={14} color={Colors.purple} />
              <Text style={styles.heroBadgeText}>Genre Explorer</Text>
            </View>
            <Text style={styles.heroGenre}>{genre}</Text>
            <Text style={styles.heroSub}>
              {artists.length} artists from around the world
            </Text>
          </View>

          {/* Era filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eraRow}
            style={styles.eraScroll}
          >
            {ERAS.map(era => (
              <TouchableOpacity
                key={era}
                style={[styles.eraChip, eraFilter === era && styles.eraChipActive]}
                onPress={() => { haptics.light(); setEraFilter(era); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.eraChipText, eraFilter === era && styles.eraChipTextActive]}>
                  {era}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Artist cards */}
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={36} color={Colors.text3} />
              <Text style={styles.emptyText}>No {eraFilter} artists found</Text>
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
                  onGenrePress={g => navigation.push('GenreSpotlight', { genre: g, country: '' })}
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
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: Colors.purple,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroGenre: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  heroSub: {
    color: Colors.text3,
    fontSize: 14,
  },

  eraScroll: { marginBottom: 20 },
  eraRow: { gap: 8, paddingRight: 16 },
  eraChip: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  eraChipActive: {
    backgroundColor: Colors.goldBg,
    borderColor: Colors.goldBorder,
  },
  eraChipText: {
    color: Colors.text2,
    fontSize: 11,
    fontWeight: '600',
  },
  eraChipTextActive: {
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
