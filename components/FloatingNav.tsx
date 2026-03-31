import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { DiscoverSheet } from './DiscoverSheet';

type FullAuth = AuthState & {
  loginSpotify: () => void;
  loginAppleMusic: () => void;
  logout: () => void;
};

interface Props {
  navigation: any;
  auth: FullAuth;
  favorites: SavedDiscovery[];
  currentScreen?: string;
  onShare?: () => void;
}

function ServiceModal({ visible, onClose, auth, onServiceChange }: {
  visible: boolean;
  onClose: () => void;
  auth: FullAuth;
  onServiceChange: () => void;
}) {
  const insets = useSafeAreaInsets();

  const handleOption = (action: () => void) => {
    const wasConnected = !!auth.service;
    onClose();
    action();
    if (wasConnected) {
      // Switching service or logging out — return to root
      setTimeout(onServiceChange, 150);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={svcStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[svcStyles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={svcStyles.handle} />
          <Text style={svcStyles.title}>Music Service</Text>
          {!auth.service ? (
            <>
              <TouchableOpacity style={svcStyles.row} onPress={() => handleOption(auth.loginSpotify)} activeOpacity={0.7}>
                <View style={svcStyles.rowIconWrap}><FontAwesome5 name="spotify" size={20} color="#1DB954" /></View>
                <Text style={svcStyles.rowLabel}>Connect Spotify</Text>
                <Text style={svcStyles.rowArrow}>›</Text>
              </TouchableOpacity>
              <View style={svcStyles.sep} />
              <TouchableOpacity style={svcStyles.row} onPress={() => handleOption(auth.loginAppleMusic)} activeOpacity={0.7}>
                <View style={svcStyles.rowIconWrap}><FontAwesome5 name="apple" size={20} color={Colors.text} /></View>
                <Text style={svcStyles.rowLabel}>Connect Apple Music</Text>
                <Text style={svcStyles.rowArrow}>›</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {auth.service === 'spotify' ? (
                <TouchableOpacity style={svcStyles.row} onPress={() => handleOption(auth.loginAppleMusic)} activeOpacity={0.7}>
                  <View style={svcStyles.rowIconWrap}><FontAwesome5 name="apple" size={20} color={Colors.text} /></View>
                  <Text style={svcStyles.rowLabel}>Switch to Apple Music</Text>
                  <Text style={svcStyles.rowArrow}>›</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={svcStyles.row} onPress={() => handleOption(auth.loginSpotify)} activeOpacity={0.7}>
                  <View style={svcStyles.rowIconWrap}><FontAwesome5 name="spotify" size={20} color="#1DB954" /></View>
                  <Text style={svcStyles.rowLabel}>Switch to Spotify</Text>
                  <Text style={svcStyles.rowArrow}>›</Text>
                </TouchableOpacity>
              )}
              <View style={svcStyles.sep} />
              <TouchableOpacity style={svcStyles.row} onPress={() => handleOption(auth.logout)} activeOpacity={0.7}>
                <View style={svcStyles.rowIconWrap}><Ionicons name="log-out-outline" size={20} color="#e05c5c" /></View>
                <Text style={[svcStyles.rowLabel, { color: '#e05c5c' }]}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function FloatingNav({ navigation, auth, favorites, currentScreen, onShare }: Props) {
  const insets = useSafeAreaInsets();
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [discoverVisible, setDiscoverVisible] = useState(false);
  const { currentTrackTitle } = useAudioPlayer();
  const miniPlayerOffset = currentTrackTitle ? 72 : 0;

  const isConnected = auth.service === 'spotify' || auth.service === 'apple-music';
  const hasInsights = auth.service === 'spotify' && auth.topArtists?.length > 0 && currentScreen !== 'Insights';
  const showSearch = isConnected && currentScreen !== 'ArtistSearch';

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
            <Ionicons name="analytics-outline" size={26} color={Colors.purple} />
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

      {/* Bottom-left: service button */}
      <View style={[styles.floatingBtnLeft, { bottom: insets.bottom + 12 + miniPlayerOffset }]}>
        {auth.loading ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : auth.service ? (
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} style={styles.serviceBtn} activeOpacity={0.7}>
            {auth.service === 'spotify'
              ? <FontAwesome5 name="spotify" size={22} color="#1DB954" />
              : <FontAwesome5 name="apple" size={22} color={Colors.text} />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} style={styles.loginBtn} activeOpacity={0.7}>
            <Text style={styles.loginBtnText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom-right: saved discoveries */}
      {isConnected && favorites.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingBtnRight, { bottom: insets.bottom + 12 + miniPlayerOffset }]}
          onPress={() => navigation.navigate('Saved')}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={22} color={Colors.red} />
          {/* <View style={styles.heartBadge}>
            <Text style={styles.heartBadgeText}>{favorites.length}</Text>
          </View> */}
        </TouchableOpacity>
      )}

      <ServiceModal
        visible={serviceModalVisible}
        onClose={() => setServiceModalVisible(false)}
        auth={auth}
        onServiceChange={() => navigation.navigate('Home')}
      />
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
    borderWidth: 1, borderColor: Colors.purpleBorder,
    borderRadius: 20, backgroundColor: Colors.purpleBg, padding: 7,
  },
  searchBtn: {
    borderWidth: 1, borderColor: Colors.greenBorder,
    borderRadius: 20, backgroundColor: Colors.greenBg, padding: 7,
  },
  floatingBtnLeft: {
    position: 'absolute', left: 24, zIndex: 20,
  },
  floatingBtnRight: {
    position: 'absolute', right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  heartBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.red,
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  heartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  serviceBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10,
  },
  loginBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
});

const svcStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border2, alignSelf: 'center', marginBottom: 16,
  },
  title: {
    color: Colors.text3, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: 20, marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  rowIconWrap: { width: 28, alignItems: 'center' },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowArrow: { color: Colors.text3, fontSize: 20 },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
});
