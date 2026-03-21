import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LandingScreen } from './screens/LandingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RecommendationScreen } from './screens/RecommendationScreen';
import { TimeMachineScreen } from './screens/TimeMachineScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { SavedScreen } from './screens/SavedScreen';
import { GenreSpotlightScreen } from './screens/GenreSpotlightScreen';
import { ArtistSearchScreen } from './screens/ArtistSearchScreen';
import { Colors } from './constants/colors';
import { useAuth } from './hooks/useAuth';
import { useStamps } from './hooks/useStamps';
import { useFavorites } from './hooks/useFavorites';
import { AudioPlayerProvider, useAudioPlayer } from './contexts/AudioPlayerContext';
import { SplashAnimation } from './components/SplashAnimation';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createStackNavigator();

function MiniPlayer() {
  const { currentTrackTitle, currentTrackArtist, isPlaying, isLoading, togglePlay, stop } = useAudioPlayer();
  const insets = useSafeAreaInsets();

  if (!currentTrackTitle) return null;

  return (
    <View style={[styles.miniPlayer, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.miniPlayerInfo}>
        <Text style={styles.miniPlayerTitle} numberOfLines={1}>{currentTrackTitle}</Text>
        {currentTrackArtist && (
          <Text style={styles.miniPlayerArtist} numberOfLines={1}>{currentTrackArtist}</Text>
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.gold} style={styles.miniPlayerBtn} />
      ) : (
        <TouchableOpacity onPress={togglePlay} style={styles.miniPlayerBtn}>
          <Text style={styles.miniPlayerBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={stop} style={styles.miniPlayerBtn}>
        <Text style={styles.miniPlayerBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppNavigator() {
  const auth = useAuth();
  const stampsHook = useStamps();
  const favoritesHook = useFavorites();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.gold,
          background: Colors.bg,
          card: Colors.surface,
          text: Colors.text,
          border: Colors.border,
          notification: Colors.gold,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {props => <LandingScreen {...props} auth={auth} stampsHook={stampsHook} favoritesHook={favoritesHook} />}
        </Stack.Screen>
        <Stack.Screen name="Explore">
          {props => <HomeScreen {...props} stampsHook={stampsHook} />}
        </Stack.Screen>
        <Stack.Screen name="Recommendations">
          {props => (
            <RecommendationScreen
              navigation={props.navigation}
              route={props.route as any}
              auth={auth}
              stampsHook={stampsHook}
              favoritesHook={favoritesHook}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="TimeMachine" options={{ presentation: 'modal' }}>
          {props => (
            <TimeMachineScreen
              {...props}
              accessToken={auth.accessToken}
              service={auth.service}
              favoritesHook={favoritesHook}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="GenreSpotlight">
          {props => (
            <GenreSpotlightScreen
              {...props}
              service={auth.service}
              accessToken={auth.accessToken}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Insights">
          {props => <InsightsScreen {...props} auth={auth} />}
        </Stack.Screen>
        <Stack.Screen name="ArtistSearch">
          {props => (
            <ArtistSearchScreen
              {...props}
              service={auth.service}
              accessToken={auth.accessToken}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Saved">
          {props => <SavedScreen {...props} favoritesHook={favoritesHook} />}
        </Stack.Screen>
      </Stack.Navigator>
      <MiniPlayer />
    </NavigationContainer>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const onLayoutReady = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider onLayout={onLayoutReady}>
      <StatusBar style="light" />
      <AudioPlayerProvider>
        <AppNavigator />
      </AudioPlayerProvider>
      {!splashDone && <SplashAnimation onDone={() => setSplashDone(true)} />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderTopWidth: 1,
    borderTopColor: Colors.border2,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  miniPlayerInfo: { flex: 1 },
  miniPlayerTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  miniPlayerArtist: { color: Colors.text2, fontSize: 12, marginTop: 2 },
  miniPlayerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayerBtnText: { color: Colors.gold, fontSize: 14 },
});
