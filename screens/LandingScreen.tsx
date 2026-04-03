import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FLAGS } from '../constants/flags';
import { getAllCountries, MUSIC_REGIONS } from '../constants/regions';
import { haptics } from '../utils/haptics';
import { DiscoverSheet } from '../components/DiscoverSheet';
import { useFocusEffect } from '@react-navigation/native';
import { fetchCountryOfDay, recordCountryOfDayHit } from '../services/api';
import { Globe3D, Globe3DHandle } from '../components/Globe3D';
import type { AuthState } from '../hooks/useAuth';

const DAILY_COUNTRIES_FALLBACK = [
  'Brazil', 'Japan', 'Nigeria', 'Cuba', 'Ethiopia', 'Colombia', 'Jamaica',
  'Iran', 'Mali', 'South Korea', 'Portugal', 'Iceland', 'Greece', 'Algeria',
  'India', 'Senegal', 'Vietnam', 'Argentina', 'Ghana', 'Turkey', 'Lebanon',
  'Morocco', 'Peru', 'Georgia', 'Mongolia', 'Cambodia', 'Cape Verde',
  'Trinidad & Tobago', 'Armenia', 'Azerbaijan', 'Laos', 'Papua New Guinea',
];

function getFallbackCountry(): { country: string; flag: string } {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const country = DAILY_COUNTRIES_FALLBACK[day % DAILY_COUNTRIES_FALLBACK.length];
  return { country, flag: FLAGS[country] ?? '🌐' };
}

interface Props {
  navigation: any;
  auth: AuthState;
  stampsHook: { stamps: Set<string> };
  favoritesHook: { favorites: any[] };
}

export function LandingScreen({ navigation, favoritesHook }: Props) {
  const { favorites } = favoritesHook;
  const { currentTrackTitle } = useAudioPlayer();
  const miniPlayerOffset = currentTrackTitle ? 72 : 0;
  const [discoverVisible, setDiscoverVisible] = useState(false);
  const [todayEntry, setTodayEntry] = useState(getFallbackCountry());
  const todayDateRef = useRef(new Date().toISOString().slice(0, 10));

  const allCountries = useRef([...getAllCountries(), ...MUSIC_REGIONS]).current;
  const globeRef = useRef<Globe3DHandle>(null);

  useFocusEffect(useCallback(() => {
    todayDateRef.current = new Date().toISOString().slice(0, 10);
    fetchCountryOfDay()
      .then(({ country }) => setTodayEntry({ country, flag: FLAGS[country] ?? '🌐' }))
      .catch(() => {});
  }, []));

  const hasInsights = true; // passport always accessible

  const handleGlobeTap = () => {
    haptics.medium();
    navigation.navigate('Explore');
  };

  const triggerSurprise = () => {
    haptics.light();
    globeRef.current?.spinForSurprise();
  };

  const handleSpinComplete = () => {
    const country = allCountries[Math.floor(Math.random() * allCountries.length)];
    navigation.navigate('Recommendations', { country });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top-left: Country of the Day pill */}
      <View style={styles.dailyPillWrap}>
        <TouchableOpacity
          style={styles.dailyPill}
          onPress={() => { haptics.light(); recordCountryOfDayHit(todayDateRef.current).catch(() => {}); navigation.navigate('Recommendations', { country: todayEntry.country }); }}
          activeOpacity={0.75}
        >
          <Text style={styles.dailyPillFlag}>{todayEntry.flag}</Text>
          <Text style={styles.dailyPillLabel}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Top-right icon buttons */}
      <View style={styles.topRightBtns}>
        {hasInsights && (
          <TouchableOpacity
            style={styles.dnaBtn}
            onPress={() => { haptics.light(); navigation.navigate('Insights'); }}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Image source={require('../assets/passport.png')} style={styles.passportBtnImg} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => { haptics.light(); setDiscoverVisible(true); }}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="compass" size={36} color={Colors.green} />
        </TouchableOpacity>
      </View>

      {/* Globe */}
      <View style={styles.cards}>
        <View style={styles.globeWrap}>
          <Text style={styles.tapHint}>tap to explore</Text>
          <Globe3D
            ref={globeRef}
            size={280}
            onTap={handleGlobeTap}
            onSpinComplete={handleSpinComplete}
          />
          <TouchableOpacity
            style={styles.spinBtn}
            onPress={triggerSurprise}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={Colors.text3} style={{ marginTop: 20 }} />
            <Text style={styles.spinHint}>spin for a random drop</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Bottom-right: saved discoveries */}
      {favorites.length > 0 && (
        <View style={[styles.floatingBtnRight, { bottom: 32 + miniPlayerOffset }]}>
          <TouchableOpacity
            style={styles.floatingBtnRightInner}
            onPress={() => navigation.navigate('Saved')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={26} color={Colors.red} />
          </TouchableOpacity>
        </View>
      )}

      <DiscoverSheet
        visible={discoverVisible}
        onClose={() => setDiscoverVisible(false)}
        onSoundAlike={() => navigation.navigate('ArtistSearch')}
        onGenreGo={(genre, country) => {
          if (country) {
            navigation.navigate('GenreSpotlight', { genre, country });
          } else {
            navigation.navigate('GenreArtists', { genre });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  topRightBtns: {
    position: 'absolute', top: 56, right: 20,
    flexDirection: 'row', gap: 10,
    zIndex: 10,
  },
  dnaBtn: {
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 30, backgroundColor: Colors.goldBg, padding: 8,
  },
  passportBtnImg: { width: 36, height: 36, resizeMode: 'contain', tintColor: Colors.gold },
  searchBtn: {
    borderWidth: 1, borderColor: Colors.greenBorder,
    borderRadius: 30, backgroundColor: Colors.greenBg, padding: 8,
  },

  cards: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  globeWrap: {
    alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowColor: '#4ab8c1', shadowOpacity: 0.55, shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  tapHint: {
    color: Colors.text3, marginBottom: 20, fontSize: 15, fontWeight: '500',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  spinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  spinHint: {
    color: Colors.text3, fontSize: 15, fontWeight: '500',
    letterSpacing: 0.8, marginTop: 20, textTransform: 'uppercase',
  },

  dailyPillWrap: {
    position: 'absolute', top: 65, left: 20, zIndex: 10,
  },
  dailyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  dailyPillFlag: { fontSize: 20 },
  dailyPillLabel: {
    color: Colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 0.5,
  },

  floatingBtnLeft: {
    position: 'absolute', left: 24,
  },
  floatingBtnRight: {
    position: 'absolute', right: 24,
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  floatingBtnRightInner: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
  },
  serviceBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 28, paddingHorizontal: 22, paddingVertical: 14,
  },
  loginBtnText: { color: Colors.gold, fontSize: 16, fontWeight: '700' },
});
