import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Animated, Easing,
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
import { fetchCountryOfDay, recordCountryOfDayHit, fetchRecommendations, RecommendationResponse } from '../services/api';
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

  // Spin-reveal state
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCountry, setSpinCountry] = useState('');
  const spinCountryRef = useRef('');
  const spinDataRef = useRef<RecommendationResponse | null>(null);
  const spinFetchDoneRef = useRef(false);
  const spinMinDoneRef = useRef(false);
  const spinNavFiredRef = useRef(false);
  const spinMinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated values
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const globeScaleAnim = useRef(new Animated.Value(1)).current;
  const countryOpacityAnim = useRef(new Animated.Value(0)).current;
  const countryTranslateAnim = useRef(new Animated.Value(12)).current;

  // tryNavigate ref keeps it up to date without stale closure issues
  const tryNavigateRef = useRef<() => void>(() => {});
  useEffect(() => {
    tryNavigateRef.current = () => {
      if (spinMinDoneRef.current && spinFetchDoneRef.current && !spinNavFiredRef.current) {
        spinNavFiredRef.current = true;
        navigation.navigate('Recommendations', {
          country: spinCountryRef.current,
          ...(spinDataRef.current ? { savedData: spinDataRef.current } : {}),
        });
      }
    };
  });

  useFocusEffect(useCallback(() => {
    todayDateRef.current = new Date().toISOString().slice(0, 10);
    fetchCountryOfDay()
      .then(({ country }) => setTodayEntry({ country, flag: FLAGS[country] ?? '🌐' }))
      .catch(() => {});

    // Reset spin animations when returning to screen
    setIsSpinning(false);
    uiFadeAnim.setValue(1);
    globeScaleAnim.setValue(1);
    countryOpacityAnim.setValue(0);
    countryTranslateAnim.setValue(12);
    if (spinMinTimerRef.current) clearTimeout(spinMinTimerRef.current);
  }, []));

  const hasInsights = true; // passport always accessible

  const handleGlobeTap = () => {
    haptics.medium();
    navigation.navigate('Explore');
  };

  const triggerSurprise = () => {
    if (isSpinning) return;
    haptics.light();
    setIsSpinning(true);
    globeRef.current?.spinForSurprise();
  };

  const handleSpinComplete = () => {
    const country = allCountries[Math.floor(Math.random() * allCountries.length)];
    spinCountryRef.current = country;
    spinDataRef.current = null;
    spinFetchDoneRef.current = false;
    spinMinDoneRef.current = false;
    spinNavFiredRef.current = false;
    setSpinCountry(country);

    // Fade UI out + scale globe up
    Animated.parallel([
      Animated.timing(uiFadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(globeScaleAnim, { toValue: 1.14, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Country name slides in after slight pause
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(countryOpacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(countryTranslateAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 250);

    // Minimum display time
    spinMinTimerRef.current = setTimeout(() => {
      spinMinDoneRef.current = true;
      tryNavigateRef.current();
    }, 2000);

    fetchRecommendations(country)
      .then(data => { spinDataRef.current = data; })
      .catch(() => {})
      .finally(() => {
        spinFetchDoneRef.current = true;
        tryNavigateRef.current();
      });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top-left: Country of the Day pill */}
      <Animated.View style={[styles.dailyPillWrap, { opacity: uiFadeAnim }]}>
        <TouchableOpacity
          style={styles.dailyPill}
          onPress={() => { if (isSpinning) return; haptics.light(); recordCountryOfDayHit(todayDateRef.current).catch(() => {}); navigation.navigate('Recommendations', { country: todayEntry.country }); }}
          activeOpacity={0.75}
        >
          <Text style={styles.dailyPillFlag}>{todayEntry.flag}</Text>
          <Text style={styles.dailyPillLabel}>Today</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Top-right icon buttons */}
      <Animated.View style={[styles.topRightBtns, { opacity: uiFadeAnim }]}>
        {hasInsights && (
          <TouchableOpacity
            style={styles.dnaBtn}
            onPress={() => { if (isSpinning) return; haptics.light(); navigation.navigate('Insights'); }}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Image source={require('../assets/passport.png')} style={styles.passportBtnImg} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => { if (isSpinning) return; haptics.light(); setDiscoverVisible(true); }}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="compass" size={36} color={Colors.green} />
        </TouchableOpacity>
      </Animated.View>

      {/* Globe */}
      <View style={styles.cards}>
        <View style={styles.globeWrap}>
          <Animated.Text style={[styles.tapHint, { opacity: uiFadeAnim }]}>tap to explore</Animated.Text>
          <Animated.View style={{ transform: [{ scale: globeScaleAnim }] }}>
            <Globe3D
              ref={globeRef}
              size={280}
              onTap={handleGlobeTap}
              onSpinComplete={handleSpinComplete}
            />
          </Animated.View>
          <Animated.View style={{ opacity: uiFadeAnim }}>
            <TouchableOpacity
              style={styles.spinBtn}
              onPress={triggerSurprise}
              activeOpacity={0.7}
              disabled={isSpinning}
            >
              <Ionicons name="refresh" size={20} color={Colors.text3} style={{ marginTop: 20 }} />
              <Text style={styles.spinHint}>spin for a random drop</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.Text style={[styles.spinCountryLabel, {
            opacity: countryOpacityAnim,
            transform: [{ translateY: countryTranslateAnim }],
          }]}>
            {FLAGS[spinCountry] ? `${FLAGS[spinCountry]}  ` : ''}{spinCountry}
          </Animated.Text>
        </View>
      </View>

      {/* Bottom-left: home button */}
      <Animated.View style={[styles.homeBtn, { bottom: 32 + miniPlayerOffset, opacity: uiFadeAnim }]}>
        <TouchableOpacity
          style={styles.homeBtnInner}
          onPress={() => { if (isSpinning) return; haptics.light(); navigation.navigate('Home'); }}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={22} color={Colors.text2} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom-right: saved discoveries */}
      {favorites.length > 0 && (
        <Animated.View style={[styles.floatingBtnRight, { bottom: 32 + miniPlayerOffset, opacity: uiFadeAnim }]}>
          <TouchableOpacity
            style={styles.floatingBtnRightInner}
            onPress={() => { if (isSpinning) return; navigation.navigate('Saved'); }}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={26} color={Colors.red} />
          </TouchableOpacity>
        </Animated.View>
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
  homeBtn: {
    position: 'absolute', left: 24, zIndex: 20,
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    overflow: 'hidden',
  },
  homeBtnInner: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
  },
  spinCountryLabel: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: 28,
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
