import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetchFavorites, apiSaveFavorite, apiRemoveFavorite } from '../services/api';

const LOCAL_KEY = '@musical_passport_favorites';

export interface SavedDiscovery {
  id: string;
  type: 'track';
  country: string;
  decade?: string;
  savedAt: number;
  data: Record<string, any>;
}

export function useFavorites(accessToken: string | null = null, initialFavorites: SavedDiscovery[] = []) {
  const [favorites, setFavorites] = useState<SavedDiscovery[]>(initialFavorites);

  useEffect(() => {
    if (accessToken) {
      apiFetchFavorites(accessToken)
        .then((data: SavedDiscovery[]) => setFavorites(data))
        .catch(() => {});
    } else {
      AsyncStorage.getItem(LOCAL_KEY).then(raw => {
        if (raw) { try { setFavorites(JSON.parse(raw)); } catch {} }
      });
    }
  }, [accessToken]);

  const save = useCallback(async (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => {
    if (accessToken) {
      try {
        const saved = await apiSaveFavorite(accessToken, item);
        setFavorites(prev => [saved, ...prev]);
      } catch {
        // Fall back to local if server fails
        const entry: SavedDiscovery = { ...item, id: String(Date.now()), savedAt: Date.now() };
        setFavorites(prev => {
          const next = [entry, ...prev];
          AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
          return next;
        });
      }
    } else {
      const entry: SavedDiscovery = { ...item, id: String(Date.now()), savedAt: Date.now() };
      setFavorites(prev => {
        const next = [entry, ...prev];
        AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [accessToken]);

  const remove = useCallback(async (id: string) => {
    if (accessToken) {
      await apiRemoveFavorite(accessToken, id);
    } else {
      setFavorites(prev => {
        const next = prev.filter(f => f.id !== id);
        AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        return next;
      });
      return;
    }
    setFavorites(prev => prev.filter(f => f.id !== id));
  }, [accessToken]);

  const isTrackSaved = useCallback((trackId: string) =>
    favorites.some(f => f.type === 'track' && (f.data as any)?.trackId === trackId),
    [favorites]);

  const findSavedTrack = useCallback((trackId: string) =>
    favorites.find(f => f.type === 'track' && (f.data as any)?.trackId === trackId),
    [favorites]);

  return { favorites, save, remove, isTrackSaved, findSavedTrack };
}
