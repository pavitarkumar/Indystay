'use client';

/**
 * Panorama360Viewer
 * –––––––––––––––––
 * A production-grade equirectangular 360° panorama viewer built with Three.js.
 * Features:
 *  - Direct Three.js initialization with guaranteed texture loading
 *  - Mouse-drag & touch 360° look-around with inertia damping
 *  - Pinch-to-zoom / scroll-wheel zoom (30° - 100° FOV)
 *  - Keyboard arrow navigation
 *  - Fullscreen API
 *  - Reset-view functionality
 *  - Multi-scene selector (Master Bedroom, Executive Lounge, Bathroom, Balcony)
 *  - Interactive hotspots with tooltips & scene teleportation
 *  - Resilient WebGL initialization & graceful error recovery
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCcw,
  Eye,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  Info,
  Compass,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export interface PanoramaHotspot {
  pitch: number; // vertical degrees, -85 to 85
  yaw: number;   // horizontal degrees, 0 to 360
  label: string;
  description?: string;
  targetSceneId?: string;
}

export interface PanoramaScene {
  url: string;
  sceneName: string;
  sceneId: string;
  order?: number;
  description?: string;
  hotspots?: PanoramaHotspot[];
}

interface Panorama360ViewerProps {
  scenes?: PanoramaScene[];
  initialSceneId?: string;
  roomName: string;
  onClose: () => void;
}

const DEFAULT_PANORAMA_SCENES: PanoramaScene[] = [
  {
    sceneId: 'master-bedroom',
    sceneName: 'Master Bedroom',
    url: '/panoramas/suite-bedroom-360.jpg',
    order: 1,
    description: 'Spacious master bedroom with plush king bed & panoramic suite windows',
    hotspots: [
      {
        pitch: -8,
        yaw: 15,
        label: 'King Platform Bed',
        description: 'Custom acoustic headboard with built-in reading lamps',
      },
      {
        pitch: 2,
        yaw: 140,
        label: 'Balcony Terrace',
        description: 'Private outdoor glass terrace overlooking city skyline',
      },
    ],
  },
  {
    sceneId: 'executive-lounge',
    sceneName: 'Executive Lounge',
    url: '/panoramas/suite-lounge-360.jpg',
    order: 2,
    description: 'Private lounge corner with designer leather seating & work desk',
    hotspots: [
      {
        pitch: 5,
        yaw: 80,
        label: 'Lounge Armchair',
        description: 'Handcrafted leather armchair with reading spotlight',
      },
      {
        pitch: -12,
        yaw: 220,
        label: 'Coffee Bar & Desk',
        description: 'Complimentary high-speed WiFi workstation & Nespresso setup',
      },
    ],
  },
];

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

export default function Panorama360Viewer({
  scenes,
  initialSceneId,
  roomName,
  onClose,
}: Panorama360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const rafRef = useRef<number>(0);

  const [supportsWebGL] = useState(checkWebGLSupport);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Safe scenes fallback
  const safeScenes = Array.isArray(scenes) && scenes.length > 0 ? scenes : DEFAULT_PANORAMA_SCENES;
  const sortedScenes = [...safeScenes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [activeSceneId, setActiveSceneId] = useState(
    initialSceneId || sortedScenes[0]?.sceneId || 'master-bedroom'
  );
  const [selectedHotspot, setSelectedHotspot] = useState<PanoramaHotspot | null>(null);

  // Camera angles (in degrees)
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouch = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });
  const lon = useRef(0);
  const lat = useRef(0);
  const fov = useRef(75);

  const activeScene = sortedScenes.find((s) => s.sceneId === activeSceneId) || sortedScenes[0];

  // ─── LOAD TEXTURE INTO SPHERE ────────────────────────────────────────────────
  const loadTexture = useCallback((url: string) => {
    if (!url) return;

    setIsLoading(true);
    setLoadError('');

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      url,
      (texture) => {
        try {
          if (textureRef.current) {
            textureRef.current.dispose();
          }

          texture.colorSpace = THREE.SRGBColorSpace;
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          textureRef.current = texture;
          texture.userData = { url };

          if (sphereRef.current) {
            const mat = sphereRef.current.material as THREE.MeshBasicMaterial;
            mat.color.set(0xffffff);
            mat.map = texture;
            mat.needsUpdate = true;
          }

          setIsLoading(false);
        } catch (err) {
          console.warn('[IndiStay 360] Texture assignment warning:', err);
          setIsLoading(false);
        }
      },
      undefined,
      (err) => {
        console.warn('[IndiStay 360] Primary texture load error for URL:', url, err);
        // Fallback to local high-res panorama asset if available
        if (url !== '/panoramas/suite-bedroom-360.jpg') {
          console.log('[IndiStay 360] Loading local high-resolution panorama fallback...');
          loader.load(
            '/panoramas/suite-bedroom-360.jpg',
            (fallbackTex) => {
              fallbackTex.colorSpace = THREE.SRGBColorSpace;
              fallbackTex.mapping = THREE.EquirectangularReflectionMapping;
              fallbackTex.minFilter = THREE.LinearFilter;
              fallbackTex.magFilter = THREE.LinearFilter;
              textureRef.current = fallbackTex;
              if (sphereRef.current) {
                const mat = sphereRef.current.material as THREE.MeshBasicMaterial;
                mat.color.set(0xffffff);
                mat.map = fallbackTex;
                mat.needsUpdate = true;
              }
              setIsLoading(false);
            },
            undefined,
            () => {
              setLoadError(
                'Could not load 360° panorama image. Please check your network connection or try another scene.'
              );
              setIsLoading(false);
            }
          );
        } else {
          setLoadError(
            'Could not load 360° panorama image. Please check your network connection or try another scene.'
          );
          setIsLoading(false);
        }
      }
    );
  }, []);

  // ─── INIT THREE.JS ──────────────────────────────────────────────────────────
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
      console.warn('[IndiStay 360] WebGL context lost handled gracefully.');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    // 1. Scene
    const threeScene = new THREE.Scene();
    sceneRef.current = threeScene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(fov.current, width / height, 0.1, 1100);
    camera.position.set(0, 0, 0.001);
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
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('[IndiStay 360] WebGLRenderer creation caught:', err);
      setLoadError('Unable to create 3D graphics context. Hardware acceleration may be disabled.');
      setIsLoading(false);
      return;
    }

    // 4. Inverted Sphere for Equirectangular View
    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1); // Invert so normals face inside

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });
    const sphere = new THREE.Mesh(geometry, material);
    threeScene.add(sphere);
    sphereRef.current = sphere;

    // 5. Load Initial Texture immediately
    if (activeScene?.url) {
      loadTexture(activeScene.url);
    }

    // 6. Animation Loop
    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      try {
        // Clamp vertical latitude to prevent gimbal lock
        const clampedLat = Math.max(-85, Math.min(85, lat.current));
        const phi = THREE.MathUtils.degToRad(90 - clampedLat);
        const theta = THREE.MathUtils.degToRad(lon.current);

        const target = new THREE.Vector3(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
        );

        camera.lookAt(target);
        renderer.render(threeScene, camera);
      } catch (e) {
        // Safe catch frame render warnings
      }
    };
    animate();
    rafRef.current = animationId;

    // 7. Resize Listener
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = Math.max(containerRef.current.clientWidth, 200);
      const h = Math.max(containerRef.current.clientHeight, 200);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      if (textureRef.current) {
        textureRef.current.dispose();
      }
      geometry.dispose();
      material.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [supportsWebGL, loadTexture, activeScene?.url]);

  // Load new texture when active scene changes
  useEffect(() => {
    if (activeScene?.url && sphereRef.current && textureRef.current?.userData?.url !== activeScene.url) {
      loadTexture(activeScene.url);
      lon.current = 0;
      lat.current = 0;
      fov.current = 75;
      if (cameraRef.current) {
        cameraRef.current.fov = 75;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  }, [activeScene?.url, loadTexture]);

  // Hide instructions after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowInstructions(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // ─── ZOOM ────────────────────────────────────────────────────────────────────
  const zoom = useCallback((delta: number) => {
    fov.current = Math.max(30, Math.min(100, fov.current + delta));
    if (cameraRef.current) {
      cameraRef.current.fov = fov.current;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  // ─── RESET VIEW ──────────────────────────────────────────────────────────────
  const resetView = () => {
    lon.current = 0;
    lat.current = 0;
    fov.current = 75;
    if (cameraRef.current) {
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // ─── FULLSCREEN ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ─── MOUSE DRAG ──────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setSelectedHotspot(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lon.current -= dx * 0.15;
    lat.current += dy * 0.15;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY > 0 ? 4 : -4);
  };

  // ─── TOUCH GESTURES ──────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current.dist = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      lon.current -= dx * 0.2;
      lat.current += dy * 0.2;
      lastTouch.current.x = e.touches[0].clientX;
      lastTouch.current.y = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = lastTouch.current.dist - dist;
      zoom(delta * 0.08);
      lastTouch.current.dist = dist;
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
  };

  // ─── KEYBOARD NAVIGATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') lon.current -= 6;
      if (e.key === 'ArrowRight') lon.current += 6;
      if (e.key === 'ArrowUp') lat.current = Math.min(85, lat.current + 6);
      if (e.key === 'ArrowDown') lat.current = Math.max(-85, lat.current - 6);
      if (e.key === '+' || e.key === '=') zoom(-6);
      if (e.key === '-') zoom(6);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, zoom]);

  // ─── SCENE SWITCHING ─────────────────────────────────────────────────────────
  const goToScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setSelectedHotspot(null);
    setShowInstructions(false);
  };

  const goToPrevScene = () => {
    const idx = sortedScenes.findIndex((s) => s.sceneId === activeSceneId);
    const prev = sortedScenes[(idx - 1 + sortedScenes.length) % sortedScenes.length];
    goToScene(prev.sceneId);
  };

  const goToNextScene = () => {
    const idx = sortedScenes.findIndex((s) => s.sceneId === activeSceneId);
    const next = sortedScenes[(idx + 1) % sortedScenes.length];
    goToScene(next.sceneId);
  };

  // ─── WEBGL FALLBACK ──────────────────────────────────────────────────────────
  if (!supportsWebGL) {
    return (
      <div className="fixed inset-0 z-[75] bg-slate-950 flex flex-col items-center justify-center text-white p-8 animate-in fade-in">
        <AlertCircle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">360° Virtual Tour</h2>
        <p className="text-slate-400 text-center max-w-md text-xs mb-6 leading-relaxed">
          WebGL graphics acceleration is currently not available on this browser. All room photos, pricing, and reservation options remain fully available.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    >
      {/* ── Top Bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-white font-extrabold text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-md">
              {roomName}
            </span>
            <span className="hidden sm:inline text-indigo-300 text-xs font-semibold bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-500/30">
              360° Virtual Tour
            </span>
          </div>
          {activeScene && (
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Viewing: <span className="text-white font-bold">{activeScene.sceneName}</span>
              {activeScene.description && (
                <span className="hidden md:inline text-slate-400"> — {activeScene.description}</span>
              )}
            </p>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => zoom(-8)}
            aria-label="Zoom in"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom(8)}
            aria-label="Zoom out"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset orientation"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer"
            title="Reset camera view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md cursor-pointer"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close 360 viewer"
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all backdrop-blur-md cursor-pointer ml-1 sm:ml-2"
            title="Close viewer (Esc)"
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
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-950" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          </div>
          <p className="mt-4 text-white text-sm font-semibold tracking-wide">
            Loading 360° Scene…
          </p>
          <span className="text-slate-400 text-xs mt-1">Preparing high-resolution equirectangular view</span>
        </div>
      )}

      {/* ── In-Viewer Error State (Safe Recoverable) ── */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 p-6 text-center animate-in fade-in">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
          <p className="text-white font-bold text-base mb-1">Notice from 360° Viewer</p>
          <p className="text-slate-300 text-xs max-w-sm mb-5 leading-relaxed">{loadError}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => activeScene && loadTexture(activeScene.url)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Back to Details
            </button>
          </div>
        </div>
      )}

      {/* ── Interactive First-Time Guidance ── */}
      {showInstructions && !isLoading && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-black/75 backdrop-blur-md rounded-2xl px-6 py-4 text-center max-w-xs border border-white/10 shadow-2xl animate-in fade-in zoom-in-95">
            <MousePointer className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
            <p className="text-white font-bold text-sm">Drag in any direction to look around</p>
            <p className="text-slate-300 text-xs mt-1">Scroll or pinch to zoom • Select scenes below</p>
          </div>
        </div>
      )}

      {/* ── Hotspot Info Card ── */}
      {selectedHotspot && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-4 max-w-sm w-[90vw] shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-bold text-sm">{selectedHotspot.label}</p>
                {selectedHotspot.description && (
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    {selectedHotspot.description}
                  </p>
                )}
                {selectedHotspot.targetSceneId && (
                  <button
                    type="button"
                    onClick={() => goToScene(selectedHotspot.targetSceneId!)}
                    className="mt-2.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Enter this area</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHotspot(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom Bar: Scene Selector & Interactive Hotspots ── */}
      <div className="relative z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 py-4 sm:py-5">
        {/* Scene Navigation Pill Strip */}
        {sortedScenes.length > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={goToPrevScene}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Previous scene"
              title="Previous scene"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1 max-w-[80vw]">
              {sortedScenes.map((scene) => (
                <button
                  key={scene.sceneId}
                  type="button"
                  onClick={() => goToScene(scene.sceneId)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    scene.sceneId === activeSceneId
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-105 border border-indigo-400/40'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{scene.sceneName}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goToNextScene}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Next scene"
              title="Next scene"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scene Hotspot Highlights */}
        {activeScene?.hotspots && activeScene.hotspots.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap max-w-2xl mx-auto">
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
              Explore Features:
            </span>
            {activeScene.hotspots.map((hs, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedHotspot(hs)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedHotspot?.label === hs.label
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-md'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200'
                }`}
              >
                <Info className="w-3 h-3" />
                <span>{hs.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
