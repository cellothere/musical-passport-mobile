import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchArtistTracks, Track } from '../services/api';
import type { Artist } from '../services/api';
import type { AuthService } from '../hooks/useAuth';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import * as WebBrowser from 'expo-web-browser';

interface Props {
  artist: Artist;
  service: AuthService;
  accessToken: string | null;
  showSimilarTo?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

function eraColors(era: string): { bg: string; border: string; text: string } {
  const e = era.toLowerCase();
  if (e.includes('pioneer')) return { bg: Colors.goldBg, border: Colors.goldBorder, text: Colors.gold };
  if (e.includes('golden')) return { bg: Colors.blueBg, border: Colors.blueBorder, text: Colors.blue };
  return { bg: Colors.purpleBg, border: Colors.purpleBorder, text: Colors.purple };
}

export function ArtistCard({ artist, service, accessToken, showSimilarTo = true, isSaved, onToggleSave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (expanded) { setExpanded(false); return; }
    if (tracks.length > 0 || error) { setExpanded(true); return; }
    setLoading(true);
    try {
      const data = await fetchArtistTracks(artist.name, service || 'spotify', accessToken || undefined);
      setTracks(data.tracks);
      setExpanded(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tracks');
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  const era = eraColors(artist.era);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.cardLeft}>
          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.artistGenre}>{artist.genre}</Text>
          {showSimilarTo && artist.similarTo ? <Text style={styles.similarTo}>Because you like {artist.similarTo}</Text> : null}
        </View>
        
        <View style={styles.cardRight}>
          <View style={styles.cardRightTop}>
            <View style={[styles.eraBadge, { backgroundColor: era.bg, borderColor: era.border }]}>
              <Text style={[styles.eraText, { color: era.text }]}>{artist.era}</Text>
            </View>
            {onToggleSave && (
              <TouchableOpacity
                onPress={onToggleSave}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={20} color={isSaved ? Colors.red : Colors.text3} />
              </TouchableOpacity>
            )}
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.gold} style={styles.spinner} />
          ) : (
            ''
          )}
        </View>
      </TouchableOpacity>

      {expanded && !loading && (
        <View style={styles.tracks}>
          {error ? (
            <Text style={styles.errorText}>⚠️ {error}</Text>
          ) : tracks.length === 0 ? (
            <Text style={styles.noTracks}>No tracks found</Text>
          ) : (
            tracks.map((track, i) => <TrackRow key={i} index={i + 1} track={track} />)
          )}
        </View>
      )}
    </View>
  );
}

function TrackRow({ track, index }: { track: Track; index: number }) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const trackId = track.spotifyId || track.appleId || track.previewUrl || `${track.title}-${index}`;
  const isThisTrack = currentTrackId === trackId;

  const openUrl = track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const openTrack = () => Linking.openURL(openUrl);

  // Spotify removed preview_url from most tracks in 2024.
  // Fall back to their embed player (30s preview, no login needed).
  const embedUrl = track.spotifyId
    ? `https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator`
    : track.appleId
    ? `https://embed.music.apple.com/us/album/${track.appleId}`
    : null;

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
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        {track.artist && <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>}
      </View>
      <View style={styles.trackActions}>
        {canPlay && (
          <TouchableOpacity
            style={[styles.playBtn, isThisTrack && styles.playBtnActive]}
            onPress={handlePlay}
          >
            {isThisTrack && isLoading ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <Text style={[styles.playBtnText, isThisTrack && styles.playBtnTextActive]}>
                {isThisTrack && isPlaying ? '⏸' : '▶'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.openBtn} onPress={openTrack}>
          <Text style={styles.openBtnText}>↗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cardLeft: { flex: 1, gap: 4 },
  artistName: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  artistGenre: { color: Colors.text2, fontSize: 15 },
  similarTo: { color: Colors.text3, fontSize: 14, fontStyle: 'italic' },

  cardRight: { alignItems: 'flex-end', gap: 10 },
  cardRightTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eraBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  eraText: { fontSize: 13, fontWeight: '700' },

  chevronWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrapOpen: {
    backgroundColor: Colors.goldBg,
    borderColor: Colors.goldBorder,
  },
  chevron: { color: Colors.text3, fontSize: 20, lineHeight: 22, fontWeight: '600' },
  chevronOpen: { color: Colors.gold },
  spinner: { width: 36, height: 36 },

  tracks: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  trackNumber: {
    color: Colors.text3,
    fontSize: 14,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 14, marginTop: 3 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: Colors.goldBg,
    borderColor: Colors.goldBorder,
  },
  playBtnText: { color: Colors.text2, fontSize: 16 },
  playBtnTextActive: { color: Colors.gold },
  openBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.greenBg,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtnText: { color: Colors.green, fontSize: 16, fontWeight: '700' },
  errorText: { color: Colors.red, fontSize: 14, paddingVertical: 12 },
  noTracks: { color: Colors.text3, fontSize: 14, paddingVertical: 12 },
});
