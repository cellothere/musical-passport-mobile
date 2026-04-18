import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useSettings } from '../hooks/useSettings';

const MIN_SHOW_MS = 2200;
const MIN_SHOW_MS_FAST = 900;
const { width: SW } = Dimensions.get('window');
const SIZE = Math.min(SW, 340);

const GLOBE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #040814; }
  canvas { display: block; }
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
<script>
const W = window.innerWidth, H = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x040814, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
camera.position.z = 3.4;

// Stars
const starCount = 1400;
const starPositions = new Float32Array(starCount * 3);
let s = 0;
while (s < starCount) {
  const x = (Math.random() - 0.5) * 22;
  const y = (Math.random() - 0.5) * 22;
  const z = (Math.random() - 0.5) * 22;
  if (x*x + y*y + z*z > 9) {
    starPositions[s*3] = x; starPositions[s*3+1] = y; starPositions[s*3+2] = z; s++;
  }
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.65 })));

const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
sun.position.set(5, 2, 4);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x1a2c44, 1.0));

const globeMat = new THREE.MeshPhongMaterial({ color: 0x2255bb, specular: 0x112233, shininess: 20 });
const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), globeMat);
scene.add(globe);

// Fresnel atmosphere glow
const atmMat = new THREE.ShaderMaterial({
  vertexShader: \`
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`
    varying vec3 vNormal;
    void main() {
      float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
      gl_FragColor = vec4(0.25, 0.58, 1.0, 1.0) * intensity;
    }
  \`,
  side: THREE.FrontSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 32), atmMat));

// Texture fade-in
let texFade = 0, texLoaded = false;
const baseR = 0x22/255, baseG = 0x55/255, baseB = 0xbb/255;

new THREE.TextureLoader().load(
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/land_ocean_ice_cloud_2048.jpg',
  tex => { globeMat.map = tex; globeMat.needsUpdate = true; texLoaded = true; }
);

function tick() {
  requestAnimationFrame(tick);
  if (texLoaded && texFade < 1) {
    texFade = Math.min(1, texFade + 0.016);
    globeMat.color.setRGB(
      baseR + (1 - baseR) * texFade,
      baseG + (1 - baseG) * texFade,
      baseB + (1 - baseB) * texFade
    );
    globeMat.needsUpdate = true;
  }
  globe.rotation.y += 0.003;
  renderer.render(scene, camera);
}
tick();
</script>
</body>
</html>`;

interface Props {
  visible: boolean;
  country: string;
  decade: string;
  onDone: () => void;
  onCancel?: () => void;
  dataReady?: boolean;
  instant?: boolean;
  subtitle?: string;
}

export function GlobeOverlay({ visible, country, decade, onDone, onCancel, dataReady, instant, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useSettings();
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const labelCountryOpacity = useRef(new Animated.Value(0)).current;
  const labelCountryY = useRef(new Animated.Value(10)).current;
  const labelDecadeOpacity = useRef(new Animated.Value(0)).current;
  const labelDecadeY = useRef(new Animated.Value(8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const [displayedSubtitle, setDisplayedSubtitle] = React.useState(subtitle);

  const minTimeDone = useRef(false);
  const dataReadyRef = useRef(false);
  const closeFired = useRef(false);

  // Re-assigned every render so timer callback and dataReady effect always call the latest version
  const tryCloseRef = useRef<() => void>(() => {});

  useEffect(() => {
    tryCloseRef.current = () => {
      if (minTimeDone.current && dataReadyRef.current && !closeFired.current) {
        closeFired.current = true;
        Animated.timing(overlayOpacity, {
          toValue: 0, duration: 450, useNativeDriver: true,
        }).start(() => onDone());
      }
    };
  });

  useEffect(() => {
    if (!visible) return;

    // Reset state
    overlayOpacity.setValue(1);
    labelCountryOpacity.setValue(0);
    labelCountryY.setValue(10);
    labelDecadeOpacity.setValue(0);
    labelDecadeY.setValue(8);
    minTimeDone.current = false;
    dataReadyRef.current = false;
    closeFired.current = false;

    const countryTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(labelCountryOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(labelCountryY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }, 600);

    const decadeTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(labelDecadeOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(labelDecadeY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 1000);

    const minTimer = setTimeout(() => {
      minTimeDone.current = true;
      tryCloseRef.current();
    }, MIN_SHOW_MS);

    return () => {
      clearTimeout(countryTimer);
      clearTimeout(decadeTimer);
      clearTimeout(minTimer);
    };
  }, [visible, country, decade]);

  // When instant becomes true mid-animation (cache hit), bypass the remaining min wait
  useEffect(() => {
    if (instant && visible) {
      minTimeDone.current = true;
      tryCloseRef.current();
    }
  }, [instant, visible]);

  // React to dataReady becoming true
  useEffect(() => {
    if (dataReady && visible) {
      dataReadyRef.current = true;
      tryCloseRef.current();
    }
  }, [dataReady, visible]);

  // Reduce-motion: skip rendering the globe and dismiss as soon as data is ready.
  useEffect(() => {
    if (!reduceMotion || !visible) return;
    closeFired.current = false;
    if (instant || dataReady) {
      closeFired.current = true;
      onDone();
    }
  }, [reduceMotion, visible, dataReady, instant]);

  // Crossfade subtitle when text changes
  useEffect(() => {
    if (!subtitle) {
      subtitleOpacity.setValue(0);
      setDisplayedSubtitle(undefined);
      return;
    }
    // Fade out → swap text → fade in
    Animated.timing(subtitleOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setDisplayedSubtitle(subtitle);
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  }, [subtitle]);

  if (reduceMotion) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, { top: insets.top + 12 }]}
            onPress={onCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
        <View style={styles.globeGlow}>
          <View style={styles.globeClip}>
            <WebView
              style={styles.webView}
              source={{ html: GLOBE_HTML }}
              originWhitelist={['*']}
              scrollEnabled={false}
              bounces={false}
              androidLayerType="hardware"
            />
          </View>
        </View>
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
          {displayedSubtitle ? (
            <Animated.Text style={[styles.labelSubtitle, { opacity: subtitleOpacity }]}>
              {displayedSubtitle}
            </Animated.Text>
          ) : null}
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
  cancelBtn: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  globeGlow: {
    shadowColor: '#4ab8c1',
    shadowOpacity: 0.55,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  globeClip: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
  },
  webView: {
    width: SIZE,
    height: SIZE,
    backgroundColor: 'transparent',
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
  labelSubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
