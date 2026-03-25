import { Platform } from 'react-native';
import type { AuthService } from '../hooks/useAuth';

/**
 * When no service is connected, default to Apple Music on iOS
 * (pre-installed on every iPhone) and Spotify elsewhere.
 */
export const DEFAULT_SERVICE: 'spotify' | 'apple-music' = Platform.OS === 'ios' ? 'apple-music' : 'spotify';

export function resolveService(service: AuthService): 'spotify' | 'apple-music' {
  return service ?? DEFAULT_SERVICE;
}
