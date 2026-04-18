import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { fetchPreviewUrl } from '../services/api';

export interface TrackMeta {
  spotifyId?: string;
  appleId?: string;
  deezerId?: string;
  deezerUrl?: string;
  spotifyUrl?: string;
}

export function buildTrackMeta({ spotifyId, appleId, deezerId, deezerUrl, spotifyUrl }: TrackMeta): TrackMeta {
  return { spotifyId, appleId, deezerId, deezerUrl, spotifyUrl };
}

export type PreviewSource = 'spotify' | 'deezer' | 'apple' | null;

export function getPreviewSource(url: string | undefined): PreviewSource {
  if (!url) return null;
  if (url.includes('scdn.co')) return 'spotify';
  if (url.includes('dzcdn.net') || url.includes('cdnt-preview')) return 'deezer';
  if (url.includes('itunes.apple.com') || url.includes('itunes-assets')) return 'apple';
  return null;
}

interface AudioPlayerState {
  currentTrackId: string | null;
  currentTrackTitle: string | null;
  currentTrackArtist: string | null;
  currentArtworkUrl: string | null;
  currentTrackMeta: TrackMeta | null;
  currentPreviewSource: PreviewSource;
  isPlaying: boolean;
  isLoading: boolean;
}

interface AudioPlayerContextValue extends AudioPlayerState {
  play: (trackId: string, url: string | undefined, title: string, artist?: string, artworkUrl?: string, trackMeta?: TrackMeta) => Promise<boolean>;
  togglePlay: () => void;
  stop: () => void;
  currentTime: number;
  duration: number;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

const EMPTY: AudioPlayerState = {
  currentTrackId: null,
  currentTrackTitle: null,
  currentTrackArtist: null,
  currentArtworkUrl: null,
  currentTrackMeta: null,
  currentPreviewSource: null,
  isPlaying: false,
  isLoading: false,
};

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioPlayerState>(EMPTY);
  const currentIdRef = useRef<string | null>(null);
  const switchingRef = useRef(false);

  const player = useExpoAudioPlayer(undefined);
  const playerStatus = useAudioPlayerStatus(player);

  // Configure audio session once at mount: foreground-only, mix politely.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'doNotMix',
    }).catch(err => console.warn('setAudioModeAsync failed:', err));
  }, []);

  // When app leaves the foreground, pause and stay paused on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active' && currentIdRef.current) {
        player.pause();
        setState(s => s.isPlaying ? { ...s, isPlaying: false } : s);
      }
    });
    return () => sub.remove();
  }, [player]);

  // Detect natural end of track — reset to start and show play button
  useEffect(() => {
    if (!currentIdRef.current) return;
    if (playerStatus.playing) {
      switchingRef.current = false;
      setState(s => s.isPlaying ? s : { ...s, isPlaying: true });
      return;
    }
    if (switchingRef.current) return;
    setState(s => {
      if (!s.isPlaying) return s;
      player.seekTo(0);
      return { ...s, isPlaying: false };
    });
  }, [playerStatus.playing]);

  // Hard 30s cap — preview clips should never exceed 30 seconds, regardless of source.
  useEffect(() => {
    if (!currentIdRef.current) return;
    if (!playerStatus.playing) return;
    if ((playerStatus.currentTime ?? 0) >= 30) {
      player.pause();
      player.seekTo(0);
      setState(s => s.isPlaying ? { ...s, isPlaying: false } : s);
    }
  }, [playerStatus.currentTime, playerStatus.playing]);

  const stop = useCallback(() => {
    player.pause();
    switchingRef.current = false;
    currentIdRef.current = null;
    setState(EMPTY);
  }, [player]);

  const play = useCallback(async (trackId: string, url: string | undefined, title: string, artist?: string, artworkUrl?: string, trackMeta?: TrackMeta): Promise<boolean> => {
    if (currentIdRef.current === trackId) {
      stop();
      return false;
    }

    switchingRef.current = true;
    currentIdRef.current = trackId;
    setState({
      currentTrackId: trackId,
      currentTrackTitle: title,
      currentTrackArtist: artist ?? null,
      currentArtworkUrl: artworkUrl ?? null,
      currentTrackMeta: trackMeta ?? null,
      currentPreviewSource: null,
      isPlaying: true,
      isLoading: true,
    });

    try {
      // Fetch preview URL on-demand if not supplied
      let resolvedUrl = url;
      if (!resolvedUrl && trackMeta) {
        resolvedUrl = await fetchPreviewUrl({
          title,
          artist,
          deezerId: trackMeta.deezerId,
          appleId: trackMeta.appleId,
          spotifyId: trackMeta.spotifyId,
        }) ?? undefined;
      }

      if (!resolvedUrl) {
        switchingRef.current = false;
        currentIdRef.current = null;
        setState(EMPTY);
        return false;
      }

      setState(s => s.currentTrackId === trackId ? { ...s, currentPreviewSource: getPreviewSource(resolvedUrl) } : s);

      player.replace({ uri: resolvedUrl });
      player.play();
      setState(s => s.currentTrackId === trackId ? { ...s, isLoading: false } : s);
      return true;
    } catch (err) {
      console.error('Audio playback error:', err);
      switchingRef.current = false;
      currentIdRef.current = null;
      setState(EMPTY);
      return false;
    }
  }, [player, stop]);

  const togglePlay = useCallback(() => {
    if (!currentIdRef.current) return;
    if (player.playing) {
      player.pause();
      setState(s => ({ ...s, isPlaying: false }));
    } else {
      player.play();
      setState(s => ({ ...s, isPlaying: true }));
    }
  }, [player]);

  return (
    <AudioPlayerContext.Provider value={{ ...state, play, togglePlay, stop, currentTime: playerStatus.currentTime ?? 0, duration: playerStatus.duration ?? 0 }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}
