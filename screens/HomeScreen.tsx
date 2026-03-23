import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput, FlatList, Platform, KeyboardAvoidingView, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { REGIONS, MUSIC_REGIONS, DECADES, getAllCountries } from '../constants/regions';
import * as Haptics from 'expo-haptics';

const FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Greece': '🇬🇷',
  'Poland': '🇵🇱', 'Iceland': '🇮🇸', 'Finland': '🇫🇮', 'Ireland': '🇮🇪',
  'Netherlands': '🇳🇱', 'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦',
  'Hungary': '🇭🇺', 'Czechia': '🇨🇿', 'Turkey': '🇹🇷', 'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Denmark': '🇩🇰', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Croatia': '🇭🇷', 'Bulgaria': '🇧🇬', 'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮', 'Lithuania': '🇱🇹', 'Latvia': '🇱🇻', 'Estonia': '🇪🇪',
  'Albania': '🇦🇱', 'North Macedonia': '🇲🇰', 'Bosnia': '🇧🇦', 'Kosovo': '🇽🇰',
  'Montenegro': '🇲🇪', 'Luxembourg': '🇱🇺', 'Malta': '🇲🇹', 'Cyprus': '🇨🇾',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Cuba': '🇨🇺',
  'Mexico': '🇲🇽', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Jamaica': '🇯🇲',
  'Venezuela': '🇻🇪', 'Bolivia': '🇧🇴', 'Ecuador': '🇪🇨', 'Panama': '🇵🇦',
  'Uruguay': '🇺🇾', 'Paraguay': '🇵🇾', 'Costa Rica': '🇨🇷', 'Dominican Republic': '🇩🇴',
  'Puerto Rico': '🇵🇷', 'Guatemala': '🇬🇹', 'Honduras': '🇭🇳', 'El Salvador': '🇸🇻',
  'Nicaragua': '🇳🇮', 'Belize': '🇧🇿', 'Guyana': '🇬🇾', 'Suriname': '🇸🇷',
  'Trinidad & Tobago': '🇹🇹', 'Barbados': '🇧🇧', 'Haiti': '🇭🇹',
  'Nigeria': '🇳🇬', 'Ghana': '🇬🇭', 'Senegal': '🇸🇳', 'Mali': '🇲🇱',
  'Ethiopia': '🇪🇹', 'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'Cameroon': '🇨🇲',
  'Congo': '🇨🇩', 'Kenya': '🇰🇪', 'Algeria': '🇩🇿', 'Morocco': '🇲🇦',
  'Tanzania': '🇹🇿', 'Ivory Coast': '🇨🇮', 'Angola': '🇦🇴', 'Mozambique': '🇲🇿',
  'Zimbabwe': '🇿🇼', 'Uganda': '🇺🇬', 'Rwanda': '🇷🇼', 'Zambia': '🇿🇲',
  'Tunisia': '🇹🇳', 'Libya': '🇱🇾', 'Sudan': '🇸🇩', 'Guinea': '🇬🇳',
  'Burkina Faso': '🇧🇫', 'Benin': '🇧🇯', 'Togo': '🇹🇬', 'Sierra Leone': '🇸🇱',
  'Liberia': '🇱🇷', 'Namibia': '🇳🇦', 'Botswana': '🇧🇼', 'Malawi': '🇲🇼',
  'Madagascar': '🇲🇬', 'Mauritius': '🇲🇺', 'Cape Verde': '🇨🇻',
  'Lebanon': '🇱🇧', 'Iran': '🇮🇷', 'Israel': '🇮🇱', 'Saudi Arabia': '🇸🇦',
  'Armenia': '🇦🇲', 'Azerbaijan': '🇦🇿', 'Georgia': '🇬🇪', 'Iraq': '🇮🇶',
  'Syria': '🇸🇾', 'Jordan': '🇯🇴', 'Yemen': '🇾🇪', 'Oman': '🇴🇲',
  'UAE': '🇦🇪', 'Kuwait': '🇰🇼', 'Qatar': '🇶🇦', 'Bahrain': '🇧🇭', 'Palestine': '🇵🇸',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'India': '🇮🇳', 'China': '🇨🇳',
  'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Philippines': '🇵🇭',
  'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Taiwan': '🇹🇼', 'Mongolia': '🇲🇳',
  'Myanmar': '🇲🇲', 'Cambodia': '🇰🇭', 'Laos': '🇱🇦', 'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬', 'Sri Lanka': '🇱🇰', 'Nepal': '🇳🇵', 'Afghanistan': '🇦🇫',
  'Kazakhstan': '🇰🇿', 'Uzbekistan': '🇺🇿', 'Tajikistan': '🇹🇯', 'Kyrgyzstan': '🇰🇬', 'Turkmenistan': '🇹🇲', 'Hong Kong': '🇭🇰',
  'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'Papua New Guinea': '🇵🇬', 'Fiji': '🇫🇯',
  'Vanuatu': '🇻🇺', 'Solomon Islands': '🇸🇧', 'Hawaii': '🌺',
  'USA': '🇺🇸', 'Canada': '🇨🇦',
  'Yugoslavia': '🏳', 'Soviet Union': '☭', 'Czechoslovakia': '🏳',
  'East Germany': '🏳', 'Ottoman Empire': '🌙', 'British India': '🏳',
};

