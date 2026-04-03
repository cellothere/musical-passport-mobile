import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_KEY = '@musical_passport_favorites';

export interface SavedDiscovery {
  id: string;
  type: 'track';
  country: string;
  decade?: string;
  savedAt: number;
  data: Record<string, any>;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedDiscovery[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(LOCAL_KEY).then(raw => {
      if (raw) { try { setFavorites(JSON.parse(raw)); } catch {} }
    });
  }, []);

  const save = useCallback(async (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => {
    const entry: SavedDiscovery = { ...item, id: String(Date.now()), savedAt: Date.now() };
    setFavorites(prev => {
      const next = [entry, ...prev];
      AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback(async (id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isTrackSaved = useCallback((trackId: string) =>
    favorites.some(f => f.type === 'track' && (f.data as any)?.trackId === trackId),
    [favorites]);

  const findSavedTrack = useCallback((trackId: string) =>
    favorites.find(f => f.type === 'track' && (f.data as any)?.trackId === trackId),
    [favorites]);

  return { favorites, save, remove, isTrackSaved, findSavedTrack };
}
