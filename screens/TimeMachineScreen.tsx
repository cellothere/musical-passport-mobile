import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Linking, Modal, FlatList, TextInput, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { REGIONS, DECADES } from '../constants/regions';
import { fetchTimeMachine, TimeMachineResponse, Track } from '../services/api';
import type { AuthService } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { GlobeOverlay } from '../components/GlobeOverlay';

const FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Greece': '🇬🇷',
  'Poland': '🇵🇱', 'Iceland': '🇮🇸', 'Finland': '🇫🇮', 'Ireland': '🇮🇪',
  'Netherlands': '🇳🇱', 'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦',
  'Hungary': '🇭🇺', 'Czechia': '🇨🇿', 'Turkey': '🇹🇷',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Cuba': '🇨🇺',
  'Mexico': '🇲🇽', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Jamaica': '🇯🇲',
  'Venezuela': '🇻🇪', 'Bolivia': '🇧🇴', 'Ecuador': '🇪🇨', 'Panama': '🇵🇦',
  'Nigeria': '🇳🇬', 'Ghana': '🇬🇭', 'Senegal': '🇸🇳', 'Mali': '🇲🇱',
  'Ethiopia': '🇪🇹', 'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'Cameroon': '🇨🇲',
  'Congo': '🇨🇩', 'Kenya': '🇰🇪', 'Algeria': '🇩🇿', 'Morocco': '🇲🇦',
  'Tanzania': '🇹🇿', 'Lebanon': '🇱🇧', 'Iran': '🇮🇷', 'Israel': '🇮🇱',
  'Saudi Arabia': '🇸🇦', 'Armenia': '🇦🇲', 'Azerbaijan': '🇦🇿', 'Georgia': '🇬🇪',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'India': '🇮🇳', 'China': '🇨🇳',
  'Indonesia': '🇮🇩', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'Philippines': '🇵🇭',
  'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Taiwan': '🇹🇼', 'Mongolia': '🇲🇳',
  'Australia': '🇦🇺', 'New Zealand': '🇳🇿', 'Papua New Guinea': '🇵🇬', 'Fiji': '🇫🇯',
  'USA': '🇺🇸', 'Canada': '🇨🇦', 'Haiti': '🇭🇹', 'Trinidad & Tobago': '🇹🇹', 'Barbados': '🇧🇧',
};

const ALL_COUNTRIES = REGIONS.flatMap(r => r.countries);

interface Props {
  navigation: any;
  accessToken: string | null;
  service: AuthService;
}

