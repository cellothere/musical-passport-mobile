import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

// Simplified continent outlines as [longitude, latitude] arrays
const LAND_POLYGONS: [number, number][][] = [
  // Africa
  [
    [-17,15],[-12,8],[-8,5],[-3,5],[2,5],[9,4],[14,4],[18,4],
    [24,0],[30,-2],[38,-11],[40,-11],[50,-27],[44,-30],[38,-34],
    [27,-34],[19,-35],[14,-17],[12,-6],[9,4],[2,7],[-4,5],
    [-8,5],[-13,8],[-17,15],
  ],
  // Europe
  [
    [-10,36],[0,38],[3,43],[7,44],[14,46],[18,42],[22,38],[28,36],
    [35,36],[36,42],[32,46],[28,52],[20,56],[14,57],[10,58],[5,58],
    [0,56],[-4,52],[-5,48],[-3,44],[-8,44],[-10,38],[-10,36],
  ],
  // Asia (main landmass)
  [
    [26,38],[32,46],[38,44],[44,42],[50,42],[58,44],[68,52],[80,55],
    [90,52],[100,52],[110,55],[118,52],[126,48],[135,38],[132,34],
    [120,24],[110,22],[104,10],[100,2],[102,-2],[108,-8],[115,-8],
    [120,-5],[124,0],[130,0],[142,-5],[146,-18],[140,-36],[130,-32],
    [120,-34],[114,-22],[104,-2],[100,4],[96,16],[90,22],[80,28],
    [74,34],[68,38],[60,38],[50,40],[44,42],[38,44],[32,46],[26,38],
  ],
  // Australia
  [
    [114,-22],[116,-20],[120,-14],[122,-12],[126,-14],[130,-12],
    [136,-12],[138,-14],[142,-10],[145,-14],[148,-20],[152,-28],
    [153,-32],[152,-38],[148,-40],[140,-38],[135,-35],[130,-34],
    [122,-34],[116,-32],[114,-28],[112,-26],[114,-22],
  ],
  // North America
  [
    [-168,64],[-165,68],[-158,70],[-140,68],[-130,58],[-126,50],
    [-122,46],[-120,42],[-116,32],[-110,28],[-104,24],[-96,18],
    [-90,16],[-84,12],[-80,9],[-80,24],[-82,28],[-80,32],
    [-76,38],[-72,42],[-66,44],[-60,46],[-60,50],[-64,48],
    [-70,44],[-76,44],[-80,44],[-84,46],[-88,46],[-92,48],
    [-98,50],[-105,52],[-110,50],[-116,50],[-124,50],[-130,56],
    [-140,60],[-148,62],[-158,60],[-164,62],[-168,64],
  ],
  // Central America
  [
    [-80,9],[-84,10],[-88,14],[-90,18],[-92,20],[-95,18],[-88,12],[-80,9],
  ],
  // South America
  [
    [-80,8],[-76,8],[-62,10],[-52,6],[-50,2],[-48,0],
    [-38,-8],[-35,-12],[-35,-15],[-38,-22],[-46,-24],[-52,-32],
    [-58,-38],[-65,-45],[-68,-54],[-64,-56],[-60,-52],[-52,-42],
    [-50,-38],[-52,-32],[-58,-28],[-62,-22],[-64,-10],[-70,-2],
    [-76,0],[-80,6],[-80,8],
  ],
  // Greenland
  [
    [-30,82],[-42,80],[-52,78],[-56,76],[-60,72],[-55,70],
    [-46,65],[-42,65],[-38,68],[-30,74],[-22,78],[-20,80],[-30,82],
  ],
];

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'France': [2.3, 48.9], 'Germany': [10.5, 51.2], 'Sweden': [18.6, 60.1], 'Norway': [10.7, 59.9],
  'Portugal': [-8.2, 39.4], 'Spain': [-3.7, 40.4], 'Italy': [12.6, 41.9], 'Greece': [21.8, 37.0],
  'Poland': [19.1, 52.2], 'Iceland': [-22.0, 65.0], 'Finland': [24.9, 60.2], 'Ireland': [-8.0, 53.4],
  'Netherlands': [5.3, 52.1], 'Romania': [25.0, 45.9], 'Serbia': [21.0, 44.0], 'Ukraine': [32.0, 49.0],
  'Hungary': [19.0, 47.5], 'Czechia': [15.5, 49.8], 'Turkey': [35.2, 39.0],
  'Brazil': [-51.9, -14.2], 'Argentina': [-63.6, -38.4], 'Colombia': [-74.3, 4.6], 'Cuba': [-79.5, 22.0],
  'Mexico': [-102.5, 23.6], 'Chile': [-71.5, -35.7], 'Peru': [-75.0, -9.2], 'Jamaica': [-77.3, 18.1],
  'Venezuela': [-66.6, 6.4], 'Bolivia': [-64.9, -16.3], 'Ecuador': [-78.5, -1.8], 'Panama': [-80.8, 8.5],
  'Nigeria': [8.7, 9.1], 'Ghana': [-1.0, 7.9], 'Senegal': [-14.5, 14.5], 'Mali': [-1.6, 17.6],
  'Ethiopia': [40.5, 9.1], 'South Africa': [25.0, -29.0], 'Egypt': [30.8, 26.8], 'Cameroon': [12.4, 4.0],
  'Congo': [15.8, -0.2], 'Kenya': [37.9, 0.0], 'Algeria': [1.7, 28.0], 'Morocco': [-7.1, 31.8],
  'Tanzania': [34.9, -6.4], 'Lebanon': [35.9, 33.9], 'Iran': [53.7, 32.4], 'Israel': [34.9, 31.5],
  'Saudi Arabia': [45.1, 23.9], 'Armenia': [45.0, 40.1], 'Azerbaijan': [47.6, 40.1], 'Georgia': [43.4, 42.3],
  'Japan': [138.3, 36.2], 'South Korea': [127.8, 35.9], 'India': [78.9, 20.6], 'China': [104.2, 35.9],
  'Indonesia': [113.9, -0.8], 'Thailand': [101.0, 15.9], 'Vietnam': [106.3, 14.1], 'Philippines': [122.9, 12.9],
  'Pakistan': [69.3, 30.4], 'Bangladesh': [90.4, 23.7], 'Taiwan': [120.9, 23.7], 'Mongolia': [103.8, 46.9],
  'Australia': [133.8, -25.3], 'New Zealand': [172.5, -40.9], 'Papua New Guinea': [143.9, -6.3], 'Fiji': [178.1, -17.7],
  'USA': [-101.3, 39.3], 'Canada': [-96.8, 56.1], 'Haiti': [-72.3, 18.9],
  'Trinidad & Tobago': [-61.2, 10.7], 'Barbados': [-59.6, 13.2],
};

