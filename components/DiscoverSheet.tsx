import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { GenrePanel } from './GenrePanel';
import { haptics } from '../utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSoundAlike: () => void;
  onGenreGo: (genre: string, country?: string) => void;
}

export function DiscoverSheet({ visible, onClose, onSoundAlike, onGenreGo }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [genrePanelVisible, setGenrePanelVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const handleSoundAlike = () => {
    haptics.light();
    onClose();
    setTimeout(onSoundAlike, 240);
  };

  const handleGenres = () => {
    haptics.light();
    onClose();
    setTimeout(() => setGenrePanelVisible(true), 260);
  };

  return (
    <>
      {mounted && (
        <Modal visible transparent animationType="none" onRequestClose={onClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]}
          >
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + 16 },
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Discover Music</Text>

            {/* Sound Alike card */}
            <TouchableOpacity style={styles.card} onPress={handleSoundAlike} activeOpacity={0.82}>
              <View style={[styles.cardIcon, styles.cardIconGreen]}>
                <Ionicons name="ear" size={28} color={Colors.green} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Sound Alike</Text>
                <Text style={styles.cardDesc}>
                  Find artists from around the world who share the sound of your favorites
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
            </TouchableOpacity>

            {/* Genre Explorer card */}
            <TouchableOpacity style={styles.card} onPress={handleGenres} activeOpacity={0.82}>
              <View style={[styles.cardIcon, styles.cardIconPurple]}>
                <Ionicons name="musical-notes" size={28} color={Colors.purple} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Genre Explorer</Text>
                <Text style={styles.cardDesc}>
                  Deep dive into any genre — filter by country or go global
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}

      <GenrePanel
        visible={genrePanelVisible}
        onClose={() => setGenrePanelVisible(false)}
        onGo={(genre: string) => {
          setGenrePanelVisible(false);
          onGenreGo(genre);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconGreen: {
    backgroundColor: Colors.greenBg,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  cardIconPurple: {
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: Colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
});
