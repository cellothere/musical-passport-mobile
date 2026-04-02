import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput, FlatList, Platform, KeyboardAvoidingView, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { REGIONS, MUSIC_REGIONS, DECADES, getAllCountries } from '../constants/regions';
import { FLAGS } from '../constants/flags';
import { fetchStreamingFloors } from '../services/api';
import * as Haptics from 'expo-haptics';
import { FloatingNav } from '../components/FloatingNav';
import type { AuthState } from '../hooks/useAuth';
import type { SavedDiscovery } from '../hooks/useFavorites';

const FLAG_IMAGES: Record<string, any> = {
  'Republic of South Vietnam': require('../assets/SouthVietnam.png'),
  'Quebec': require('../assets/QuebecFlag.png'),
  'East Germany': require('../assets/EastGermany.png'),
  'Zaire': require('../assets/ZaireFlag.png')
};

const ALL_COUNTRIES = getAllCountries();
const ALL_SEARCHABLE = [...new Set([...ALL_COUNTRIES, ...MUSIC_REGIONS])];

// Curated picks — musically rich and diverse
function getQuickPicks(count = 14): string[] {
  const pool = [...getAllCountries(), ...MUSIC_REGIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

const QUICK_PICKS = getQuickPicks();

interface Props {
  navigation: any;
  stampsHook: { stamps: Set<string> };
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
  favoritesHook: { favorites: SavedDiscovery[] };
}

// ── Country Picker Modal ──────────────────────────────────
function CountryPickerModal({ visible, onClose, onSelect }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: string) => void;
}) {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_SEARCHABLE;
    return ALL_SEARCHABLE.filter(c => c.toLowerCase().includes(q));
  }, [query]);

  const handleSelect = (country: string) => {
    setQuery('');
    onClose();
    onSelect(country);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[pickerStyles.container, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Handle + header */}
        <View style={pickerStyles.header}>
          {Platform.OS === 'ios' && <View style={pickerStyles.handle} />}
          <View style={pickerStyles.headerRow}>
            <Text style={pickerStyles.title}>Select a Country</Text>
            <TouchableOpacity onPress={onClose} style={pickerStyles.closeBtn}>
              <Text style={pickerStyles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={pickerStyles.searchRow}>
            <Text style={pickerStyles.searchIcon}>🔍</Text>
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="Search countries…"
              placeholderTextColor={Colors.text3}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={pickerStyles.row} onPress={() => handleSelect(item)} activeOpacity={0.6}>
              {FLAG_IMAGES[item]
                ? <Image source={FLAG_IMAGES[item]} style={pickerStyles.rowFlagImg} />
                : <Text style={pickerStyles.rowFlag}>{FLAGS[item] ?? '🌐'}</Text>}
              <Text style={pickerStyles.rowName}>{item}</Text>
              <Text style={pickerStyles.rowArrow}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={pickerStyles.sep} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────
function DecadeFilterModal({ visible, selected, onSelect, onClose, floorDecade }: {
  visible: boolean;
  selected: string;
  onSelect: (decade: string) => void;
  onClose: () => void;
  floorDecade?: string | null;
}) {
  const insets = useSafeAreaInsets();
  const floorIdx = floorDecade ? DECADES.indexOf(floorDecade) : -1;
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={decadeStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[decadeStyles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={decadeStyles.handle} />
          <Text style={decadeStyles.title}>Filter by Era</Text>
          <TouchableOpacity
            style={[decadeStyles.row, !selected && decadeStyles.rowActive]}
            onPress={() => { onSelect(''); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={[decadeStyles.rowLabel, !selected && decadeStyles.rowLabelActive]}>Any era</Text>
            {!selected && <Ionicons name="checkmark" size={18} color={Colors.gold} />}
          </TouchableOpacity>
          {DECADES.map((d, i) => {
            const disabled = floorIdx >= 0 && i < floorIdx;
            return (
              <TouchableOpacity
                key={d}
                style={[decadeStyles.row, selected === d && decadeStyles.rowActive, disabled && decadeStyles.rowDisabled]}
                onPress={() => { if (!disabled) { onSelect(d); onClose(); } }}
                activeOpacity={disabled ? 1 : 0.7}
              >
                <Text style={[decadeStyles.rowLabel, selected === d && decadeStyles.rowLabelActive, disabled && decadeStyles.rowLabelDisabled]}>{d}</Text>
                {selected === d && !disabled && <Ionicons name="checkmark" size={18} color={Colors.gold} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function HomeScreen({ navigation, stampsHook, auth, favoritesHook }: Props) {
  const { stamps } = stampsHook;
  const insets = useSafeAreaInsets();
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set([...REGIONS.map(r => r.name), '__cultural__']));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDecade, setSelectedDecade] = useState('');
  const [decadeModalVisible, setDecadeModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const historicalCountries = useMemo(() => new Set(REGIONS.find(r => r.name === 'Historical')?.countries ?? []), []);
  const isHistorical = selectedCountry ? historicalCountries.has(selectedCountry) : false;

  const [streamingFloors, setStreamingFloors] = useState<Record<string, string>>({});
  useEffect(() => {
    fetchStreamingFloors().then(setStreamingFloors).catch(() => {});
  }, []);
  const floorForSelected = selectedCountry ? (streamingFloors[selectedCountry] ?? null) : null;

  // Slide-up animation for the Go bar
  const goBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(goBarAnim, {
      toValue: selectedCountry ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [selectedCountry]);

  // Pulse animation for the random button
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

  const selectCountry = (country: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedCountry(prev => prev === country ? null : country);
    if (historicalCountries.has(country)) { setSelectedDecade(''); return; }
    const floor = streamingFloors[country];
    if (floor && selectedDecade) {
      const floorIdx = DECADES.indexOf(floor);
      const selectedIdx = DECADES.indexOf(selectedDecade);
      if (selectedIdx < floorIdx) setSelectedDecade('');
    }
  };

  const go = (country?: string) => {
    const target = country ?? selectedCountry;
    if (!target) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedCountry(null);
    navigation.push('Recommendations', selectedDecade ? { country: target, decade: selectedDecade } : { country: target });
  };

  const toggleRegion = (name: string) => {
    setCollapsedRegions(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Countries</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search + era pill row */}
        <View style={styles.searchRow}>
          <TouchableOpacity style={[styles.pickerBtn, { flex: 1 }]} onPress={() => setPickerVisible(true)} activeOpacity={0.75}>
            <Ionicons name="search" size={16} color={Colors.text3} />
            <Text style={styles.pickerBtnText}>Search any country…</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.decadePill, selectedDecade ? styles.decadePillActive : null, isHistorical ? styles.decadePillDisabled : null]}
            onPress={() => { if (!isHistorical) setDecadeModalVisible(true); }}
            activeOpacity={isHistorical ? 1 : 0.7}
          >
            <Ionicons name="time-outline" size={26} color={isHistorical ? Colors.text3 : Colors.gold} />
            {selectedDecade ? (
              <Text style={styles.decadePillTextActive}>{selectedDecade}</Text>
            ) : null}
          </TouchableOpacity>
        </View>




        {/* Quick Picks */}
        <Text style={styles.sectionLabel}>Quick Picks</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickPicksScroll}
          contentContainerStyle={styles.quickPicksContent}
        >
          {QUICK_PICKS.map(country => {
            const isStamped = stamps.has(country);
            const isSelected = selectedCountry === country;
            return (
              <TouchableOpacity
                key={country}
                style={[styles.quickPickCard, isSelected && styles.quickPickCardSelected]}
                onPress={() => selectCountry(country)}
                activeOpacity={0.7}
              >
                {FLAG_IMAGES[country]
                  ? <Image source={FLAG_IMAGES[country]} style={styles.quickPickFlagImg} />
                  : <Text style={styles.quickPickFlag}>{FLAGS[country] ?? '🌐'}</Text>}
                <Text style={styles.quickPickName} numberOfLines={1}>
                  {country}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Random button — prominent, above the region list */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignSelf: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            style={styles.randomBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              const country = ALL_COUNTRIES[Math.floor(Math.random() * ALL_COUNTRIES.length)];
              navigation.push('Recommendations', selectedDecade ? { country, decade: selectedDecade } : { country });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="shuffle" size={18} color={Colors.bg} />
            <Text style={styles.randomBtnText}>
              {selectedDecade ? `Surprise Me · ${selectedDecade}` : 'Surprise Me'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider before browse-by-region */}
        <Text style={styles.sectionLabel}>Browse by Region</Text>

        {/* Country regions */}
        {REGIONS.map(region => {
          const isCollapsed = collapsedRegions.has(region.name);
          const stampedCount = region.countries.filter(c => stamps.has(c)).length;
          return (
            <View key={region.name} style={styles.region}>
              <TouchableOpacity
                style={styles.regionHeader}
                onPress={() => toggleRegion(region.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.regionCount}>{region.countries.length}</Text>
                <Ionicons
                  name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={16}
                  color={Colors.text3}
                />
              </TouchableOpacity>

              {!isCollapsed && (
                <View style={styles.countryGrid}>
                  {region.countries.map(country => {
                    const isStamped = stamps.has(country);
                    const isSelected = selectedCountry === country;
                    const flag = FLAGS[country] ?? '🌐';
                    const flagImg = FLAG_IMAGES[country];
                    return (
                      <TouchableOpacity
                        key={country}
                        style={[styles.countryBtn, isSelected && styles.countryBtnSelected]}
                        onPress={() => selectCountry(country)}
                        activeOpacity={0.65}
                      >
                        {flagImg
                          ? <Image source={flagImg} style={styles.countryFlagImg} />
                          : <Text style={styles.countryFlag}>{flag}</Text>}
                        <Text
                          style={styles.countryText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {country}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Cultural / Musical Regions */}
        {(() => {
          const isCollapsed = collapsedRegions.has('__cultural__');
          return (
            <View style={styles.region}>
              <TouchableOpacity
                style={styles.regionHeader}
                onPress={() => toggleRegion('__cultural__')}
                activeOpacity={0.7}
              >
                <Text style={styles.regionName}>Cultural Regions</Text>
                <Text style={styles.regionCount}>{MUSIC_REGIONS.length}</Text>
                <Ionicons
                  name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={16}
                  color={Colors.text3}
                />
              </TouchableOpacity>

              {!isCollapsed && (
                <View style={styles.countryGrid}>
                  {MUSIC_REGIONS.map(region => (
                    <TouchableOpacity
                      key={region}
                      style={[styles.countryBtn, selectedCountry === region && styles.countryBtnSelected]}
                      onPress={() => selectCountry(region)}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.countryFlag}>🌐</Text>
                      <Text
                        style={styles.countryText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {region}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })()}

        <View style={[styles.bottomPad, selectedCountry ? styles.bottomPadGoBar : null]} />
      </ScrollView>

      {/* Go bar — slides up when a country is selected */}
      <Animated.View
        style={[
          styles.goBar,
          {
            paddingBottom: insets.bottom + 80,
            transform: [{
              translateY: goBarAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }),
            }],
          },
        ]}
        pointerEvents={selectedCountry ? 'auto' : 'none'}
      >
        <View style={styles.goBarInner}>
          <TouchableOpacity style={styles.goBarInfo} onPress={() => setSelectedCountry(null)} activeOpacity={0.7}>
            {selectedCountry && FLAG_IMAGES[selectedCountry]
              ? <Image source={FLAG_IMAGES[selectedCountry]} style={styles.goBarFlagImg} />
              : <Text style={styles.goBarFlag}>{selectedCountry ? (FLAGS[selectedCountry] ?? '🌐') : ''}</Text>
            }
            <View>
              <Text style={styles.goBarCountry} numberOfLines={1}>{selectedCountry}</Text>
              {selectedDecade ? (
                <Text style={styles.goBarEra}>{selectedDecade}</Text>
              ) : !isHistorical ? (
                <Text style={styles.goBarEraHint}>tap era filter to set an era</Text>
              ) : null}
            </View>
            <Ionicons name="close-circle" size={18} color={Colors.text3} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.goBtn} onPress={() => go()} activeOpacity={0.8}>
            <Text style={styles.goBtnText}>Go</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.bg} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={country => selectCountry(country)}
      />
      <DecadeFilterModal
        visible={decadeModalVisible}
        selected={selectedDecade}
        onSelect={setSelectedDecade}
        onClose={() => setDecadeModalVisible(false)}
        floorDecade={floorForSelected}
      />
      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites} />
    </SafeAreaView>
  );
}

// ── Picker styles ─────────────────────────────────────────
const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  closeBtn: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  closeText: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  rowFlag: { fontSize: 22, width: 30 },
  rowFlagImg: { width: 30, height: 20, borderRadius: 2 },
  rowName: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowArrow: { color: Colors.text3, fontSize: 20 },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
});

// ── Screen styles ─────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3, flex: 1 },
  genreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: Colors.purpleBg,
    borderWidth: 1,
    borderColor: Colors.purpleBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  genreBtnText: { color: Colors.purple, fontSize: 13, fontWeight: '700' },
  decadePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.text3,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  decadePillActive: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  decadePillDisabled: { opacity: 0.35 },
  decadePillText: { color: Colors.text3, fontSize: 13, fontWeight: '600' },
  decadePillTextActive: { color: Colors.gold },

  scroll: { flex: 1 },
  content: { padding: 16 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  pickerBtnText: { flex: 1, color: Colors.text2, fontSize: 15 },

  region: { marginBottom: 20 },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  regionName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    flex: 1,
  },
  regionCount: { color: Colors.text3, fontSize: 12, fontWeight: '500' },

  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  countryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, minHeight: 38, gap: 5,
  },
  countryBtnStamped: { backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder },
  countryBtnSelected: { backgroundColor: Colors.blueBg, borderWidth: 1, borderColor: Colors.blueBorder },
  countryFlag: { fontSize: 13 },
  countryFlagImg: { width: 18, height: 12, borderRadius: 2 },
  countryText: { color: Colors.text3, fontSize: 12, fontWeight: '500' },
  countryTextStamped: { color: Colors.gold, fontWeight: '600' },
  stampDot: { color: Colors.gold, fontSize: 9, marginLeft: 2 },

  bottomPad: { height: 48 },
  bottomPadGoBar: { height: 200 },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.goldBg,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 16, alignSelf: 'flex-start',
  },
  statsText: { color: Colors.text2, fontSize: 13 },
  statsHighlight: { color: Colors.gold, fontWeight: '700' },

  sectionLabel: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 1.1, textTransform: 'uppercase',
    marginBottom: 10,
  },

  quickPicksScroll: { marginLeft: -16, marginBottom: 20 },
  quickPicksContent: { paddingHorizontal: 16, gap: 8 },
  quickPickCard: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    minWidth: 80, gap: 4,
  },
  quickPickCardSelected: {
    backgroundColor: Colors.blueBg,
    borderColor: Colors.blueBorder,
  },
  quickPickCardStamped: {
    backgroundColor: Colors.goldBg,
    borderColor: Colors.goldBorder,
  },
  quickPickFlag: { fontSize: 28 },
  quickPickFlagImg: { width: 36, height: 24, borderRadius: 3 },
  quickPickName: {
    color: Colors.text2, fontSize: 11, fontWeight: '600',
    maxWidth: 76, textAlign: 'center',
  },
  quickPickNameStamped: { color: Colors.gold },
  quickPickCheck: { color: Colors.gold, fontSize: 9 },

  randomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: 24, paddingHorizontal: 28, paddingVertical: 14,
    shadowColor: Colors.gold, shadowOpacity: 0.4,
    shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  randomBtnText: { color: Colors.bg, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },

  goBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    zIndex: 30,
  },
  goBarInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.blueBorder,
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12,
    gap: 12,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  goBarInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  goBarFlag: { fontSize: 24 },
  goBarFlagImg: { width: 32, height: 22, borderRadius: 3 },
  goBarCountry: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  goBarEra: { color: Colors.gold, fontSize: 12, fontWeight: '600', marginTop: 1 },
  goBarEraHint: { color: Colors.text3, fontSize: 11, marginTop: 1 },
  goBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12,
  },
  goBtnText: { color: Colors.bg, fontSize: 16, fontWeight: '800' },
});

const decadeStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, maxHeight: '80%',
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
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  rowActive: { backgroundColor: Colors.goldBg },
  rowDisabled: { opacity: 0.3 },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowLabelActive: { color: Colors.gold, fontWeight: '700' },
  rowLabelDisabled: { color: Colors.text3 },
});
