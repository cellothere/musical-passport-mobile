import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LandingScreen } from './screens/LandingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RecommendationScreen } from './screens/RecommendationScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { SavedScreen } from './screens/SavedScreen';
import { GenreSpotlightScreen } from './screens/GenreSpotlightScreen';
import { ArtistSearchScreen } from './screens/ArtistSearchScreen';
import { GenreArtistsScreen } from './screens/GenreArtistsScreen';
import { DecadeSpotlightScreen } from './screens/DecadeSpotlightScreen';
import { Colors } from './constants/colors';
import { useAuth } from './hooks/useAuth';
import { useStamps } from './hooks/useStamps';
import { useFavorites } from './hooks/useFavorites';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import { MiniPlayer } from './components/MiniPlayer';
import { SplashAnimation } from './components/SplashAnimation';
import { useNotifications } from './hooks/useNotifications';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { navigationRef } from './utils/navigationRef';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createStackNavigator();


function AppNavigator() {
  useNotifications();
  const auth = useAuth();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'country_of_day' && data?.country) {
        navigationRef.navigate('Recommendations', { country: data.country });
      }
    });
    return () => sub.remove();
  }, []);

  const pendingUrl = useRef<string | null>(null);
  const navReady = useRef(false);

  function maybeNavigateToInitialUrl() {
    if (navReady.current && pendingUrl.current) {
      handleDeepLink(pendingUrl.current);
      pendingUrl.current = null;
    }
  }

  useEffect(() => {
    // Handle deep link when app is already open
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    // Store cold-start URL — navigate once nav is ready (see onReady below).
    // onReady may fire before this promise resolves, so we check both sides.
    Linking.getInitialURL().then(url => {
      if (url) {
        pendingUrl.current = url;
        maybeNavigateToInitialUrl();
      }
    });
    return () => sub.remove();
  }, []);

  function handleDeepLink(url: string) {
    const parsed = Linking.parse(url);
    const path = decodeURIComponent((parsed.path ?? '').replace(/^\//, ''));

    // musical-passport://country/Brazil → hostname='country', path='Brazil'
    if (parsed.hostname === 'country') {
      if (!path) return;
      const artist = parsed.queryParams?.artist as string | undefined;
      const track = parsed.queryParams?.track as string | undefined;
      navigationRef.navigate('Recommendations', { country: path, highlightArtist: artist, highlightTrack: track });
    }

    // musical-passport://genre/Bossa%20Nova?country=Brazil → hostname='genre', path='Bossa Nova'
    if (parsed.hostname === 'genre') {
      if (!path) return;
      const country = decodeURIComponent((parsed.queryParams?.country as string) ?? '');
      navigationRef.navigate('GenreSpotlight', { genre: path, country });
    }
  }
  const stampsHook = useStamps();
  const favoritesHook = useFavorites();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => { navReady.current = true; maybeNavigateToInitialUrl(); }}
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
          {props => <HomeScreen {...props} stampsHook={stampsHook} auth={auth} favoritesHook={favoritesHook} />}
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
        <Stack.Screen name="GenreSpotlight">
          {props => (
            <GenreSpotlightScreen
              navigation={props.navigation as any}
              route={props.route as any}
              service={auth.service}
              favoritesHook={favoritesHook}
              auth={auth}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Insights">
          {props => <InsightsScreen {...props} auth={auth} favoritesHook={favoritesHook} stampsHook={stampsHook} />}
        </Stack.Screen>
        <Stack.Screen name="ArtistSearch">
          {props => (
            <ArtistSearchScreen
              {...props}
              service={auth.service}
              favoritesHook={favoritesHook}
              auth={auth}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="GenreArtists">
          {props => (
            <GenreArtistsScreen
              navigation={props.navigation as any}
              route={props.route as any}
              service={auth.service}
              favoritesHook={favoritesHook}
              auth={auth}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="DecadeSpotlight">
          {props => (
            <DecadeSpotlightScreen
              navigation={props.navigation as any}
              route={props.route as any}
              service={auth.service}
              favoritesHook={favoritesHook}
              auth={auth}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Saved">
          {props => <SavedScreen {...props} favoritesHook={favoritesHook} auth={auth} />}
        </Stack.Screen>
      </Stack.Navigator>
      <MiniPlayer />
    </NavigationContainer>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AudioPlayerProvider>
          <AppNavigator />
        </AudioPlayerProvider>
        {!splashDone && <SplashAnimation onDone={() => setSplashDone(true)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
