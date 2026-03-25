import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Linking,
} from 'react-native';

const HEART_ICON = require('../assets/favorite-music-heart-icon-png.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FLAGS } from '../constants/flags';
import type { SavedDiscovery } from '../hooks/useFavorites';
import type { AuthState } from '../hooks/useAuth';
import { FloatingNav } from '../components/FloatingNav';

interface FavoritesHook {
  favorites: SavedDiscovery[];
  remove: (id: string) => Promise<void>;
}

interface Props {
  navigation: any;
  favoritesHook: FavoritesHook;
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function TrackCard({ item, onRemove }: { item: SavedDiscovery; onRemove: () => void }) {
  const track = (item.data as any).track ?? {};
  const genre = (item.data as any).genre ?? '';
  const country = item.country;

  const openUrl = track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title ?? ''} ${track.artist ?? ''}`)}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>{track.title ?? 'Unknown track'}</Text>
          {track.artist && <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>}
          <View style={styles.cardMeta}>
            {genre ? (
              <View style={styles.genreBadge}>
                <Text style={styles.genreBadgeText}>{genre}</Text>
              </View>
            ) : null}
            <Text style={styles.countryText}>{FLAGS[country] ?? '🌐'} {country}</Text>
            <Text style={styles.dateText}>{formatDate(item.savedAt)}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => Linking.openURL(openUrl)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="open-outline" size={18} color={Colors.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="heart" size={18} color={Colors.red} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function SavedScreen({ navigation, favoritesHook, auth }: Props) {
  const tracks = favoritesHook.favorites.filter(f => f.type === 'track');

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
        <View style={styles.headerTitleRow}>
          <Image source={HEART_ICON} style={{ width: 22, height: 22 }} />
          <Text style={styles.headerTitle}>Saved Songs</Text>
        </View>
      </View>

      {tracks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={Colors.text3} />
          <Text style={styles.emptyTitle}>No saved songs yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any track to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>{tracks.length} saved</Text>
          {tracks.map(item => (
            <TrackCard
              key={item.id}
              item={item}
              onRemove={() => favoritesHook.remove(item.id)}
            />
          ))}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}
      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  content: { padding: 16 },
  countLabel: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, marginBottom: 10, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  cardInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  trackArtist: { color: Colors.text2, fontSize: 14, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  genreBadge: {
    backgroundColor: Colors.purpleBg, borderWidth: 1, borderColor: Colors.purpleBorder,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  genreBadgeText: { color: Colors.purple, fontSize: 11, fontWeight: '600' },
  countryText: { color: Colors.text3, fontSize: 11 },
  dateText: { color: Colors.text3, fontSize: 11 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  openBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.blueBg, borderWidth: 1, borderColor: Colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtn: { padding: 4 },
});
