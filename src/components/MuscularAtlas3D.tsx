import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { createSafeWebGLRenderer } from '../utils/webglSafe';
import {
  AnatomyAtlasManifest,
  ManifestRegion,
  MUSCLE_GROUPS,
  ATLAS_SIDE_LABELS,
  ExerciseCatalog,
  ExerciseRecord,
  bindExerciseMedia,
  getExercisesForMuscle,
  getMuscleExerciseInfo,
  filterRegionsByQuery,
} from '../utils/muscularAtlasData';
import {
  BookOpen,
  Crosshair,
  Dumbbell,
  Eye,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  X,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

interface MuscularAtlas3DProps {
  onAskTutorWithTopic: (topic: string, material: string) => void;
}

type BodyAreaFraming = 'full' | 'upper' | 'lower';
type CameraDirection = 'front' | 'back' | 'left' | 'right' | 'home';

interface MaterialAppearanceEntry {
  material: THREE.MeshStandardMaterial;
  region: ManifestRegion | null;
  baseColor: THREE.Color;
  baseEmissive: THREE.Color;
  baseEmissiveIntensity: number;
  baseNormalScale: THREE.Vector2 | null;
  baseBumpScale: number;
  fibreRoughnessMap: THREE.Texture | null;
  baseRoughness: number;
}

const HOME_DIRECTION = new THREE.Vector3(0.24, 0.035, 1).normalize();
const CARDINAL_DIRS: Record<CameraDirection, THREE.Vector3> = {
  home: HOME_DIRECTION.clone(),
  front: new THREE.Vector3(0, 0.015, 1).normalize(),
  back: new THREE.Vector3(0, 0.015, -1).normalize(),
  left: new THREE.Vector3(1, 0.015, 0).normalize(),
  right: new THREE.Vector3(-1, 0.015, 0).normalize(),
};

const PALETTE = {
  selected: new THREE.Color('#38bdf8'),
  related: new THREE.Color('#7dd3fc'),
  hover: new THREE.Color('#facc15'),
};

export const MuscularAtlas3D: React.FC<MuscularAtlas3DProps> = ({ onAskTutorWithTopic }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [manifest, setManifest] = useState<AnatomyAtlasManifest | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [matchedRegionCount, setMatchedRegionCount] = useState<number>(0);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState<number>(0);

  // Interactive Atlas State
  const [framing, setFraming] = useState<BodyAreaFraming>('full');
  const [showFibres, setShowFibres] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [showJoints, setShowJoints] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<ManifestRegion | null>(null);
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<ManifestRegion | null>(null);
  const [projectedLabels, setProjectedLabels] = useState<
    { id: string; label: string; x: number; y: number }[]
  >([]);

  // Exercise Library State (SirwanAfifi/anatomy-atlas + Free Exercise DB)
  const [exerciseCatalog, setExerciseCatalog] = useState<ExerciseCatalog | null>(null);
  const [exerciseLoading, setExerciseLoading] = useState<boolean>(false);
  const [exerciseQuery, setExerciseQuery] = useState<string>('');
  const [exerciseEquipment, setExerciseEquipment] = useState<string>('all');
  const [exerciseRole, setExerciseRole] = useState<'all' | 'primary' | 'secondary'>('all');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<Record<string, number>>({});

  // Three.js mutable refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const jointsGroupRef = useRef<THREE.Group | null>(null);
  const appearanceRef = useRef<MaterialAppearanceEntry[]>([]);
  const regionMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const regionBoundsRef = useRef<Map<string, THREE.Box3>>(new Map());
  const modelBoundsRef = useRef<THREE.Box3>(
    new THREE.Box3(new THREE.Vector3(-0.65, 0, -0.22), new THREE.Vector3(0.65, 2, 0.22))
  );
  const invalidateRef = useRef<() => void>(() => {});
  const tweenRef = useRef<{
    start: number;
    targetFrom: THREE.Vector3;
    targetTo: THREE.Vector3;
    orbitFrom: THREE.Spherical;
    orbitTo: THREE.Spherical;
    thetaDelta: number;
  } | null>(null);

  // Synced state refs for imperative render loop
  const selectionRef = useRef<{ region: ManifestRegion | null; muscleId: string | null }>({
    region: null,
    muscleId: null,
  });
  const hoverIdRef = useRef<string | null>(null);
  const searchMatchesRef = useRef<Set<string> | null>(null);
  const showFibresRef = useRef<boolean>(showFibres);
  const showLabelsRef = useRef<boolean>(showLabels);
  const showJointsRef = useRef<boolean>(showJoints);
  const manifestRef = useRef<AnatomyAtlasManifest | null>(null);
  const isSoftwareRef = useRef<boolean>(false);

  useEffect(() => {
    showFibresRef.current = showFibres;
    showLabelsRef.current = showLabels;
    showJointsRef.current = showJoints;
    if (jointsGroupRef.current) {
      jointsGroupRef.current.visible = showJoints;
    }
    invalidateRef.current();
  }, [showFibres, showLabels, showJoints]);

  // 1. Fetch Manifest JSON
  useEffect(() => {
    let active = true;
    fetch('/assets/anatomy/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Manifest load error (${res.status})`);
        return res.json();
      })
      .then((data: AnatomyAtlasManifest) => {
        if (!active) return;
        manifestRef.current = data;
        setManifest(data);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || 'Unable to load muscular atlas manifest.');
      });
    return () => {
      active = false;
    };
  }, []);

  const exercisePromiseRef = useRef<Promise<ExerciseCatalog> | null>(null);

  // 2. Lazy-load Exercise Catalog & Media Manifest on first muscle selection
  useEffect(() => {
    if (!selectedMuscleId || exerciseCatalog) return;
    let active = true;
    setExerciseLoading(true);
    if (!exercisePromiseRef.current) {
      exercisePromiseRef.current = Promise.all([
        fetch('/assets/exercises/catalog.json').then((r) => {
          if (!r.ok) throw new Error(`Catalog HTTP ${r.status}`);
          return r.json();
        }),
        fetch('/assets/exercises/media-manifest.json').then((r) => {
          if (!r.ok) throw new Error(`Media HTTP ${r.status}`);
          return r.json();
        }),
      ]).then(([catalogData, mediaData]) => bindExerciseMedia(catalogData, mediaData));
    }

    exercisePromiseRef.current
      .then((boundCatalog) => {
        if (!active) return;
        setExerciseCatalog(boundCatalog);
      })
      .catch((err) => {
        console.warn('Exercise library load notice:', err);
        exercisePromiseRef.current = null;
      })
      .finally(() => {
        if (active) setExerciseLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMuscleId, exerciseCatalog]);

  const updateAppearance = useCallback(() => {
    const selRegion = selectionRef.current.region;
    const selMuscle = selectionRef.current.muscleId;
    const hovId = hoverIdRef.current;
    const searchSet = searchMatchesRef.current;

    for (const entry of appearanceRef.current) {
      const {
        material,
        region,
        baseColor,
        baseEmissive,
        baseEmissiveIntensity,
        baseNormalScale,
        baseBumpScale,
        fibreRoughnessMap,
        baseRoughness,
      } = entry;

      const exact = Boolean(region && selRegion && region.id === selRegion.id);
      const related = Boolean(region && selMuscle && region.muscle === selMuscle);
      const hovered = Boolean(region && hovId && region.id === hovId);
      const dimmed = Boolean(region && searchSet && !searchSet.has(region.id));

      material.color.copy(baseColor);
      material.emissive.copy(baseEmissive);
      material.emissiveIntensity = baseEmissiveIntensity;

      if (exact) {
        material.color.lerp(PALETTE.selected, 0.82);
        material.emissive.copy(PALETTE.selected);
        material.emissiveIntensity = 0.45;
      } else if (hovered) {
        material.color.lerp(PALETTE.hover, 0.6);
        material.emissive.copy(PALETTE.hover);
        material.emissiveIntensity = 0.22;
      } else if (related) {
        material.color.lerp(PALETTE.selected, selRegion ? 0.38 : 0.78);
        material.emissive.copy(PALETTE.selected);
        material.emissiveIntensity = selRegion ? 0.14 : 0.36;
      }

      if (dimmed && !exact && !related && !hovered) {
        material.color.multiplyScalar(0.38);
      }

      if (baseNormalScale && material.normalScale) {
        material.normalScale.copy(baseNormalScale).multiplyScalar(showFibresRef.current ? 1 : 0);
      }
      if ('bumpScale' in material) {
        material.bumpScale = showFibresRef.current ? baseBumpScale : 0;
      }
      if (fibreRoughnessMap) {
        const nextMap = showFibresRef.current ? fibreRoughnessMap : null;
        if (material.roughnessMap !== nextMap) {
          material.roughnessMap = nextMap;
          material.roughness = showFibresRef.current ? baseRoughness : 0.72;
          material.needsUpdate = true;
        }
      }
    }
    invalidateRef.current();
  }, []);

  const moveCameraToBounds = useCallback(
    (
      target: THREE.Vector3,
      direction: THREE.Vector3,
      distance: number,
      immediate = false
    ) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const dir = direction.clone().normalize();
      if (immediate) {
        tweenRef.current = null;
        controls.target.copy(target);
        camera.position.copy(target).addScaledVector(dir, distance);
        controls.update();
        if (containerRef.current) {
          containerRef.current.dataset.camDist = camera.position
            .distanceTo(controls.target)
            .toFixed(3);
        }
        invalidateRef.current();
        return;
      }

      const currentOffset = camera.position.clone().sub(controls.target);
      const orbitFrom = new THREE.Spherical().setFromVector3(currentOffset);
      const orbitTo = new THREE.Spherical().setFromVector3(dir.multiplyScalar(distance));
      let thetaDelta = orbitTo.theta - orbitFrom.theta;
      while (thetaDelta > Math.PI) thetaDelta -= Math.PI * 2;
      while (thetaDelta < -Math.PI) thetaDelta += Math.PI * 2;

      tweenRef.current = {
        start: performance.now(),
        targetFrom: controls.target.clone(),
        targetTo: target.clone(),
        orbitFrom,
        orbitTo,
        thetaDelta,
      };
      invalidateRef.current();
    },
    []
  );

  const fitBoxDistance = useCallback((bounds: THREE.Box3, padding = 1.2) => {
    const camera = cameraRef.current;
    if (!camera) return 3.2;
    const size = bounds.getSize(new THREE.Vector3());
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (camera.aspect || 1));
    const maxH = Math.max(size.y, 0.2);
    const maxW = Math.max(size.x, size.z, 0.2);
    return Math.max(
      maxH / (2 * Math.tan(vFov / 2)) * padding,
      maxW / (2 * Math.tan(hFov / 2)) * padding,
      0.55
    );
  }, []);

  const getAreaBounds = useCallback((area: BodyAreaFraming) => {
    const b = modelBoundsRef.current;
    const size = b.getSize(new THREE.Vector3());
    if (area === 'upper') {
      return new THREE.Box3(
        new THREE.Vector3(b.min.x, b.min.y + size.y * 0.45, b.min.z),
        b.max.clone()
      );
    }
    if (area === 'lower') {
      return new THREE.Box3(
        b.min.clone(),
        new THREE.Vector3(b.max.x, b.min.y + size.y * 0.56, b.max.z)
      );
    }
    return b.clone();
  }, []);

  const handleFrameArea = useCallback(
    (area: BodyAreaFraming) => {
      setFraming(area);
      const box = getAreaBounds(area);
      const center = box.getCenter(new THREE.Vector3());
      const dist = fitBoxDistance(box, 1.18);
      moveCameraToBounds(center, HOME_DIRECTION, dist, isSoftwareRef.current);
    },
    [fitBoxDistance, getAreaBounds, moveCameraToBounds]
  );

  const handleSetView = useCallback(
    (dir: CameraDirection) => {
      const box = getAreaBounds(framing);
      const center = box.getCenter(new THREE.Vector3());
      const dist = fitBoxDistance(box, 1.18);
      moveCameraToBounds(center, CARDINAL_DIRS[dir], dist, isSoftwareRef.current);
    },
    [fitBoxDistance, framing, getAreaBounds, moveCameraToBounds]
  );

  const handleZoom = useCallback((factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const offset = camera.position.clone().sub(controls.target);
    const nextDist = THREE.MathUtils.clamp(offset.length() * factor, 0.35, 7);
    offset.setLength(nextDist);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    invalidateRef.current();
  }, []);

  const selectRegionEntry = useCallback(
    (region: ManifestRegion | null, options?: { focus?: boolean; groupOnly?: boolean; muscleId?: string }) => {
      const mId = options?.muscleId ?? region?.muscle ?? null;
      selectionRef.current = {
        region: options?.groupOnly ? null : region,
        muscleId: mId,
      };
      setSelectedRegion(options?.groupOnly ? null : region);
      setSelectedMuscleId(mId);
      updateAppearance();

      if (options?.focus && region) {
        const bounds = regionBoundsRef.current.get(region.id);
        const target = region.focus?.target
          ? new THREE.Vector3(...region.focus.target)
          : bounds
            ? bounds.getCenter(new THREE.Vector3())
            : new THREE.Vector3(0, 1, 0);
        const dir = region.focus?.direction
          ? new THREE.Vector3(...region.focus.direction)
          : HOME_DIRECTION.clone();
        const dist = bounds ? Math.max(0.55, fitBoxDistance(bounds, 1.8)) : 1.1;
        moveCameraToBounds(target, dir, dist, isSoftwareRef.current);
      }
    },
    [fitBoxDistance, moveCameraToBounds, updateAppearance]
  );

  const selectMuscleGroup = useCallback(
    (muscleId: string) => {
      const m = manifestRef.current;
      if (!m) {
        setSelectedMuscleId(muscleId);
        return;
      }
      const preferredSide = selectedRegion?.side;
      const firstRegion =
        m.regions.find((r) => r.muscle === muscleId && r.side === preferredSide) ||
        m.regions.find((r) => r.muscle === muscleId) ||
        null;

      // Combine bounds of all regions in the muscle group
      const groupBox = new THREE.Box3();
      for (const r of m.regions) {
        if (r.muscle !== muscleId) continue;
        const b = regionBoundsRef.current.get(r.id);
        if (b) groupBox.union(b);
      }

      selectionRef.current = { region: null, muscleId };
      setSelectedRegion(null);
      setSelectedMuscleId(muscleId);
      updateAppearance();

      if (!groupBox.isEmpty() && firstRegion) {
        const target = groupBox.getCenter(new THREE.Vector3());
        const dir = firstRegion.focus?.direction
          ? new THREE.Vector3(...firstRegion.focus.direction)
          : HOME_DIRECTION.clone();
        const dist = Math.max(0.75, fitBoxDistance(groupBox, 1.55));
        moveCameraToBounds(target, dir, dist, isSoftwareRef.current);
      }
    },
    [fitBoxDistance, moveCameraToBounds, selectedRegion?.side, updateAppearance]
  );

  // Sync search filtering into 3D mesh highlight
  const searchMatchSet = useMemo(() => {
    if (!manifest) return null;
    return filterRegionsByQuery(manifest.regions, searchQuery);
  }, [manifest, searchQuery]);

  useEffect(() => {
    searchMatchesRef.current = searchMatchSet;
    updateAppearance();
  }, [searchMatchSet, updateAppearance]);

  useEffect(() => {
    updateAppearance();
  }, [showFibres, updateAppearance]);

  // 3. Lazy WebGL2 Init + MeshBVH + Meshopt GLB Loading
  useEffect(() => {
    if (!manifest) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let disposed = false;
    let initialized = false;
    let cleanupViewer: (() => void) | null = null;

    const initViewer = () => {
      if (disposed || initialized) return;
      const rect = container.getBoundingClientRect();
      if (rect.width < 12 || rect.height < 12) return;
      initialized = true;

      const safe = createSafeWebGLRenderer(canvas, { alpha: false });
      if (!safe.renderer) {
        setWebglError(safe.error || 'WebGL2 is unavailable on this graphics driver.');
        return;
      }

      setWebglError(null);
      const renderer = safe.renderer;
      const isSoftware = safe.isSoftware;
      isSoftwareRef.current = isSoftware;
      rendererRef.current = renderer;

      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));

      renderer.setPixelRatio(isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.94;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0c1210');
      sceneRef.current = scene;

      const annotationScene = new THREE.Scene();
      const jointsGroup = new THREE.Group();
      jointsGroup.visible = showJointsRef.current;
      annotationScene.add(jointsGroup);
      jointsGroupRef.current = jointsGroup;

      const camera = new THREE.PerspectiveCamera(34, width / height, 0.015, 30);
      cameraRef.current = camera;

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.55;
      roomEnv.dispose();

      // Studio lighting inspired by SirwanAfifi/anatomy-atlas
      scene.add(new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 0.6));
      const keyLight = new THREE.DirectionalLight(0xfffaf2, 1.45);
      keyLight.position.set(2.8, 4.2, 3.6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0xc7f9e5, 0.65);
      rimLight.position.set(-2.5, 2.2, -3.5);
      scene.add(rimLight);

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = !isSoftware;
      controls.dampingFactor = 0.09;
      controls.rotateSpeed = 0.7;
      controls.zoomSpeed = 0.75;
      controls.minDistance = 0.32;
      controls.maxDistance = 7;
      controls.minPolarAngle = 0.14;
      controls.maxPolarAngle = Math.PI * 0.87;
      controls.screenSpacePanning = true;
      controls.target.set(0, 1, 0);
      camera.position.copy(controls.target).addScaledVector(HOME_DIRECTION, 4.1);
      controls.update();
      controlsRef.current = controls;

      // Joint landmarks sprites
      const jointTexCanvas = document.createElement('canvas');
      jointTexCanvas.width = 96;
      jointTexCanvas.height = 96;
      const ctx2d = jointTexCanvas.getContext('2d');
      if (ctx2d) {
        ctx2d.beginPath();
        ctx2d.arc(48, 48, 34, 0, Math.PI * 2);
        ctx2d.fillStyle = 'rgba(224, 242, 254, 0.85)';
        ctx2d.fill();
        ctx2d.lineWidth = 5;
        ctx2d.strokeStyle = '#0284c7';
        ctx2d.stroke();
        ctx2d.beginPath();
        ctx2d.arc(48, 48, 7, 0, Math.PI * 2);
        ctx2d.fillStyle = '#0369a1';
        ctx2d.fill();
      }
      const jointTexture = new THREE.CanvasTexture(jointTexCanvas);
      jointTexture.colorSpace = THREE.SRGBColorSpace;
      const jointMat = new THREE.SpriteMaterial({
        map: jointTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      for (const joint of manifest.joints || []) {
        const sprite = new THREE.Sprite(jointMat);
        sprite.position.fromArray(joint.position);
        sprite.scale.set(0.065, 0.065, 1);
        sprite.name = joint.label;
        jointsGroup.add(sprite);
      }

      const regionByMeshName = new Map<string, ManifestRegion>();
      const regionById = new Map<string, ManifestRegion>();
      for (const region of manifest.regions) {
        regionById.set(region.id, region);
        for (const mName of region.meshNames) {
          regionByMeshName.set(mName, region);
        }
      }

      const resolveRegionForObject = (obj: THREE.Object3D): ManifestRegion | null => {
        if ((obj.userData as any)?.atlasRegion) {
          return (obj.userData as any).atlasRegion as ManifestRegion;
        }
        let cur: THREE.Object3D | null = obj;
        for (let depth = 0; depth < 3 && cur; depth += 1) {
          const rId = cur.userData?.regionId;
          if (typeof rId === 'string' && regionById.has(rId)) {
            return regionById.get(rId)!;
          }
          if (cur.name) {
            const cleanName = cur.name.replace(/_\d+$/, '');
            const found = regionByMeshName.get(cur.name) || regionByMeshName.get(cleanName);
            if (found) return found;
          }
          cur = cur.parent;
        }
        return null;
      };

      const ownedGeometries: THREE.BufferGeometry[] = [];
      const ownedMaterials: THREE.Material[] = [jointMat];
      const ownedTextures: THREE.Texture[] = [jointTexture];
      const modelMeshes: THREE.Mesh[] = [];
      const raycaster = new THREE.Raycaster();
      (raycaster as any).firstHitOnly = true;
      const pointer = new THREE.Vector2();

      let frameHandle = 0;
      let syncTimerHandle = 0;
      let renderBusy = false;
      let renderDirty = false;
      let labelUpdateCounter = 0;

      const updateProjectedLabels = () => {
        if (!showLabelsRef.current || !manifestRef.current) {
          setProjectedLabels((prev) => (prev.length === 0 ? prev : []));
          return;
        }
        const curWidth = canvas.clientWidth || width;
        const curHeight = canvas.clientHeight || height;
        const candidates = manifestRef.current.regions.filter(
          (r) => !selectionRef.current.muscleId || r.muscle === selectionRef.current.muscleId
        );
        const next: { id: string; label: string; x: number; y: number }[] = [];
        const vec = new THREE.Vector3();
        for (const reg of candidates) {
          if (next.length >= 6) break;
          const b = regionBoundsRef.current.get(reg.id);
          if (!b) continue;
          b.getCenter(vec).project(camera);
          if (vec.z <= -1 || vec.z >= 1 || Math.abs(vec.x) > 0.9 || Math.abs(vec.y) > 0.9) {
            continue;
          }
          const x = Math.round((vec.x + 1) * curWidth * 0.5);
          const y = Math.round((1 - vec.y) * curHeight * 0.5);
          if (next.some((o) => Math.abs(o.x - x) < 96 && Math.abs(o.y - y) < 28)) continue;
          next.push({ id: reg.id, label: reg.label, x, y });
        }
        setProjectedLabels(next);
      };

      const afterDraw = (done: () => void) => {
        const gl = renderer.getContext() as WebGL2RenderingContext | null;
        if (!gl || typeof gl.fenceSync !== 'function') {
          syncTimerHandle = window.setTimeout(done, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        if (!sync) {
          syncTimerHandle = window.setTimeout(done, 80);
          return;
        }
        let polls = 0;
        const poll = () => {
          if (disposed) {
            gl.deleteSync(sync);
            return;
          }
          polls += 1;
          const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED && polls < 1500) {
            syncTimerHandle = window.setTimeout(poll, 8);
          } else {
            gl.deleteSync(sync);
            syncTimerHandle = window.setTimeout(done, 96);
          }
        };
        syncTimerHandle = window.setTimeout(poll, 8);
      };

      let frameDoneCount = 0;

      const invalidate = () => {
        if (disposed) return;
        if (renderBusy) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        frameHandle = requestAnimationFrame(renderFrame);
      };
      invalidateRef.current = invalidate;

      const renderFrame = (now: number) => {
        frameHandle = 0;
        if (disposed) {
          renderBusy = false;
          return;
        }
        renderDirty = false;

        let tweenActive = false;
        if (tweenRef.current) {
          tweenActive = true;
          const tw = tweenRef.current;
          const t = Math.min(1, (now - tw.start) / (isSoftware ? 160 : 420));
          const smooth = t * t * (3 - 2 * t);
          controls.target.lerpVectors(tw.targetFrom, tw.targetTo, smooth);
          const r = THREE.MathUtils.lerp(tw.orbitFrom.radius, tw.orbitTo.radius, smooth);
          const phi = THREE.MathUtils.lerp(tw.orbitFrom.phi, tw.orbitTo.phi, smooth);
          const theta = tw.orbitFrom.theta + tw.thetaDelta * smooth;
          camera.position.setFromSphericalCoords(r, phi, theta).add(controls.target);
          if (t === 1) tweenRef.current = null;
        }

        const moving = controls.update();
        camera.updateMatrixWorld();
        if (containerRef.current) {
          containerRef.current.dataset.camDist = camera.position
            .distanceTo(controls.target)
            .toFixed(3);
        }

        renderer.render(scene, camera);
        if (jointsGroup.visible) {
          renderer.autoClear = false;
          renderer.clearDepth();
          renderer.render(annotationScene, camera);
          renderer.autoClear = true;
        }

        labelUpdateCounter += 1;
        if (showLabelsRef.current && (labelUpdateCounter % 4 === 0 || (!moving && !tweenActive))) {
          updateProjectedLabels();
        } else if (!showLabelsRef.current) {
          setProjectedLabels((prev) => (prev.length === 0 ? prev : []));
        }

        const finishFrame = () => {
          renderBusy = false;
          frameDoneCount += 1;
          if (containerRef.current) {
            containerRef.current.dataset.frameDone = String(frameDoneCount);
          }
          if (disposed) return;
          if (renderDirty || moving || tweenActive) {
            invalidate();
          }
        };
        if (isSoftware) {
          afterDraw(finishFrame);
        } else {
          finishFrame();
        }
      };

      const onControlsChange = () => invalidate();
      controls.addEventListener('change', onControlsChange);

      const pickRegion = (clientX: number, clientY: number): ManifestRegion | null => {
        const r = canvas.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0 || modelMeshes.length === 0) return null;
        pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
        pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(modelMeshes, false);
        for (const hit of hits) {
          const reg = resolveRegionForObject(hit.object);
          if (reg) return reg;
        }
        return null;
      };

      let downPt = { x: 0, y: 0 };
      let lastHoverAt = 0;
      const onPointerDown = (e: PointerEvent) => {
        tweenRef.current = null;
        downPt = { x: e.clientX, y: e.clientY };
      };
      const onPointerMove = (e: PointerEvent) => {
        if (isSoftware || e.pointerType === 'touch' || e.buttons !== 0) return;
        const now = performance.now();
        if (now - lastHoverAt < 50) return;
        lastHoverAt = now;
        const reg = pickRegion(e.clientX, e.clientY);
        const nextId = reg?.id || null;
        if (nextId !== hoverIdRef.current) {
          hoverIdRef.current = nextId;
          setHoveredRegion(reg);
          updateAppearance();
        }
      };
      const onPointerUp = (e: PointerEvent) => {
        if (Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) >= 6) return;
        const reg = pickRegion(e.clientX, e.clientY);
        if (reg) {
          selectRegionEntry(reg, { focus: false });
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);

      const handleCanvasResize = () => {
        const b = container.getBoundingClientRect();
        const w = Math.floor(b.width);
        const h = Math.floor(b.height);
        if (w < 10 || h < 10) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        invalidate();
      };
      const ro = new ResizeObserver(handleCanvasResize);
      ro.observe(container);

      const onContextLost = (e: Event) => {
        e.preventDefault();
        setWebglError('WebGL2 context was interrupted by the device driver.');
      };
      canvas.addEventListener('webglcontextlost', onContextLost);

      // Load Meshopt-compressed GLB & build MeshBVH for instant raycasting
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        manifest.model.url,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          scene.add(model);

          appearanceRef.current = [];
          regionMeshesRef.current.clear();
          regionBoundsRef.current.clear();

          const wholeBox = new THREE.Box3();
          const seenMaterials = new Set<THREE.Material>();
          model.traverse((obj) => {
            if (!(obj as THREE.Mesh).isMesh) return;
            const mesh = obj as THREE.Mesh;
            modelMeshes.push(mesh);
            mesh.updateWorldMatrix(true, false);

            // Build BVH tree on non-indexed/indexed geometry for <0.1ms raycasting on phones
            const geom = mesh.geometry as any;
            ownedGeometries.push(mesh.geometry);
            if (!geom.boundsTree) {
              try {
                geom.boundsTree = new MeshBVH(mesh.geometry);
                mesh.raycast = acceleratedRaycast;
              } catch {
                // Fallback to standard raycast if geometry has unusual attributes
              }
            }

            const reg = resolveRegionForObject(mesh);
            if (reg) {
              mesh.userData.atlasRegion = reg;
              const list = regionMeshesRef.current.get(reg.id) || [];
              list.push(mesh);
              regionMeshesRef.current.set(reg.id, list);

              const meshBox = new THREE.Box3().setFromObject(mesh);
              const existingBox = regionBoundsRef.current.get(reg.id);
              if (existingBox) existingBox.union(meshBox);
              else regionBoundsRef.current.set(reg.id, meshBox);
            }
            wholeBox.expandByObject(mesh);

            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map((orig) => {
                if (seenMaterials.has(orig)) return orig.clone();
                seenMaterials.add(orig);
                return orig;
              });
            } else if (mesh.material) {
              if (seenMaterials.has(mesh.material)) {
                mesh.material = mesh.material.clone();
              } else {
                seenMaterials.add(mesh.material);
              }
            }

            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              ownedMaterials.push(m);
              for (const val of Object.values(m)) {
                if ((val as THREE.Texture)?.isTexture) {
                  ownedTextures.push(val as THREE.Texture);
                }
              }
              const std = m as THREE.MeshStandardMaterial;
              if (std.isMeshStandardMaterial) {
                appearanceRef.current.push({
                  material: std,
                  region: reg,
                  baseColor: std.color.clone(),
                  baseEmissive: std.emissive.clone(),
                  baseEmissiveIntensity: std.emissiveIntensity ?? 0,
                  baseNormalScale: std.normalScale ? std.normalScale.clone() : null,
                  baseBumpScale: std.bumpScale ?? 0,
                  fibreRoughnessMap: std.roughnessMap || null,
                  baseRoughness: std.roughness ?? 0.55,
                });
              }
            });
          });

          if (!wholeBox.isEmpty()) {
            modelBoundsRef.current.copy(wholeBox);
            const center = wholeBox.getCenter(new THREE.Vector3());
            const dist = fitBoxDistance(wholeBox, 1.18);
            moveCameraToBounds(center, HOME_DIRECTION, dist, true);
          }

          updateAppearance();
          setMatchedRegionCount(regionBoundsRef.current.size);
          setLoadProgress(100);
          setIsLoaded(true);
          invalidate();
        },
        (evt) => {
          if (disposed) return;
          if (evt.lengthComputable && evt.total > 0) {
            setLoadProgress(Math.min(96, Math.round((evt.loaded / evt.total) * 96)));
          }
        },
        (err) => {
          if (disposed) return;
          setLoadError((err as any)?.message || 'Failed to load anatomy GLB model.');
        }
      );

      cleanupViewer = () => {
        if (frameHandle) cancelAnimationFrame(frameHandle);
        if (syncTimerHandle) clearTimeout(syncTimerHandle);
        ro.disconnect();
        controls.removeEventListener('change', onControlsChange);
        controls.dispose();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        ownedGeometries.forEach((g) => {
          (g as any).boundsTree = null;
          g.dispose();
        });
        ownedMaterials.forEach((m) => m.dispose());
        ownedTextures.forEach((t) => t.dispose());
        envRT.dispose();
        pmrem.dispose();
        renderer.dispose();
        appearanceRef.current = [];
      };
    };

    const mountObserver = new ResizeObserver(() => initViewer());
    mountObserver.observe(container);
    initViewer();

    return () => {
      disposed = true;
      mountObserver.disconnect();
      cleanupViewer?.();
    };
  }, [manifest, retryToken, fitBoxDistance, moveCameraToBounds, selectRegionEntry, updateAppearance]);

  const activeMuscleMeta = selectedMuscleId ? MUSCLE_GROUPS[selectedMuscleId] : null;
  const activeRegionVariants = useMemo(() => {
    if (!manifest || !selectedMuscleId) return [];
    return manifest.regions.filter((r) => r.muscle === selectedMuscleId);
  }, [manifest, selectedMuscleId]);

  const matchedExercises = useMemo(() => {
    if (!selectedMuscleId || !exerciseCatalog) return [];
    return getExercisesForMuscle(exerciseCatalog, selectedMuscleId, {
      query: exerciseQuery,
      equipment: exerciseEquipment,
      relationship: exerciseRole,
    });
  }, [selectedMuscleId, exerciseCatalog, exerciseQuery, exerciseEquipment, exerciseRole]);

  const availableEquipment = useMemo(() => {
    if (!selectedMuscleId || !exerciseCatalog) return [];
    const allForMuscle = getExercisesForMuscle(exerciseCatalog, selectedMuscleId);
    return Array.from(new Set(allForMuscle.map((e) => e.equipment))).sort();
  }, [selectedMuscleId, exerciseCatalog]);

  const exerciseInfo = useMemo(
    () => (selectedMuscleId ? getMuscleExerciseInfo(selectedMuscleId) : null),
    [selectedMuscleId]
  );

  const groupedMuscles = useMemo(() => {
    const entries = Object.entries(MUSCLE_GROUPS);
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.trim().toLowerCase();
    return entries.filter(([id, meta]) => {
      if (
        meta.name.toLowerCase().includes(q) ||
        meta.area.toLowerCase().includes(q) ||
        meta.latin.toLowerCase().includes(q)
      ) {
        return true;
      }
      return Boolean(
        manifest?.regions.some(
          (r) => r.muscle === id && r.label.toLowerCase().includes(q)
        )
      );
    });
  }, [manifest, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left 3D Stage */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2 lg:sticky lg:top-20 self-start">
          {/* Top Stage Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2">
            <div className="flex items-center gap-1" role="group" aria-label="Body framing">
              {(
                [
                  ['full', 'Full Body'],
                  ['upper', 'Upper Body'],
                  ['lower', 'Lower Body'],
                ] as [BodyAreaFraming, string][]
              ).map(([areaKey, label]) => (
                <button
                  key={areaKey}
                  type="button"
                  onClick={() => handleFrameArea(areaKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    framing === areaKey
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5" role="group" aria-label="Display layers">
              <button
                type="button"
                onClick={() => setShowFibres((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  showFibres
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Fibres</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLabels((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  showLabels
                    ? 'bg-sky-700 text-white'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>Labels</span>
              </button>
              <button
                type="button"
                onClick={() => setShowJoints((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  showJoints
                    ? 'bg-indigo-700 text-white'
                    : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Joints</span>
              </button>
            </div>
          </div>

          {/* 3D Viewport */}
          <div
            ref={containerRef}
            data-matched-regions={matchedRegionCount}
            data-selected-muscle={selectedMuscleId || ''}
            className="relative w-full h-[430px] sm:h-[510px] md:h-[560px] rounded-xl overflow-hidden bg-[#0c1210] border border-zinc-300 shadow-md select-none touch-none"
          >
            {/* Top-Right Status Badge */}
            <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-2">
              {hoveredRegion && (
                <div className="hidden sm:block bg-[#0f172a] border border-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium text-amber-300">
                  {hoveredRegion.label}
                </div>
              )}
              <div className="bg-[#0f172a] border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[11px] text-slate-200 font-mono">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isLoaded
                    ? `Anatomy Atlas • ${manifest?.regions.length || 126} Muscles`
                    : `Loading Atlas ${loadProgress}%`}
                </span>
              </div>
            </div>

            {/* Projected 3D HTML Labels */}
            {showLabels && projectedLabels.length > 0 && (
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                {projectedLabels.map((lbl) => (
                  <div
                    key={lbl.id}
                    style={{ left: `${lbl.x}px`, top: `${lbl.y}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#090f19] border border-emerald-500/60 text-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded shadow whitespace-nowrap"
                  >
                    {lbl.label}
                  </div>
                ))}
              </div>
            )}

            {/* Loading Bar Overlay */}
            {!isLoaded && !webglError && !loadError && (
              <div className="absolute inset-x-6 bottom-16 z-20 bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-slate-100 text-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex items-center justify-between font-semibold">
                  <span>Loading Anatomy Atlas (126 subdivisions)</span>
                  <span className="font-mono text-emerald-300">{loadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Safe 2D Fallback when WebGL2 is unavailable */}
            {(webglError || loadError) && (
              <div className="absolute inset-0 z-30 bg-[#0c1210] text-slate-100 p-6 flex flex-col items-center justify-center text-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <h3 className="text-base font-bold">2D Muscle &amp; Exercise Atlas Mode</h3>
                <p className="text-xs text-slate-300 max-w-md">
                  {webglError || loadError} Select any muscle group on the right to inspect its Latin nomenclature and matched exercise cards.
                </p>
                <button
                  type="button"
                  onClick={() => setRetryToken((n) => n + 1)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry 3D WebGL2</span>
                </button>
              </div>
            )}

            {/* Camera Control Bar */}
            {!webglError && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#0f172a] border border-slate-700 px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleZoom(0.78)}
                  className="p-1.5 bg-[#1e293b] hover:bg-emerald-700 text-white rounded text-xs"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(1.28)}
                  className="p-1.5 bg-[#1e293b] hover:bg-emerald-700 text-white rounded text-xs"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFrameArea('full')}
                  className="px-2 py-1 bg-[#1e293b] hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <div className="h-4 w-px bg-slate-700 mx-0.5" />
                {(['front', 'back', 'left', 'right'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => handleSetView(dir)}
                    className="px-2 py-1 bg-[#1e293b] hover:bg-emerald-700 text-white rounded text-[11px] font-semibold capitalize"
                  >
                    {dir}
                  </button>
                ))}
              </div>
            )}

            <canvas
              ref={canvasRef}
              aria-label="Muscular Anatomy Atlas 3D Viewport"
              className="w-full h-full block cursor-grab active:cursor-grabbing"
            />
          </div>
        </div>

        {/* Right Sidebar: Selected Muscle Inspector & 18 Muscle Groups Browser */}
        <aside className="w-full lg:w-[350px] bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div>
                <h2 className="text-base font-extrabold text-zinc-900">
                  Muscular &amp; Exercise Atlas
                </h2>
                <p className="text-[11px] text-zinc-500">
                  18 muscle families • 126 subdivisions
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                MeshBVH
              </span>
            </div>

            {/* Selected Muscle Inspector */}
            {activeMuscleMeta && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-emerald-700 font-semibold">
                      {activeMuscleMeta.area}
                    </div>
                    <h3 className="text-sm font-extrabold text-zinc-900">
                      {selectedRegion ? selectedRegion.label : activeMuscleMeta.name}
                    </h3>
                    <p className="text-[11px] italic font-serif text-zinc-500">
                      {activeMuscleMeta.latin}
                      {selectedRegion ? ` • ${ATLAS_SIDE_LABELS[selectedRegion.side]}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      selectionRef.current = { region: null, muscleId: null };
                      setSelectedRegion(null);
                      setSelectedMuscleId(null);
                      updateAppearance();
                    }}
                    className="text-zinc-400 hover:text-black"
                    aria-label="Clear muscle selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subdivisions / Sides Selector */}
                {activeRegionVariants.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">
                      Subdivisions ({activeRegionVariants.length})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {activeRegionVariants.map((reg) => {
                        const active = selectedRegion?.id === reg.id;
                        return (
                          <button
                            key={reg.id}
                            type="button"
                            onClick={() => selectRegionEntry(reg, { focus: true })}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                              active
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            {reg.label.replace(/ muscle$/i, '')} ({reg.side === 'left' ? 'L' : reg.side === 'right' ? 'R' : 'M'})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onAskTutorWithTopic(
                        `Explain the functional anatomy, origin, insertion, and innervation of: ${
                          selectedRegion ? selectedRegion.label : activeMuscleMeta.name
                        }`,
                        `Muscle Family: ${activeMuscleMeta.name} (${activeMuscleMeta.latin})\nRegion: ${activeMuscleMeta.area}\nSelected Subdivision: ${
                          selectedRegion?.label || activeMuscleMeta.name
                        }`
                      )
                    }
                    className="w-full py-1.5 px-2.5 bg-black hover:bg-zinc-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ask AI Tutor about {activeMuscleMeta.name}</span>
                  </button>
                  {matchedExercises.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById('muscular-exercise-library')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                      className="w-full py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>View {matchedExercises.length} Matched Exercises</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Muscle Search + List */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter muscle group or Latin term..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-black"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                {groupedMuscles.map(([id, meta]) => {
                  const isActive = selectedMuscleId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectMuscleGroup(id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-black text-white border-black'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{meta.name}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {meta.area} • <i>{meta.latin}</i>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 border-t border-zinc-100 pt-2 leading-snug">
            Integrated from <b>github.com/SirwanAfifi/anatomy-atlas</b> &amp; <b>Z-Anatomy</b> (CC BY-SA 4.0) + <b>Free Exercise DB</b> (Unlicense).
          </div>
        </aside>
      </div>

      {/* Visual Exercise Library Panel (appears when a muscle group is selected) */}
      {selectedMuscleId && activeMuscleMeta && (
        <section
          id="muscular-exercise-library"
          className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <Dumbbell className="w-4 h-4" />
                <span>Biomechanics &amp; Exercise Library</span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                Exercises targeting {activeMuscleMeta.name} ({matchedExercises.length})
              </h3>
              {exerciseInfo && (
                <p className="text-[11px] text-zinc-500">{exerciseInfo.note}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={exerciseQuery}
                onChange={(e) => setExerciseQuery(e.target.value)}
                placeholder="Search exercise..."
                className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-black"
              />
              <select
                value={exerciseEquipment}
                onChange={(e) => setExerciseEquipment(e.target.value)}
                aria-label="Filter by equipment"
                className="px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg"
              >
                <option value="all">All Equipment</option>
                {availableEquipment.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
              <select
                value={exerciseRole}
                onChange={(e) => setExerciseRole(e.target.value as any)}
                aria-label="Filter by muscle role"
                className="px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg"
              >
                <option value="all">Primary &amp; Supporting</option>
                <option value="primary">Primary Mover</option>
                <option value="secondary">Supporting Synergist</option>
              </select>
            </div>
          </div>

          {exerciseLoading ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Loading exercise photographs &amp; instructions...
            </div>
          ) : matchedExercises.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              No photo-verified exercises match these filters for {activeMuscleMeta.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {matchedExercises.slice(0, 12).map((ex: ExerciseRecord) => {
                const imgs = ex.media?.images || [];
                const photoIdx = activePhotoIndex[ex.id] || 0;
                const currentImg = imgs[photoIdx % Math.max(1, imgs.length)];
                const isExpanded = expandedExerciseId === ex.id;

                return (
                  <div
                    key={ex.id}
                    className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 flex flex-col"
                  >
                    {currentImg && (
                      <div className="relative h-40 bg-zinc-900 overflow-hidden">
                        <img
                          src={currentImg}
                          alt={ex.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {imgs.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setActivePhotoIndex((prev) => ({
                                ...prev,
                                [ex.id]: ((prev[ex.id] || 0) + 1) % imgs.length,
                              }))
                            }
                            className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold"
                          >
                            Pose {(photoIdx % imgs.length) + 1}/{imgs.length}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono uppercase">
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              ex.match === 'primary'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-sky-100 text-sky-900'
                            }`}
                          >
                            {ex.match === 'primary' ? 'Primary' : 'Synergist'}
                          </span>
                          <span className="text-zinc-500">{ex.equipment}</span>
                        </div>
                        <h4 className="font-bold text-zinc-900 text-xs mt-1">{ex.name}</h4>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedExerciseId((cur) => (cur === ex.id ? null : ex.id))
                        }
                        className="text-[11px] font-semibold text-zinc-700 hover:text-black flex items-center justify-between pt-1 border-t border-zinc-200"
                      >
                        <span>Step-by-step form cues</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <ol className="text-[11px] text-zinc-600 list-decimal pl-4 space-y-1 pt-1">
                          {ex.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
