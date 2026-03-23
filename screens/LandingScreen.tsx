import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

interface Props {
  navigation: any;
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
  stampsHook: { stamps: Set<string> };
  favoritesHook: { favorites: SavedDiscovery[] };
}

function ServiceModal({ visible, onClose, auth }: {
  visible: boolean;
  onClose: () => void;
  auth: Props['auth'];
}) {
  const insets = useSafeAreaInsets();
  const handleOption = (action: () => void) => { onClose(); action(); };

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

export function LandingScreen({ navigation, auth, stampsHook, favoritesHook }: Props) {
  const { favorites } = favoritesHook;
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const isConnected = auth.service === 'spotify' || auth.service === 'apple-music';
  const hasInsights = auth.service === 'spotify' && auth.topArtists?.length > 0;
  const handleGlobeTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate('Explore');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top-right icon buttons */}
      <View style={styles.topRightBtns}>
        {hasInsights && (
          <TouchableOpacity
            style={styles.dnaBtn}
            onPress={() => navigation.navigate('Insights')}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="analytics-outline" size={36} color={Colors.purple} />
          </TouchableOpacity>
        )}
        {isConnected && (
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => navigation.navigate('ArtistSearch')}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="search" size={36} color={Colors.green} />
          </TouchableOpacity>
        )}
      </View>

      {/* Globe */}
      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.globeWrap}
          onPress={handleGlobeTap}
          activeOpacity={0.85}
        >
          <Image
            source={require('../assets/Rotating_earth_animated_transparent.gif')}
            style={styles.globeImage}
            resizeMode="contain"
          />
          <Text style={styles.tapHint}>tap to explore</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom-left: service button */}
      <View style={styles.floatingBtnLeft}>
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
          style={styles.floatingBtnRight}
          onPress={() => navigation.navigate('Saved')}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={22} color={Colors.red} />
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
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  globeImage: {
    width: 280,
    height: 280,
  },
  tapHint: {
    color: Colors.text3,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  floatingBtnLeft: {
    position: 'absolute', bottom: 32, left: 24,
  },
  floatingBtnRight: {
    position: 'absolute', bottom: 32, right: 24,
    width: 52, height: 52, borderRadius: 26,
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
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  loginBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
});

const svcStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12,
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
