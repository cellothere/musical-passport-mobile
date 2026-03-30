import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');
const BASE = Math.min(width, height) * 0.18;

interface Props {
  onDone: () => void;
}

export function SplashAnimation({ onDone }: Props) {
  // Individual ring animations
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  // Title / subtitle
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(18)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  // Exit
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const animateRing = (anim: Animated.Value, delay: number) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(anim, {
        toValue: 1,
        damping: 14,
        stiffness: 90,
        useNativeDriver: true,
      }),
    ]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    Animated.parallel([
      // Rings stagger in
      animateRing(ring1, 0),
      animateRing(ring2, 120),
      animateRing(ring3, 240),
      // Title fades up
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(titleY, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
      // Subtitle fades in
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Hold briefly, then fade out
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(screenOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start(onDone);
    });
  }, []);

  const ringStyle = (anim: Animated.Value, size: number, color: string) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1.5,
    borderColor: color,
    position: 'absolute' as const,
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Concentric rings */}
      <View style={styles.rings}>
        <Animated.View style={ringStyle(ring3, BASE * 3.8, 'rgba(240,168,50,0.18)')} />
        <Animated.View style={ringStyle(ring2, BASE * 2.5, 'rgba(240,168,50,0.32)')} />
        <Animated.View style={ringStyle(ring1, BASE * 1.3, 'rgba(240,168,50,0.65)')} />
        {/* Center dot */}
        <Animated.View style={[styles.centerDot, { opacity: ring1 }]} />
      </View>

      {/* Title */}
      <Animated.View style={[styles.textBlock, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        <Text style={styles.title}>Musical Passport</Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Discover the world through music
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#080c14',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  rings: {
    width: BASE * 4,
    height: BASE * 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  centerDot: {
    width: BASE * 0.38,
    height: BASE * 0.38,
    borderRadius: BASE * 0.19,
    backgroundColor: '#f0a832',
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#e8eef8',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#445570',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
