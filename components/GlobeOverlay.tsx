import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

// Auto-generated from Natural Earth 110m land (world-atlas)
const LAND_POLYGONS: [number, number][][] = [
  [
    [-180,69],[-176.2,65.4],[179.5,62.6],[162.1,57.8],[156.8,57.4],[152.8,58.9],
    [141.4,52.2],[130,41.9],[129.5,35.6],[124.7,38.1],[120.8,40.6],[120.6,36.1],
    [119.6,25.7],[108,21.6],[104.8,9.2],[100.3,8.3],[104.2,1.3],[98.1,8.3],
    [94.5,17.3],[89.7,21.9],[80.3,15.9],[75.4,11.8],[68.2,23.7],[52.5,27.6],
    [50.2,26.3],[51.8,24],[58.7,23.6],[56.6,18.6],[49.6,14.7],[43.3,13.8],
    [39.8,20.3],[34.6,28.1],[34.1,26.1],[39.3,15.9],[44.6,10.4],[50.8,10.3],
    [40.3,-2.6],[40.3,-10.3],[34.7,-20.5],[32.8,-26.7],[25.8,-33.9],[18.3,-33.3],
    [13.9,-21.7],[13.7,-11.3],[9.4,-2.1],[7.1,4.5],[-3.3,5],[-13.1,8.2],
    [-16.7,12.4],[-17.1,21],[-11.7,28.1],[-3.6,35.4],[10.2,37.2],[13.9,32.7],
    [23.6,32.2],[33.8,31],[35.6,36.6],[27.3,40.4],[40.3,43.1],[35,45.7],
    [30.7,46.6],[26.4,40.2],[24,38.2],[20,39.9],[14.9,45.1],[15.9,42],
    [16.1,38],[10.2,43.9],[-0.3,39.3],[-7.9,36.8],[-9.4,43],[-1.9,49.8],
    [8.6,54.4],[9.6,55.5],[19.9,54.9],[25.9,59.6],[25.4,65.1],[15.9,56.1],
    [10.5,64.5],[36.5,69.1],[37.2,65.1],[46.3,66.7],[63.5,69.5],[72.8,72.2],
    [73.8,69.1],[80.5,73.6],[101,76.9],[110.6,74],[129.7,71.2],[159,70.9],
  ],
  [
    [-90.5,69.5],[-82.6,69.7],[-87.3,64.8],[-93.2,58.8],[-82.3,55.1],[-76.5,56.5],
    [-73.8,62.4],[-65.2,59.9],[-56.2,53.6],[-66.4,50.2],[-65.1,48.1],[-65.4,43.5],
    [-70.7,43],[-71.9,41.3],[-74.2,39.7],[-76,37.3],[-75.7,35.6],[-81.5,30.7],
    [-81.2,25.2],[-85.3,29.7],[-89.4,29.2],[-96.6,28.3],[-97.9,22.4],[-92.8,18.5],
    [-87.1,21.5],[-88.1,18.3],[-88.6,15.7],[-86.1,15.9],[-83.1,15],[-83.7,11.9],
    [-81.8,9],[-77.7,8.9],[-73.4,11.2],[-71.6,10.4],[-68.9,11.4],[-61.9,10.7],
    [-58.5,6.8],[-51.7,4.2],[-47.8,-0.6],[-36.5,-5.1],[-39,-13.8],[-43.1,-23],
    [-49.6,-29.2],[-57.8,-34.5],[-62.3,-38.8],[-63.5,-42.6],[-66,-48.1],[-70.8,-52.9],
    [-74.1,-46.9],[-73.7,-39.9],[-71.5,-28.9],[-76,-14.6],[-80.9,-5.7],[-80.6,-0.9],
    [-77.5,3.3],[-78.2,8.3],[-80.3,7.4],[-83,8.2],[-84.9,9.8],[-86.5,11.8],
    [-88.8,13.3],[-94.7,16.2],[-101.9,17.9],[-105.6,21.9],[-110.4,27.2],[-114.2,31.5],
    [-112.8,27.8],[-109.4,23.4],[-112.8,26.3],[-115.5,29.6],[-119.4,34.3],[-124.4,40.3],
    [-122.6,47.1],[-129.1,52.8],[-136.6,58.2],[-149.7,59.7],[-153.3,58.9],[-163.1,54.7],
    [-157.7,57.6],[-162,58.7],[-164.6,63.1],[-162.5,64.6],[-163.8,66.1],[-161.9,70.3],
    [-150.7,70.4],[-136.5,68.9],[-124.4,70.2],[-115.3,67.9],[-105.3,68.6],[-94.7,68.1],
  ],
  [
    [-180,-84.7],[-176.5,-84.2],[-173.1,-84.1],[-161.9,-85.1],[-143.1,-85],[-153.4,-83.2],
    [-156.8,-81.1],[-146.4,-80.3],[-155.3,-79.1],[-155.3,-77.2],[-147.6,-76.6],[-144.3,-75.5],
    [-136.4,-74.5],[-129.6,-74.5],[-121.1,-74.5],[-113.3,-74],[-107.6,-75.2],[-100.1,-74.9],
    [-103.7,-72.6],[-97.7,-73.6],[-90.1,-73.3],[-82.7,-73.6],[-76.9,-73.6],[-70.2,-73.1],
    [-67.6,-71.2],[-68,-69],[-66.7,-66.6],[-62,-64.6],[-57.8,-63.3],[-60.6,-64.3],
    [-62.1,-66.2],[-65.7,-68],[-62.6,-70],[-60.7,-73.2],[-64.4,-75.3],[-72.2,-76.7],
    [-74.3,-77.6],[-78,-79.2],[-70,-81],[-58.2,-83.2],[-47.3,-81.7],[-36.3,-81.1],
    [-29.7,-79.6],[-35.8,-78.3],[-28.9,-76.7],[-20,-75.7],[-16.5,-73.9],[-11.5,-72],
    [-7.4,-71.3],[-1.8,-71.2],[4.1,-70.9],[10.3,-70.5],[15.1,-70.4],[21.5,-70.1],
    [27.1,-70.5],[32.8,-69.4],[37.2,-69.2],[42.9,-68.5],[48.3,-67.4],[52.6,-66.1],
    [57.3,-66.7],[62.4,-68],[67.9,-67.9],[67.9,-70.7],[69.9,-72.3],[73.3,-70.4],
    [78.1,-69.1],[82.1,-67.4],[87.5,-66.9],[92.6,-67.2],[97.8,-67.2],[102.8,-65.6],
    [108.1,-67],[113.6,-65.9],[118.6,-67.2],[125.2,-66.7],[130.8,-66.4],[135.1,-65.3],
    [138.6,-66.9],[145.5,-66.9],[150.1,-68.6],[156.8,-69.4],[162.7,-70.7],[169.5,-71.2],
    [169.8,-73.2],[165,-75.1],[164.1,-77.5],[161.8,-79.2],[161.6,-81.7],[169.4,-83.8],
  ],
  [
    [-27.1,83.5],[-22.7,82.3],[-31.9,82.2],[-24.8,81.8],[-22.1,81.7],[-20.6,81.5],
    [-12.8,81.7],[-16.3,80.6],[-20,80.2],[-19.7,78.8],[-18.5,77],[-21.7,76.6],
    [-19.6,75.2],[-19.4,74.3],[-20.8,73.5],[-23.6,73.3],[-22.3,72.2],[-24.8,72.3],
    [-22.1,71.5],[-23.5,70.5],[-25.2,70.8],[-23.7,70.2],[-25,69.3],[-30.7,68.1],
    [-32.8,67.7],[-37,65.9],[-39.8,65.5],[-40.7,64.1],[-42.8,62.7],[-42.9,61.1],
    [-46.3,60.9],[-49.2,61.4],[-51.6,63.6],[-52.3,65.2],[-53.3,66.8],[-53,68.4],
    [-50.9,69.9],[-52.6,69.4],[-54.7,69.6],[-54.4,70.8],[-51.4,70.6],[-55,71.4],
    [-54.7,72.6],[-56.1,73.7],[-58.6,75.1],[-61.3,76.1],[-66.1,76.1],[-71.4,77],
    [-66.8,77.4],[-73.3,78],[-69.4,78.9],[-65.3,79.8],[-63.7,81.2],[-62.6,81.8],
    [-57.2,82.2],[-53,81.9],[-48,82.1],[-44.5,81.7],[-43.4,83.2],[-38.6,83.5],
  ],
  [
    [143.6,-13.8],[145.4,-15],[145.6,-16.8],[146.4,-19],[148.7,-20.6],[150.5,-22.6],
    [151.6,-24.1],[153.2,-26.6],[153.3,-29.5],[152.9,-31.6],[151,-34.3],[149.9,-37.1],
    [147.4,-38.2],[145.5,-38.6],[143.6,-38.8],[140.6,-38],[139.6,-36.1],[138.2,-34.4],
    [137.5,-34.1],[136.4,-34.1],[135.2,-33.9],[133,-32],[128.2,-31.9],[125.1,-32.7],
    [122.8,-33.9],[119.9,-34],[118,-35.1],[115.6,-34.4],[115.7,-33.3],[115.2,-30.6],
    [114.6,-28.5],[113.5,-26.5],[113.9,-25.9],[113.6,-24.7],[113.7,-23.6],[114.2,-22.5],
    [116.7,-20.7],[118.8,-20.3],[119.8,-20],[122.2,-18.2],[123.4,-17.3],[123.8,-16.1],
    [125.2,-14.7],[126.1,-14.1],[128.4,-14.9],[129.4,-14.4],[130.6,-12.5],[132.6,-11.6],
    [133,-11.4],[135.3,-12.2],[137,-12.4],[136.1,-13.7],[135.5,-15],[138.3,-16.8],
    [140.2,-17.7],[141.3,-16.4],[141.6,-14.3],[141.7,-12.4],[142.5,-10.7],[143.1,-11.9],
  ],
  [
    [-86.6,73.2],[-84.9,73.3],[-80.6,72.7],[-80.8,72.1],[-77.8,72.8],[-74.2,71.8],
    [-72.2,71.6],[-68.8,70.5],[-67.9,70.1],[-68.8,68.7],[-64.9,67.8],[-61.9,66.9],
    [-63.9,65],[-65.1,65.4],[-68,66.3],[-67.1,65.1],[-65.3,64.4],[-65,62.7],
    [-66.3,62.9],[-67.4,62.9],[-66.2,61.9],[-71,62.9],[-71.9,63.7],[-73.4,64.2],
    [-74.8,64.4],[-78.6,64.6],[-76,65.3],[-74.3,65.8],[-73.9,66.3],[-72.9,67.7],
    [-74.8,68.6],[-76.2,69.1],[-78.2,69.8],[-79,70.2],[-81.3,69.7],[-87.1,70.3],
    [-89.5,70.8],[-89.9,71.2],[-90.2,72.2],[-88.4,73.5],
  ],
  [
    [-68.5,83.1],[-63.7,82.9],[-61.9,82.6],[-64.3,81.9],[-66.8,81.7],[-65.5,81.5],
    [-69.5,80.6],[-71.2,79.8],[-73.9,79.4],[-76.9,79.3],[-76.2,79],[-76.3,78.2],
    [-77.9,77.9],[-79.8,77.2],[-79.6,77],[-77.9,76.8],[-83.2,76.5],[-86.1,76.3],
    [-89.5,76.5],[-89.6,77],[-88.3,77.9],[-85,77.5],[-86.3,78.2],[-87.2,78.8],
    [-85.4,79],[-86.5,79.7],[-84.2,80.2],[-83.4,80.1],[-84.1,80.6],[-87.6,80.5],
    [-90.2,81.3],[-91.6,81.9],[-90.1,82.1],[-87,82.3],[-85.5,82.7],[-83.2,82.3],
    [-81.1,83],[-79.3,83.1],[-75.7,83.1],[-72.8,83.2],
  ],
  [
    [134.1,-1.2],[135.5,-3.4],[136.3,-2.3],[138.3,-1.7],[139.9,-2.4],[141,-2.6],
    [144.6,-3.9],[145.8,-4.9],[146,-5.5],[147.9,-6.6],[147.2,-7.4],[148.1,-8],
    [149.3,-9.1],[149.3,-9.5],[149.7,-9.9],[150.7,-10.6],[150,-10.7],[148.9,-10.3],
    [147.1,-9.5],[146.6,-8.9],[144.7,-7.6],[143.3,-8.2],[143.4,-9],[142.1,-9.2],
    [140.1,-8.3],[139.1,-8.1],[137.6,-8.4],[138.7,-7.3],[138.4,-6.2],[136,-4.5],
    [133.7,-3.5],[133.4,-4],[132.8,-3.7],[132.8,-3.3],[133.1,-2.5],[133.7,-2.2],
    [132.2,-2.2],[130.9,-1.4],[131.9,-0.7],[132.4,-0.4],
  ],
  [
    [141,37.1],[140.6,36.3],[140.8,35.8],[140.3,35.1],[139,34.7],[137.2,34.6],
    [135.8,33.5],[135.1,33.8],[135.1,34.6],[133.3,34.4],[132.2,33.9],[131,33.9],
    [132,33.1],[131.3,31.5],[130.7,31],[130.2,31.4],[130.4,32.3],[129.8,32.6],
    [129.4,33.3],[130.4,33.6],[130.9,34.2],[131.9,34.8],[132.6,35.4],[134.6,35.7],
    [135.7,35.5],[136.7,37.3],[137.4,36.8],[138.9,37.8],[139.4,38.2],[140.1,39.4],
    [139.9,40.6],[140.3,41.2],[141.4,41.4],[141.9,40],[141.9,39.2],[141,38.2],
  ],
  [
    [105.8,-5.9],[104.7,-5.9],[103.9,-5],[102.6,-4.2],[102.2,-3.6],[101.4,-2.8],
    [100.9,-2.1],[100.1,-0.7],[99.3,0.2],[99,1],[98.6,1.8],[97.7,2.5],
    [97.2,3.3],[96.4,3.9],[95.4,5],[95.3,5.5],[95.9,5.4],[97.5,5.2],
    [98.4,4.3],[99.1,3.6],[99.7,3.2],[100.6,2.1],[101.7,2.1],[102.5,1.4],
    [103.1,0.6],[103.8,0.1],[103.4,-0.7],[104,-1.1],[104.4,-1.1],[104.5,-1.8],
    [104.9,-2.3],[105.6,-2.4],[106.1,-3.1],[105.9,-4.3],
  ],
  [
    [117.9,1.8],[119,0.9],[117.8,0.8],[117.5,0.1],[116.6,-1.5],[116.5,-2.5],
    [116.1,-4],[116,-3.7],[114.9,-4.1],[114.5,-3.5],[113.8,-3.4],[113.3,-3.1],
    [111.7,-3],[111,-3],[110.2,-2.9],[110.1,-1.6],[109.6,-1.3],[109.1,-0.5],
    [109,0.4],[109.1,1.3],[110.4,1.7],[111.2,1.9],[111.4,2.7],[111.8,2.9],
    [113,3.1],[113.7,3.9],[114.2,4.5],[114.6,4.9],[116.2,6.1],[116.7,6.9],
    [117.1,6.9],[117.6,6.4],[117.7,6],[118.3,5.7],[119.2,5.4],[119.1,5],
    [118.6,4.5],[117.9,4.1],[117.3,3.2],[118,2.3],
  ],
  [
    [50.1,-13.6],[50.5,-15.2],[50.2,-16],[49.7,-15.7],[49.8,-16.9],[49.4,-18],
    [48.5,-20.5],[47.9,-22.4],[47.1,-24.9],[45.4,-25.6],[44,-25],[43.7,-23.6],
    [43.3,-22.1],[43.9,-21.2],[44.4,-20.1],[44.2,-19],[44,-17.4],[44.4,-16.2],
    [45.5,-16],[45.9,-15.8],[46.9,-15.2],[48,-14.1],[48.3,-13.8],[48.9,-12.5],
    [49.5,-12.5],
  ],
  [
    [-114.2,73.1],[-112.4,73],[-109.9,73],[-109,72.6],[-107.7,72.1],[-107.5,73.2],
    [-105.4,72.7],[-104.8,71.7],[-102.8,70.5],[-101.1,69.6],[-102.1,69.1],[-102.4,68.8],
    [-106,69.2],[-109,68.8],[-113.3,68.5],[-113.9,69],[-116.1,69.2],[-116.7,70.1],
    [-113.7,70.2],[-112.4,70.4],[-116.5,70.5],[-118.4,70.9],[-117.7,71.3],[-119.4,71.6],
    [-117.9,72.7],
  ],
  [
    [57.5,70.7],[56.9,70.6],[53.7,70.8],[53.4,71.2],[51.6,71.5],[51.5,72],
    [52.5,72.2],[52.4,72.8],[54.4,73.6],[53.5,73.8],[55.7,74.3],[59,74.9],
    [62.4,75.1],[64.1,75.5],[66,75.6],[66.7,75.2],[66.1,74.9],[62.5,74.4],
    [59.5,73.9],[56.4,73],[54.9,72],[53.3,71],[53.5,70.2],
  ],
  [
    [-3,58.6],[-3.1,57.7],[-2,57.7],[-3.1,56],[-1.1,54.6],[0.2,53.3],
    [0.5,52.9],[1.6,52.1],[1.4,51.3],[0.5,50.8],[-2.5,50.5],[-3.6,50.2],
    [-5.2,50],[-5.8,50.2],[-3.4,51.4],[-5.3,52],[-4.8,52.8],[-4.6,53.5],
    [-2.9,54],[-4.8,54.8],[-5.1,55.1],[-5,55.8],[-5.6,56.3],[-5.8,57.8],
    [-5,58.6],
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
