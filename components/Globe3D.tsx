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
  if (x * x + y * y + z * z > 9) {
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

// Fresnel atmosphere glow — visible rim-light effect around the globe edge
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

// Texture fade-in: start blue, smoothly reveal Earth texture on load
let texFade = 0;
let texLoaded = false;
const baseR = 0x22 / 255, baseG = 0x55 / 255, baseB = 0xbb / 255;

new THREE.TextureLoader().load(
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/land_ocean_ice_cloud_2048.jpg',
  tex => { globeMat.map = tex; globeMat.needsUpdate = true; texLoaded = true; }
);

// Quaternion rotation helpers — all rotations applied in world space via premultiply,
// which eliminates gimbal lock. No clamping — fully free rotation.
const _q = new THREE.Quaternion();
const _axis = new THREE.Vector3();

function rotateGlobe(dx, dy) {
  const angle = Math.sqrt(dx * dx + dy * dy);
  if (angle < 1e-6) return;
  _axis.set(dy / angle, dx / angle, 0).normalize();
  _q.setFromAxisAngle(_axis, angle);
  globe.quaternion.premultiply(_q);
}

// Interaction state
let isDragging = false;
let isTwoFinger = false;
let hadTwoFingers = false;
let lastX = 0, lastY = 0, startX = 0, startY = 0;
let velX = 0, velY = 0;
let lastTwistAngle = 0;
let autoRotate = true;
let idleTimer = null;

// Spin-for-surprise state
let spinning = false;
let spinT = 0;
let spinAxis = new THREE.Vector3(0, 1, 0);

const axisY = new THREE.Vector3(0, 1, 0);
const axisZ = new THREE.Vector3(0, 0, 1);

function getTouchAngle(t0, t1) {
  return Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
}

const canvas = renderer.domElement;

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  autoRotate = false;
  clearTimeout(idleTimer);
  velX = velY = 0;
  if (e.touches.length >= 2) {
    isTwoFinger = true;
    hadTwoFingers = true;
    isDragging = false;
    lastTwistAngle = getTouchAngle(e.touches[0], e.touches[1]);
  } else {
    isTwoFinger = false;
    isDragging = true;
    const t = e.touches[0];
    lastX = startX = t.clientX;
    lastY = startY = t.clientY;
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length >= 2) {
    isTwoFinger = true;
    isDragging = false;
    const newAngle = getTouchAngle(e.touches[0], e.touches[1]);
    let delta = newAngle - lastTwistAngle;
    if (delta > Math.PI)  delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    _q.setFromAxisAngle(axisZ, -delta);
    globe.quaternion.premultiply(_q);
    lastTwistAngle = newAngle;
  } else if (isDragging && !isTwoFinger) {
    const t = e.touches[0];
    const dx = t.clientX - lastX;
    const dy = t.clientY - lastY;
    rotateGlobe(dx * 0.007, dy * 0.007);
    velX = dx * 0.007;
    velY = dy * 0.007;
    lastX = t.clientX;
    lastY = t.clientY;
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  if (e.touches.length === 1 && isTwoFinger) {
    isTwoFinger = false;
    isDragging = true;
    const t = e.touches[0];
    lastX = startX = t.clientX;
    lastY = startY = t.clientY;
    velX = velY = 0;
    return;
  }
  if (e.touches.length === 0 && hadTwoFingers) {
    isTwoFinger = false;
    hadTwoFingers = false;
    isDragging = false;
    idleTimer = setTimeout(() => { autoRotate = true; }, 500);
    return;
  }
  hadTwoFingers = false;
  isTwoFinger = false;
  isDragging = false;
  const dx = lastX - startX;
  const dy = lastY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const speed = Math.sqrt(velX * velX + velY * velY);
  if (dist < 8) {
    idleTimer = setTimeout(() => { autoRotate = true; }, 500);
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('tap');
  } else if (speed > 0.09 && dist > 60) {
    const sp = Math.sqrt(velX * velX + velY * velY);
    spinAxis.set(velY / sp, velX / sp, 0).normalize();
    spinning = true;
    spinT = 0;
    autoRotate = false;
    velX = velY = 0;
  } else {
    idleTimer = setTimeout(() => { autoRotate = true; }, 500);
  }
});

window.addEventListener('message', e => {
  if (e.data === 'spin') {
    spinAxis.set(0, 1, 0);
    spinning = true;
    spinT = 0;
    autoRotate = false;
    velX = velY = 0;
    isDragging = false;
  }
});

function animate() {
  requestAnimationFrame(animate);

  // Smooth texture reveal
  if (texLoaded && texFade < 1) {
    texFade = Math.min(1, texFade + 0.016);
    globeMat.color.setRGB(
      baseR + (1 - baseR) * texFade,
      baseG + (1 - baseG) * texFade,
      baseB + (1 - baseB) * texFade
    );
    globeMat.needsUpdate = true;
  }

  if (spinning) {
    spinT += 0.018;
    _q.setFromAxisAngle(spinAxis, Math.sin(spinT * Math.PI) * 0.28);
    globe.quaternion.premultiply(_q);
    if (spinT >= 1) {
      spinning = false;
      idleTimer = setTimeout(() => { autoRotate = true; }, 1200);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('spinComplete');
    }
  } else if (!isDragging) {
    if (Math.abs(velX) > 0.0002 || Math.abs(velY) > 0.0002) {
      rotateGlobe(velX, velY);
      velX *= 0.93;
      velY *= 0.93;
    } else {
      velX = velY = 0;
    }
    if (autoRotate) {
      _q.setFromAxisAngle(axisY, 0.003);
      globe.quaternion.premultiply(_q);
    }
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
