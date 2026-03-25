import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Share,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { fetchArtistTracks, Track } from '../services/api';
import { resolveService } from '../utils/defaultService';
import type { Artist } from '../services/api';
import type { AuthService } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import * as WebBrowser from 'expo-web-browser';

interface TrackFavoritesHook {
  isTrackSaved: (trackId: string) => boolean;
  findSavedTrack: (trackId: string) => SavedDiscovery | undefined;
  save: (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

interface Props {
  artist: Artist;
  service: AuthService;
  accessToken: string | null;
  showSimilarTo?: boolean;
  favoritesHook?: TrackFavoritesHook;
  country?: string;
  onNeedAuth?: () => void;
  autoExpand?: boolean;
  highlightTrack?: string;
}

function eraColors(era: string): { bg: string; border: string; text: string } {
  const e = era.toLowerCase();
  if (e.includes('pioneer')) return { bg: Colors.goldBg, border: Colors.goldBorder, text: Colors.gold };
  if (e.includes('golden')) return { bg: Colors.blueBg, border: Colors.blueBorder, text: Colors.blue };
  return { bg: Colors.purpleBg, border: Colors.purpleBorder, text: Colors.purple };
}

export function ArtistCard({ artist, service, accessToken, showSimilarTo = true, favoritesHook, country, onNeedAuth, autoExpand, highlightTrack }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoExpand) toggle();
  }, [autoExpand]);

  const toggle = async () => {
    if (expanded) { setExpanded(false); return; }
    if (tracks.length > 0 || error) { setExpanded(true); return; }
    setLoading(true);
    try {
      const data = await fetchArtistTracks(artist.name, resolveService(service), accessToken || undefined);
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
            tracks.map((track, i) => (
              <TrackRow
                key={i}
                index={i + 1}
                track={track}
                favoritesHook={favoritesHook}
                country={country}
                onNeedAuth={onNeedAuth}
                artistGenre={artist.genre}
                highlighted={!!highlightTrack && track.title.toLowerCase() === highlightTrack.toLowerCase()}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

function TrackOptionsSheet({ visible, onClose, title, artist, onShare, onOpen }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  artist?: string | null;
  onShare: () => void;
  onOpen: () => void;
}) {
  const insets = useSafeAreaInsets();
  const handle = (action: () => void) => { onClose(); setTimeout(action, 200); };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={sheetStyles.handle} />
          <View style={sheetStyles.trackMeta}>
            <Text style={sheetStyles.trackMetaTitle} numberOfLines={1}>{title}</Text>
            {artist ? <Text style={sheetStyles.trackMetaArtist} numberOfLines={1}>{artist}</Text> : null}
          </View>
          <View style={sheetStyles.sep} />
          <TouchableOpacity style={sheetStyles.row} onPress={() => handle(onShare)} activeOpacity={0.7}>
            <View style={[sheetStyles.iconWrap, { backgroundColor: Colors.blueBg, borderColor: Colors.blueBorder }]}>
              <Ionicons name="share-outline" size={20} color={Colors.blue} />
            </View>
            <Text style={sheetStyles.rowLabel}>Share</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text3} />
          </TouchableOpacity>
          <View style={sheetStyles.sep} />
          <TouchableOpacity style={sheetStyles.row} onPress={() => handle(onOpen)} activeOpacity={0.7}>
            <View style={[sheetStyles.iconWrap, { backgroundColor: Colors.greenBg, borderColor: Colors.greenBorder }]}>
              <Ionicons name="musical-notes-outline" size={20} color={Colors.green} />
            </View>
            <Text style={sheetStyles.rowLabel}>Open in App</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text3} />
          </TouchableOpacity>
          <View style={sheetStyles.sep} />
          <TouchableOpacity style={sheetStyles.row} onPress={onClose} activeOpacity={0.7}>
            <View style={[sheetStyles.iconWrap, { backgroundColor: Colors.surface2, borderColor: Colors.border2 }]}>
              <Ionicons name="close" size={20} color={Colors.text3} />
            </View>
            <Text style={[sheetStyles.rowLabel, { color: Colors.text2 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function TrackRow({ track, index, favoritesHook, country, onNeedAuth, artistGenre, highlighted }: {
  track: Track;
  index: number;
  favoritesHook?: TrackFavoritesHook;
  country?: string;
  onNeedAuth?: () => void;
  artistGenre?: string;
  highlighted?: boolean;
}) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const [optionsVisible, setOptionsVisible] = useState(false);
  const trackId = track.spotifyId || track.appleId || track.previewUrl || `${track.title}-${index}`;
  const isSaved = favoritesHook?.isTrackSaved(trackId) ?? false;
  const toggleSave = async () => {
    if (onNeedAuth) { onNeedAuth(); return; }
    if (!favoritesHook) return;
    if (isSaved) {
      const entry = favoritesHook.findSavedTrack(trackId);
      if (entry) await favoritesHook.remove(entry.id);
    } else {
      await favoritesHook.save({ type: 'track', country: country ?? '', data: { trackId, track, genre: artistGenre ?? '', country: country ?? '' } });
    }
  };
  const isThisTrack = currentTrackId === trackId;

  const openUrl = track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const openTrack = () => Linking.openURL(openUrl);

  const shareTrack = () => {
    const artistStr = track.artist ? ` by ${track.artist}` : '';
    const from = country ? ` from ${country}` : '';
    let deepLink = '';
    if (country) {
      const params = new URLSearchParams();
      if (track.artist) params.set('artist', track.artist);
      params.set('track', track.title);
      deepLink = `\n\nListen on Musical Passport 👉 musical-passport://country/${encodeURIComponent(country)}?${params.toString()}`;
    }
    Share.share({
      message: `🎵 Just discovered "${track.title}"${artistStr}${from} on Musical Passport!${deepLink}`,
    });
  };

  const showMore = () => setOptionsVisible(true);

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
    <View style={[styles.track, highlighted && styles.trackHighlighted]}>
      <TrackOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        title={track.title}
        artist={track.artist}
        onShare={shareTrack}
        onOpen={openTrack}
      />
      <Text style={styles.trackNumber}>{index}</Text>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
        {track.artist && <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>}
      </View>
      <View style={styles.trackActions}>
        {canPlay && (
          <TouchableOpacity
            style={styles.playBtn}
            onPress={handlePlay}
          >
            {isThisTrack && isLoading ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <Ionicons
                name={isThisTrack && isPlaying ? 'pause' : 'play'}
                size={20}
                color={Colors.gold}
              />
            )}
          </TouchableOpacity>
        )}
        {favoritesHook && (
          <TouchableOpacity style={[styles.heartBtn, isSaved && styles.heartBtnActive]} onPress={toggleSave}>
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={Colors.red} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.moreBtn} onPress={showMore}>
          <Text style={styles.moreBtnText}>•••</Text>
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
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(240,101,101,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240,101,101,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(240,101,101,0.18)',
    borderColor: 'rgba(240,101,101,0.4)',
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtnText: { color: Colors.text3, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  trackHighlighted: {
    backgroundColor: Colors.goldBg,
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  errorText: { color: Colors.red, fontSize: 14, paddingVertical: 12 },
  noTracks: { color: Colors.text3, fontSize: 14, paddingVertical: 12 },
});

const sheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border2, alignSelf: 'center', marginBottom: 16,
  },
  trackMeta: { paddingHorizontal: 20, paddingBottom: 14 },
  trackMetaTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  trackMetaArtist: { color: Colors.text2, fontSize: 14, marginTop: 3 },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 14,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
});
