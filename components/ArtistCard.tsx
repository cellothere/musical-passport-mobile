import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
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
}

function eraColors(era: string): { bg: string; border: string; text: string } {
  const e = era.toLowerCase();
  if (e.includes('legend')) return { bg: Colors.goldBg, border: Colors.goldBorder, text: Colors.gold };
  if (e.includes('classic')) return { bg: Colors.blueBg, border: Colors.blueBorder, text: Colors.blue };
  return { bg: Colors.purpleBg, border: Colors.purpleBorder, text: Colors.purple };
}

export function ArtistCard({ artist, service, accessToken }: Props) {
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
          <Text style={styles.similarTo}>Similar to {artist.similarTo}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.eraBadge, { backgroundColor: era.bg, borderColor: era.border }]}>
            <Text style={[styles.eraText, { color: era.text }]}>{artist.era}</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.gold} style={styles.spinner} />
          ) : (
            <View style={[styles.chevronWrap, expanded && styles.chevronWrapOpen]}>
              <Text style={[styles.chevron, expanded && styles.chevronOpen]}>
                {expanded ? '−' : '+'}
              </Text>
            </View>
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
  artistName: { color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  artistGenre: { color: Colors.text2, fontSize: 14 },
  similarTo: { color: Colors.text3, fontSize: 13, fontStyle: 'italic' },

  cardRight: { alignItems: 'flex-end', gap: 10 },
  eraBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eraText: { fontSize: 12, fontWeight: '700' },

  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  chevron: { color: Colors.text3, fontSize: 18, lineHeight: 20, fontWeight: '600' },
  chevronOpen: { color: Colors.gold },
  spinner: { width: 28, height: 28 },

  tracks: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  trackNumber: {
    color: Colors.text3,
    fontSize: 13,
    fontWeight: '700',
    width: 22,
    textAlign: 'center',
  },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 13, marginTop: 2 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  playBtnText: { color: Colors.text2, fontSize: 13 },
  playBtnTextActive: { color: Colors.gold },
  openBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.greenBg,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtnText: { color: Colors.green, fontSize: 13, fontWeight: '700' },
  errorText: { color: Colors.red, fontSize: 13, paddingVertical: 12 },
  noTracks: { color: Colors.text3, fontSize: 13, paddingVertical: 12 },
});
