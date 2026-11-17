'use client';

/**
 * Room3DViewer
 * –––––––––––
 * A premium, interactive 3D Hotel Room Suite experience built with Three.js.
 * Features:
 *  - Dynamically customized architectural layouts, materials, color palettes,
 *    and furniture per room type category:
 *      * ROYAL_PALACE (Italian Calacatta marble, imperial velvet, crimson & gold silk, velvet sofa)
 *      * ALPINE_MOUNTAIN (Rustic cedar timber, mountain stone slate, forest wool, timber beams)
 *      * COASTAL_SEAVIEW (Sun-bleached ash hardwood, seafoam & turquoise textiles, coastal teak)
 *      * EXECUTIVE_SKYLINE (Smoked oak, midnight charcoal slate, executive sapphire blue, work desk)
 *      * DELUXE_SIGNATURE (Honey oak, IndiStay signature indigo runner, brass & ivory luxury)
 *  - GLB/GLTF model loader integration (custom furniture pieces).
 *  - Camera OrbitControls with smooth damping (rotate, zoom, pan).
 *  - Interactive Room Zone Navigator (Bed, Lounge, Desk, Balcony, Overview).
 *  - Daylight vs. Evening Mood Lighting toggle.
 *  - Auto-orbit cinematic tour mode.
 *  - Fullscreen API & reset view.
 *  - Resilient WebGL initialization & graceful error recovery.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  X,
  Maximize,
  Minimize,
  RotateCcw,
  Box,
  Sun,
  Moon,
  Play,
  Pause,
  Bed,
  Armchair,
  Tv,
  Eye,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Crown,
  Compass,
  Building,
} from 'lucide-react';

export type RoomThemeStyle =
  | 'ROYAL_PALACE'
  | 'ALPINE_MOUNTAIN'
  | 'COASTAL_SEAVIEW'
  | 'EXECUTIVE_SKYLINE'
  | 'DELUXE_SIGNATURE';

export interface Room3DViewerProps {
  modelUrl?: string;
  roomName: string;
  description?: string;
  themeStyle?: RoomThemeStyle;
  onClose: () => void;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function detectRoomTheme(name: string): RoomThemeStyle {
  const lower = (name || '').toLowerCase();
  if (/royal|palace|maharaja|heritage|monument|nizami|haveli|chamber|kohinoor|victorian/i.test(lower)) {
    return 'ROYAL_PALACE';
  }
  if (/mountain|alpine|himalayan|ridge|kanchenjunga|valley|doon|cedar|cabin/i.test(lower)) {
    return 'ALPINE_MOUNTAIN';
  }
  if (/sea|ocean|beach|azure|villa|chalet|lake|backwater|river|pool|portuguese|french/i.test(lower)) {
    return 'COASTAL_SEAVIEW';
  }
  if (/executive|business|club|skyline|regency|urban|estate/i.test(lower)) {
    return 'EXECUTIVE_SKYLINE';
  }
  return 'DELUXE_SIGNATURE';
}

interface ThemeConfig {
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  floorColor: number;
  floorRoughness: number;
  rugColor: number;
  wallColor: number;
  accentWallColor: number;
  bedFrameColor: number;
  runnerColor: number;
  accentCushionColor: number;
  metalColor: number;
  metalness: number;
  lampLightColor: number;
  sunColor: number;
  ambientColor: number;
  defaultModel: string;
}

const THEME_CONFIGS: Record<RoomThemeStyle, ThemeConfig> = {
  ROYAL_PALACE: {
    label: 'Imperial Palace Suite',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-400/40',
    badgeText: 'text-amber-300',
    floorColor: 0xf5f5f4, // Italian Calacatta White Marble
    floorRoughness: 0.12,
    rugColor: 0x7f1d1d, // Royal Velvet Crimson & Gold Tapestry
    wallColor: 0xfbf9f5, // Ornate Alabaster
    accentWallColor: 0x4a0e17, // Deep Imperial Velvet Burgundy
    bedFrameColor: 0x2b1d16, // Carved Antique Rosewood
    runnerColor: 0xd4af37, // Royal Silk Gold Brocade
    accentCushionColor: 0x991b1b, // Ruby Silk
    metalColor: 0xf59e0b, // 24K Royal Gold
    metalness: 0.95,
    lampLightColor: 0xff9933,
    sunColor: 0xffedd5,
    ambientColor: 0xfef3c7,
    defaultModel: '/models/glamvelvetsofa.glb',
  },
  ALPINE_MOUNTAIN: {
    label: 'Alpine Mountain Lodge',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-400/40',
    badgeText: 'text-emerald-300',
    floorColor: 0x5c381e, // Rustic Hand-Hewn Pine Planks
    floorRoughness: 0.55,
    rugColor: 0xd6d3d1, // Knitted Wool Mountain Rug
    wallColor: 0xe7e5e4, // Mountain Ash
    accentWallColor: 0x292524, // Stone Slate Hearth Wall
    bedFrameColor: 0x452312, // Timber Pine Beams
    runnerColor: 0x166534, // Forest Pine Green Wool
    accentCushionColor: 0xb45309, // Amber Wool
    metalColor: 0x57534e, // Burnished Bronze / Cast Iron
    metalness: 0.65,
    lampLightColor: 0xff8822,
    sunColor: 0xfff7ed,
    ambientColor: 0xf5f5f4,
    defaultModel: '/models/luxury-armchair.glb',
  },
  COASTAL_SEAVIEW: {
    label: 'Coastal Beach Villa',
    badgeBg: 'bg-cyan-950/80',
    badgeBorder: 'border-cyan-400/40',
    badgeText: 'text-cyan-300',
    floorColor: 0xd6c7b2, // Sun-Bleached Ash Hardwood
    floorRoughness: 0.35,
    rugColor: 0xe6dfd3, // Woven Natural Sea-Grass Mat
    wallColor: 0xf8fafc, // Pure White Coastal Stucco
    accentWallColor: 0x0e7490, // Deep Sea Lagoon Cyan
    bedFrameColor: 0x78563a, // Natural Teak Driftwood
    runnerColor: 0x06b6d4, // Caribbean Ocean Cyan
    accentCushionColor: 0xf59e0b, // Warm Sunset Orange
    metalColor: 0x94a3b8, // Marine Brushed Chrome
    metalness: 0.85,
    lampLightColor: 0xfef08a,
    sunColor: 0xfffbeb,
    ambientColor: 0xe0f2fe,
    defaultModel: '/models/glamvelvetsofa.glb',
  },
  EXECUTIVE_SKYLINE: {
    label: 'Skyline Business Suite',
    badgeBg: 'bg-blue-950/80',
    badgeBorder: 'border-blue-400/40',
    badgeText: 'text-blue-300',
    floorColor: 0x261b16, // Dark Espresso Smoked Oak
    floorRoughness: 0.22,
    rugColor: 0x334155, // Minimalist Charcoal Slate Rug
    wallColor: 0xf1f5f9, // Architectural White
    accentWallColor: 0x0f172a, // Midnight Obsidian Slate
    bedFrameColor: 0x18181b, // Matte Black Platform
    runnerColor: 0x2563eb, // Metropolitan Sapphire Blue
    accentCushionColor: 0x64748b, // Brushed Silver Velvet
    metalColor: 0xe2e8f0, // Polished Titanium Platinum
    metalness: 0.9,
    lampLightColor: 0xfff8ee,
    sunColor: 0xffffff,
    ambientColor: 0xe2e8f0,
    defaultModel: '/models/luxury-armchair.glb',
  },
  DELUXE_SIGNATURE: {
    label: 'Signature Deluxe Suite',
    badgeBg: 'bg-indigo-950/80',
    badgeBorder: 'border-indigo-400/40',
    badgeText: 'text-indigo-300',
    floorColor: 0x8b5a2b, // Honey Golden Oak Hardwood
    floorRoughness: 0.35,
    rugColor: 0xded8ce, // Plush Ivory Wool
    wallColor: 0xf1ece4, // Warm Linen
    accentWallColor: 0x2b3e4a, // Signature IndiStay Navy Slate
    bedFrameColor: 0x3d312a, // Warm Walnut Wood
    runnerColor: 0x4f46e5, // Signature IndiStay Indigo
    accentCushionColor: 0x6366f1, // Royal Lavender Velvet
    metalColor: 0xd4af37, // Polished Brass
    metalness: 0.85,
    lampLightColor: 0xffb86c,
    sunColor: 0xfff5e6,
    ambientColor: 0xfff7ed,
    defaultModel: '/models/luxury-armchair.glb',
  },
};

type LightingMode = 'DAYLIGHT' | 'EVENING';
type RoomZone = 'OVERVIEW' | 'BED' | 'LOUNGE' | 'DESK' | 'BALCONY';

export default function Room3DViewer({
  modelUrl,
  roomName,
  description,
  themeStyle,
  onClose,
}: Room3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const roomGroupRef = useRef<THREE.Group | null>(null);

  // Active theme configuration
  const activeThemeKey: RoomThemeStyle = themeStyle || detectRoomTheme(roomName);
  const theme = THEME_CONFIGS[activeThemeKey] || THEME_CONFIGS.DELUXE_SIGNATURE;

  // Lighting references for mode switching
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const lampLightsRef = useRef<THREE.PointLight[]>([]);

  // Orbit navigation state
  const isOrbitDragging = useRef(false);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  // Target camera state
  const spherical = useRef({ theta: 0.8, phi: 1.1, radius: 11 });
  const targetLookAt = useRef(new THREE.Vector3(0, 1.2, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  // Auto-rotation toggle
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const autoRotateRef = useRef(false);
  useEffect(() => {
    autoRotateRef.current = isAutoRotating;
  }, [isAutoRotating]);

  const [lightingMode, setLightingMode] = useState<LightingMode>('DAYLIGHT');
  const [activeZone, setActiveZone] = useState<RoomZone>('OVERVIEW');
  const [supportsWebGL] = useState(checkWebGLSupport);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── BUILD 3D ARCHITECTURAL HOTEL SUITE ──────────────────────────────────────
  const buildHotelRoomScene = useCallback(
    (scene: THREE.Scene) => {
      try {
        const room = new THREE.Group();
        roomGroupRef.current = room;

        // Dynamic Materials Palette based on Theme
        const floorMat = new THREE.MeshStandardMaterial({
          color: theme.floorColor,
          roughness: theme.floorRoughness,
          metalness: activeThemeKey === 'ROYAL_PALACE' ? 0.15 : 0.05,
        });
        const rugMat = new THREE.MeshStandardMaterial({
          color: theme.rugColor,
          roughness: 0.9,
        });
        const wallMat = new THREE.MeshStandardMaterial({
          color: theme.wallColor,
          roughness: 0.8,
        });
        const accentWallMat = new THREE.MeshStandardMaterial({
          color: theme.accentWallColor,
          roughness: 0.6,
        });
        const bedFrameMat = new THREE.MeshStandardMaterial({
          color: theme.bedFrameColor,
          roughness: 0.5,
        });
        const mattressMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.8,
        });
        const duvetMat = new THREE.MeshStandardMaterial({
          color: 0xfafafa,
          roughness: 0.7,
        });
        const runnerMat = new THREE.MeshStandardMaterial({
          color: theme.runnerColor,
          roughness: 0.45,
          metalness: activeThemeKey === 'ROYAL_PALACE' ? 0.2 : 0.0,
        });
        const accentCushionMat = new THREE.MeshStandardMaterial({
          color: theme.accentCushionColor,
          roughness: 0.5,
        });
        const metalTrimMat = new THREE.MeshStandardMaterial({
          color: theme.metalColor,
          metalness: theme.metalness,
          roughness: 0.2,
        });
        const nightstandTopMat = new THREE.MeshStandardMaterial({
          color: activeThemeKey === 'ROYAL_PALACE' ? 0xf5f5f4 : 0xefedea,
          roughness: 0.15,
          metalness: 0.1,
        });
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 0.85,
          opacity: 1,
          transparent: true,
          roughness: 0.05,
          ior: 1.5,
        });
        const tvScreenMat = new THREE.MeshBasicMaterial({
          color: 0x050810,
        });

        // 1. FLOOR (8m x 7m)
        const floorGeo = new THREE.BoxGeometry(8, 0.2, 7);
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(0, -0.1, 0);
        floorMesh.receiveShadow = true;
        room.add(floorMesh);

        // 2. LUXURY PLUSH AREA RUG (4.5m x 4.2m)
        const rugGeo = new THREE.BoxGeometry(4.5, 0.03, 4.2);
        const rugMesh = new THREE.Mesh(rugGeo, rugMat);
        rugMesh.position.set(0, 0.015, -0.2);
        rugMesh.receiveShadow = true;
        room.add(rugMesh);

        // 3. WALLS
        // Back Accent Wall (Headboard wall)
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 0.2), accentWallMat);
        backWall.position.set(0, 1.6, -3.5);
        backWall.receiveShadow = true;
        room.add(backWall);

        // Left Wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 7), wallMat);
        leftWall.position.set(-4, 1.6, 0);
        leftWall.receiveShadow = true;
        room.add(leftWall);

        // Right Wall (with Balcony window cutout)
        const rightWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 2.2), wallMat);
        rightWall1.position.set(4, 1.6, -2.4);
        rightWall1.receiveShadow = true;
        room.add(rightWall1);

        const rightWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 1.5), wallMat);
        rightWall2.position.set(4, 1.6, 2.75);
        rightWall2.receiveShadow = true;
        room.add(rightWall2);

        // Balcony Glass Sliding Doors
        const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.7, 3.2), glassMat);
        glassDoor.position.set(3.98, 1.4, 0.35);
        room.add(glassDoor);

        // Balcony Railing outside
        const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 3.4), floorMat);
        balconyFloor.position.set(5, -0.075, 0.35);
        room.add(balconyFloor);

        const railing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 3.4), metalTrimMat);
        railing.position.set(5.95, 0.55, 0.35);
        room.add(railing);

        // 4. MASTER HOTEL BED (King Size)
        const bedGroup = new THREE.Group();
        bedGroup.position.set(0, 0, -2);

        // Upholstered Headboard
        const headboardHeight = activeThemeKey === 'ROYAL_PALACE' ? 1.8 : 1.4;
        const headboard = new THREE.Mesh(
          new THREE.BoxGeometry(2.6, headboardHeight, 0.15),
          bedFrameMat
        );
        headboard.position.set(0, headboardHeight / 2 + 0.2, -1.35);
        headboard.castShadow = true;
        headboard.receiveShadow = true;
        bedGroup.add(headboard);

        // Bed Frame
        const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 2.3), bedFrameMat);
        bedFrame.position.set(0, 0.2, -0.2);
        bedFrame.castShadow = true;
        bedFrame.receiveShadow = true;
        bedGroup.add(bedFrame);

        // Mattress
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.35, 2.15), mattressMat);
        mattress.position.set(0, 0.5, -0.2);
        mattress.castShadow = true;
        bedGroup.add(mattress);

        // Duvet
        const duvet = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 1.6), duvetMat);
        duvet.position.set(0, 0.7, 0.05);
        duvet.castShadow = true;
        bedGroup.add(duvet);

        // Bed Runner (Theme Specific Color)
        const runner = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.03, 0.5), runnerMat);
        runner.position.set(0, 0.76, 0.55);
        bedGroup.add(runner);

        // Sleeping Pillows & Accent Cushions
        for (let i = -0.55; i <= 0.55; i += 1.1) {
          const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.45), mattressMat);
          pillow.position.set(i, 0.75, -0.9);
          pillow.rotation.x = 0.25;
          pillow.castShadow = true;
          bedGroup.add(pillow);

          const accent = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.35), accentCushionMat);
          accent.position.set(i, 0.8, -0.7);
          accent.rotation.x = 0.35;
          accent.castShadow = true;
          bedGroup.add(accent);
        }
        room.add(bedGroup);

        // 5. NIGHTSTANDS & GLOWING LAMPS
        lampLightsRef.current = [];
        [-1.6, 1.6].forEach((xPos) => {
          const stand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.5), nightstandTopMat);
          stand.position.set(xPos, 0.25, -3.2);
          stand.castShadow = true;
          stand.receiveShadow = true;
          room.add(stand);

          const lampStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.08, 0.4, 16),
            metalTrimMat
          );
          lampStem.position.set(xPos, 0.7, -3.2);
          room.add(lampStem);

          const shade = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.22, 0.22, 16),
            new THREE.MeshStandardMaterial({
              color: 0xfffaea,
              emissive: theme.lampLightColor,
              emissiveIntensity: 0.6,
            })
          );
          shade.position.set(xPos, 0.9, -3.2);
          room.add(shade);

          const lampLight = new THREE.PointLight(theme.lampLightColor, 1.2, 5);
          lampLight.position.set(xPos, 0.9, -3.1);
          lampLight.castShadow = true;
          lampLight.shadow.bias = -0.002;
          room.add(lampLight);
          lampLightsRef.current.push(lampLight);
        });

        // 6. EXECUTIVE MEDIA CONSOLE & WALL-MOUNTED TV (Front Wall)
        const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 0.45), bedFrameMat);
        consoleTable.position.set(0, 0.25, 3.2);
        consoleTable.castShadow = true;
        room.add(consoleTable);

        const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.35, 0.06), metalTrimMat);
        tvFrame.position.set(0, 1.7, 3.35);
        room.add(tvFrame);

        const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.25, 0.02), tvScreenMat);
        tvScreen.position.set(0, 1.7, 3.32);
        room.add(tvScreen);

        // 7. LOUNGE SEATING CORNER (Left front)
        const loungeGroup = new THREE.Group();
        loungeGroup.position.set(-2.4, 0, 1.2);

        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.85), runnerMat);
        chairSeat.position.set(0, 0.35, 0);
        chairSeat.castShadow = true;
        loungeGroup.add(chairSeat);

        const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.2), runnerMat);
        chairBack.position.set(0, 0.8, -0.35);
        chairBack.castShadow = true;
        loungeGroup.add(chairBack);

        [-0.48, 0.48].forEach((xSide) => {
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.8), runnerMat);
          arm.position.set(xSide, 0.55, 0);
          arm.castShadow = true;
          loungeGroup.add(arm);
        });

        const tableTop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.05, 32),
          nightstandTopMat
        );
        tableTop.position.set(0.95, 0.4, 0.3);
        tableTop.castShadow = true;
        loungeGroup.add(tableTop);

        const tableLeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.15, 0.38, 16),
          metalTrimMat
        );
        tableLeg.position.set(0.95, 0.2, 0.3);
        loungeGroup.add(tableLeg);

        room.add(loungeGroup);

        // 8. MODERN ART CANVAS ON LEFT WALL
        const artFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 1.8), metalTrimMat);
        artFrame.position.set(-3.88, 1.8, -1.2);
        room.add(artFrame);

        const artCanvas = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 1.1, 1.7),
          new THREE.MeshStandardMaterial({
            color: theme.runnerColor,
            roughness: 0.3,
          })
        );
        artCanvas.position.set(-3.86, 1.8, -1.2);
        room.add(artCanvas);

        scene.add(room);
      } catch (e) {
        console.warn('[IndiStay 3D] buildHotelRoomScene warning:', e);
      }
    },
    [theme, activeThemeKey]
  );

  // ─── CAMERA ZONE TELEPORTATION ────────────────────────────────────────
  const applyZone = (zone: RoomZone) => {
    setActiveZone(zone);
    switch (zone) {
      case 'OVERVIEW':
        spherical.current = { theta: 0.8, phi: 1.1, radius: 11 };
        targetLookAt.current.set(0, 1.2, 0);
        break;
      case 'BED':
        spherical.current = { theta: 0.1, phi: 1.2, radius: 4.8 };
        targetLookAt.current.set(0, 0.8, -2);
        break;
      case 'LOUNGE':
        spherical.current = { theta: -1.2, phi: 1.15, radius: 4.2 };
        targetLookAt.current.set(-2.2, 0.7, 1.2);
        break;
      case 'DESK':
        spherical.current = { theta: 3.1, phi: 1.2, radius: 5.5 };
        targetLookAt.current.set(0, 1.4, 3.2);
        break;
      case 'BALCONY':
        spherical.current = { theta: 1.5, phi: 1.3, radius: 5.8 };
        targetLookAt.current.set(4, 1.2, 0.35);
        break;
    }
  };

  // ─── LIGHTING PRESET TOGGLE ──────────────────────────────────────────────────
  const toggleLighting = () => {
    const nextMode: LightingMode = lightingMode === 'DAYLIGHT' ? 'EVENING' : 'DAYLIGHT';
    setLightingMode(nextMode);

    if (nextMode === 'EVENING') {
      if (sunLightRef.current) sunLightRef.current.intensity = 0.2;
      if (ambientLightRef.current) ambientLightRef.current.intensity = 0.35;
      lampLightsRef.current.forEach((l) => (l.intensity = 2.4));
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x090d16);
    } else {
      if (sunLightRef.current) sunLightRef.current.intensity = 1.6;
      if (ambientLightRef.current) ambientLightRef.current.intensity = 0.85;
      lampLightsRef.current.forEach((l) => (l.intensity = 1.0));
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x0f172a);
    }
  };

  // ─── THREE.JS INITIALIZATION ────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    if (!supportsWebGL) {
      setLoadError('WebGL graphics acceleration is not supported or enabled on your browser.');
      setIsLoading(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = Math.max(container.clientWidth || window.innerWidth, 200);
    const height = Math.max(container.clientHeight || window.innerHeight, 200);

    // Prevent browser context loss abort
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[IndiStay 3D] WebGL context lost handled gracefully.');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer with safe try/catch
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('[IndiStay 3D] WebGLRenderer creation caught:', err);
      setLoadError('Unable to create 3D graphics context. Hardware acceleration may be disabled.');
      setIsLoading(false);
      return;
    }

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(theme.ambientColor, 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Sun directional light coming through balcony window
    const sunLight = new THREE.DirectionalLight(theme.sunColor, 1.6);
    sunLight.position.set(9, 7, 2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Fill soft sky bounce
    const fillLight = new THREE.DirectionalLight(theme.sunColor, 0.45);
    fillLight.position.set(-8, 5, -5);
    scene.add(fillLight);

    // 5. Build Complete Architectural Hotel Suite
    buildHotelRoomScene(scene);

    // 6. Load custom or theme-specific GLB model if available
    const activeModelPath = modelUrl || theme.defaultModel;
    if (activeModelPath && activeModelPath.endsWith('.glb')) {
      const loader = new GLTFLoader();
      try {
        loader.load(
          activeModelPath,
          (gltf) => {
            try {
              const model = gltf.scene;
              model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });

              if (activeModelPath.includes('sofa')) {
                // GlamVelvetSofa position in living lounge corner
                model.position.set(1.5, 0, 1.2);
                model.scale.set(0.0018, 0.0018, 0.0018);
                model.rotation.y = -Math.PI / 4;
              } else {
                // Armchair position
                model.position.set(1.8, 0, 1.2);
                model.scale.set(1.2, 1.2, 1.2);
              }

              scene.add(model);
            } catch (e) {
              console.warn('[IndiStay 3D] GLTF model placement notice:', e);
            }
          },
          undefined,
          (err) => console.warn('[IndiStay 3D] Optional GLB load notice:', err)
        );
      } catch (err) {
        console.warn('[IndiStay 3D] GLTFLoader caught:', err);
      }
    }

    setIsLoading(false);

    // 7. Animation Loop with Smooth Camera Interpolation
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      try {
        if (autoRotateRef.current) {
          spherical.current.theta += 0.003;
        }

        currentLookAt.current.lerp(targetLookAt.current, 0.08);

        const { theta, phi, radius } = spherical.current;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const look = currentLookAt.current;
        camera.position.set(
          look.x + radius * sinPhi * Math.sin(theta),
          look.y + radius * cosPhi,
          look.z + radius * sinPhi * Math.cos(theta)
        );
        camera.lookAt(look);

        renderer.render(scene, camera);
      } catch (e) {
        // Safe catch frame render warnings
      }
    };
    animate();
    rafRef.current = animId;

    // 8. Resize Listener
    const onResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = Math.max(containerRef.current.clientWidth, 200);
      const h = Math.max(containerRef.current.clientHeight, 200);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      // Dispose room geometry and materials
      if (roomGroupRef.current) {
        roomGroupRef.current.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [supportsWebGL, modelUrl, theme, activeThemeKey, buildHotelRoomScene]);

  // ─── MOUSE DRAG & TOUCH CONTROLS ─────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      isPanning.current = true;
    } else {
      isOrbitDragging.current = true;
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isOrbitDragging.current && !isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;

    if (isOrbitDragging.current) {
      spherical.current.theta -= dx * 0.008;
      spherical.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.02, spherical.current.phi - dy * 0.008)
      );
    } else if (isPanning.current) {
      const panSpeed = 0.006 * (spherical.current.radius / 10);
      const right = new THREE.Vector3();
      if (cameraRef.current) {
        cameraRef.current.getWorldDirection(right);
        right.cross(cameraRef.current.up).normalize();
        targetLookAt.current.addScaledVector(right, -dx * panSpeed);
        targetLookAt.current.y += dy * panSpeed;
      }
    }

    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isOrbitDragging.current = false;
    isPanning.current = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    spherical.current.radius = Math.max(
      2.5,
      Math.min(18, spherical.current.radius * (e.deltaY > 0 ? 1.08 : 0.92))
    );
  };

  // ─── TOUCH EVENTS ────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isOrbitDragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isOrbitDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isOrbitDragging.current) {
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      spherical.current.theta -= dx * 0.008;
      spherical.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.02, spherical.current.phi - dy * 0.008)
      );
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = lastTouchDist.current - dist;
      spherical.current.radius = Math.max(2.5, Math.min(18, spherical.current.radius * (1 + delta * 0.005)));
      lastTouchDist.current = dist;
    }
  };

  const onTouchEnd = () => {
    isOrbitDragging.current = false;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Escape key listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!supportsWebGL) {
    return (
      <div className="fixed inset-0 z-[75] bg-slate-950 flex flex-col items-center justify-center text-white p-8 animate-in fade-in">
        <AlertCircle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">3D Interactive Suite</h2>
        <p className="text-slate-400 text-center max-w-md text-xs mb-6 leading-relaxed">
          WebGL graphics acceleration is currently not available on this browser. All room photos, pricing, and reservation options remain fully available.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Back to Room Details
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[70] bg-slate-950 flex flex-col select-none overflow-hidden"
      style={{ cursor: isOrbitDragging.current ? 'grabbing' : 'grab' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Top Bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-white font-extrabold text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-md">
              {roomName}
            </span>
            <span
              className={`hidden sm:inline text-xs font-bold px-2.5 py-0.5 rounded-md border shadow-xs ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}
            >
              {theme.label}
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-300 font-medium mt-0.5 hidden md:block">
              {description}
            </p>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Lighting Preset Toggle */}
          <button
            type="button"
            onClick={toggleLighting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
            title={`Switch to ${lightingMode === 'DAYLIGHT' ? 'Evening Mood' : 'Daylight'}`}
          >
            {lightingMode === 'DAYLIGHT' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Daylight</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Evening</span>
              </>
            )}
          </button>

          {/* Auto Rotation Tour Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all cursor-pointer ${
              isAutoRotating
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/40'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Toggle 360° cinematic rotation"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Tour</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={() => applyZone('OVERVIEW')}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer"
            title="Reset overview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all backdrop-blur-md cursor-pointer ml-1 sm:ml-2"
            title="Close 3D View (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── WebGL Canvas ── */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full h-full block touch-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* ── Loading Overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 backdrop-blur-xs">
          <Box className="w-12 h-12 text-violet-400 animate-pulse mb-3" />
          <p className="text-white text-sm font-semibold">Loading 3D {theme.label}…</p>
          <span className="text-slate-400 text-xs mt-1">Generating custom materials & suite architecture</span>
        </div>
      )}

      {/* ── In-Viewer Error State (Safe Recoverable) ── */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 p-6 text-center animate-in fade-in">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
          <p className="text-white font-bold text-base mb-1">Notice from 3D Suite Viewer</p>
          <p className="text-slate-300 text-xs max-w-sm mb-5 leading-relaxed">{loadError}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoadError('');
                setIsLoading(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Back to Details
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Bar: Room Zone Explorer ── */}
      <div className="relative z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 py-4 sm:py-5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-1 max-w-[90vw]">
          <button
            type="button"
            onClick={() => applyZone('OVERVIEW')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeZone === 'OVERVIEW'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/40 scale-105 border border-violet-400/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Full Suite</span>
          </button>

          <button
            type="button"
            onClick={() => applyZone('BED')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeZone === 'BED'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/40 scale-105 border border-violet-400/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>King Bed</span>
          </button>

          <button
            type="button"
            onClick={() => applyZone('LOUNGE')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeZone === 'LOUNGE'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/40 scale-105 border border-violet-400/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Lounge</span>
          </button>

          <button
            type="button"
            onClick={() => applyZone('DESK')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeZone === 'DESK'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/40 scale-105 border border-violet-400/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Work Desk & TV</span>
          </button>

          <button
            type="button"
            onClick={() => applyZone('BALCONY')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeZone === 'BALCONY'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/40 scale-105 border border-violet-400/40'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Balcony View</span>
          </button>
        </div>

        {/* Instructions indicator */}
        <div className="flex items-center gap-3 text-[11px] text-white/50">
          <span>🖱 Drag to orbit</span>
          <span>• Scroll to zoom</span>
          <span className="hidden sm:inline">• Right-click to pan</span>
          <span className="hidden sm:inline">• Switch Day / Evening</span>
        </div>
      </div>
    </div>
  );
}
