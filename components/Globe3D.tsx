import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface Globe3DHandle {
  spinForSurprise: () => void;
}

interface Props {
  onTap?: () => void;
  onSpinComplete?: () => void;
  size?: number;
}

const GLOBE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #080c14; }
  canvas { display: block; }
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
<script>
const W = window.innerWidth;
const H = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x080c14, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
camera.position.z = 3.4;

// Star field — placed in a shell to avoid spawning inside the globe
const starCount = 1400;
const starPositions = new Float32Array(starCount * 3);
let s = 0;
while (s < starCount) {
  const x = (Math.random() - 0.5) * 22;
  const y = (Math.random() - 0.5) * 22;
  const z = (Math.random() - 0.5) * 22;
  if (x * x + y * y + z * z > 9) { // minimum radius 3 from origin
    starPositions[s * 3]     = x;
    starPositions[s * 3 + 1] = y;
    starPositions[s * 3 + 2] = z;
    s++;
  }
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.65 })));

// Lighting
const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
sun.position.set(5, 2, 4);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x1a2c44, 1.0));

// Globe mesh — starts as blue ocean until texture loads
const globeGeo = new THREE.SphereGeometry(1, 64, 64);
const globeMat = new THREE.MeshPhongMaterial({ color: 0x2255bb, specular: 0x112233, shininess: 20 });
const globe = new THREE.Mesh(globeGeo, globeMat);
scene.add(globe);

// Atmospheric glow
const atmMat = new THREE.MeshPhongMaterial({ color: 0x55aaff, transparent: true, opacity: 0.07, side: THREE.FrontSide });
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.03, 32, 32), atmMat));

// Earth texture — Blue Marble composite
new THREE.TextureLoader().load(
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/land_ocean_ice_cloud_2048.jpg',
  tex => { globeMat.map = tex; globeMat.color.set(0xffffff); globeMat.needsUpdate = true; }
);

// Interaction state
let isDragging = false;
let lastX = 0, lastY = 0, startX = 0, startY = 0;
let velX = 0, velY = 0;
let autoRotate = true;
let idleTimer = null;

// Spin-for-surprise state
let spinning = false;
let spinT = 0;
let spinDir = 1;

const canvas = renderer.domElement;

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  isDragging = true;
  autoRotate = false;
  clearTimeout(idleTimer);
  lastX = startX = t.clientX;
  lastY = startY = t.clientY;
  velX = velY = 0;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!isDragging) return;
  const t = e.touches[0];
  const dx = t.clientX - lastX;
  const dy = t.clientY - lastY;
  globe.rotation.y += dx * 0.007;
  globe.rotation.x += dy * 0.007;
  globe.rotation.x = Math.max(-1.0, Math.min(1.0, globe.rotation.x));
  velX = dx * 0.007;
  velY = dy * 0.007;
  lastX = t.clientX;
  lastY = t.clientY;
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
  const dx = lastX - startX;
  const dy = lastY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 8) {
    // Short tap — explore
    idleTimer = setTimeout(() => { autoRotate = true; }, 500);
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('tap');
  } else if (Math.abs(velX) > 0.09 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
    // Fast horizontal flick — spin for surprise
    spinning = true;
    spinT = 0;
    spinDir = velX > 0 ? 1 : -1;
    autoRotate = false;
    velX = velY = 0;
  } else {
    idleTimer = setTimeout(() => { autoRotate = true; }, 500);
  }
});

window.addEventListener('message', e => {
  if (e.data === 'spin') {
    spinning = true;
    spinT = 0;
    spinDir = 1;
    autoRotate = false;
    velX = velY = 0;
    isDragging = false;
  }
});

function animate() {
  requestAnimationFrame(animate);

  if (spinning) {
    spinT += 0.018;
    globe.rotation.y += Math.sin(spinT * Math.PI) * 0.28 * spinDir;
    if (spinT >= 1) {
      spinning = false;
      idleTimer = setTimeout(() => { autoRotate = true; }, 1200);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('spinComplete');
    }
  } else if (!isDragging) {
    if (Math.abs(velX) > 0.0002) { globe.rotation.y += velX; velX *= 0.93; } else velX = 0;
    if (Math.abs(velY) > 0.0002) { globe.rotation.x += velY; velY *= 0.93; } else velY = 0;
    if (autoRotate) globe.rotation.y += 0.003;
  }

  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;

export const Globe3D = forwardRef<Globe3DHandle, Props>(
  ({ onTap, onSpinComplete, size = 280 }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      spinForSurprise: () => {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: 'spin' }));
          true;
        `);
      },
    }));

    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <WebView
          ref={webViewRef}
          style={{ width: size, height: size }}
          source={{ html: GLOBE_HTML }}
          originWhitelist={['*']}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
          onMessage={({ nativeEvent }) => {
            if (nativeEvent.data === 'tap') onTap?.();
            else if (nativeEvent.data === 'spinComplete') onSpinComplete?.();
          }}
        />
      </View>
    );
  }
);
