import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

export interface TrackMeta {
  spotifyId?: string;
  appleId?: string;
  deezerId?: string;
  deezerUrl?: string;
  spotifyUrl?: string;
}

interface AudioPlayerState {
  currentTrackId: string | null;
  currentTrackTitle: string | null;
  currentTrackArtist: string | null;
  currentArtworkUrl: string | null;
  currentTrackMeta: TrackMeta | null;
  isPlaying: boolean;
  isLoading: boolean;
}

interface AudioPlayerContextValue extends AudioPlayerState {
  play: (trackId: string, url: string, title: string, artist?: string, artworkUrl?: string, trackMeta?: TrackMeta) => Promise<void>;
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
  isPlaying: false,
  isLoading: false,
};

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioPlayerState>(EMPTY);
  const currentIdRef = useRef<string | null>(null);
  const switchingRef = useRef(false);

  const player = useExpoAudioPlayer(undefined);
  const playerStatus = useAudioPlayerStatus(player);

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

  const stop = useCallback(() => {
    player.pause();
    switchingRef.current = false;
    currentIdRef.current = null;
    setState(EMPTY);
    player.clearLockScreenControls();
  }, [player]);

  const play = useCallback(async (trackId: string, url: string, title: string, artist?: string, artworkUrl?: string, trackMeta?: TrackMeta) => {
    if (currentIdRef.current === trackId) {
      stop();
      return;
    }

    switchingRef.current = true;
    currentIdRef.current = trackId;
    setState({ currentTrackId: trackId, currentTrackTitle: title, currentTrackArtist: artist ?? null, currentArtworkUrl: artworkUrl ?? null, currentTrackMeta: trackMeta ?? null, isPlaying: true, isLoading: true });

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      player.replace({ uri: url });
      player.play();
      player.setActiveForLockScreen(true, {
        title,
        artist: artist ?? 'Musical Passport',
        artworkUrl: artworkUrl ?? undefined,
      }, { showSeekForward: false, showSeekBackward: false });
      setState(s => s.currentTrackId === trackId ? { ...s, isLoading: false } : s);
    } catch (err) {
      console.error('Audio playback error:', err);
      switchingRef.current = false;
      currentIdRef.current = null;
      setState(EMPTY);
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
