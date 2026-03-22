import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { fetchInsights, InsightsResponse, InsightsBlindSpot } from '../services/api';
import type { AuthState } from '../hooks/useAuth';

const FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Greece': '🇬🇷',
  'Poland': '🇵🇱', 'Iceland': '🇮🇸', 'Finland': '🇫🇮', 'Ireland': '🇮🇪',
  'Netherlands': '🇳🇱', 'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦',
  'Hungary': '🇭🇺', 'Czechia': '🇨🇿', 'Turkey': '🇹🇷', 'Belgium': '🇧🇪',
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
  'USA': '🇺🇸', 'Canada': '🇨🇦',
};

const REGION_COLORS: Record<string, string> = {
  'North America': Colors.blue,
  'Europe': Colors.purple,
  'Latin America': Colors.green,
  'Africa': Colors.gold,
  'Middle East': '#e07b3a',
  'Asia': '#e05a8a',
  'Oceania': '#4ab8c1',
};

interface Props {
  navigation: any;
  auth: AuthState;
  updateSyncData: (partial: { insights: any }) => void;
}

export function InsightsScreen({ navigation, auth, updateSyncData }: Props) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.topArtists.length) { setLoading(false); return; }
    // Use cached insights from login sync if available
    if (auth.syncData?.insights) {
      setInsights(auth.syncData.insights);
      setLoading(false);
      return;
    }
    const token = auth.service === 'spotify' ? auth.accessToken : null;
    fetchInsights(auth.topArtists, token ?? undefined)
      .then(data => {
        setInsights(data);
        setLoading(false);
        updateSyncData({ insights: data });
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name="analytics-outline" size={20} color={Colors.purple} />
          <Text style={styles.headerTitle}>{auth.user?.displayName ? `${auth.user.displayName}'s Musical DNA` : 'Your Musical DNA'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.purple} />
          <Text style={styles.loadingText}>Analysing your taste…</Text>
        </View>
      ) : !auth.topArtists.length ? (
        <View style={styles.centered}>
          <Ionicons name="musical-notes-outline" size={48} color={Colors.text3} />
          <Text style={styles.emptyTitle}>Connect Spotify</Text>
          <Text style={styles.emptyText}>
            Link your Spotify account to see a breakdown of your musical roots and personalised country suggestions.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={36} color={Colors.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : insights ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Regional DNA */}
          {insights.dna?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Where your music comes from</Text>
              <View style={styles.card}>
                {insights.dna
                  .sort((a, b) => b.percentage - a.percentage)
                  .map(({ region, percentage }, i) => {
                    const color = REGION_COLORS[region] ?? Colors.purple;
                    return (
                      <View key={region} style={[styles.dnaRow, i > 0 && styles.dnaRowBorder]}>
                        <Text style={styles.dnaLabel}>{region}</Text>
                        <View style={styles.dnaBarTrack}>
                          <View style={[styles.dnaBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.dnaPct}>{percentage}%</Text>
                      </View>
                    );
                  })}
              </View>
            </>
          )}

          {/* Top eras */}
          {insights.topEras?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Your eras</Text>
              <View style={styles.card}>
                {insights.topEras.map(({ decade, percentage }, i) => (
                  <View key={decade} style={[styles.dnaRow, i > 0 && styles.dnaRowBorder]}>
                    <Text style={styles.dnaLabel}>{decade}</Text>
                    <View style={styles.dnaBarTrack}>
                      <View style={[styles.dnaBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: Colors.gold }]} />
                    </View>
                    <Text style={styles.dnaPct}>{percentage}%</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Blind spots */}
          {insights.blindSpots?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Your blind spots</Text>
              {insights.blindSpots.map((spot: InsightsBlindSpot) => (
                <TouchableOpacity
                  key={spot.region}
                  style={styles.blindSpotCard}
                  onPress={() => navigation.navigate('Recommendations', { country: spot.gatewayCountry })}
                  activeOpacity={0.7}
                >
                  <View style={styles.blindSpotLeft}>
                    <View style={styles.blindSpotIconWrap}>
                      <Ionicons name="earth-outline" size={22} color={Colors.red} />
                    </View>
                    <View style={styles.blindSpotBody}>
                      <View style={styles.blindSpotTitleRow}>
                        <Text style={styles.blindSpotRegion}>{spot.region}</Text>
                        <View style={styles.blindSpotBadge}>
                          <Text style={styles.blindSpotBadgeText}>{spot.percentage}% of your taste</Text>
                        </View>
                      </View>
                      <Text style={styles.blindSpotCta}>
                        Start with {FLAGS[spot.gatewayCountry] ?? '🌐'} {spot.gatewayCountry} →
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Suggested countries */}
          {insights.suggestedCountries?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Picked for you</Text>
              {insights.suggestedCountries.map(({ country, reason }) => (
                <TouchableOpacity
                  key={country}
                  style={styles.suggestionCard}
                  onPress={() => navigation.navigate('Recommendations', { country })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionFlag}>{FLAGS[country] ?? '🌐'}</Text>
                  <View style={styles.suggestionBody}>
                    <Text style={styles.suggestionCountry}>{country}</Text>
                    <Text style={styles.suggestionReason}>{reason}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  loadingText: { color: Colors.text2, fontSize: 15, marginTop: 4 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorText: { color: Colors.red, fontSize: 15, textAlign: 'center' },

  content: { padding: 18 },

  // Archetype hero
  archetypeCard: {
    backgroundColor: Colors.purpleBg,
    borderWidth: 1, borderColor: Colors.purpleBorder,
    borderRadius: 16, padding: 20, marginBottom: 14, alignItems: 'center',
  },
  archetypeLabel: {
    color: Colors.purple, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  archetypeTitle: {
    color: Colors.text, fontSize: 24, fontWeight: '800',
    letterSpacing: -0.5, textAlign: 'center', marginBottom: 10,
  },
  archetypeDesc: {
    color: Colors.text2, fontSize: 14, lineHeight: 21, textAlign: 'center',
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, padding: 16, marginBottom: 24,
  },
  summaryText: { color: Colors.text2, fontSize: 14, lineHeight: 22 },

  sectionLabel: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 4,
  },

  // DNA bars
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, overflow: 'hidden', marginBottom: 24,
  },
  dnaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dnaRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  dnaLabel: { color: Colors.text, fontSize: 13, fontWeight: '600', width: 114 },
  dnaBarTrack: {
    flex: 1, height: 6, backgroundColor: Colors.surface2,
    borderRadius: 3, overflow: 'hidden',
  },
  dnaBarFill: { height: '100%', borderRadius: 3 },
  dnaPct: { color: Colors.text3, fontSize: 13, fontWeight: '600', width: 38, textAlign: 'right' },

  // Blind spots
  blindSpotCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: 'rgba(240,101,101,0.3)',
    borderRadius: 14, padding: 16, marginBottom: 10,
  },
  blindSpotLeft: { flexDirection: 'row', gap: 14 },
  blindSpotIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(240,101,101,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  blindSpotBody: { flex: 1 },
  blindSpotTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' },
  blindSpotRegion: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  blindSpotBadge: {
    backgroundColor: 'rgba(240,101,101,0.12)',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  blindSpotBadgeText: { color: Colors.red, fontSize: 11, fontWeight: '700' },
  blindSpotTeaser: { color: Colors.text2, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  blindSpotCta: { color: Colors.blue, fontSize: 13, fontWeight: '600' },

  // Suggested countries
  suggestionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, padding: 16, marginBottom: 10, gap: 14,
  },
  suggestionFlag: { fontSize: 28 },
  suggestionBody: { flex: 1 },
  suggestionCountry: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  suggestionReason: { color: Colors.text2, fontSize: 13, lineHeight: 19 },
});
