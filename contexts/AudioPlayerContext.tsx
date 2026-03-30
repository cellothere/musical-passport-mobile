import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

interface AudioPlayerState {
  currentTrackId: string | null;
  currentTrackTitle: string | null;
  currentTrackArtist: string | null;
  isPlaying: boolean;
  isLoading: boolean;
}

interface AudioPlayerContextValue extends AudioPlayerState {
  play: (trackId: string, url: string, title: string, artist?: string) => Promise<void>;
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
  isPlaying: false,
  isLoading: false,
};

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AudioPlayerState>(EMPTY);
  const currentIdRef = useRef<string | null>(null);
  const pausedByBackground = useRef(false);
  const switchingRef = useRef(false); // true while loading a new track — suppresses false "track ended" events

  // expo-audio hook — source is replaced dynamically when a track is played
  const player = useExpoAudioPlayer(undefined);
  const playerStatus = useAudioPlayerStatus(player);

  // Pause when backgrounded; prevent auto-resume when returning to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (!currentIdRef.current) return;
      if (nextState === 'background' || nextState === 'inactive') {
        pausedByBackground.current = true;
        player.pause();
        setState(s => ({ ...s, isPlaying: false }));
      } else if (nextState === 'active' && pausedByBackground.current) {
        // expo-audio may auto-resume — explicitly keep it paused
        player.pause();
        pausedByBackground.current = false;
      }
    });
    return () => sub.remove();
  }, [player]);

  // Detect natural end of track — reset to start and show play button
  useEffect(() => {
    if (!currentIdRef.current) return;
    if (playerStatus.playing) {
      // New track is now stably playing — clear the switching guard and ensure isPlaying: true
      switchingRef.current = false;
      setState(s => s.isPlaying ? s : { ...s, isPlaying: true });
      return;
    }
    if (switchingRef.current || pausedByBackground.current) return;
    setState(s => {
      if (!s.isPlaying) return s; // already paused by user, no-op
      player.seekTo(0);
      return { ...s, isPlaying: false };
    });
  }, [playerStatus.playing]);

  const stop = useCallback(() => {
    player.pause();
    switchingRef.current = false;
    currentIdRef.current = null;
    setState(EMPTY);
  }, [player]);

  const play = useCallback(async (trackId: string, url: string, title: string, artist?: string) => {
    // Tap same track → stop
    if (currentIdRef.current === trackId) {
      stop();
      return;
    }

    switchingRef.current = true;
    currentIdRef.current = trackId;
    setState({ currentTrackId: trackId, currentTrackTitle: title, currentTrackArtist: artist ?? null, isPlaying: true, isLoading: true });

    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      player.replace({ uri: url });
      player.play();
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
