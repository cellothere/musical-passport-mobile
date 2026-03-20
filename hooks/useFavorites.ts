import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecommendationResponse, TimeMachineResponse } from '../services/api';

const STORAGE_KEY = '@musical_passport_favorites';

export interface SavedDiscovery {
  id: string;
  type: 'recommendation' | 'timemachine';
  country: string;
  decade?: string; // timemachine only
  savedAt: number;
  data: RecommendationResponse | TimeMachineResponse;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedDiscovery[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setFavorites(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const persist = async (next: SavedDiscovery[]) => {
    setFavorites(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const save = useCallback(async (item: Omit<SavedDiscovery, 'id' | 'savedAt'>) => {
    const entry: SavedDiscovery = { ...item, id: String(Date.now()), savedAt: Date.now() };
    await persist([entry, ...favorites]);
  }, [favorites]);

  const remove = useCallback(async (id: string) => {
    await persist(favorites.filter(f => f.id !== id));
  }, [favorites]);

  const isSaved = useCallback((country: string, type: SavedDiscovery['type'], decade?: string) =>
    favorites.some(f =>
      f.country === country && f.type === type && (!decade || f.decade === decade)
    ), [favorites]);

  const findSaved = useCallback((country: string, type: SavedDiscovery['type'], decade?: string) =>
    favorites.find(f =>
      f.country === country && f.type === type && (!decade || f.decade === decade)
    ), [favorites]);

  return { favorites, save, remove, isSaved, findSaved };
}
