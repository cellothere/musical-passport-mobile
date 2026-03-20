import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput, FlatList, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { REGIONS, getAllCountries } from '../constants/regions';

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
  'Kazakhstan': '🇰🇿', 'Uzbekistan': '🇺🇿', 'Hong Kong': '🇭🇰',
  'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'Papua New Guinea': '🇵🇬', 'Fiji': '🇫🇯',
  'USA': '🇺🇸', 'Canada': '🇨🇦',
  'Yugoslavia': '🏳', 'Soviet Union': '☭', 'Czechoslovakia': '🏳',
  'East Germany': '🏳', 'Ottoman Empire': '🌙', 'British India': '🏳',
};


const ALL_COUNTRIES = getAllCountries();

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
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(c => c.toLowerCase().includes(q));
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
              <Text style={pickerStyles.rowFlag}>{FLAGS[item] ?? '🌐'}</Text>
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
export function HomeScreen({ navigation, stampsHook }: Props) {
  const { stamps } = stampsHook;
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set(REGIONS.map(r => r.name)));
  const [pickerVisible, setPickerVisible] = useState(false);

  const toggleRegion = (name: string) => {
    setCollapsedRegions(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
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

        {/* Country search picker button */}
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerVisible(true)} activeOpacity={0.75}>
          <Ionicons name="search" size={16} color={Colors.text3} />
          <Text style={styles.pickerBtnText}>Search any country…</Text>
        </TouchableOpacity>

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
                    return (
                      <TouchableOpacity
                        key={country}
                        style={[styles.countryBtn, isStamped && styles.countryBtnStamped]}
                        onPress={() => navigation.navigate('Recommendations', { country })}
                        activeOpacity={0.65}
                      >
                        <Text style={styles.countryFlag}>{flag}</Text>
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

        <View style={styles.bottomPad} />
      </ScrollView>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={country => navigation.navigate('Recommendations', { country })}
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
  headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },

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
  countryText: { color: Colors.text3, fontSize: 12, fontWeight: '500' },
  countryTextStamped: { color: Colors.gold, fontWeight: '600' },
  stampDot: { color: Colors.gold, fontSize: 9, marginLeft: 2 },

  bottomPad: { height: 48 },
});
