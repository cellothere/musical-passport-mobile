import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiAddStamp, type StampRecord } from '../services/api';

const LOCAL_KEY = '@musical_passport_stamps';

export function useStamps(accessToken: string | null = null, initialStamps: StampRecord[] = []) {
  const [stampRecords, setStampRecords] = useState<StampRecord[]>(initialStamps);

  // Keep a fast Set for has() lookups
  const stamps = useMemo(() => new Set(stampRecords.map(s => s.country)), [stampRecords]);

  useEffect(() => {
    if (initialStamps.length > 0) setStampRecords(initialStamps);
  }, [initialStamps.map(s => s.country).join(',')]);

  useEffect(() => {
    if (!accessToken) {
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
    }
  }, [accessToken]);

  const addStamp = async (country: string, opts?: { source?: string; genre?: string }) => {
    setStampRecords(prev => {
      const existing = prev.find(s => s.country === country);
      if (existing) {
        return prev.map(s => s.country === country
          ? { ...s, visitCount: s.visitCount + 1, source: opts?.source ?? s.source, genre: opts?.genre ?? s.genre }
          : s
        );
      }
      return [{
        country,
        stampedAt: new Date().toISOString(),
        visitCount: 1,
        genre: opts?.genre ?? null,
        source: opts?.source ?? null,
      }, ...prev];
    });

    if (accessToken) {
      apiAddStamp(accessToken, country, opts).catch(() => {});
    } else {
      const updated = stampRecords.find(s => s.country === country)
        ? stampRecords.map(s => s.country === country ? { ...s, visitCount: s.visitCount + 1 } : s)
        : [{ country, stampedAt: new Date().toISOString(), visitCount: 1, genre: opts?.genre ?? null, source: opts?.source ?? null }, ...stampRecords];
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    }
  };

  return { stamps, stampRecords, addStamp };
}
