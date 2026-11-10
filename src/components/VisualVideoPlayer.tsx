import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  FastForward,
  Rewind,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Quote,
  Eye,
  Camera,
  Compass,
  ChevronRight,
  List,
  Clock,
  BookOpen,
  Download,
  Film,
} from 'lucide-react';
import { VideoStoryboard, VideoScene, VisualCallout, CanvasVideoRecorder } from '../utils/videoExplanationEngine';

interface VisualVideoPlayerProps {
  storyboard: VideoStoryboard;
  material: string;
  onJumpToQuote?: (quote: string) => void;
  onClose?: () => void;
}

type CameraViewMode = 'director' | 'exploded' | 'focus' | 'orbit';

export const VisualVideoPlayer: React.FC<VisualVideoPlayerProps> = ({
  storyboard,
  material,
  onJumpToQuote,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [muted, setMuted] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('director');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCallout, setActiveCallout] = useState<VisualCallout | null>(null);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const videoRecorderRef = useRef<CanvasVideoRecorder | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const partsMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const animationFrameId = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Speech synthesis reference
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const totalDuration = storyboard.totalDurationSeconds || 76;
  const currentScene = storyboard.scenes[currentSceneIndex] || storyboard.scenes[0];

  // Calculate cumulative scene start times
  const sceneStartTimes: number[] = [];
  let accum = 0;
  storyboard.scenes.forEach((s) => {
    sceneStartTimes.push(accum);
    accum += s.durationSeconds;
  });

  // 1. Initialize Three.js 3D Visual Stage
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d16');
    sceneRef.current = scene;

    // Atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 0.8);
    dirLight2.position.set(-5, 4, -4);
    scene.add(dirLight2);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.35, 3.8);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      renderer = new THREE.WebGLRenderer({ antialias: false });
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Build stylized procedural 3D anatomy models representing the complete organism
    const meshMap = new Map<string, THREE.Mesh>();

    // Calvarium (Skull Vault)
    const skullGeo = new THREE.SphereGeometry(0.24, 24, 24);
    skullGeo.scale(0.85, 1.05, 0.95);
    const skullMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.15,
      wireframe: false,
    });
    const skullMesh = new THREE.Mesh(skullGeo, skullMat);
    skullMesh.position.set(0, 1.85, 0);
    skullMesh.userData = { id: 'calvarium', basePos: new THREE.Vector3(0, 1.85, 0), explodeVec: new THREE.Vector3(0, 0.5, 0) };
    scene.add(skullMesh);
    meshMap.set('calvarium', skullMesh);

    // Spine (Vertebral Column)
    const spineGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.9, 16);
    const spineMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.4 });
    const spineMesh = new THREE.Mesh(spineGeo, spineMat);
    spineMesh.position.set(0, 1.15, -0.06);
    spineMesh.userData = { id: 'cervical_spine', basePos: new THREE.Vector3(0, 1.15, -0.06), explodeVec: new THREE.Vector3(0, 0, -0.4) };
    scene.add(spineMesh);
    meshMap.set('cervical_spine', spineMesh);

    // Rib Cage (Thoracic Basket)
    const ribGroup = new THREE.Group();
    for (let r = 0; r < 7; r++) {
      const ringGeo = new THREE.TorusGeometry(0.28 - r * 0.015, 0.018, 12, 32, Math.PI * 1.5);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = Math.PI * 0.25;
      ring.position.set(0, 1.4 - r * 0.055, 0);
      ribGroup.add(ring);
    }
    ribGroup.userData = { id: 'rib_cage', basePos: new THREE.Vector3(0, 0, 0), explodeVec: new THREE.Vector3(0, 0, 0.45) };
    scene.add(ribGroup);
    meshMap.set('rib_cage', ribGroup as any);

    // Heart (Left/Right Ventricles)
    const heartGeo = new THREE.DodecahedronGeometry(0.13, 2);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.25,
      metalness: 0.2,
      emissive: 0x9f1239,
      emissiveIntensity: 0.3,
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(0.02, 1.18, 0.06);
    heartMesh.userData = { id: 'heart_ventricles', basePos: new THREE.Vector3(0.02, 1.18, 0.06), explodeVec: new THREE.Vector3(0.3, 0, 0.3) };
    scene.add(heartMesh);
    meshMap.set('heart_ventricles', heartMesh);

    // Aorta & Arterial Windkessel
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 1.25, 0.06),
      new THREE.Vector3(0.01, 1.34, 0.05),
      new THREE.Vector3(-0.03, 1.32, 0.02),
      new THREE.Vector3(-0.03, 0.95, -0.04),
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.032, 16, false);
    const aortaMat = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0x880022,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
    aortaMesh.userData = { id: 'aorta_tree', basePos: new THREE.Vector3(0, 0, 0), explodeVec: new THREE.Vector3(-0.25, 0, 0.25) };
    scene.add(aortaMesh);
    meshMap.set('aorta_tree', aortaMesh);

    // Lungs & Tracheobronchial Tree
    const lungGeo = new THREE.SphereGeometry(0.18, 16, 16);
    lungGeo.scale(0.7, 1.3, 0.65);
    const lungMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.72,
      roughness: 0.3,
    });
    const leftLung = new THREE.Mesh(lungGeo, lungMat);
    leftLung.position.set(0.22, 1.20, 0.02);
    const rightLung = new THREE.Mesh(lungGeo, lungMat.clone());
    rightLung.position.set(-0.22, 1.20, 0.02);
    const lungsGroup = new THREE.Group();
    lungsGroup.add(leftLung);
    lungsGroup.add(rightLung);
    lungsGroup.userData = { id: 'lungs_trachea', basePos: new THREE.Vector3(0, 0, 0), explodeVec: new THREE.Vector3(0.5, 0, 0) };
    scene.add(lungsGroup);
    meshMap.set('lungs_trachea', lungsGroup as any);

    // Kidneys
    const kidneyGeo = new THREE.SphereGeometry(0.07, 16, 16);
    kidneyGeo.scale(0.65, 1.0, 0.65);
    const kidneyMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.4 });
    const kLeft = new THREE.Mesh(kidneyGeo, kidneyMat);
    kLeft.position.set(-0.16, 0.92, -0.07);
    const kRight = new THREE.Mesh(kidneyGeo, kidneyMat);
    kRight.position.set(0.16, 0.90, -0.07);
    const kidneyGroup = new THREE.Group();
    kidneyGroup.add(kLeft);
    kidneyGroup.add(kRight);
    kidneyGroup.userData = { id: 'kidneys_ureters', basePos: new THREE.Vector3(0, 0, 0), explodeVec: new THREE.Vector3(0, -0.2, -0.3) };
    scene.add(kidneyGroup);
    meshMap.set('kidneys_ureters', kidneyGroup as any);

    // Femurs (Weight Bearing Levers)
    const femurGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.75, 16);
    const femurMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
    const fLeft = new THREE.Mesh(femurGeo, femurMat);
    fLeft.position.set(0.18, 0.25, 0);
    const fRight = new THREE.Mesh(femurGeo, femurMat);
    fRight.position.set(-0.18, 0.25, 0);
    const femurGroup = new THREE.Group();
    femurGroup.add(fLeft);
    femurGroup.add(fRight);
    femurGroup.userData = { id: 'femurs', basePos: new THREE.Vector3(0, 0, 0), explodeVec: new THREE.Vector3(0, -0.4, 0) };
    scene.add(femurGroup);
    meshMap.set('femurs', femurGroup as any);

    partsMeshMap.current = meshMap;

    // Handle dynamic resize
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (renderer) renderer.dispose();
      scene.clear();
    };
  }, []);

  // 2. Continuous 3D Animation & Camera Choreography Loop
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    let targetCamPos = new THREE.Vector3(...currentScene.cameraPosition);
    let targetLookAt = new THREE.Vector3(...currentScene.cameraTarget);

    if (cameraMode === 'exploded') {
      targetCamPos = new THREE.Vector3(0, 1.3, 4.8);
      targetLookAt = new THREE.Vector3(0, 1.1, 0);
    } else if (cameraMode === 'focus') {
      targetCamPos = new THREE.Vector3(0.1, 1.18, 1.2);
      targetLookAt = new THREE.Vector3(0.02, 1.18, 0.06);
    }

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Smooth camera interpolation
      if (cameraMode !== 'orbit') {
        camera.position.lerp(targetCamPos, delta * 2.2);
        const currentLookAt = new THREE.Vector3(0, 1.1, 0);
        camera.lookAt(targetLookAt);
      }

      // Heart pulsatile beat simulation
      const heartMesh = partsMeshMap.current.get('heart_ventricles');
      if (heartMesh) {
        const beatScale = 1.0 + Math.sin(elapsed * 7.5) * 0.06;
        heartMesh.scale.set(beatScale, beatScale, beatScale);
      }

      // Dynamic explosion / knolled dispatching along explosion vectors
      const explosion = currentScene.explosionLevel;
      partsMeshMap.current.forEach((mesh) => {
        const base = mesh.userData.basePos as THREE.Vector3;
        const vec = mesh.userData.explodeVec as THREE.Vector3;
        if (base && vec) {
          const targetP = base.clone().add(vec.clone().multiplyScalar(explosion));
          mesh.position.lerp(targetP, delta * 3.0);
        }

        // Highlight parts targeted in current scene
        const isFocused = currentScene.focusedPartIds.includes(mesh.userData.id);
        if ((mesh as any).material && (mesh as any).material.emissive) {
          const mat = (mesh as any).material as THREE.MeshStandardMaterial;
          if (isFocused) {
            mat.emissiveIntensity = 0.6 + Math.sin(elapsed * 4) * 0.2;
          } else {
            mat.emissiveIntensity = 0.1;
          }
        }
      });

      // Ambient turntable rotation in director mode
      if (cameraMode === 'director' && currentScene.rotationSpeed > 0) {
        scene.rotation.y += currentScene.rotationSpeed * delta * 60;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [currentSceneIndex, cameraMode]);

  // 3. Playback Clock & Voiceover Synchronization
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * playbackSpeed;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }

          // Determine current scene from cumulative start times
          let foundScene = 0;
          for (let i = 0; i < sceneStartTimes.length; i++) {
            if (next >= sceneStartTimes[i]) {
              foundScene = i;
            }
          }
          if (foundScene !== currentSceneIndex) {
            setCurrentSceneIndex(foundScene);
          }

          return next;
        });
      }, 100);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, totalDuration, sceneStartTimes, currentSceneIndex]);

  // 4. Synchronized Voiceover Trigger on Scene Change
  useEffect(() => {
    if (!isPlaying || muted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentScene.narrationScript);
    utterance.rate = Math.min(1.4, Math.max(0.8, 1.05 * playbackSpeed));
    utterance.pitch = 1.0;

    // Pick an articulate English voice if available
    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (goodVoice) utterance.voice = goodVoice;

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentSceneIndex, isPlaying, muted, playbackSpeed]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsPlaying(true);
    }
  };

  const handleToggleRecord = async () => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    if (!isRecording) {
      try {
        const recorder = new CanvasVideoRecorder(canvas);
        videoRecorderRef.current = recorder;
        recorder.startRecording(30);
        setIsRecording(true);
        if (!isPlaying) {
          setIsPlaying(true);
        }
      } catch (err: any) {
        console.warn('Canvas recording not supported or failed:', err);
      }
    } else {
      try {
        const recorder = videoRecorderRef.current;
        if (recorder) {
          const { url } = await recorder.stopRecording();
          setDownloadUrl(url);
          setIsRecording(false);
        }
      } catch (err: any) {
        console.warn('Stop recording failed:', err);
        setIsRecording(false);
      }
    }
  };

  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(newTime, totalDuration));
    setCurrentTime(clamped);
    let found = 0;
    for (let i = 0; i < sceneStartTimes.length; i++) {
      if (clamped >= sceneStartTimes[i]) found = i;
    }
    setCurrentSceneIndex(found);
  };

  const handleJumpToScene = (idx: number) => {
    setCurrentSceneIndex(idx);
    setCurrentTime(sceneStartTimes[idx] || 0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find active subtitle matching current time
  const sceneElapsedTime = currentTime - (sceneStartTimes[currentSceneIndex] || 0);
  const activeSubtitle = currentScene.subtitles.find(
    (sub) => sceneElapsedTime >= sub.startSec && sceneElapsedTime <= sub.endSec
  );

  return (
    <div
      ref={containerRef}
      className={`border border-zinc-200 rounded-2xl bg-[#090d16] text-white overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative w-full'
      }`}
    >
      {/* Top Header Bar (YouTube Style) */}
      <div className="px-4 py-3 bg-zinc-950/90 border-b border-zinc-800 flex items-center justify-between gap-3 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-rose-600 flex items-center justify-center font-bold text-xs text-white">
            3D
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
              <span>{storyboard.videoTitle}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                Scene {currentScene.sceneNumber}/4: {currentScene.title}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Cognitive Dual-Coding Visualization • Strictly Grounded in User Material
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chapter Drawer Toggle */}
          <button
            onClick={() => setShowChaptersDrawer(!showChaptersDrawer)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chapters ({storyboard.scenes.length})</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Viewport Stage & HUD Overlays */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-[#090d16] flex items-center justify-center overflow-hidden">
        {/* Three.js Canvas Container */}
        <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Live HUD Floating Telemetry Badge (Top Left) */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-2">
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3 shadow-lg max-w-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-rose-500 animate-pulse" />
                <span>Physiological Telemetry</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="font-mono text-xs font-bold text-white flex items-center justify-between">
              <span>Dynamic Phase:</span>
              <span className="text-rose-400">
                {currentScene.explosionLevel > 0.4 ? 'Exploded Layering' : 'Integrated Systole'}
              </span>
            </div>

            {storyboard.keyFormulas[0] && (
              <div className="text-[10px] font-mono text-zinc-300 bg-zinc-900/90 px-2 py-1 rounded border border-zinc-800">
                {storyboard.keyFormulas[0]}
              </div>
            )}
          </div>
        </div>

        {/* Visual Callout Cards (Top Right) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 max-w-sm">
          {currentScene.visualCallouts.map((callout) => (
            <div
              key={callout.id}
              onClick={() => {
                setActiveCallout(callout);
                if (callout.evidenceQuote && onJumpToQuote) {
                  onJumpToQuote(callout.evidenceQuote);
                }
              }}
              className="bg-zinc-950/85 backdrop-blur-md border border-zinc-700/90 hover:border-white rounded-xl p-3 shadow-xl transition-all cursor-pointer group pointer-events-auto"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{callout.title}</span>
                </div>
                {callout.value && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                    {callout.value}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                {callout.description}
              </p>
              {callout.evidenceQuote && (
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Source Quote</span>
                  </span>
                  <span className="group-hover:text-white transition-colors underline">
                    View In Notes ↗
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subtitles & Closed Captions Bar (Bottom of Stage) */}
        {activeSubtitle && (
          <div className="absolute bottom-6 inset-x-8 z-20 flex justify-center pointer-events-none">
            <div className="bg-black/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center max-w-2xl shadow-2xl">
              <p className="text-xs sm:text-sm font-medium text-white tracking-wide leading-snug">
                {activeSubtitle.text}
              </p>
            </div>
          </div>
        )}

        {/* Chapters Drawer Overlay */}
        {showChaptersDrawer && (
          <div className="absolute inset-y-0 left-0 w-72 bg-zinc-950/95 border-r border-zinc-800 p-4 z-30 shadow-2xl overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                Video Chapters
              </span>
              <button
                onClick={() => setShowChaptersDrawer(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {storyboard.scenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => {
                  handleJumpToScene(idx);
                  setShowChaptersDrawer(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                  currentSceneIndex === idx
                    ? 'border-rose-500 bg-rose-500/10 text-white font-semibold'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Scene {scene.sceneNumber}</span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {formatTime(sceneStartTimes[idx])}
                  </span>
                </div>
                <div className="text-white font-medium">{scene.title}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrubber Progress Bar with Chapter Markers */}
      <div className="relative w-full h-3 bg-zinc-800 cursor-pointer group z-20"
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const pos = (e.clientX - rect.left) / rect.width;
             handleSeek(pos * totalDuration);
           }}
      >
        {/* Filled Progress */}
        <div
          className="h-full bg-rose-600 transition-all duration-75 relative"
          style={{ width: `${(currentTime / totalDuration) * 100}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md scale-0 group-hover:scale-100 transition-transform" />
        </div>

        {/* Chapter Boundary Divider Lines */}
        {sceneStartTimes.map((startT, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-0.5 bg-zinc-950 pointer-events-none"
            style={{ left: `${(startT / totalDuration) * 100}%` }}
            title={`Scene ${i + 1}`}
          />
        ))}
      </div>

      {/* Bottom YouTube-Style Media Toolbar */}
      <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 z-10">
        {/* Play / Pause / Skip Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => handleSeek(currentTime - 5)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Rewind 5s"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSeek(currentTime + 5)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Fast Forward 5s"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSeek(0)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Restart Video"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="font-mono text-xs text-zinc-400 ml-1">
            <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(totalDuration)}
          </div>
        </div>

        {/* Center: Camera Director Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-medium">
          <span className="text-[10px] uppercase font-mono text-zinc-500 px-2 hidden sm:inline">Camera:</span>
          {(['director', 'exploded', 'focus', 'orbit'] as CameraViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                cameraMode === mode
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Right Action Tools: Speed, Mute */}
        <div className="flex items-center gap-2">
          {/* Audio Voiceover Mute Toggle */}
          <button
            onClick={() => {
              setMuted(!muted);
              if (!muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={muted ? 'Unmute Audio Narration' : 'Mute Audio Narration'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Speed Selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded px-2 py-1 font-mono focus:outline-none focus:border-rose-500"
          >
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x Normal</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>

          {/* Video Capture & Download */}
          <button
            onClick={handleToggleRecord}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isRecording ? 'Stop Recording' : 'Record Video Clip (WebM/MP4)'}
          >
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span>{isRecording ? 'Rec...' : 'Record'}</span>
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={`${storyboard.videoTitle.replace(/\s+/g, '_')}_masterclass.webm`}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              title="Download Recorded Video"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
