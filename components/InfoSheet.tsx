import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Switch,
  Linking, Animated,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { haptics } from '../utils/haptics';
import { useSettings } from '../hooks/useSettings';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRIVACY_URL = 'https://cellothere.github.io/index.html';
const SUPPORT_URL = 'https://musical-passport-production.up.railway.app/support.html';
const SUPPORT_EMAIL = 'musicalpassportapp@gmail.com';

export function InfoSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { hapticsEnabled, reduceMotion, setHapticsEnabled, setReduceMotion } = useSettings();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY = useSharedValue(60);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { damping: 22, stiffness: 200 });
      dragY.value = 0;
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
      slideY.value = 60;
    }
  }, [visible]);

  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-5)
    .onUpdate(e => { if (e.translationY > 0) dragY.value = e.translationY; })
    .onEnd(e => {
      if (e.translationY > 100 || e.velocityY > 600) {
        dragY.value = withTiming(900, { duration: 220 }, () => runOnJS(onClose)());
      } else {
        dragY.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    }), [onClose]);

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value + dragY.value }],
  }));

  const open = (url: string) => {
    haptics.light();
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <GestureDetector gesture={panGesture}>
          <Reanimated.View style={[styles.sheet, { paddingBottom: insets.bottom + 24, maxHeight: '88%' }, sheetAnimStyle]}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>About Musical Passport</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={Colors.text3} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Accessibility */}
              <Text style={styles.sectionLabel}>Accessibility</Text>
              <View style={styles.card}>
                <Row
                  label="Haptic feedback"
                  hint="Tactile vibrations when tapping buttons."
                  value={hapticsEnabled}
                  onChange={setHapticsEnabled}
                />
                <Divider />
                <Row
                  label="Reduce motion"
                  hint="Skip the spin-the-globe animation."
                  value={reduceMotion}
                  onChange={setReduceMotion}
                />
              </View>

              {/* About */}
              <Text style={styles.sectionLabel}>About</Text>
              <View style={styles.card}>
                <Text style={styles.bodyText}>
                  Musical Passport is a music-discovery app that helps you explore artists,
                  genres, and songs from around the world. All audio you hear in the app is a
                  30-second preview clip provided by Spotify, Apple Music, or Deezer through
                  their official developer APIs.
                </Text>
              </View>

              {/* Legal */}
              <Text style={styles.sectionLabel}>Legal</Text>
              <View style={styles.card}>
                <LinkRow icon="document-text-outline" label="Privacy Policy" onPress={() => open(PRIVACY_URL)} />
                <Divider />
                <LinkRow icon="reader-outline" label="Support" onPress={() => open(SUPPORT_URL)} />
                <Divider />
                <LinkRow icon="mail-outline" label="Contact support" onPress={() => open(`mailto:${SUPPORT_EMAIL}`)} />
              </View>

              {/* Data sources */}
              <Text style={styles.sectionLabel}>Data sources & attribution</Text>
              <View style={styles.card}>
                <Text style={styles.bodyText}>
                  Track previews are provided by{' '}
                  <Text style={styles.brand}>Apple Music</Text>,{' '}
                  <Text style={styles.brand}>Spotify</Text>, and{' '}
                  <Text style={styles.brand}>Deezer</Text> through their public developer APIs.
                </Text>
                <Text style={[styles.bodyText, { marginTop: 8 }]}>
                  Artist images are sourced from Apple Music, Last.fm, and Deezer.
                  Artist metadata and country information come from MusicBrainz (CC0),
                  ListenBrainz, Discogs, and Last.fm.
                </Text>
                <Text style={[styles.bodyText, { marginTop: 8 }]}>
                  Musical Passport is not affiliated with, endorsed by, or sponsored by any
                  of these services. All trademarks belong to their respective owners.
                </Text>
              </View>

              {/* Version */}
              <Text style={styles.versionLabel}>Musical Passport · Version 1.0.0</Text>
            </ScrollView>
          </Reanimated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

function Row({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={v => { haptics.light(); onChange(v); }}
        trackColor={{ false: Colors.border2, true: Colors.goldBorder }}
        thumbColor={value ? Colors.gold : '#bbb'}
        ios_backgroundColor={Colors.border2}
      />
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.65}>
      <Ionicons name={icon} size={18} color={Colors.text2} style={{ marginRight: 12 }} />
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: Colors.border2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 6,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionLabel: {
    color: Colors.text3,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  rowHint: {
    color: Colors.text3,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: -14,
  },
  bodyText: {
    color: Colors.text2,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 10,
  },
  brand: {
    color: Colors.text,
    fontWeight: '600',
  },
  versionLabel: {
    color: Colors.text3,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 4,
  },
});
