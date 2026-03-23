import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Modal, StyleSheet, View } from 'react-native';

const SHOW_MS = 5000; // how long to show the globe before fading out
const { width: SW } = Dimensions.get('window');
const SIZE = Math.min(SW, 340);

interface Props {
  visible: boolean;
  country: string;
  decade: string;
  onDone: () => void;
}

export function GlobeOverlay({ visible, country, decade, onDone }: Props) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const labelCountryOpacity = useRef(new Animated.Value(0)).current;
  const labelCountryY = useRef(new Animated.Value(10)).current;
  const labelDecadeOpacity = useRef(new Animated.Value(0)).current;
  const labelDecadeY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset
    overlayOpacity.setValue(0);
    labelCountryOpacity.setValue(0);
    labelCountryY.setValue(10);
    labelDecadeOpacity.setValue(0);
    labelDecadeY.setValue(8);

    // Fade in backdrop + globe
    Animated.timing(overlayOpacity, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    // Country label appears after 600ms
    const countryTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(labelCountryOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(labelCountryY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }, 600);

    // Decade label appears after 1000ms
    const decadeTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(labelDecadeOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(labelDecadeY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 1000);

    // Fade out and call onDone
    const doneTimer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0, duration: 450, useNativeDriver: true,
      }).start(() => onDone());
    }, SHOW_MS);

    return () => {
      clearTimeout(countryTimer);
      clearTimeout(decadeTimer);
      clearTimeout(doneTimer);
    };
  }, [visible, country, decade]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        <Image
          source={require('../assets/Rotating_earth_animated_transparent.gif')}
          style={styles.globe}
          resizeMode="contain"
        />
        <View style={styles.labels}>
          <Animated.Text style={[styles.labelCountry, {
            opacity: labelCountryOpacity,
            transform: [{ translateY: labelCountryY }],
          }]}>
            {country}
          </Animated.Text>
          <Animated.Text style={[styles.labelDecade, {
            opacity: labelDecadeOpacity,
            transform: [{ translateY: labelDecadeY }],
          }]}>
            {decade}
          </Animated.Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 20, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  globe: {
    width: SIZE,
    height: SIZE,
  },
  labels: {
    alignItems: 'center',
    gap: 8,
  },
  labelCountry: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  labelDecade: {
    color: 'rgba(200, 180, 100, 0.9)',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
