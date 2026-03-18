import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Modal, TextInput, FlatList, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { REGIONS, getAllCountries } from '../constants/regions';
import type { AuthState } from '../hooks/useAuth';

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

const REGION_ICONS: Record<string, string> = {
  'Europe': '🏰', 'Latin America': '🌴', 'Africa': '🌍',
  'Middle East': '🌙', 'Asia': '🏯', 'Oceania': '🌊',
  'North America': '🗽', 'Historical': '📜',
};

const ALL_COUNTRIES = getAllCountries();
const totalCountries = REGIONS.reduce((acc, r) => acc + r.countries.length, 0);

interface StampsHook {
  stamps: Set<string>;
  addStamp: (country: string) => Promise<void>;
}

interface Props {
  navigation: any;
  auth: AuthState & { loginSpotify: () => void; loginAppleMusic: () => void; logout: () => void };
  stampsHook: StampsHook;
}

// ── Service Modal ─────────────────────────────────────────
function ServiceModal({ visible, onClose, auth }: {
  visible: boolean;
  onClose: () => void;
  auth: Props['auth'];
}) {
  const insets = useSafeAreaInsets();

  const handleOption = (action: () => void) => {
    onClose();
    action();
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
                <Text style={[svcStyles.rowLabel, svcStyles.rowLabelDanger]}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
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
export function HomeScreen({ navigation, auth, stampsHook }: Props) {
  const { stamps } = stampsHook;
  const canTimeMachine = auth.service === 'spotify' || auth.service === 'apple-music';
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set(REGIONS.map(r => r.name)));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Musical Passport</Text>
          <View style={styles.stampPill}>
            <Text style={styles.stampPillText}>{stamps.size} / {totalCountries}</Text>
          </View>
        </View>
        {auth.loading ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : (
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} style={styles.serviceIconBtn} activeOpacity={0.7}>
            {auth.service === 'spotify' ? (
              <FontAwesome5 name="spotify" size={20} color="#1DB954" />
            ) : auth.service === 'apple-music' ? (
              <FontAwesome5 name="apple" size={20} color={Colors.text} />
            ) : (
              <Ionicons name="musical-notes-outline" size={20} color={Colors.text3} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Country search picker button */}
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickerVisible(true)} activeOpacity={0.75}>
          <Text style={styles.pickerBtnIcon}>🔍</Text>
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
                <Text style={styles.regionChevron}>{isCollapsed ? '›' : '⌄'}</Text>
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

        {/* Time Machine */}
        <TouchableOpacity
          style={[styles.tmCard, !canTimeMachine && styles.tmCardDisabled]}
          onPress={() => canTimeMachine && navigation.navigate('TimeMachine')}
          activeOpacity={canTimeMachine ? 0.72 : 1}
        >
          <Ionicons name="time-outline" size={26} color={Colors.gold} />
          <View style={styles.tmTextBlock}>
            <Text style={styles.tmTitle}>Time Machine</Text>
            <Text style={styles.tmSubtitle}>
              {canTimeMachine ? 'Explore iconic music from any era' : 'Connect a service to unlock'}
            </Text>
          </View>
          {canTimeMachine && <Text style={styles.tmArrow}>›</Text>}
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={country => navigation.navigate('Recommendations', { country })}
      />

      <ServiceModal
        visible={serviceModalVisible}
        onClose={() => setServiceModalVisible(false)}
        auth={auth}
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
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  stampPill: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stampPillText: { color: Colors.gold, fontSize: 12, fontWeight: '600' },

  serviceIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  content: { padding: 16 },

  tmCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 14, padding: 16, marginBottom: 14, gap: 14,
  },
  tmCardDisabled: { opacity: 0.4 },
  tmTextBlock: { flex: 1 },
  tmTitle: { color: Colors.gold, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  tmSubtitle: { color: Colors.gold, fontSize: 13, opacity: 0.75 },
  tmArrow: { color: Colors.gold, fontSize: 24, opacity: 0.65 },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  pickerBtnIcon: { fontSize: 16 },
  pickerBtnText: { flex: 1, color: Colors.text2, fontSize: 15 },
  pickerBtnHint: {
    color: Colors.text3,
    fontSize: 11,
    backgroundColor: Colors.surface2,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },

  region: { marginBottom: 20 },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 10,
  },
  regionIcon: { fontSize: 18 },
  regionName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  regionCount: { color: Colors.text3, fontSize: 12, fontWeight: '600' },
  regionChevron: { color: Colors.text3, fontSize: 18, width: 20, textAlign: 'center' },

  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  countryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12, minHeight: 44, gap: 6,
  },
  countryBtnStamped: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  countryFlag: { fontSize: 15 },
  countryText: { color: Colors.text2, fontSize: 13, fontWeight: '500' },
  countryTextStamped: { color: Colors.gold, fontWeight: '600' },
  stampDot: { color: Colors.gold, fontSize: 9, marginLeft: 2 },

  bottomPad: { height: 48 },
});

// ── Service modal styles ───────────────────────────────────
const svcStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.text3,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  rowIconWrap: { width: 28, alignItems: 'center' },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowLabelDanger: { color: '#e05c5c' },
  rowArrow: { color: Colors.text3, fontSize: 20 },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
});
