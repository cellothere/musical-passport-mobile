import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
  TextInput, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { GENRES } from '../constants/genres';
import { haptics } from '../utils/haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(SCREEN_W * 0.82, 340);

interface Props {
  visible: boolean;
  onClose: () => void;
  onGo: (genre: string) => void;
}

export function GenrePanel({ visible, onClose, onGo }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(PANEL_W)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(PANEL_W);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: PANEL_W, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        setMounted(false);
        setQuery('');
        setSelectedGenre(null);
      });
    }
  }, [visible]);

  const filteredGenres = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GENRES;
    return GENRES.filter(g => g.toLowerCase().includes(q));
  }, [query]);

  const handleGenreSelect = (genre: string) => {
    haptics.light();
    setSelectedGenre(prev => prev === genre ? null : genre);
  };

  const handleGo = () => {
    if (!selectedGenre) return;
    haptics.medium();
    onGo(selectedGenre);
    onClose();
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: backdropAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Genre Explorer</Text>
            <Text style={styles.subtitle}>Pick a genre to discover artists</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color={Colors.text2} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={15} color={Colors.text3} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search genres…"
            placeholderTextColor={Colors.text3}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Genre list */}
        <ScrollView
          style={styles.genreScroll}
          contentContainerStyle={styles.genreList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredGenres.map(genre => {
            const isSelected = selectedGenre === genre;
            return (
              <TouchableOpacity
                key={genre}
                style={[styles.genrePill, isSelected && styles.genrePillSelected]}
                onPress={() => handleGenreSelect(genre)}
                activeOpacity={0.7}
              >
                <Text style={[styles.genrePillText, isSelected && styles.genrePillTextSelected]}>{genre}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Go button */}
        <TouchableOpacity
          style={[styles.goBtn, !selectedGenre && styles.goBtnDisabled]}
          onPress={handleGo}
          activeOpacity={0.8}
          disabled={!selectedGenre}
        >
          <Text style={styles.goBtnText}>
            {selectedGenre ? `Explore ${selectedGenre} Worldwide` : 'Select a genre'}
          </Text>
          {selectedGenre && <Ionicons name="arrow-forward" size={16} color={Colors.bg} style={{ marginLeft: 6 }} />}
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_W,
    backgroundColor: Colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: Colors.text3,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    padding: 0,
  },
  genreScroll: {
    flex: 1,
    marginHorizontal: 12,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
    paddingRight: 4,
  },
  genrePill: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  genrePillSelected: {
    backgroundColor: Colors.purpleBg,
    borderColor: Colors.purpleBorder,
  },
  genrePillText: {
    color: Colors.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  genrePillTextSelected: {
    color: Colors.purple,
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  goBtnDisabled: {
    backgroundColor: Colors.surface2,
  },
  goBtnText: {
    color: Colors.bg,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});
