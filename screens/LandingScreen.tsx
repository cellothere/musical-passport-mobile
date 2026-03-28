import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, PanResponder, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FLAGS } from '../constants/flags';
import { getAllCountries, MUSIC_REGIONS } from '../constants/regions';
import { haptics } from '../utils/haptics';
import { ServiceModal } from '../components/ServiceModal';
import { fetchCountryOfDay, recordCountryOfDayHit } from '../services/api';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

// Fallback for when API is unavailable
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
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
  stampsHook: { stamps: Set<string> };
  favoritesHook: { favorites: SavedDiscovery[] };
}


export function LandingScreen({ navigation, auth, favoritesHook }: Props) {
  const { favorites } = favoritesHook;
  const { currentTrackTitle } = useAudioPlayer();
  const miniPlayerOffset = currentTrackTitle ? 72 : 0;
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [todayEntry, setTodayEntry] = useState(getFallbackCountry());
  const todayDate = useRef(new Date().toISOString().slice(0, 10)).current;

  useEffect(() => {
    fetchCountryOfDay()
      .then(({ country }) => {
        setTodayEntry({ country, flag: FLAGS[country] ?? '🌐' });
      })
      .catch(() => {}); // keep fallback on error
  }, []);

  const prevService = useRef(auth.service);
  useEffect(() => {
    if (!prevService.current && auth.service) {
      haptics.success();
    }
    prevService.current = auth.service;
  }, [auth.service]);
  const hasInsights = !!auth.service;
  const handleGlobeTap = () => {
    haptics.medium();
    navigation.navigate('Explore');
  };


  const handleSurprise = () => {
    haptics.launch();
    const country = allCountries[Math.floor(Math.random() * allCountries.length)];
    navigation.navigate('Recommendations', { country });
  };

  const allCountries = useRef([...getAllCountries(), ...MUSIC_REGIONS]).current;
  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -40) {
          handleSurprise();
        } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
          handleGlobeTap();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top-left: Country of the Day pill */}
      <TouchableOpacity
        style={styles.dailyPill}
        onPress={() => { haptics.light(); recordCountryOfDayHit(todayDate).catch(() => {}); navigation.navigate('Recommendations', { country: todayEntry.country }); }}
        activeOpacity={0.75}
      >
        <Text style={styles.dailyPillFlag}>{todayEntry.flag}</Text>
        <Text style={styles.dailyPillLabel}>Today</Text>
      </TouchableOpacity>

      {/* Top-right icon buttons */}
      <View style={styles.topRightBtns}>
        {hasInsights && (
          <TouchableOpacity
            style={styles.dnaBtn}
            onPress={() => { haptics.light(); navigation.navigate('Insights'); }}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="analytics-outline" size={36} color={Colors.purple} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => { haptics.light(); navigation.navigate('ArtistSearch'); }}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="search" size={36} color={Colors.green} />
        </TouchableOpacity>
      </View>

      {/* Globe */}
      <View style={styles.cards} {...swipePanResponder.panHandlers}>
        <View style={styles.globeWrap}>
          <Text style={styles.tapHint}>tap to explore</Text>
          <Image
            source={require('../assets/Rotating_earth_animated_transparent.gif')}
            style={styles.globeImage}
            resizeMode="contain"
          />
          <Text style={styles.swipeHint}>or swipe up</Text>
        </View>
      </View>

      {/* Bottom-left: service button */}
      <View style={[styles.floatingBtnLeft, { bottom: 32 + miniPlayerOffset }]}>
        {auth.loading ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : auth.service ? (
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} style={styles.serviceBtn} activeOpacity={0.7}>
            {auth.service === 'spotify'
              ? <FontAwesome5 name="spotify" size={26} color="#1DB954" />
              : <FontAwesome5 name="apple" size={26} color={Colors.text} />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} style={styles.loginBtn} activeOpacity={0.7}>
            <Text style={styles.loginBtnText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom-right: saved discoveries */}
      {favorites.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingBtnRight, { bottom: 32 + miniPlayerOffset }]}
          onPress={() => navigation.navigate('Saved')}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={26} color={Colors.red} />
          {/* <View style={styles.heartBadge}>
            <Text style={styles.heartBadgeText}>{favorites.length}</Text>
          </View> */}
        </TouchableOpacity>
      )}

      <ServiceModal
        visible={serviceModalVisible}
        onClose={() => setServiceModalVisible(false)}
        auth={auth}
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
    borderWidth: 1, borderColor: Colors.purpleBorder,
    borderRadius: 30,
    backgroundColor: Colors.purpleBg,
    padding: 8,
  },
  searchBtn: {
    borderWidth: 1, borderColor: Colors.greenBorder,
    borderRadius: 30,
    backgroundColor: Colors.greenBg,
    padding: 8,
  },

  cards: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#4ab8c1',
    shadowOpacity: 0.55,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  globeImage: {
    width: 280,
    height: 280,
  },
  tapHint: {
    color: Colors.text3,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  swipeHint: {
    color: Colors.text3,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  dailyPill: {
    position: 'absolute', top: 65, left: 20,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    zIndex: 10,
  },
  dailyPillFlag: { fontSize: 20 },
  dailyPillLabel: {
    color: Colors.gold, fontSize: 12, fontWeight: '700',
    letterSpacing: 0.5,
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
  serviceBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 28,
    paddingHorizontal: 22, paddingVertical: 14,
  },
  loginBtnText: { color: Colors.gold, fontSize: 16, fontWeight: '700' },
});

