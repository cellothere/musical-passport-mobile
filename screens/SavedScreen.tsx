import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { SavedDiscovery } from '../hooks/useFavorites';
import type { TimeMachineResponse, RecommendationResponse } from '../services/api';

const FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Germany': '🇩🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Portugal': '🇵🇹', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Greece': '🇬🇷',
  'Poland': '🇵🇱', 'Iceland': '🇮🇸', 'Finland': '🇫🇮', 'Ireland': '🇮🇪',
  'Netherlands': '🇳🇱', 'Romania': '🇷🇴', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦',
  'Hungary': '🇭🇺', 'Czechia': '🇨🇿', 'Turkey': '🇹🇷', 'Belgium': '🇧🇪',
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
  'USA': '🇺🇸', 'Canada': '🇨🇦',
};

interface FavoritesHook {
  favorites: SavedDiscovery[];
  remove: (id: string) => Promise<void>;
}

interface Props {
  navigation: any;
  favoritesHook: FavoritesHook;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function TimeMachineDetail({ data }: { data: TimeMachineResponse }) {
  return (
    <View style={styles.detail}>
      <View style={styles.detailHeaderRow}>
        <View style={styles.genreBadge}>
          <Text style={styles.genreBadgeText}>{data.genre}</Text>
        </View>
        <Text style={styles.detailDecade}>{data.decade}</Text>
      </View>
      <Text style={styles.detailDesc}>{data.description}</Text>
      {data.tracks?.length > 0 && (
        <>
          <Text style={styles.tracksLabel}>Essential Tracks</Text>
          {data.tracks.map((t, i) => (
            <View key={i} style={styles.trackRow}>
              <Text style={styles.trackNum}>{i + 1}</Text>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{t.title}</Text>
                {t.artist && <Text style={styles.trackArtist}>{t.artist}</Text>}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function RecommendationDetail({ data }: { data: RecommendationResponse }) {
  return (
    <View style={styles.detail}>
      {data.genres?.length > 0 && (
        <View style={styles.genreRow}>
          {data.genres.map(g => (
            <View key={g} style={styles.genreTag}>
              <Text style={styles.genreText}>{g}</Text>
            </View>
          ))}
        </View>
      )}
      {data.artists?.length > 0 && (
        <>
          <Text style={styles.tracksLabel}>Artists</Text>
          {data.artists.map((a, i) => (
            <View key={i} style={styles.artistRow}>
              <Text style={styles.artistName}>{a.name}</Text>
              <Text style={styles.artistMeta}>{a.genre} · {a.era}</Text>
            </View>
          ))}
        </>
      )}
      {data.didYouKnow && (
        <View style={styles.dyk}>
          <Text style={styles.dykLabel}>💡 Did you know</Text>
          <Text style={styles.dykText}>{data.didYouKnow}</Text>
        </View>
      )}
    </View>
  );
}

function SavedItem({
  item,
  onRemove,
  onNavigate,
}: {
  item: SavedDiscovery;
  onRemove: () => void;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isTimeMachine = item.type === 'timemachine';
  const isArtist = item.type === 'artist';
  const isGenre = item.type === 'genre';
  const artistData = isArtist ? (item.data as any) : null;
  const genreData = isGenre ? (item.data as any) : null;

  const badgeStyle = isTimeMachine ? styles.typeBadgeGold : (isArtist || isGenre) ? styles.typeBadgeGreen : styles.typeBadgePurple;
  const badgeTextStyle = isTimeMachine ? styles.typeBadgeTextGold : (isArtist || isGenre) ? styles.typeBadgeTextGreen : styles.typeBadgeTextPurple;
  const badgeLabel = isTimeMachine ? `⏳ ${item.decade}` : isArtist ? `🎵 ${item.decade ?? 'Artist'}` : isGenre ? '🎼 Genre Spotlight' : '🌍 Recommendations';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => isTimeMachine || isArtist || isGenre ? setExpanded(e => !e) : onNavigate()}
        activeOpacity={0.7}
      >
        <Text style={styles.cardFlag}>{isArtist ? '🎤' : isGenre ? '🎼' : (FLAGS[item.country] ?? '🌐')}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardCountry}>{isArtist ? artistData?.name : isGenre ? genreData?.genre : item.country}</Text>
          <View style={styles.cardSubRow}>
            <View style={[styles.typeBadge, badgeStyle]}>
              <Text style={[styles.typeBadgeText, badgeTextStyle]}>{badgeLabel}</Text>
            </View>
            {(isArtist || isGenre) && (
              <Text style={styles.cardCountryMeta}>{FLAGS[item.country] ?? '🌐'} {item.country}</Text>
            )}
            <Text style={styles.cardDate}>{formatDate(item.savedAt)}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          {!isTimeMachine && !isArtist && !isGenre && (
            <TouchableOpacity
              onPress={onNavigate}
              style={styles.goBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={18} color={Colors.blue} />
            </TouchableOpacity>
          )}
          {(isTimeMachine || isArtist || isGenre) && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.text3}
            />
          )}
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="heart" size={18} color={Colors.red} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && isTimeMachine && (
        <TimeMachineDetail data={item.data as TimeMachineResponse} />
      )}
      {expanded && isGenre && genreData && (
        <View style={styles.detail}>
          {genreData.explanation && (
            <Text style={styles.detailDesc}>{genreData.explanation}</Text>
          )}
          {genreData.tracks?.length > 0 && (
            <>
              <Text style={styles.tracksLabel}>Essential Tracks</Text>
              {genreData.tracks.map((t: any, i: number) => (
                <View key={i} style={styles.trackRow}>
                  <Text style={styles.trackNum}>{i + 1}</Text>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>{t.title}</Text>
                    {t.artist && <Text style={styles.trackArtist}>{t.artist}</Text>}
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}
      {expanded && isArtist && artistData && (
        <View style={styles.detail}>
          {artistData.genre && (
            <View style={[styles.genreBadge, { marginBottom: 8 }]}>
              <Text style={styles.genreBadgeText}>{artistData.genre}</Text>
            </View>
          )}
          {artistData.description && (
            <Text style={styles.detailDesc}>{artistData.description}</Text>
          )}
          {artistData.similarityReason && (
            <Text style={[styles.detailDesc, { fontStyle: 'italic' }]}>{artistData.similarityReason}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export function SavedScreen({ navigation, favoritesHook }: Props) {
  const { favorites, remove } = favoritesHook;

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
          <Ionicons name="heart" size={20} color={Colors.red} />
          <Text style={styles.headerTitle}>Saved Discoveries</Text>
        </View>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={Colors.text3} />
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any recommendation or time machine result to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>{favorites.length} saved</Text>
          {favorites.map(item => (
            <SavedItem
              key={item.id}
              item={item}
              onRemove={() => remove(item.id)}
              onNavigate={() => {
                navigation.navigate('Recommendations', {
                  country: item.country,
                  savedData: item.data,
                });
              }}
            />
          ))}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

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

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  content: { padding: 16 },
  countLabel: {
    color: Colors.text3, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, marginBottom: 10, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  cardFlag: { fontSize: 28 },
  cardMeta: { flex: 1 },
  cardCountry: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 5 },
  cardSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1,
  },
  typeBadgeGold: { backgroundColor: Colors.goldBg, borderColor: Colors.goldBorder },
  typeBadgePurple: { backgroundColor: Colors.purpleBg, borderColor: Colors.purpleBorder },
  typeBadgeGreen: { backgroundColor: Colors.greenBg, borderColor: Colors.greenBorder },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  typeBadgeTextGold: { color: Colors.gold },
  typeBadgeTextPurple: { color: Colors.purple },
  typeBadgeTextGreen: { color: Colors.green },
  cardCountryMeta: { color: Colors.text3, fontSize: 11 },
  cardDate: { color: Colors.text3, fontSize: 11 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goBtn: { padding: 4 },
  removeBtn: { padding: 4 },

  // Detail sections
  detail: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 14,
  },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  genreBadge: {
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  genreBadgeText: { color: Colors.gold, fontSize: 12, fontWeight: '700' },
  detailDecade: { color: Colors.text2, fontSize: 14, fontWeight: '600' },
  detailDesc: { color: Colors.text2, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  tracksLabel: {
    color: Colors.text3, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  trackRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10,
  },
  trackNum: { color: Colors.text3, fontSize: 13, fontWeight: '700', width: 20, textAlign: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: Colors.text2, fontSize: 13, marginTop: 2 },

  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  genreTag: {
    backgroundColor: Colors.purpleBg, borderWidth: 1, borderColor: Colors.purpleBorder,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  genreText: { color: Colors.purple, fontSize: 12, fontWeight: '600' },
  artistRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  artistName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  artistMeta: { color: Colors.text2, fontSize: 12, marginTop: 2 },
  dyk: {
    backgroundColor: Colors.goldBg, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 10, padding: 12, marginTop: 10,
  },
  dykLabel: { color: Colors.gold, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  dykText: { color: Colors.text, fontSize: 13, lineHeight: 20 },
});
