import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiAddStamp } from '../services/api';

const LOCAL_KEY = '@musical_passport_stamps';

export function useStamps(accessToken: string | null = null, initialStamps: string[] = []) {
  const [stamps, setStamps] = useState<Set<string>>(new Set(initialStamps));

  useEffect(() => {
    if (initialStamps.length > 0) setStamps(new Set(initialStamps));
  }, [initialStamps.join(',')]);

  useEffect(() => {
    if (!accessToken) {
      AsyncStorage.getItem(LOCAL_KEY).then(raw => {
        if (raw) { try { setStamps(new Set(JSON.parse(raw))); } catch {} }
      });
    }
  }, [accessToken]);

  const addStamp = async (country: string) => {
    setStamps(prev => new Set([...prev, country]));
    if (accessToken) {
      apiAddStamp(accessToken, country).catch(() => {});
    } else {
      const next = new Set([...stamps, country]);
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify([...next]));
    }
  };

  return { stamps, addStamp };
}
