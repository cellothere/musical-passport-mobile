import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from '../services/api';

async function checkConnectivity(): Promise<boolean> {
  return Promise.race<boolean>([
    fetch(`${API_BASE_URL}/health`, { method: 'HEAD' })
      .then(() => true)
      .catch(() => false),
    new Promise<boolean>(resolve => setTimeout(() => resolve(false), 6000)),
  ]);
}

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const appState = useRef(AppState.currentState);
  const failCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    const online = await checkConnectivity();
    if (online) {
      failCount.current = 0;
      setIsOffline(false);
    } else {
      failCount.current += 1;
      if (failCount.current >= 2) {
        setIsOffline(true);
      }
    }
  };

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, 15000);

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        check();
      }
      appState.current = next;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return { isOffline };
}