const ROTATE_MS = 1900;
const ZOOM_MS = 1100;
const TOTAL_MS = ROTATE_MS + ZOOM_MS;
const TILT = 22 * Math.PI / 180;
const R_START = 112;
const R_END = 164;

const { width: SW, height: SH } = Dimensions.get('window');
const SIZE = Math.min(SW, SH) * 0.72;
const cx = SIZE / 2;
const cy = SIZE / 2;

function easeInOut(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

function project(lon: number, lat: number, rotation: number, R: number) {
  const φ = (lon - rotation) * Math.PI / 180;
  const λ = lat * Math.PI / 180;
  const x3 = Math.cos(λ) * Math.sin(φ);
  const yRaw = Math.sin(λ);
  const zRaw = Math.cos(λ) * Math.cos(φ);
  const y3 = yRaw * Math.cos(TILT) - zRaw * Math.sin(TILT);
  const z3 = yRaw * Math.sin(TILT) + zRaw * Math.cos(TILT);
  return { x: cx + x3 * R, y: cy - y3 * R, z: z3 };
}

function buildGridPaths(rotation: number, R: number): string[] {
  const paths: string[] = [];

  // Latitude lines
  for (let lat = -80; lat <= 80; lat += 20) {
    let d = '';
    let drawing = false;
    for (let lon = -180; lon <= 180; lon += 4) {
      const p = project(lon, lat, rotation, R);
      if (p.z > 0) {
        d += drawing ? ` L${p.x.toFixed(1)},${p.y.toFixed(1)}` : `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        drawing = true;
      } else { drawing = false; }
    }
    if (d) paths.push(d);
  }

  // Longitude lines
  for (let lon = 0; lon < 360; lon += 20) {
    let d = '';
    let drawing = false;
    for (let lat = -90; lat <= 90; lat += 4) {
      const p = project(lon, lat, rotation, R);
      if (p.z > 0) {
        d += drawing ? ` L${p.x.toFixed(1)},${p.y.toFixed(1)}` : `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        drawing = true;
      } else { drawing = false; }
    }
    if (d) paths.push(d);
  }

  return paths;
}

function buildLandPaths(rotation: number, R: number): string[] {
  const result: string[] = [];
  for (const polygon of LAND_POLYGONS) {
    let d = '';
    let open = false;
    for (const [lon, lat] of polygon) {
      const p = project(lon, lat, rotation, R);
      if (p.z > 0) {
        d += open ? ` L${p.x.toFixed(1)},${p.y.toFixed(1)}` : `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        open = true;
      } else {
        if (open) { d += ' Z'; open = false; }
      }
    }
    if (open) d += ' Z';
    if (d.length > 4) result.push(d);
  }
  return result;
}

interface GlobeState {
  rotation: number;
  R: number;
  dotX: number;
  dotY: number;
  dotVisible: boolean;
  dotOpacity: number;
  gridPaths: string[];
  landPaths: string[];
}

interface Props {
  visible: boolean;
  country: string;
  decade: string;
  onDone: () => void;
}

export function GlobeOverlay({ visible, country, decade, onDone }: Props) {
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const labelCountryOpacity = useRef(new Animated.Value(0)).current;
  const labelCountryY = useRef(new Animated.Value(8)).current;
  const labelDecadeOpacity = useRef(new Animated.Value(0)).current;
  const labelDecadeY = useRef(new Animated.Value(6)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const [globe, setGlobe] = useState<GlobeState>({
    rotation: 0, R: R_START, dotX: cx, dotY: cy,
    dotVisible: false, dotOpacity: 0, gridPaths: [], landPaths: [],
  });

  useEffect(() => {
    if (!visible) return;

    const [targetLon, targetLat] = COUNTRY_COORDS[country] ?? [0, 0];
    const startRotation = targetLon - 115;

    // Reset
    overlayOpacity.setValue(0);
    labelCountryOpacity.setValue(0);
    labelCountryY.setValue(8);
    labelDecadeOpacity.setValue(0);
    labelDecadeY.setValue(6);
    pulseAnim.setValue(0);
    startRef.current = 0;

    // Fade in overlay
    Animated.timing(overlayOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();

    // Pulse loop for dot
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true })
    );

    let labelsShown = [false, false];

    function animate(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      let rotation: number, R: number;

      if (elapsed < ROTATE_MS) {
        const p = easeInOut(Math.min(elapsed / ROTATE_MS, 1));
        rotation = startRotation + (targetLon - startRotation) * p;
        R = R_START;

        if (p > 0.5 && !labelsShown[0]) {
          labelsShown[0] = true;
          pulseLoop.start();
          Animated.parallel([
            Animated.timing(labelCountryOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(labelCountryY, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]).start();
        }
        if (p > 0.65 && !labelsShown[1]) {
          labelsShown[1] = true;
          Animated.parallel([
            Animated.timing(labelDecadeOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(labelDecadeY, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]).start();
        }
      } else {
        const p = easeOut(Math.min((elapsed - ROTATE_MS) / ZOOM_MS, 1));
        rotation = targetLon;
        R = R_START + p * (R_END - R_START);
      }

      const dot = project(targetLon, targetLat, rotation, R);

      setGlobe({
        rotation, R,
        dotX: dot.x, dotY: dot.y,
        dotVisible: dot.z > 0.04,
        dotOpacity: dot.z > 0.04 ? Math.min(1, (dot.z - 0.04) / 0.25) : 0,
        gridPaths: buildGridPaths(rotation, R),
        landPaths: buildLandPaths(rotation, R),
      });

      if (elapsed < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        pulseLoop.stop();
        Animated.timing(overlayOpacity, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => {
          onDone();
        });
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      pulseLoop.stop();
    };
  }, [visible, country]);

  // Pulse ring radii from animation value
  const pulse1 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 29] });
  const pulse2 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 29] });
  const pulse3 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 29] });
  const pulseOp1 = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const pulseOp2 = pulseAnim.interpolate({ inputRange: [0, 0.333, 1], outputRange: [0, 0.5, 0] });
  const pulseOp3 = pulseAnim.interpolate({ inputRange: [0, 0.667, 1], outputRange: [0, 0.5, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="ocean" cx="40%" cy="40%" r="105%">
              <Stop offset="0%" stopColor="#1e3160" />
              <Stop offset="60%" stopColor="#0e1a38" />
              <Stop offset="100%" stopColor="#060c18" />
            </RadialGradient>
            <RadialGradient id="limb" cx="50%" cy="50%" r="50%">
              <Stop offset="62%" stopColor="#060c18" stopOpacity="0" />
              <Stop offset="88%" stopColor="#060c18" stopOpacity="0.72" />
              <Stop offset="100%" stopColor="#030810" stopOpacity="0.96" />
            </RadialGradient>
            <ClipPath id="globeClip">
              <Circle cx={cx} cy={cy} r={globe.R} />
            </ClipPath>
          </Defs>

          {/* Ocean fill + land + grid, clipped to globe */}
          <G clipPath="url(#globeClip)">
            <Circle cx={cx} cy={cy} r={globe.R} fill="url(#ocean)" />
            {globe.landPaths.map((d, i) => (
              <Path key={`land-${i}`} d={d} fill="rgba(48,88,48,0.88)" stroke="rgba(68,118,58,0.5)" strokeWidth={0.6} />
            ))}
            {globe.gridPaths.map((d, i) => (
              <Path key={i} d={d} stroke="rgba(90,140,230,0.15)" strokeWidth={0.6} fill="none" />
            ))}
            {/* Limb darkening — hides back-hemisphere artifacts at the edges */}
            <Circle cx={cx} cy={cy} r={globe.R} fill="url(#limb)" />
          </G>

          {/* Globe rim */}
          <Circle cx={cx} cy={cy} r={globe.R} stroke="rgba(74,158,255,0.5)" strokeWidth={1.5} fill="none" />

          {/* Pulsing rings — animated via native driver workaround */}
          {globe.dotVisible && (
            <>
              <AnimatedCircleSvg
                cx={globe.dotX} cy={globe.dotY}
                r={pulse1} strokeOpacity={pulseOp1}
                stroke="rgba(74,158,255,1)" strokeWidth={1.5} fill="none"
              />
              <AnimatedCircleSvg
                cx={globe.dotX} cy={globe.dotY}
                r={pulse2} strokeOpacity={pulseOp2}
                stroke="rgba(74,158,255,1)" strokeWidth={1.5} fill="none"
              />
              <AnimatedCircleSvg
                cx={globe.dotX} cy={globe.dotY}
                r={pulse3} strokeOpacity={pulseOp3}
                stroke="rgba(74,158,255,1)" strokeWidth={1.5} fill="none"
              />
              <Circle
                cx={globe.dotX} cy={globe.dotY} r={5}
                fill={`rgba(74,158,255,${(globe.dotOpacity * 0.92).toFixed(2)})`}
              />
              <Circle
                cx={globe.dotX} cy={globe.dotY} r={2.5}
                fill={`rgba(255,255,255,${globe.dotOpacity.toFixed(2)})`}
              />
            </>
          )}
        </Svg>

        {/* Labels */}
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
      </Animated.View>
    </Modal>
  );
}

// Thin wrapper to make SVG Circle accept Animated values
function AnimatedCircleSvg({ cx, cy, r, stroke, strokeWidth, fill, strokeOpacity }: {
  cx: number; cy: number;
  r: Animated.AnimatedInterpolation<number>;
  stroke: string; strokeWidth: number; fill: string;
  strokeOpacity: Animated.AnimatedInterpolation<number>;
}) {
  const [rVal, setRVal] = useState(5);
  const [opVal, setOpVal] = useState(0);

  useEffect(() => {
    const rId = (r as any).addListener(({ value }: { value: number }) => setRVal(value));
    const oId = (strokeOpacity as any).addListener(({ value: { value } }: any) => setOpVal(value));
    return () => {
      (r as any).removeListener(rId);
      (strokeOpacity as any).removeListener(oId);
    };
  }, []);

  return (
    <Circle
      cx={cx} cy={cy} r={rVal}
      stroke={stroke} strokeWidth={strokeWidth} fill={fill}
      strokeOpacity={opVal}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,12,20,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  labelCountry: {
    color: '#e8eef8',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  labelDecade: {
    color: '#7a92b4',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -12,
  },
});
