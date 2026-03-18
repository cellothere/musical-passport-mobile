import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';

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

  // expo-audio hook — source is replaced dynamically when a track is played
  const player = useExpoAudioPlayer(undefined);

  const stop = useCallback(() => {
    player.pause();
    currentIdRef.current = null;
    setState(EMPTY);
  }, [player]);

  const play = useCallback(async (trackId: string, url: string, title: string, artist?: string) => {
    // Tap same track → stop
    if (currentIdRef.current === trackId) {
      stop();
      return;
    }

    currentIdRef.current = trackId;
    setState({ currentTrackId: trackId, currentTrackTitle: title, currentTrackArtist: artist ?? null, isPlaying: false, isLoading: true });

    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      player.replace({ uri: url });
      player.play();
      setState(s => ({ ...s, isPlaying: true, isLoading: false }));
    } catch (err) {
      console.error('Audio playback error:', err);
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
    <AudioPlayerContext.Provider value={{ ...state, play, togglePlay, stop }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}
