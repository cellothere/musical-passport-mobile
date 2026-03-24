import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMe, fetchSpotifyToken, fetchAppleMe, syncUser, API_BASE_URL } from '../services/api';
import type { SyncResult } from '../services/api';
import type { SavedDiscovery } from './useFavorites';

WebBrowser.maybeCompleteAuthSession();


const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const SCOPES = ['user-top-read', 'user-read-private', 'user-read-email'];
const STORAGE_KEY_SPOTIFY = '@musical_passport_spotify_token';
const STORAGE_KEY_APPLE = '@musical_passport_apple_token';
const STORAGE_KEY_SERVICE = '@musical_passport_service';

export type AuthService = 'spotify' | 'apple-music' | null;

export interface AuthState {
  service: AuthService;
  accessToken: string | null;
  user: { id?: string; displayName?: string; email?: string } | null;
  topArtists: string[];
  loading: boolean;
  syncData: SyncResult | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    service: null,
    accessToken: null,
    user: null,
    topArtists: [],
    loading: true,
    syncData: null,
  });

  const loginTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'musical-passport', path: 'callback' });
  const discovery = AuthSession.useAutoDiscovery('https://accounts.spotify.com');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    { clientId: SPOTIFY_CLIENT_ID, scopes: SCOPES, usePKCE: true, redirectUri },
    discovery
  );

  // Restore session on mount
  useEffect(() => {
    async function restore() {
      const service = await AsyncStorage.getItem(STORAGE_KEY_SERVICE);
      if (service === 'spotify') {
        const token = await AsyncStorage.getItem(STORAGE_KEY_SPOTIFY);
        if (token) { await validateSpotifyToken(token); return; }
      } else if (service === 'apple-music') {
        const token = await AsyncStorage.getItem(STORAGE_KEY_APPLE);
        if (token) {
          const { topArtists } = await fetchAppleMe(token).catch(() => ({ topArtists: [] }));
          setState({ service: 'apple-music', accessToken: token, user: { displayName: 'Apple Music' }, topArtists, loading: false, syncData: null });
          return;
        }
      }
      setState(s => ({ ...s, loading: false }));
    }
    restore();
  }, []);

  // Handle Spotify OAuth callback
  useEffect(() => {
    if (!response) return;
    if (loginTimeoutRef.current) { clearTimeout(loginTimeoutRef.current); loginTimeoutRef.current = null; }
    if (response.type === 'success') {
      const { code } = response.params;
      const codeVerifier = request?.codeVerifier;
      if (code && codeVerifier) exchangeSpotifyCode(code, codeVerifier);
    } else if (response.type === 'error' || response.type === 'dismiss') {
      setState(s => ({ ...s, loading: false }));
    }
  }, [response]);

  async function validateSpotifyToken(token: string) {
    try {
      const data = await fetchMe(token);
      await AsyncStorage.setItem(STORAGE_KEY_SPOTIFY, token);
      await AsyncStorage.setItem(STORAGE_KEY_SERVICE, 'spotify');
      // Sync user to Supabase and retrieve their persisted data
      const syncData = await syncUser(token, {
        displayName: data.user.displayName,
        topArtists: data.topArtists,
      }).catch(() => null);
      setState({ service: 'spotify', accessToken: token, user: data.user, topArtists: data.topArtists, loading: false, syncData });
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY_SPOTIFY);
      await AsyncStorage.removeItem(STORAGE_KEY_SERVICE);
      setState({ service: null, accessToken: null, user: null, topArtists: [], loading: false, syncData: null });
    }
  }

  async function exchangeSpotifyCode(code: string, codeVerifier: string) {
    try {
      const token = await fetchSpotifyToken(code, codeVerifier, redirectUri);
      await validateSpotifyToken(token);
    } catch (err) {
      console.error('Token exchange failed:', err);
      setState(s => ({ ...s, loading: false }));
    }
  }

  const loginSpotify = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY_SERVICE);
    setState(s => ({ ...s, loading: true }));
    if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
    loginTimeoutRef.current = setTimeout(() => {
      setState(s => {
        if (!s.loading) return s;
        Alert.alert('Connection Failed', 'Could not connect to Spotify. Please try again.');
        return { ...s, loading: false };
      });
      loginTimeoutRef.current = null;
    }, 15000);
    await promptAsync();
  }, [promptAsync]);

  const loginAppleMusic = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const authUrl = `${API_BASE_URL}/auth/apple-music`;
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );
      const result = await Promise.race([
        WebBrowser.openAuthSessionAsync(authUrl, 'musical-passport://apple-music-callback'),
        timeout,
      ]);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const error = url.searchParams.get('error');

        if (token) {
          await AsyncStorage.removeItem(STORAGE_KEY_SPOTIFY);
          await AsyncStorage.setItem(STORAGE_KEY_APPLE, token);
          await AsyncStorage.setItem(STORAGE_KEY_SERVICE, 'apple-music');
          const { topArtists } = await fetchAppleMe(token).catch(() => ({ topArtists: [] }));
          setState({ service: 'apple-music', accessToken: token, user: { displayName: 'Apple Music' }, topArtists, loading: false, syncData: null });
        } else {
          throw new Error(error || 'Authorization failed');
        }
      } else {
        // User cancelled
        setState(s => ({ ...s, loading: false }));
      }
    } catch (err: any) {
      console.error('Apple Music connect failed:', err);
      const isTimeout = err.message === 'timeout';
      Alert.alert(
        'Connection Failed',
        isTimeout
          ? 'Could not connect to Apple Music. Please try again.'
          : 'Could not connect to Apple Music: ' + (err.message || 'Unknown error')
      );
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY_SPOTIFY);
    await AsyncStorage.removeItem(STORAGE_KEY_APPLE);
    await AsyncStorage.removeItem(STORAGE_KEY_SERVICE);
    setState({ service: null, accessToken: null, user: null, topArtists: [], loading: false, syncData: null });
  }, []);

  const updateSyncData = useCallback((partial: Partial<NonNullable<AuthState['syncData']>>) => {
    setState(s => ({
      ...s,
      syncData: s.syncData ? { ...s.syncData, ...partial } : null,
    }));
  }, []);

  return { ...state, loginSpotify, loginAppleMusic, logout, request, updateSyncData };
}
