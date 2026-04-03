import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StampRecord } from '../services/api';

const LOCAL_KEY = '@musical_passport_stamps';

export function useStamps() {
  const [stampRecords, setStampRecords] = useState<StampRecord[]>([]);

  // Keep a fast Set for has() lookups
  const stamps = useMemo(() => new Set(stampRecords.map(s => s.country)), [stampRecords]);

  useEffect(() => {
    AsyncStorage.getItem(LOCAL_KEY).then(raw => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        // Support legacy string[] format from old installs
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          setStampRecords(parsed.map((c: string) => ({
            country: c, stampedAt: new Date().toISOString(), visitCount: 1, genre: null, source: null,
          })));
        } else {
          setStampRecords(parsed);
        }
      } catch {}
    });
  }, []);

  const addStamp = async (country: string, opts?: { source?: string; genre?: string }) => {
    setStampRecords(prev => {
      const existing = prev.find(s => s.country === country);
      let next: StampRecord[];
      if (existing) {
        next = prev.map(s => s.country === country
          ? { ...s, visitCount: s.visitCount + 1, source: opts?.source ?? s.source, genre: opts?.genre ?? s.genre }
          : s
        );
      } else {
        next = [{
          country,
          stampedAt: new Date().toISOString(),
          visitCount: 1,
          genre: opts?.genre ?? null,
          source: opts?.source ?? null,
        }, ...prev];
      }
      AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { stamps, stampRecords, addStamp };
}