// ── Decade Picker Modal ────────────────────────────────────
function DecadePickerModal({ visible, selected, onClose, onSelect }: {
  visible: boolean;
  selected: string;
  onClose: () => void;
  onSelect: (decade: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const items = ['', ...DECADES]; // '' = Random

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[sheetStyles.container, { paddingBottom: insets.bottom }]}>
        <View style={sheetStyles.header}>
          {Platform.OS === 'ios' && <View style={sheetStyles.handle} />}
          <View style={sheetStyles.headerRow}>
            <Text style={sheetStyles.title}>Select a Decade</Text>
            <TouchableOpacity onPress={onClose} style={sheetStyles.doneBtn}>
              <Text style={sheetStyles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {items.map(d => {
            const isSelected = d === selected;
            return (
              <TouchableOpacity
                key={d || '__random'}
                style={[sheetStyles.row, isSelected && sheetStyles.rowSelected]}
                onPress={() => { onSelect(d); onClose(); }}
                activeOpacity={0.6}
              >
                <View style={sheetStyles.rowIconWrap}>
                  {d === '' && <Ionicons name="shuffle" size={18} color={isSelected ? Colors.gold : Colors.text3} />}
                </View>
                <Text style={[sheetStyles.rowLabel, isSelected && sheetStyles.rowLabelSelected]}>
                  {d || 'Random'}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color={Colors.gold} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Country Picker Modal ───────────────────────────────────
function CountryPickerModal({ visible, selected, onClose, onSelect }: {
  visible: boolean;
  selected: string;
  onClose: () => void;
  onSelect: (country: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('');
  const insets = useSafeAreaInsets();

  const regionCountries = activeRegion
    ? (REGIONS.find(r => r.name === activeRegion)?.countries ?? ALL_COUNTRIES)
    : ALL_COUNTRIES;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = [{ label: 'Random', value: '' }, ...regionCountries.map(c => ({ label: c, value: c }))];
    if (!q) return pool;
    return pool.filter(c => c.label.toLowerCase().includes(q));
  }, [query, regionCountries]);

  const handleSelect = (value: string) => {
    setQuery('');
    onClose();
    onSelect(value);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[sheetStyles.container, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={sheetStyles.header}>
          {Platform.OS === 'ios' && <View style={sheetStyles.handle} />}
          <View style={sheetStyles.headerRow}>
            <Text style={sheetStyles.title}>Select a Country</Text>
            <TouchableOpacity onPress={onClose} style={sheetStyles.doneBtn}>
              <Text style={sheetStyles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
          {/* Region filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={sheetStyles.regionRow}
            contentContainerStyle={sheetStyles.regionRowContent}
          >
            {['', ...REGIONS.map(r => r.name)].map(r => (
              <TouchableOpacity
                key={r || '__all'}
                style={[sheetStyles.regionChip, activeRegion === r && sheetStyles.regionChipActive]}
                onPress={() => { setActiveRegion(r); setQuery(''); }}
                activeOpacity={0.7}
              >
                <Text style={[sheetStyles.regionChipText, activeRegion === r && sheetStyles.regionChipTextActive]}>
                  {r || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Search */}
          <View style={sheetStyles.searchRow}>
            <Ionicons name="search" size={16} color={Colors.text3} />
            <TextInput
              style={sheetStyles.searchInput}
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
          keyExtractor={item => item.value || '__random'}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = item.value === selected;
            return (
              <TouchableOpacity
                style={[sheetStyles.row, isSelected && sheetStyles.rowSelected]}
                onPress={() => handleSelect(item.value)}
                activeOpacity={0.6}
              >
                <View style={sheetStyles.rowIconWrap}>
                  {item.value === '' ? (
                    <Ionicons name="shuffle" size={18} color={isSelected ? Colors.gold : Colors.text3} />
                  ) : (
                    <Text style={{ fontSize: 20 }}>{FLAGS[item.value] ?? '🌐'}</Text>
                  )}
                </View>
                <Text style={[sheetStyles.rowLabel, isSelected && sheetStyles.rowLabelSelected]}>
                  {item.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color={Colors.gold} />}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={sheetStyles.sep} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────
export function TimeMachineScreen({ navigation, accessToken, service }: Props) {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TimeMachineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decadeModalVisible, setDecadeModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [globeVisible, setGlobeVisible] = useState(false);
  const [globeCountry, setGlobeCountry] = useState('');
  const [globeDecade, setGlobeDecade] = useState('');
  const pendingFetch = useRef<Promise<TimeMachineResponse> | null>(null);
  const pendingResult = useRef<TimeMachineResponse | null>(null);
  const pendingError = useRef<string | null>(null);

  const launch = async () => {
    const allCountries = REGIONS.flatMap(r => r.countries);
    const country = selectedCountry || allCountries[Math.floor(Math.random() * allCountries.length)];
    const decade = selectedDecade || DECADES[Math.floor(Math.random() * DECADES.length)];

    setResult(null);
    setError(null);
    setGlobeCountry(country);
    setGlobeDecade(decade);
    setGlobeVisible(true);
    setLoading(true);

    // Kick off API call in parallel with the animation
    pendingResult.current = null;
    pendingError.current = null;
    pendingFetch.current = fetchTimeMachine(country, decade, service || 'spotify', accessToken || undefined)
      .then(data => { pendingResult.current = data; return data; })
      .catch(err => { pendingError.current = err.message || 'Time machine failed'; throw err; });
  };

  const handleGlobeDone = async () => {
    setGlobeVisible(false);
    // Wait for API if still in flight
    try {
      if (pendingFetch.current) await pendingFetch.current;
      if (pendingResult.current) setResult(pendingResult.current);
    } catch {
      setError(pendingError.current ?? 'Time machine failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name="time-outline" size={20} color={Colors.gold} />
          <Text style={styles.headerTitle}>Time Machine</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Pick a country and decade, or go fully random. We'll surface the iconic music of that time and place.
        </Text>

        {/* Pickers */}
        <View style={styles.pickerCard}>
          {/* Decade picker */}
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setDecadeModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerRowLeft}>
              <Ionicons name="calendar-outline" size={20} color={Colors.text3} style={styles.pickerIcon} />
              <View>
                <Text style={styles.pickerLabel}>Decade</Text>
                <Text style={[styles.pickerValue, !selectedDecade && styles.pickerValuePlaceholder]}>
                  {selectedDecade || 'Random'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
          </TouchableOpacity>

          <View style={styles.pickerDivider} />

          {/* Country picker */}
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setCountryModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerRowLeft}>
              <Ionicons name="globe-outline" size={20} color={Colors.text3} style={styles.pickerIcon} />
              <View>
                <Text style={styles.pickerLabel}>Country</Text>
                <Text style={[styles.pickerValue, !selectedCountry && styles.pickerValuePlaceholder]}>
                  {selectedCountry
                    ? `${FLAGS[selectedCountry] ?? ''} ${selectedCountry}`
                    : 'Random'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text3} />
          </TouchableOpacity>
        </View>

        {/* Clear row */}
        {(selectedDecade || selectedCountry) && (
          <TouchableOpacity
            style={styles.clearRow}
            onPress={() => { setSelectedDecade(''); setSelectedCountry(''); }}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={14} color={Colors.text3} />
            <Text style={styles.clearText}>Clear selections</Text>
          </TouchableOpacity>
        )}

        {/* Launch button */}
        <TouchableOpacity
          style={[styles.launchBtn, loading && styles.launchBtnDisabled]}
          onPress={launch}
          disabled={loading}
          activeOpacity={0.75}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.bg} />
          ) : (
            <Ionicons name="rocket-outline" size={18} color={Colors.bg} style={styles.launchIcon} />
          )}
          <Text style={styles.launchBtnText}>
            {loading ? 'Travelling…' : 'Launch Time Machine'}
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={16} color={Colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && !loading && (
          <View style={styles.result}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>You arrived in</Text>
              <View style={styles.resultTitleRow}>
                <Text style={styles.resultFlag}>{FLAGS[result.country] ?? '🌐'}</Text>
                <Text style={styles.resultDestination}>{result.country}</Text>
              </View>
              <Text style={styles.resultDecade}>{result.decade}</Text>
            </View>

            <View style={styles.genreBadge}>
              <Text style={styles.genreBadgeText}>{result.genre}</Text>
            </View>

            <Text style={styles.resultDesc}>{result.description}</Text>

            <Text style={styles.tracksHeading}>5 essential tracks</Text>

            {result.tracks.map((track, i) => (
              <TimeMachineTrack key={i} index={i + 1} track={track} />
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <GlobeOverlay
        visible={globeVisible}
        country={globeCountry}
        decade={globeDecade}
        onDone={handleGlobeDone}
      />
      <DecadePickerModal
        visible={decadeModalVisible}
        selected={selectedDecade}
        onClose={() => setDecadeModalVisible(false)}
        onSelect={setSelectedDecade}
      />
      <CountryPickerModal
        visible={countryModalVisible}
        selected={selectedCountry}
        onClose={() => setCountryModalVisible(false)}
        onSelect={setSelectedCountry}
      />
    </SafeAreaView>
  );
}

// ── Track row ──────────────────────────────────────────────
function TimeMachineTrack({ track, index }: { track: Track; index: number }) {
  const { play, currentTrackId, isPlaying, isLoading } = useAudioPlayer();
  const trackId = track.spotifyId || track.appleId || track.previewUrl || `${track.title}-${index}`;
  const isThisTrack = currentTrackId === trackId;

  const openUrl = track.spotifyUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist ?? ''}`)}`;

  const openTrack = () => Linking.openURL(openUrl);

  const embedUrl = track.spotifyId
    ? `https://open.spotify.com/embed/track/${track.spotifyId}?utm_source=generator`
    : track.appleId
    ? `https://embed.music.apple.com/us/album/${track.appleId}`
    : null;

  const handlePlay = () => {
    if (track.previewUrl) {
      play(trackId, track.previewUrl, track.title, track.artist);
    } else if (embedUrl) {
      WebBrowser.openBrowserAsync(embedUrl);
    }
  };

  const canPlay = !!(track.previewUrl || embedUrl);

  return (
    <View style={styles.track}>
      <Text style={styles.trackNumber}>{index}</Text>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        {track.artist && <Text style={styles.trackArtist}>{track.artist}</Text>}
      </View>
      <View style={styles.trackActions}>
        {canPlay && (
          <TouchableOpacity
            style={[styles.playBtn, isThisTrack && styles.playBtnActive]}
            onPress={handlePlay}
          >
            {isThisTrack && isLoading ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <Ionicons
                name={isThisTrack && isPlaying ? 'pause' : 'play'}
                size={14}
                color={isThisTrack ? Colors.gold : Colors.text2}
              />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.openBtn} onPress={openTrack}>
          <Ionicons name="open-outline" size={14} color={Colors.blue} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Sheet styles (shared by both modals) ──────────────────
const sheetStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  title: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  doneBtn: {
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
  },
  doneBtnText: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  regionRow: { flexGrow: 0, marginBottom: 12 },
  regionRowContent: { gap: 8, paddingRight: 4 },
  regionChip: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  regionChipActive: { backgroundColor: Colors.blueBg, borderColor: Colors.blueBorder },
  regionChipText: { color: Colors.text2, fontSize: 13, fontWeight: '500' },
  regionChipTextActive: { color: Colors.blue, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 15, gap: 14,
  },
  rowSelected: { backgroundColor: Colors.goldBg },
  rowIconWrap: { width: 28, alignItems: 'center' },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '500' },
  rowLabelSelected: { color: Colors.gold, fontWeight: '600' },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
});

// ── Screen styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  scroll: { flex: 1 },
  content: { padding: 18 },

  description: { color: Colors.text2, fontSize: 15, lineHeight: 22, marginBottom: 24 },

  // Picker card
  pickerCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, marginBottom: 12, overflow: 'hidden',
  },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  pickerRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pickerIcon: { width: 24 },
  pickerLabel: { color: Colors.text3, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  pickerValue: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  pickerValuePlaceholder: { color: Colors.text2, fontWeight: '400', fontStyle: 'italic' },
  pickerDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  clearRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  clearText: { color: Colors.text3, fontSize: 13 },

  // Launch button
  launchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingVertical: 17, gap: 8, marginBottom: 24,
  },
  launchBtnDisabled: { opacity: 0.5 },
  launchIcon: {},
  launchBtnText: { color: Colors.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(240,101,101,0.1)',
    borderWidth: 1, borderColor: 'rgba(240,101,101,0.3)',
    borderRadius: 10, padding: 14, marginBottom: 16,
  },
  errorText: { color: Colors.red, fontSize: 14, flex: 1 },

  // Result card
  result: {
    backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, borderRadius: 16, padding: 18,
  },
  resultHeader: { marginBottom: 14 },
  resultLabel: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6,
  },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  resultFlag: { fontSize: 28 },
  resultDestination: { color: Colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  resultDecade: { color: Colors.text2, fontSize: 16, fontWeight: '600', marginTop: 2 },
  genreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 14,
  },
  genreBadgeText: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  resultDesc: { color: Colors.text2, fontSize: 14, lineHeight: 21, marginBottom: 18 },
  tracksHeading: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },

  // Track row
  track: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 12,
  },
  trackNumber: { color: Colors.text3, fontSize: 13, fontWeight: '700', width: 20, textAlign: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 12, marginTop: 2 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  openBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.blueBg, borderWidth: 1, borderColor: Colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  bottomPad: { height: 48 },
});