const FLAG_IMAGES: Record<string, any> = {
  'Republic of South Vietnam': require('../assets/SouthVietnam.png'),
};

const ALL_COUNTRIES = getAllCountries();
const ALL_SEARCHABLE = [...new Set([...ALL_COUNTRIES, ...MUSIC_REGIONS])];

// Curated picks — musically rich and diverse
const QUICK_PICKS = [
  'Brazil', 'Japan', 'Nigeria', 'Cuba', 'India', 'Jamaica',
  'Iran', 'Colombia', 'South Korea', 'Mali', 'Greece', 'Iceland',
  'Portugal', 'Ethiopia', 'Vietnam', 'Argentina',
];

interface Props {
  navigation: any;
  stampsHook: { stamps: Set<string> };
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
function DecadeFilterModal({ visible, selected, onSelect, onClose }: {
  visible: boolean;
  selected: string;
  onSelect: (decade: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
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
          {DECADES.map(d => (
            <TouchableOpacity
              key={d}
              style={[decadeStyles.row, selected === d && decadeStyles.rowActive]}
              onPress={() => { onSelect(d); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={[decadeStyles.rowLabel, selected === d && decadeStyles.rowLabelActive]}>{d}</Text>
              {selected === d && <Ionicons name="checkmark" size={18} color={Colors.gold} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function HomeScreen({ navigation, stampsHook }: Props) {
  const { stamps } = stampsHook;
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set([...REGIONS.map(r => r.name), '__cultural__']));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDecade, setSelectedDecade] = useState('');
  const [decadeModalVisible, setDecadeModalVisible] = useState(false);

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

  const navigate = (country: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Recommendations', selectedDecade ? { country, decade: selectedDecade } : { country });
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
        <TouchableOpacity
          style={[styles.decadePill, selectedDecade ? styles.decadePillActive : null]}
          onPress={() => setDecadeModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={26} color={Colors.gold} />
          {selectedDecade ? (
            <Text style={styles.decadePillTextActive}>{selectedDecade}</Text>
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Country search picker button */}
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerVisible(true)} activeOpacity={0.75}>
          <Ionicons name="search" size={16} color={Colors.text3} />
          <Text style={styles.pickerBtnText}>Search any country…</Text>
        </TouchableOpacity>

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
            return (
              <TouchableOpacity
                key={country}
                style={[styles.quickPickCard, isStamped && styles.quickPickCardStamped]}
                onPress={() => navigate(country)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickPickFlag}>{FLAGS[country] ?? '🌐'}</Text>
                <Text style={[styles.quickPickName, isStamped && styles.quickPickNameStamped]} numberOfLines={1}>
                  {country}
                </Text>
                {isStamped && <Text style={styles.quickPickCheck}>✦</Text>}
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
              navigate(country);
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
                <Text style={styles.regionCount}>{stampedCount}/{region.countries.length}</Text>
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
                    const flag = FLAGS[country] ?? '🌐';
                    const flagImg = FLAG_IMAGES[country];
                    return (
                      <TouchableOpacity
                        key={country}
                        style={[styles.countryBtn, isStamped && styles.countryBtnStamped]}
                        onPress={() => navigate(country)}
                        activeOpacity={0.65}
                      >
                        {flagImg
                          ? <Image source={flagImg} style={styles.countryFlagImg} />
                          : <Text style={styles.countryFlag}>{flag}</Text>}
                        <Text
                          style={[styles.countryText, isStamped && styles.countryTextStamped]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {country}
                        </Text>
                        {isStamped && <Text style={styles.stampDot}>✦</Text>}
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
                      style={styles.countryBtn}
                      onPress={() => navigate(region)}
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

        <View style={styles.bottomPad} />
      </ScrollView>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={country => navigate(country)}
      />
      <DecadeFilterModal
        visible={decadeModalVisible}
        selected={selectedDecade}
        onSelect={setSelectedDecade}
        onClose={() => setDecadeModalVisible(false)}
      />
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
  decadePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.text3,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  decadePillActive: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  decadePillText: { color: Colors.text3, fontSize: 12, fontWeight: '600' },
  decadePillTextActive: { color: Colors.gold },

  scroll: { flex: 1 },
  content: { padding: 16 },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
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
  countryFlag: { fontSize: 13 },
  countryFlagImg: { width: 18, height: 12, borderRadius: 2 },
  countryText: { color: Colors.text3, fontSize: 12, fontWeight: '500' },
  countryTextStamped: { color: Colors.gold, fontWeight: '600' },
  stampDot: { color: Colors.gold, fontSize: 9, marginLeft: 2 },

  bottomPad: { height: 48 },

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
  quickPickCardStamped: {
    backgroundColor: Colors.goldBg,
    borderColor: Colors.goldBorder,
  },
  quickPickFlag: { fontSize: 28 },
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
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowLabelActive: { color: Colors.gold, fontWeight: '700' },
});
