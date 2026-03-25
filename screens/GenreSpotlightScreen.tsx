import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchGenreSpotlight, Track } from '../services/api';
import { resolveService } from '../utils/defaultService';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import type { AuthService, AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { FloatingNav } from '../components/FloatingNav';
import { ServiceModal } from '../components/ServiceModal';
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
  route: { params: { genre: string; country: string } };
  service: AuthService;
  accessToken: string | null;
  favoritesHook: FavoritesHook;
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
}

export function GenreSpotlightScreen({ navigation, route, service, accessToken, favoritesHook, auth }: Props) {
  const { genre, country } = route.params;
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

  useEffect(() => {
    fetchGenreSpotlight(genre, country, resolveService(service), accessToken || undefined)
      .then(data => {
        setExplanation(data.explanation);
        setTracks(data.tracks);
        haptics.success();
      })
      .catch(err => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [genre, country]);

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
          <Text style={styles.headerGenre}>{genre}</Text>
          <Text style={styles.headerCountry}>{country}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.purple} />
          <Text style={styles.loadingText}>Loading genre spotlight…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
            <Text style={styles.goBackBtnText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.explanation}>{explanation}</Text>

          <Text style={styles.tracksLabel}>Essential tracks</Text>

          {tracks.map((track, i) => (
            <SpotlightTrack
              key={i}
              index={i + 1}
              track={track}
              genre={genre}
              country={country}
              favoritesHook={favoritesHook}
            />
          ))}

          <View style={styles.bottomPad} />
        </ScrollView>
      )}
      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites} />
      <ServiceModal visible={serviceModalVisible} onClose={() => setServiceModalVisible(false)} auth={auth} />
    </SafeAreaView>
  );
}

function SpotlightTrack({ track, index, genre, country, favoritesHook }: {
  track: Track;
  index: number;
  genre: string;
  country: string;
  favoritesHook: FavoritesHook;
}) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const trackId = track.spotifyId || track.appleId || `${track.title}-${track.artist ?? ''}`;
  const isThisTrack = currentTrackId === trackId;

  const openUrl = track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const embedUrl = track.spotifyId
    ? `https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator`
    : track.appleId
    ? `https://embed.music.apple.com/us/album/${track.appleId}`
    : null;

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
            {isThisTrack && isLoading ? (
              <ActivityIndicator size="small" color={Colors.purple} />
            ) : (
              <Ionicons
                name={isThisTrack && isPlaying ? 'pause' : 'play'}
                size={18}
                color={isThisTrack ? Colors.purple : Colors.text2}
              />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.heartTrackBtn} onPress={toggleSave}>
          <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={Colors.red} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.openBtn} onPress={() => Linking.openURL(openUrl)}>
          <Ionicons name="open-outline" size={18} color={Colors.blue} />
        </TouchableOpacity>
      </View>
    </View>
  );
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
  heartBtn: { padding: 4 },
  headerGenre: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  headerCountry: { color: Colors.text3, fontSize: 13, marginTop: 2 },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: Colors.text2, fontSize: 15 },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  errorText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  goBackBtn: {
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  goBackBtnText: { color: Colors.text, fontSize: 15, fontWeight: '600' },

  scroll: { flex: 1 },
  content: { padding: 18 },

  explanation: {
    color: Colors.text2,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 28,
  },

  tracksLabel: {
    color: Colors.text3,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },

  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  trackNumber: { color: Colors.text3, fontSize: 14, fontWeight: '700', width: 24, textAlign: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 13, marginTop: 3 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: Colors.purpleBg, borderColor: Colors.purpleBorder },
  heartTrackBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(240,101,101,0.08)', borderWidth: 1, borderColor: 'rgba(240,101,101,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  openBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.blueBg, borderWidth: 1, borderColor: Colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  bottomPad: { height: 48 },
});
