import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { fetchRecommendations, RecommendationResponse } from '../services/api';
import { ArtistCard } from '../components/ArtistCard';
import type { AuthState } from '../hooks/useAuth';

const FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Greece': '🇬🇷',
  'Poland': '🇵🇱', 'Iceland': '🇮🇸', 'Finland': '🇫🇮', 'Ireland': '🇮🇪',
  'Netherlands': '🇳🇱', 'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦',
  'Hungary': '🇭🇺', 'Czechia': '🇨🇿', 'Turkey': '🇹🇷',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Cuba': '🇨🇺',
  'Mexico': '🇲🇽', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Jamaica': '🇯🇲',
  'Venezuela': '🇻🇪', 'Bolivia': '🇧🇴', 'Ecuador': '🇪🇨', 'Panama': '🇵🇦',
  'Nigeria': '🇳🇬', 'Ghana': '🇬🇭', 'Senegal': '🇸🇳', 'Mali': '🇲🇱',
  'Ethiopia': '🇪🇹', 'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'Cameroon': '🇨🇲',
  'Congo': '🇨🇩', 'Kenya': '🇰🇪', 'Algeria': '🇩🇿', 'Morocco': '🇲🇦',
  'Tanzania': '🇹🇿', 'Lebanon': '🇱🇧', 'Iran': '🇮🇷', 'Israel': '🇮🇱',
  'Saudi Arabia': '🇸🇦', 'Armenia': '🇦🇲', 'Azerbaijan': '🇦🇿', 'Georgia': '🇬🇪',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'India': '🇮🇳', 'China': '🇨🇳',
  'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Philippines': '🇵🇭',
  'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Taiwan': '🇹🇼', 'Mongolia': '🇲🇳',
  'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'Papua New Guinea': '🇵🇬', 'Fiji': '🇫🇯',
  'USA': '🇺🇸', 'Canada': '🇨🇦', 'Haiti': '🇭🇹', 'Trinidad & Tobago': '🇹🇹', 'Barbados': '🇧🇧',
};

interface StampsHook {
  stamps: Set<string>;
  addStamp: (country: string) => Promise<void>;
}

interface Props {
  navigation: any;
  route: { params: { country: string } };
  auth: AuthState;
  stampsHook: StampsHook;
}

export function RecommendationScreen({ navigation, route, auth, stampsHook }: Props) {
  const { country } = route.params;
  const { stamps, addStamp } = stampsHook;
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchRecommendations(country, auth.accessToken || undefined);
        if (!cancelled) {
          setRecs(data);
          addStamp(country);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Could not load recommendations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [country]);

  const isStamped = stamps.has(country);
  const flag = FLAGS[country] ?? '🌐';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.countryFlag}>{flag}</Text>
            <Text style={styles.countryName}>{country}</Text>
          </View>
          {isStamped && (
            <View style={styles.stampedBadge}>
              <Text style={styles.stampedBadgeText}>✦ Stamped</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingTitle}>Tuning in to {country}</Text>
          <Text style={styles.loadingSubtitle}>Finding the best local music…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
            <Text style={styles.goBackBtnText}>← Go back</Text>
          </TouchableOpacity>
        </View>
      ) : recs ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Genre tags */}
          {recs.genres?.length > 0 && (
            <View style={styles.genres}>
              {recs.genres.map(g => (
                <View key={g} style={styles.genreTag}>
                  <Text style={styles.genreText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Artists to discover</Text>
            <Text style={styles.sectionHint}>Tap any artist to reveal tracks</Text>
          </View>

          {(recs.artists || []).map((artist, i) => (
            <ArtistCard
              key={i}
              artist={artist}
              service={auth.service}
              accessToken={auth.accessToken}
            />
          ))}

          {recs.didYouKnow && (
            <View style={styles.dyk}>
              <Text style={styles.dykLabel}>💡 Did you know</Text>
              <Text style={styles.dykText}>{recs.didYouKnow}</Text>
            </View>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  backIcon: { color: Colors.blue, fontSize: 32, lineHeight: 32, fontWeight: '300' },
  headerMid: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryFlag: { fontSize: 26 },
  countryName: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  stampedBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  stampedBadgeText: { color: Colors.gold, fontSize: 11, fontWeight: '700' },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTitle: { color: Colors.text, fontSize: 17, fontWeight: '600' },
  loadingSubtitle: { color: Colors.text2, fontSize: 14 },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  errorIcon: { fontSize: 40 },
  errorText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  goBackBtn: {
    marginTop: 8,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  goBackBtnText: { color: Colors.text, fontSize: 15, fontWeight: '600' },

  scroll: { flex: 1 },
  content: { padding: 18 },

  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 },
  genreTag: {
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  genreText: { color: Colors.purple, fontSize: 13, fontWeight: '600' },

  sectionHeader: { marginBottom: 14 },
  sectionHeading: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  sectionHint: { color: Colors.text3, fontSize: 13 },

  dyk: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  dykLabel: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  dykText: { color: Colors.text, fontSize: 15, lineHeight: 23 },

  bottomPad: { height: 48 },
});
