import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { REGIONS } from '../constants/regions';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

const totalCountries = REGIONS.reduce((acc, r) => acc + r.countries.length, 0);

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
  const { stamps } = stampsHook;
  const { favorites } = favoritesHook;
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const isConnected = auth.service === 'spotify' || auth.service === 'apple-music';
  const hasInsights = auth.service === 'spotify' && auth.topArtists?.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Musical Passport</Text>
          <View style={styles.stampPill}>
            <Text style={styles.stampPillText}>{stamps.size} / {totalCountries}</Text>
          </View>
        </View>
        {auth.loading ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : auth.service ? (
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} style={styles.serviceBtn} activeOpacity={0.7}>
            {auth.service === 'spotify'
              ? <FontAwesome5 name="spotify" size={18} color="#1DB954" />
              : <FontAwesome5 name="apple" size={18} color={Colors.text} />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} style={styles.loginBtn} activeOpacity={0.7}>
            <Text style={styles.loginBtnText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Experience cards */}
      <View style={styles.cards}>

        {/* Explore Countries */}
        <TouchableOpacity
          style={styles.exploreCard}
          onPress={() => navigation.navigate('Explore')}
          activeOpacity={0.8}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="globe-outline" size={28} color={Colors.gold} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Explore Countries</Text>
            <Text style={styles.cardDesc}>Discover music from every corner of the world</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gold} style={{ opacity: 0.6 }} />
        </TouchableOpacity>

        {/* Time Machine */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => isConnected ? navigation.navigate('TimeMachine') : setServiceModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIconWrap, styles.cardIconBlue]}>
            <Ionicons name="time-outline" size={28} color={Colors.blue} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Time Machine</Text>
            <Text style={styles.cardDesc}>
              {isConnected ? 'Travel through iconic sounds from any era' : 'Connect a music service to unlock'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text3} style={{ opacity: 0.6 }} />
        </TouchableOpacity>

        {/* Sound-Alike Search */}
        <TouchableOpacity
          style={[styles.card, styles.cardGreen]}
          onPress={() => isConnected ? navigation.navigate('ArtistSearch') : setServiceModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.cardIconWrap, styles.cardIconGreen]}>
            <Ionicons name="search" size={28} color={Colors.green} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Sound-Alike Search</Text>
            <Text style={styles.cardDesc}>
              {isConnected ? 'Type an artist you love, find their global equivalents' : 'Connect a music service to unlock'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text3} style={{ opacity: 0.6 }} />
        </TouchableOpacity>

        {/* Musical DNA */}
        <TouchableOpacity
          style={[styles.card, isConnected && !hasInsights && styles.cardDisabled]}
          onPress={() => {
            if (!isConnected) { setServiceModalVisible(true); }
            else if (hasInsights) { navigation.navigate('Insights'); }
          }}
          activeOpacity={hasInsights || !isConnected ? 0.8 : 1}
        >
          <View style={[styles.cardIconWrap, styles.cardIconPurple]}>
            <Ionicons name="analytics-outline" size={28} color={Colors.purple} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Your Musical DNA</Text>
            <Text style={styles.cardDesc}>
              {hasInsights
                ? 'Understand the roots of your musical taste'
                : isConnected
                  ? 'Connect Spotify to unlock'
                  : 'Connect a music service to unlock'}
            </Text>
          </View>
          {(hasInsights || !isConnected) && <Ionicons name="chevron-forward" size={20} color={Colors.text3} style={{ opacity: 0.6 }} />}
        </TouchableOpacity>

        {/* Saved — secondary row, only if service connected and user has saves */}
        {isConnected && favorites.length > 0 && (
          <TouchableOpacity
            style={styles.savedRow}
            onPress={() => navigation.navigate('Saved')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={18} color={Colors.red} />
            <Text style={styles.savedRowText}>Saved Discoveries</Text>
            <Text style={styles.savedRowCount}>{favorites.length}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text3} style={{ opacity: 0.5 }} />
          </TouchableOpacity>
        )}
      </View>

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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  stampPill: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stampPillText: { color: Colors.gold, fontSize: 12, fontWeight: '600' },
  serviceBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  loginBtnText: { color: Colors.gold, fontSize: 13, fontWeight: '700' },

  cards: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 32,
  },

  // Primary hero card (Explore)
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldBg,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },

  // Standard card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  cardDisabled: { opacity: 0.45 },

  cardIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.goldBg,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconBlue: { backgroundColor: Colors.blueBg },
  cardIconGreen: { backgroundColor: Colors.greenBg },
  cardIconPurple: { backgroundColor: Colors.purpleBg },
  cardGreen: { borderWidth: 0 },

  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  cardDesc: { color: Colors.text2, fontSize: 13, lineHeight: 18 },

  // Saved secondary row
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 14,
    gap: 10,
    marginTop: 4,
  },
  savedRowText: { flex: 1, color: Colors.text2, fontSize: 14, fontWeight: '500' },
  savedRowCount: {
    color: Colors.text3,
    fontSize: 13,
    backgroundColor: Colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
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
