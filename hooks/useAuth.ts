import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SERVICE } from '../utils/defaultService';

const STORAGE_KEY_TESTER = '@musical_passport_is_tester';
const STORAGE_KEY_TESTER_ID = '@musical_passport_tester_id';

export type AuthService = 'spotify' | 'apple-music' | null;

export interface AuthState {
  service: 'spotify' | 'apple-music';
  loading: boolean;
  isTester: boolean;
  testerUserId: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    service: DEFAULT_SERVICE,
    loading: true,
    isTester: false,
    testerUserId: null,
  });

  useEffect(() => {
    async function restore() {
      const storedTester = await AsyncStorage.getItem(STORAGE_KEY_TESTER);
      const isTester = storedTester === 'true';
      const testerUserId = await AsyncStorage.getItem(STORAGE_KEY_TESTER_ID);
      setState(s => ({ ...s, loading: false, isTester, testerUserId }));
    }
    restore();
  }, []);

  return state;
}
