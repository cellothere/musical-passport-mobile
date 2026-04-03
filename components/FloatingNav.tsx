import React, { useState } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { DiscoverSheet } from './DiscoverSheet';

interface Props {
  navigation: any;
  auth: AuthState;
  favorites: SavedDiscovery[];
  currentScreen?: string;
  onShare?: () => void;
}

export function FloatingNav({ navigation, favorites, currentScreen, onShare }: Props) {
  const insets = useSafeAreaInsets();
  const [discoverVisible, setDiscoverVisible] = useState(false);
  const { currentTrackTitle } = useAudioPlayer();
  const miniPlayerOffset = currentTrackTitle ? 72 : 0;

  const hasInsights = currentScreen !== 'Insights';
  const showSearch = currentScreen !== 'ArtistSearch';

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  return (
    <>
      {/* Top-right: share + insights + search */}
      <View style={[styles.topRightBtns, { top: insets.top + 5 }]}>
        {onShare && (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => { haptic(); onShare(); }}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="share-outline" size={22} color={Colors.blue} />
          </TouchableOpacity>
        )}
        {hasInsights && (
          <TouchableOpacity
            style={styles.dnaBtn}
            onPress={() => { haptic(); navigation.navigate('Insights'); }}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Image source={require('../assets/passport.png')} style={styles.passportImg} />
          </TouchableOpacity>
        )}
        {showSearch && (
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => { haptic(); setDiscoverVisible(true); }}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="compass" size={26} color={Colors.green} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom-left: home button */}
      <TouchableOpacity
        style={[styles.homeBtn, { bottom: insets.bottom + 12 + miniPlayerOffset }]}
        onPress={() => { haptic(); navigation.navigate('Home'); }}
        activeOpacity={0.7}
      >
        <Ionicons name="home-outline" size={22} color={Colors.text2} />
      </TouchableOpacity>

      {/* Bottom-right: saved discoveries */}
      {favorites.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingBtnRight, { bottom: insets.bottom + 12 + miniPlayerOffset }]}
          onPress={() => navigation.navigate('Saved')}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={22} color={Colors.red} />
        </TouchableOpacity>
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
    </>
  );
}

const styles = StyleSheet.create({
  topRightBtns: {
    position: 'absolute', right: 20,
    flexDirection: 'row', gap: 10,
    zIndex: 20,
  },
  shareBtn: {
    borderWidth: 1, borderColor: Colors.blueBorder,
    borderRadius: 20, backgroundColor: Colors.blueBg, padding: 7,
  },
  dnaBtn: {
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, backgroundColor: Colors.goldBg, padding: 7,
  },
  passportImg: { width: 26, height: 26, resizeMode: 'contain', tintColor: Colors.gold },
  searchBtn: {
    borderWidth: 1, borderColor: Colors.greenBorder,
    borderRadius: 20, backgroundColor: Colors.greenBg, padding: 7,
  },
  homeBtn: {
    position: 'absolute', left: 24, zIndex: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  floatingBtnRight: {
    position: 'absolute', right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
});
