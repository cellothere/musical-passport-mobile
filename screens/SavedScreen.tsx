import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Image,
} from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { haptics } from '../utils/haptics';
import type { SavedDiscovery } from '../hooks/useFavorites';
import type { AuthState } from '../hooks/useAuth';
import { FloatingNav } from '../components/FloatingNav';
import { TrackOptionsSheet } from '../components/TrackOptionsSheet';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface FavoritesHook {
  favorites: SavedDiscovery[];
  remove: (id: string) => Promise<void>;
}

interface Props {
  navigation: any;
  favoritesHook: FavoritesHook;
  auth: AuthState;
}

function TrackRow({ item, onRemove, auth }: { item: SavedDiscovery; onRemove: () => void; auth: AuthState }) {
  const [optionsVisible, setOptionsVisible] = React.useState(false);
  const swipeableRef = useRef<SwipeableMethods>(null);
  const track = (item.data as any).track ?? {};
  const genre = (item.data as any).genre ?? '';
  const artistImageUrl = (item.data as any).artistImageUrl ?? null;

  const openUrl = track.spotifyUrl
    ?? track.deezerUrl
    ?? (track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : null)
    ?? (track.appleId ? `https://music.apple.com/us/song/${track.appleId}` : null)
    ?? `https://open.spotify.com/search/${encodeURIComponent(`${track.title ?? ''} ${track.artist ?? ''}`)}`;

  const handleUnlike = () => {
    haptics.error();
    swipeableRef.current?.close();
    onRemove();
  };

  const renderLeftActions = () => (
    <TouchableOpacity style={styles.unlikeAction} onPress={handleUnlike} activeOpacity={0.8}>
      <Ionicons name="heart-dislike" size={22} color="#fff" />
      <Text style={styles.unlikeText}>Unlike</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TrackOptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        track={track}
        country={item.country}
        genre={genre}
        openUrl={openUrl}
        isExpertTester={auth.isTester}
        userId={auth.testerUserId ?? undefined}
      />
      <ReanimatedSwipeable ref={swipeableRef} renderLeftActions={renderLeftActions} overshootLeft={false}>
        <View style={styles.row}>
          {artistImageUrl ? (
            <Image source={{ uri: artistImageUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="musical-note" size={20} color={Colors.text3} />
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{track.title ?? 'Unknown track'}</Text>
            <Text style={styles.artist} numberOfLines={1}>{track.artist ?? item.country}</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn} onPress={() => { haptics.light(); setOptionsVisible(true); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text3} />
          </TouchableOpacity>
        </View>
      </ReanimatedSwipeable>
    </>
  );
}

export function SavedScreen({ navigation, favoritesHook, auth }: Props) {
  const tracks = favoritesHook.favorites.filter(f => f.type === 'track');
  const insets = useSafeAreaInsets();
  const { currentTrackTitle } = useAudioPlayer();
  const contentBottomPad = insets.bottom + 76 + (currentTrackTitle ? 72 : 0);

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
        <Text style={styles.headerTitle}>Liked Songs</Text>
        <View style={{ width: 32 }} />
      </View>

      {tracks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={Colors.text3} />
          <Text style={styles.emptyTitle}>No liked songs yet</Text>
          <Text style={styles.emptyText}>Tap the heart on any track to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TrackRow item={item} onRemove={() => favoritesHook.remove(item.id)} auth={auth} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: contentBottomPad }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FloatingNav navigation={navigation} auth={auth} favorites={favoritesHook.favorites} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 32 },
  headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: Colors.text2, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bg,
    gap: 14,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 4,
    flexShrink: 0,
  },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 4,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  artist: { color: Colors.text3, fontSize: 13 },
  moreBtn: { paddingHorizontal: 4 },

  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 82 },

  unlikeAction: {
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    flexDirection: 'column',
    gap: 4,
  },
  unlikeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
