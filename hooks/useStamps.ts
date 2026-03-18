import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@musical_passport_stamps';

export function useStamps() {
  const [stamps, setStamps] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          setStamps(new Set(JSON.parse(raw)));
        } catch {}
      }
    });
  }, []);

  const addStamp = async (country: string) => {
    const next = new Set(stamps);
    next.add(country);
    setStamps(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  };

  return { stamps, addStamp };
}
