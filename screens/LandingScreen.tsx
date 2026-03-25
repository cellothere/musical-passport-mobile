import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, PanResponder, Animated, Share,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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


export function LandingScreen({ navigation, auth, stampsHook, favoritesHook }: Props) {
  const { favorites } = favoritesHook;
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const isConnected = auth.service === 'spotify' || auth.service === 'apple-music';
  const [todayEntry, setTodayEntry] = useState(getFallbackCountry());
  const todayDate = useRef(new Date().toISOString().slice(0, 10)).current;

  useEffect(() => {
    fetchCountryOfDay()
      .then(({ country, date }) => {
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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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
          <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: 8 }}>
            <TouchableOpacity style={styles.surpriseBtn} onPress={handleSurprise} activeOpacity={0.8}>
              <Ionicons name="shuffle" size={16} color={Colors.bg} />
              <Text style={styles.surpriseBtnText}>Surprise Me</Text>
              <Ionicons name="arrow-up" size={15} color={Colors.bg} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Country of the Day */}
      <TouchableOpacity
        style={styles.dailyCard}
        onPress={() => { haptics.light(); recordCountryOfDayHit(todayDate).catch(() => {}); navigation.navigate('Recommendations', { country: todayEntry.country }); }}
        activeOpacity={0.8}
      >
        <View style={styles.dailyCardLeft}>
          <Text style={styles.dailyLabel}>Country of the Day</Text>
          <Text style={styles.dailyCountry}>{todayEntry.flag}  {todayEntry.country}</Text>
        </View>
        <TouchableOpacity
          onPress={() => Share.share({
            message: `${todayEntry.flag} Today's Musical Passport destination is ${todayEntry.country}!\n\nExplore it 👉 musical-passport://country/${encodeURIComponent(todayEntry.country)}`,
          })}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="share-outline" size={20} color={Colors.text3} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={18} color={Colors.gold} style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      {/* Bottom-left: service button */}
      <View style={styles.floatingBtnLeft}>
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
          style={styles.floatingBtnRight}
          onPress={() => navigation.navigate('Saved')}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={26} color={Colors.red} />
          <View style={styles.heartBadge}>
            <Text style={styles.heartBadgeText}>{favorites.length}</Text>
          </View>
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
  surpriseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.gold,
    borderRadius: 24, paddingHorizontal: 22, paddingVertical: 12,
    shadowColor: Colors.gold, shadowOpacity: 0.2,
    shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  surpriseBtnText: { color: Colors.bg, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  dailyCard: {
    position: 'absolute',
    bottom: 108,
    left: 20, right: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  dailyCardLeft: { flex: 1 },
  dailyLabel: {
    color: Colors.gold, fontSize: 10, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  dailyCountry: {
    color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3,
  },

  floatingBtnLeft: {
    position: 'absolute', bottom: 32, left: 24,
  },
  floatingBtnRight: {
    position: 'absolute', bottom: 32, right: 24,
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  heartBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.red,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  heartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
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

