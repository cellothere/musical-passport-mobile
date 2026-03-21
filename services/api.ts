// Update this to your backend's URL when deploying.
// For local development, use your machine's LAN IP (not localhost) so the device can reach it.
// e.g. http://192.168.1.42:3000
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://musical-passport-production.up.railway.app';

export interface Artist {
  name: string;
  genre: string;
  era: string;
  similarTo?: string;
}

export interface RecommendationResponse {
  country: string;
  genres: string[];
  artists: Artist[];
  didYouKnow?: string;
}

export interface Track {
  title: string;
  artist?: string;
  spotifyId?: string;
  appleId?: string;
  previewUrl?: string;
  spotifyUrl?: string;
}

export interface ArtistTracksResponse {
  tracks: Track[];
}

export interface TimeMachineResponse {
  country: string;
  decade: string;
  genre: string;
  description: string;
  tracks: Track[];
}

export interface UserProfile {
  displayName?: string;
  email?: string;
  id: string;
}

export interface MeResponse {
  user: UserProfile;
  topArtists: string[];
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  return res;
}

export async function fetchRecommendations(
  country: string,
  accessToken?: string
): Promise<RecommendationResponse> {
  const res = await apiFetch('/api/recommend', {
    method: 'POST',
    body: JSON.stringify({ country }),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to fetch recommendations');
  }
  return res.json();
}

export async function fetchArtistTracks(
  artistName: string,
  service: 'spotify' | 'apple-music' = 'spotify',
  accessToken?: string
): Promise<ArtistTracksResponse> {
  const endpoint =
    service === 'apple-music'
      ? `/api/artist-tracks-apple/${encodeURIComponent(artistName)}`
      : `/api/artist-tracks/${encodeURIComponent(artistName)}`;
  const res = await apiFetch(endpoint, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to fetch tracks');
  }
  return res.json();
}

export async function fetchTimeMachine(
  country: string,
  decade: string,
  service: 'spotify' | 'apple-music',
  accessToken?: string
): Promise<TimeMachineResponse> {
  const res = await apiFetch('/api/time-machine', {
    method: 'POST',
    body: JSON.stringify({ country, decade, service }),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Time machine failed');
  }
  return res.json();
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const res = await apiFetch('/api/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function fetchSpotifyToken(code: string, codeVerifier: string, redirectUri: string): Promise<string> {
  const res = await apiFetch('/auth/mobile-callback', {
    method: 'POST',
    body: JSON.stringify({ code, codeVerifier, redirectUri }),
  });
  if (!res.ok) throw new Error('Token exchange failed');
  const data: any = await res.json();
  return data.accessToken;
}

export async function fetchAppleMusicToken(): Promise<string> {
  const res = await apiFetch('/api/apple-token');
  if (!res.ok) throw new Error('Apple Music not configured on server');
  const data: any = await res.json();
  return data.token;
}

export interface InsightsSuggestion {
  country: string;
  reason: string;
}

export interface InsightsDNA {
  region: string;
  percentage: number;
}

export interface InsightsResponse {
  summary: string;
  suggestedCountries: InsightsSuggestion[];
  dna: InsightsDNA[];
  topEras: Array<{ decade: string; percentage: number }>;
}

export interface GenreSpotlightResponse {
  genre: string;
  country: string;
  explanation: string;
  tracks: Track[];
}

export async function fetchGenreSpotlight(
  genre: string,
  country: string,
  service: 'spotify' | 'apple-music',
  accessToken?: string
): Promise<GenreSpotlightResponse> {
  const res = await apiFetch('/api/genre-spotlight', {
    method: 'POST',
    body: JSON.stringify({ genre, country, service }),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to load genre spotlight');
  }
  return res.json();
}

export interface FoundArtist {
  id: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
  followers: number;
}

export interface ArtistMatch {
  name: string;
  country: string;
  countryCode: string;
  genre: string;
  era: string;
  description: string;
  similarityReason: string;
}

export interface SimilarArtistsResponse {
  baseArtist: string;
  sonicSummary: string;
  artists: ArtistMatch[];
}

export async function findArtist(query: string): Promise<FoundArtist> {
  const res = await apiFetch(`/api/find-artist?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Artist not found');
  }
  return res.json();
}

export async function fetchSimilarArtists(artistName: string): Promise<SimilarArtistsResponse> {
  const res = await apiFetch('/api/similar-artists', {
    method: 'POST',
    body: JSON.stringify({ artistName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to find similar artists');
  }
  return res.json();
}

export async function fetchInsights(topArtists: string[]): Promise<InsightsResponse> {
  const res = await apiFetch('/api/insights', {
    method: 'POST',
    body: JSON.stringify({ topArtists }),
  });
  if (!res.ok) throw new Error('Could not load insights');
  return res.json();
}
