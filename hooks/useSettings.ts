import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setHapticsEnabled as applyHapticsEnabled } from '../utils/haptics';

const HAPTICS_KEY = 'mp.settings.hapticsEnabled';
const REDUCE_MOTION_KEY = 'mp.settings.reduceMotion';

type Listener = () => void;
const listeners = new Set<Listener>();

let _haptics = true;
let _reduceMotion = false;
let _hydrated = false;

function notify() { listeners.forEach(l => l()); }

async function hydrate() {
  if (_hydrated) return;
  _hydrated = true;
  try {
    const [h, r] = await Promise.all([
      AsyncStorage.getItem(HAPTICS_KEY),
      AsyncStorage.getItem(REDUCE_MOTION_KEY),
    ]);
    if (h !== null) _haptics = h === '1';
    if (r !== null) _reduceMotion = r === '1';
    applyHapticsEnabled(_haptics);
    notify();
  } catch {}
}

export function useSettings() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick(t => t + 1);
    listeners.add(l);
    hydrate();
    return () => { listeners.delete(l); };
  }, []);

  const setHapticsEnabled = useCallback((value: boolean) => {
    _haptics = value;
    applyHapticsEnabled(value);
    AsyncStorage.setItem(HAPTICS_KEY, value ? '1' : '0').catch(() => {});
    notify();
  }, []);

  const setReduceMotion = useCallback((value: boolean) => {
    _reduceMotion = value;
    AsyncStorage.setItem(REDUCE_MOTION_KEY, value ? '1' : '0').catch(() => {});
    notify();
  }, []);

  return {
    hapticsEnabled: _haptics,
    reduceMotion: _reduceMotion,
    setHapticsEnabled,
    setReduceMotion,
  };
}
