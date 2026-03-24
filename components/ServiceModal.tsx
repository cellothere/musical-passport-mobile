import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { AuthState } from '../hooks/useAuth';

type Auth = AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };

interface Props {
  visible: boolean;
  onClose: () => void;
  auth: Auth;
}

export function ServiceModal({ visible, onClose, auth }: Props) {
  const insets = useSafeAreaInsets();
  const handleOption = (action: () => void) => { onClose(); action(); };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Music Service</Text>
          {!auth.service ? (
            <>
              <TouchableOpacity style={styles.row} onPress={() => handleOption(auth.loginSpotify)} activeOpacity={0.7}>
                <View style={styles.rowIconWrap}><FontAwesome5 name="spotify" size={20} color="#1DB954" /></View>
                <Text style={styles.rowLabel}>Connect Spotify</Text>
                <Text style={styles.rowArrow}>›</Text>
              </TouchableOpacity>
              <View style={styles.sep} />
              <TouchableOpacity style={styles.row} onPress={() => handleOption(auth.loginAppleMusic)} activeOpacity={0.7}>
                <View style={styles.rowIconWrap}><FontAwesome5 name="apple" size={20} color={Colors.text} /></View>
                <Text style={styles.rowLabel}>Connect Apple Music</Text>
                <Text style={styles.rowArrow}>›</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {auth.service === 'spotify' ? (
                <TouchableOpacity style={styles.row} onPress={() => handleOption(auth.loginAppleMusic)} activeOpacity={0.7}>
                  <View style={styles.rowIconWrap}><FontAwesome5 name="apple" size={20} color={Colors.text} /></View>
                  <Text style={styles.rowLabel}>Switch to Apple Music</Text>
                  <Text style={styles.rowArrow}>›</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.row} onPress={() => handleOption(auth.loginSpotify)} activeOpacity={0.7}>
                  <View style={styles.rowIconWrap}><FontAwesome5 name="spotify" size={20} color="#1DB954" /></View>
                  <Text style={styles.rowLabel}>Switch to Spotify</Text>
                  <Text style={styles.rowArrow}>›</Text>
                </TouchableOpacity>
              )}
              <View style={styles.sep} />
              <TouchableOpacity style={styles.row} onPress={() => handleOption(auth.logout)} activeOpacity={0.7}>
                <View style={styles.rowIconWrap}><Ionicons name="log-out-outline" size={20} color="#e05c5c" /></View>
                <Text style={[styles.rowLabel, { color: '#e05c5c' }]}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
