import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AnatomyPartDef, AnatomySystem } from '../utils/anatomyData';
import { createSafeWebGLRenderer } from '../utils/webglSafe';
import {
  ZAnatomyLexiconEntry,
  ZAnatomySearchEntry,
  ZAnatomySystemKey,
  buildSearchableCatalog,
  cleanZAnatomyName,
  isFemaleSpecificAnatomyName,
  isMaleSpecificAnatomyMesh,
  isTranslucentSheathMaterialOrMesh,
  lookupZAnatomyMetadata,
} from '../utils/zAnatomyCatalog';
import {
  RotateCw,
  Crosshair,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Layers,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export type AnatomicalLayerKey =
  | 'muscles'
  | 'skeleton'
  | 'organs'
  | 'nervous'
  | 'circulatory'
  | 'lymphatic'
  | 'joints';

export type ReproductiveMode = 'male' | 'female';

export interface AnatomyCanvas3DHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  toggleRotate: () => void;
  resetView: () => void;
  setView: (view: 'front' | 'side' | 'back') => void;
  isolateCurrentPart: () => void;
  showAllStructures: () => void;
  focusStructure: (rawName: string, options?: { isolate?: boolean }) => boolean;
  setExplodedLevel: (progress: number) => void;
}

export interface AnatomyCanvas3DProps {
  system?: AnatomySystem;
  onSelectPart: (part: AnatomyPartDef | null) => void;
  selectedPart: AnatomyPartDef | null;
  explodedProgress: number; // 0 to 1
  onExplodedProgressChange?: (progress: number) => void;
  activeLayers: Record<AnatomicalLayerKey, boolean>;
  showFascia?: boolean;
  reproductiveMode?: ReproductiveMode;
  renderMode: 'realistic' | 'xray' | 'wireframe';
  onStatusUpdate?: (status: string) => void;
  isolatedPartId?: string | null;
  onIsolatePart?: (partId: string | null) => void;
  onCatalogReady?: (entries: ZAnatomySearchEntry[]) => void;
  onEnsureLayerVisible?: (layer: AnatomicalLayerKey) => void;
}

interface ExplodeCacheEntry {
  mesh: THREE.Mesh;
  ox: number;
  oy: number;
  oz: number;
  dx: number;
  dy: number;
  dz: number;
}

const LAYER_CONFIGS: {
  id: AnatomicalLayerKey;
  zSystem: ZAnatomySystemKey;
  name: string;
  file: string;
}[] = [
  { id: 'skeleton', zSystem: 'skeletal', name: 'Skeletal System', file: '/models/skeletal.glb' },
  { id: 'organs', zSystem: 'visceral', name: 'Internal Organs', file: '/models/visceral.glb' },
  { id: 'muscles', zSystem: 'muscular', name: 'Muscular System', file: '/models/muscular.glb' },
  { id: 'nervous', zSystem: 'nervous', name: 'Nervous System', file: '/models/nervous.glb' },
  { id: 'circulatory', zSystem: 'cardiovascular', name: 'Circulatory System', file: '/models/cardiovascular.glb' },
  { id: 'lymphatic', zSystem: 'lymphatic', name: 'Lymphatic System', file: '/models/lymphatic.glb' },
  { id: 'joints', zSystem: 'joints', name: 'Joints & Ligaments', file: '/models/joints.glb' },
];

// Calibrated to Z-Anatomy Blender world coordinates (Y spans -0.22m plantar to +1.67m cranial vertex)
const DEFAULT_BODY_CENTER = new THREE.Vector3(0, 0.74, 0);
const DEFAULT_CAMERA_DIST = 3.15;

const XRAY_LAYER_SETTINGS: Record<AnatomicalLayerKey, { color: number; opacity: number }> = {
  muscles: { color: 0x38bdf8, opacity: 0.13 },
  skeleton: { color: 0xe2e8f0, opacity: 0.65 },
  organs: { color: 0x7dd3fc, opacity: 0.36 },
  circulatory: { color: 0xfb7185, opacity: 0.44 },
  nervous: { color: 0xfde047, opacity: 0.46 },
  joints: { color: 0x94a3b8, opacity: 0.24 },
  lymphatic: { color: 0x34d399, opacity: 0.32 },
};

const WIREFRAME_LAYER_COLORS: Record<AnatomicalLayerKey, number> = {
  muscles: 0xf87171,
  skeleton: 0xe2e8f0,
  organs: 0xfb7185,
  circulatory: 0xef4444,
  nervous: 0xfacc15,
  joints: 0x94a3b8,
  lymphatic: 0x10b981,
};

function getExplodeMultiplier(layerId: AnatomicalLayerKey): number {
  if (layerId === 'muscles') return 1.55;
  if (layerId === 'lymphatic') return 1.15;
  if (layerId === 'organs') return 0.95;
  return 0.5;
}

/**
 * Builds an anatomically positioned 3D Female Reproductive Pelvic Assembly
 * calibrated to Z-Anatomy's pelvis coordinates (Sacrum at y=0.927, Bladder at y=0.858, z=-0.004).
 */
function buildFemaleReproductiveAssembly(): {
  group: THREE.Group;
  meshes: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.name = 'femaleReproductiveAssembly';
  const meshes: THREE.Mesh[] = [];

  const uterineMat = new THREE.MeshStandardMaterial({
    name: 'FemaleUterineMyometrium',
    color: 0xe11d48,
    roughness: 0.38,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  const tubeMat = new THREE.MeshStandardMaterial({
    name: 'FemaleUterineTube',
    color: 0xf472b6,
    roughness: 0.42,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const ovaryMat = new THREE.MeshStandardMaterial({
    name: 'FemaleOvarianCortex',
    color: 0xfbbf24,
    roughness: 0.44,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const ligamentMat = new THREE.MeshStandardMaterial({
    name: 'FemaleOvarianLigament',
    color: 0xfbcfe8,
    roughness: 0.52,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // 1. Pear-shaped Uterus (body + fundus) calibrated to true pelvic cavity posterosuperior to bladder
  const uterusProfile = [
    new THREE.Vector2(0.0, -0.026),
    new THREE.Vector2(0.014, -0.024),
    new THREE.Vector2(0.019, -0.008),
    new THREE.Vector2(0.029, 0.013),
    new THREE.Vector2(0.031, 0.027),
    new THREE.Vector2(0.024, 0.037),
    new THREE.Vector2(0.0, 0.04),
  ];
  const uterusGeom = new THREE.LatheGeometry(uterusProfile, 24);
  uterusGeom.scale(1.08, 1.02, 0.72);
  const uterusMesh = new THREE.Mesh(uterusGeom, uterineMat.clone());
  uterusMesh.name = 'Uterus';
  uterusMesh.position.set(0, 0.892, -0.016);
  uterusMesh.rotation.x = 0.56; // Anteverted over urinary bladder
  uterusMesh.userData = { zaName: 'Uterus', isFemaleSpecific: true };
  group.add(uterusMesh);
  meshes.push(uterusMesh);

  // 2. Cervix of uterus
  const cervixGeom = new THREE.CylinderGeometry(0.013, 0.015, 0.026, 20);
  const cervixMesh = new THREE.Mesh(cervixGeom, uterineMat.clone());
  cervixMesh.name = 'Cervix of uterus';
  cervixMesh.position.set(0, 0.858, -0.026);
  cervixMesh.rotation.x = 0.25;
  cervixMesh.userData = { zaName: 'Cervix of uterus', isFemaleSpecific: true };
  group.add(cervixMesh);
  meshes.push(cervixMesh);

  // 3. Vagina (tucked anatomically within true pelvic outlet between bladder and rectum)
  const vaginaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.852, -0.028),
    new THREE.Vector3(0, 0.832, -0.023),
    new THREE.Vector3(0, 0.812, -0.014),
  ]);
  const vaginaGeom = new THREE.TubeGeometry(vaginaCurve, 16, 0.013, 16, false);
  vaginaGeom.scale(1.2, 1.0, 0.76);
  const vaginaMesh = new THREE.Mesh(vaginaGeom, tubeMat.clone());
  vaginaMesh.name = 'Vagina';
  vaginaMesh.userData = { zaName: 'Vagina', isFemaleSpecific: true };
  group.add(vaginaMesh);
  meshes.push(vaginaMesh);

  // 4. Bilateral Fallopian tubes, Ovaries & Ovarian ligaments
  const sides: { suffix: '.l' | '.r'; sign: 1 | -1 }[] = [
    { suffix: '.l', sign: 1 },
    { suffix: '.r', sign: -1 },
  ];

  for (const { suffix, sign } of sides) {
    const tubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.022, 0.896, -0.005),
      new THREE.Vector3(sign * 0.044, 0.903, -0.012),
      new THREE.Vector3(sign * 0.064, 0.898, -0.022),
      new THREE.Vector3(sign * 0.072, 0.884, -0.028),
      new THREE.Vector3(sign * 0.064, 0.876, -0.03),
    ]);
    const fallopianGeom = new THREE.TubeGeometry(tubeCurve, 20, 0.0042, 12, false);
    const fallopianMesh = new THREE.Mesh(fallopianGeom, tubeMat.clone());
    fallopianMesh.name = `Fallopian tube${suffix}`;
    fallopianMesh.userData = { zaName: `Fallopian tube${suffix}`, isFemaleSpecific: true };
    group.add(fallopianMesh);
    meshes.push(fallopianMesh);

    const ovaryGeom = new THREE.SphereGeometry(0.015, 20, 16);
    ovaryGeom.scale(0.85, 1.15, 0.7);
    const ovaryMesh = new THREE.Mesh(ovaryGeom, ovaryMat.clone());
    ovaryMesh.name = `Ovary${suffix}`;
    ovaryMesh.position.set(sign * 0.062, 0.884, -0.026);
    ovaryMesh.rotation.z = sign * 0.25;
    ovaryMesh.userData = { zaName: `Ovary${suffix}`, isFemaleSpecific: true };
    group.add(ovaryMesh);
    meshes.push(ovaryMesh);

    const ligCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.022, 0.888, -0.009),
      new THREE.Vector3(sign * 0.042, 0.886, -0.018),
      new THREE.Vector3(sign * 0.056, 0.884, -0.024),
    ]);
    const ligGeom = new THREE.TubeGeometry(ligCurve, 10, 0.0024, 8, false);
    const ligMesh = new THREE.Mesh(ligGeom, ligamentMat.clone());
    ligMesh.name = `Ovarian ligament${suffix}`;
    ligMesh.userData = { zaName: `Ovarian ligament${suffix}`, isFemaleSpecific: true };
    group.add(ligMesh);
    meshes.push(ligMesh);
  }

  uterineMat.dispose();
  tubeMat.dispose();
  ovaryMat.dispose();
  ligamentMat.dispose();

  return { group, meshes };
}

export const AnatomyCanvas3D = forwardRef<AnatomyCanvas3DHandle, AnatomyCanvas3DProps>(
  (
    {
      onSelectPart,
      selectedPart,
      explodedProgress,
      activeLayers,
      showFascia = false,
      reproductiveMode = 'male',
      renderMode,
      onStatusUpdate,
      isolatedPartId,
      onIsolatePart,
      onCatalogReady,
      onEnsureLayerVisible,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const gridRef = useRef<THREE.GridHelper | null>(null);

    const masterGroupRef = useRef<THREE.Group | null>(null);
    const femaleGroupRef = useRef<THREE.Group | null>(null);
    const layerGroupsRef = useRef<Map<AnatomicalLayerKey, THREE.Group>>(new Map());
    const bodyCenterRef = useRef<THREE.Vector3>(DEFAULT_BODY_CENTER.clone());
    const bodyDistRef = useRef<number>(DEFAULT_CAMERA_DIST);

    // Z-Anatomy dictionaries
    const definitionsRef = useRef<Record<string, string>>({});
    const lexiconRef = useRef<Record<string, ZAnatomyLexiconEntry>>({});
    const systemsMapRef = useRef<Record<string, string[]>>({});

    // Meshes & pooled fast-path caches
    const meshesRef = useRef<THREE.Mesh[]>([]);
    const meshInitialMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
    const explodeCacheRef = useRef<ExplodeCacheEntry[]>([]);
    const explodeRafRef = useRef<number | null>(null);
    const pendingExplodeRef = useRef<number>(explodedProgress);
    const xrayMaterialsRef = useRef<Map<AnatomicalLayerKey, THREE.MeshLambertMaterial>>(new Map());
    const xraySelectedMatRef = useRef<THREE.MeshLambertMaterial | null>(null);
    const wireframeMaterialsRef = useRef<Map<AnatomicalLayerKey, THREE.MeshBasicMaterial>>(new Map());
    const pelvicGhostMatRef = useRef<THREE.MeshLambertMaterial | null>(null);
    const isolatedMeshRef = useRef<THREE.Mesh | null>(null);

    // Render loop & WebGL safety state
    const isSoftwareGlRef = useRef<boolean>(false);
    const requestRenderImplRef = useRef<() => void>(() => {});
    const isRotatingRef = useRef<boolean>(false);
    const hasCustomFocusRef = useRef<boolean>(false);

    const [isRotating, setIsRotating] = useState(false);
    const [loadedLayersCount, setLoadedLayersCount] = useState(0);
    const [dockCollapsed, setDockCollapsed] = useState(false);
    const [hoveredName, setHoveredName] = useState<string | null>(null);
    const [webglFallbackReason, setWebglFallbackReason] = useState<string | null>(null);
    const [initAttempt, setInitAttempt] = useState<number>(0);

    // Latest callback/prop refs
    const onSelectPartRef = useRef(onSelectPart);
    onSelectPartRef.current = onSelectPart;
    const activeLayersRef = useRef(activeLayers);
    activeLayersRef.current = activeLayers;
    const showFasciaRef = useRef(showFascia);
    showFasciaRef.current = showFascia;
    const reproductiveModeRef = useRef<ReproductiveMode>(reproductiveMode);
    reproductiveModeRef.current = reproductiveMode;
    const onCatalogReadyRef = useRef(onCatalogReady);
    onCatalogReadyRef.current = onCatalogReady;
    const onEnsureLayerVisibleRef = useRef(onEnsureLayerVisible);
    onEnsureLayerVisibleRef.current = onEnsureLayerVisible;
    const onStatusUpdateRef = useRef(onStatusUpdate);
    onStatusUpdateRef.current = onStatusUpdate;

    const requestRender = useCallback(() => {
      requestRenderImplRef.current();
    }, []);

    // Load Z-Anatomy medical dictionaries once on mount
    useEffect(() => {
      let isMounted = true;
      async function loadDictionaries() {
        try {
          const [defsRes, lexRes, sysRes] = await Promise.all([
            fetch('/data/definitions.json'),
            fetch('/data/lexicon.json'),
            fetch('/data/systems.json'),
          ]);
          if (defsRes.ok && lexRes.ok && sysRes.ok) {
            const [defs, lex, sys] = await Promise.all([
              defsRes.json(),
              lexRes.json(),
              sysRes.json(),
            ]);
            if (!isMounted) return;
            definitionsRef.current = defs;
            lexiconRef.current = lex;
            systemsMapRef.current = sys;
            const catalog = buildSearchableCatalog(sys, lex);
            onCatalogReadyRef.current?.(catalog);
          }
        } catch (err) {
          console.warn('Could not load Z-Anatomy dictionaries:', err);
        }
      }
      loadDictionaries();
      return () => {
        isMounted = false;
      };
    }, []);

    const frameObject = useCallback(
      (
        obj: THREE.Object3D,
        view: 'front' | 'side' | 'back' | 'pelvis-oblique' = 'front',
        minDist = 0.35
      ) => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        obj.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(obj);
        if (box.isEmpty()) return;

        hasCustomFocusRef.current = true;
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fovRad = THREE.MathUtils.degToRad(camera.fov);
        const fitDist = Math.max(minDist, ((maxDim / 2) / Math.tan(fovRad / 2)) * 1.35);

        controls.target.copy(center);
        if (view === 'pelvis-oblique') {
          camera.position.set(
            center.x + fitDist * 0.16,
            center.y + fitDist * 0.44,
            center.z + fitDist * 0.88
          );
        } else if (view === 'front') {
          camera.position.set(center.x, center.y + 0.04, center.z + fitDist);
        } else if (view === 'side') {
          camera.position.set(center.x + fitDist, center.y + 0.04, center.z);
        } else {
          camera.position.set(center.x, center.y + 0.04, center.z - fitDist);
        }
        camera.lookAt(center);
        controls.update();
        requestRender();
      },
      [requestRender]
    );

    const setCameraView = useCallback(
      (view: 'front' | 'side' | 'back') => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        if (isolatedMeshRef.current && isolatedMeshRef.current.visible) {
          frameObject(isolatedMeshRef.current, view, 0.38);
          return;
        }

        const target = bodyCenterRef.current.clone();
        const dist = bodyDistRef.current;

        controls.target.copy(target);
        if (view === 'front') {
          camera.position.set(target.x, target.y, target.z + dist);
        } else if (view === 'side') {
          camera.position.set(target.x + dist, target.y, target.z);
        } else {
          camera.position.set(target.x, target.y, target.z - dist);
        }
        camera.lookAt(target);
        controls.update();
        requestRender();
      },
      [frameObject, requestRender]
    );

    const resetCameraView = useCallback(() => {
      isolatedMeshRef.current = null;
      hasCustomFocusRef.current = false;
      setCameraView('front');
    }, [setCameraView]);

    const zoomIn = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;
      hasCustomFocusRef.current = true;
      const dir = camera.position.clone().sub(controls.target);
      if (dir.length() > 0.25) {
        dir.multiplyScalar(0.75);
        camera.position.copy(controls.target).add(dir);
        controls.update();
        requestRender();
      }
    }, [requestRender]);

    const zoomOut = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;
      hasCustomFocusRef.current = true;
      const dir = camera.position.clone().sub(controls.target);
      if (dir.length() < 9.5) {
        dir.multiplyScalar(1.3);
        camera.position.copy(controls.target).add(dir);
        controls.update();
        requestRender();
      }
    }, [requestRender]);

    const toggleRotate = useCallback(() => {
      if (isSoftwareGlRef.current) {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (camera && controls) {
          const offset = camera.position.clone().sub(controls.target);
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
          camera.position.copy(controls.target).add(offset);
          controls.update();
          requestRender();
        }
        return;
      }
      setIsRotating((prev) => {
        const next = !prev;
        isRotatingRef.current = next;
        if (controlsRef.current) {
          controlsRef.current.autoRotate = next;
        }
        requestRender();
        return next;
      });
    }, [requestRender]);

    const isolateCurrentPart = useCallback(() => {
      if (selectedPart && onIsolatePart) {
        onIsolatePart(selectedPart.id);
      }
    }, [selectedPart, onIsolatePart]);

    const showAllStructures = useCallback(() => {
      isolatedMeshRef.current = null;
      if (onIsolatePart) {
        onIsolatePart(null);
      }
      resetCameraView();
    }, [onIsolatePart, resetCameraView]);

    const getPartDossierInfo = useCallback(
      (meshName: string, layerId: AnatomicalLayerKey): AnatomyPartDef => {
        const fallbackSystem =
          LAYER_CONFIGS.find((l) => l.id === layerId)?.zSystem || 'muscular';

        const meta = lookupZAnatomyMetadata(
          meshName,
          fallbackSystem,
          definitionsRef.current,
          lexiconRef.current,
          systemsMapRef.current
        );

        const mappedLayer: AnatomyPartDef['layer'] =
          layerId === 'muscles'
            ? 'muscular'
            : layerId === 'skeleton' || layerId === 'joints'
              ? 'skeletal'
              : layerId === 'organs'
                ? 'visceral'
                : 'nervous_vascular';

        return {
          id: meshName,
          name: meta.displayName,
          latinName: meta.latinName,
          layer: mappedLayer,
          geometryType: 'sphere',
          color: '#38bdf8',
          position: [0, 0, 0],
          scale: [1, 1, 1],
          explosionDir: [0, 0, 0],
          mechanicalRole: `Z-Anatomy ${meta.system.toUpperCase()} structure (${layerId} layer).`,
          description: meta.description,
          highYieldFact: meta.highYieldFact,
          wikipediaUrl: meta.wikipediaUrl,
          isOfficialTA: meta.isOfficialTA,
        };
      },
      []
    );

    const getMeshStructureName = useCallback((mesh: THREE.Mesh): string => {
      const parentName =
        mesh.parent &&
        mesh.parent.name &&
        !mesh.parent.name.startsWith('layer_') &&
        mesh.parent.name !== 'femaleReproductiveAssembly'
          ? mesh.parent.name
          : '';
      return (
        (mesh.userData.zaName as string) ||
        (mesh.userData.za_name as string) ||
        (/_\d+$/.test(mesh.name) && parentName ? parentName : mesh.name) ||
        parentName ||
        'Anatomical Structure'
      );
    }, []);

    // Zero-allocation scalar explosion updater coalesced onto RAF
    const applyExplodedImmediate = useCallback(
      (progress: number) => {
        const cache = explodeCacheRef.current;
        const resetToOrigin = progress <= 0.001;
        const factor = progress * 0.42;

        for (let i = 0; i < cache.length; i += 1) {
          const entry = cache[i];
          if (resetToOrigin) {
            entry.mesh.position.set(entry.ox, entry.oy, entry.oz);
          } else {
            entry.mesh.position.set(
              entry.ox + entry.dx * factor,
              entry.oy + entry.dy * factor,
              entry.oz + entry.dz * factor
            );
          }
        }
        requestRender();
      },
      [requestRender]
    );

    const setExplodedLevel = useCallback(
      (progress: number) => {
        pendingExplodeRef.current = Math.max(0, Math.min(1, progress));
        if (explodeRafRef.current !== null) return;
        explodeRafRef.current = requestAnimationFrame(() => {
          explodeRafRef.current = null;
          applyExplodedImmediate(pendingExplodeRef.current);
        });
      },
      [applyExplodedImmediate]
    );

    const focusStructure = useCallback(
      (rawName: string, options?: { isolate?: boolean }): boolean => {
        const targetLower = rawName.toLowerCase();
        const cleanedTarget = cleanZAnatomyName(rawName).toLowerCase();

        const matchingMeshes = meshesRef.current.filter((m) => {
          const sName = getMeshStructureName(m);
          const sLower = sName.toLowerCase();
          const sClean = cleanZAnatomyName(sName).toLowerCase();
          return (
            sName === rawName ||
            m.name === rawName ||
            sClean === cleanedTarget ||
            sLower === targetLower
          );
        });

        const fallbackMesh =
          matchingMeshes[0] ||
          meshesRef.current.find((m) => {
            const sName = getMeshStructureName(m);
            const sClean = cleanZAnatomyName(sName).toLowerCase();
            return sClean.includes(cleanedTarget) || cleanedTarget.includes(sClean);
          });

        const layerId =
          (fallbackMesh?.userData.layer as AnatomicalLayerKey) ||
          (isFemaleSpecificAnatomyName(rawName) ? 'organs' : 'muscles');
        onEnsureLayerVisibleRef.current?.(layerId);

        const canonicalName = fallbackMesh ? getMeshStructureName(fallbackMesh) : rawName;
        const partDef = getPartDossierInfo(canonicalName, layerId);
        onSelectPartRef.current(partDef);

        if (!fallbackMesh) {
          return true; // Allows 2D fallback focus cleanly when GLBs are unloaded
        }

        if (options?.isolate && onIsolatePart) {
          onIsolatePart(partDef.id);
        } else {
          if (onIsolatePart) onIsolatePart(null);
          const isFemaleStruct = isFemaleSpecificAnatomyName(canonicalName);
          const targetObj =
            isFemaleStruct && femaleGroupRef.current
              ? femaleGroupRef.current
              : matchingMeshes.length > 1 &&
                  fallbackMesh.parent &&
                  !fallbackMesh.parent.name.startsWith('layer_') &&
                  fallbackMesh.parent.name !== 'femaleReproductiveAssembly'
                ? fallbackMesh.parent
                : fallbackMesh;
          frameObject(
            targetObj,
            isFemaleStruct ? 'pelvis-oblique' : 'front',
            isFemaleStruct ? 0.38 : 0.34
          );
        }
        return true;
      },
      [frameObject, getMeshStructureName, getPartDossierInfo, onIsolatePart]
    );

    useImperativeHandle(ref, () => ({
      zoomIn,
      zoomOut,
      toggleRotate,
      resetView: resetCameraView,
      setView: setCameraView,
      isolateCurrentPart,
      showAllStructures,
      focusStructure,
      setExplodedLevel,
    }));

    // Lazy Three.js initialization + GLB loading only when container becomes visible (>10px)
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      let disposed = false;
      let sceneInitialized = false;
      let dracoLoader: DRACOLoader | null = null;
      let cleanupScene: (() => void) | null = null;

      const bootScene = () => {
        if (disposed || sceneInitialized) return;
        const w = Math.floor(container.clientWidth);
        const h = Math.floor(container.clientHeight);
        if (w <= 10 || h <= 10) return;

        sceneInitialized = true;

        const safe = createSafeWebGLRenderer(canvas, { alpha: false });
        if (!safe.renderer) {
          const msg = safe.error || 'WebGL2 context could not be initialized.';
          setWebglFallbackReason(msg);
          onStatusUpdateRef.current?.(`2D Atlas Fallback active (${msg})`);
          return;
        }

        setWebglFallbackReason(null);
        const renderer = safe.renderer;
        const isSoftwareGl = safe.isSoftware;
        isSoftwareGlRef.current = isSoftwareGl;
        rendererRef.current = renderer;

        renderer.setSize(w, h, false);
        renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.02;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x090f19);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(38, w / h, 0.03, 50);
        camera.position.set(0, DEFAULT_BODY_CENTER.y, DEFAULT_CAMERA_DIST);
        cameraRef.current = camera;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const roomEnv = new RoomEnvironment();
        const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
        scene.environment = envRT.texture;
        scene.environmentIntensity = 0.45;
        roomEnv.dispose();

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = !isSoftwareGl;
        controls.dampingFactor = 0.06;
        controls.maxDistance = 10;
        controls.minDistance = 0.22;
        controls.target.copy(DEFAULT_BODY_CENTER);
        controls.autoRotate = !isSoftwareGl && isRotatingRef.current;
        controls.autoRotateSpeed = 1.8;
        controls.update();
        controlsRef.current = controls;

        scene.add(new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 0.55));
        const keyLight = new THREE.DirectionalLight(0xfffaf2, 1.45);
        keyLight.position.set(3.2, 5.2, 4.5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xbfd9ff, 0.65);
        fillLight.position.set(-3.8, 1.4, 2.2);
        scene.add(fillLight);
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
        rimLight.position.set(0, 3.5, -4.5);
        scene.add(rimLight);

        const grid = new THREE.GridHelper(3.6, 18, 0x334155, 0x1e293b);
        grid.position.y = -0.225;
        (grid.material as THREE.Material).opacity = 0.35;
        (grid.material as THREE.Material).transparent = true;
        gridRef.current = grid;
        scene.add(grid);

        // Pre-build shared pooled X-Ray and Wireframe materials ONCE (eliminates GLSL stalls)
        const xrayMap = new Map<AnatomicalLayerKey, THREE.MeshLambertMaterial>();
        const wireMap = new Map<AnatomicalLayerKey, THREE.MeshBasicMaterial>();
        (Object.keys(XRAY_LAYER_SETTINGS) as AnatomicalLayerKey[]).forEach((layerKey) => {
          const cfg = XRAY_LAYER_SETTINGS[layerKey];
          xrayMap.set(
            layerKey,
            new THREE.MeshLambertMaterial({
              color: cfg.color,
              emissive: cfg.color,
              emissiveIntensity: 0.22,
              transparent: true,
              opacity: cfg.opacity,
              depthWrite: false,
              side: THREE.FrontSide,
            })
          );
          wireMap.set(
            layerKey,
            layerKey === 'circulatory' || layerKey === 'nervous'
              ? new THREE.MeshBasicMaterial({
                  color: WIREFRAME_LAYER_COLORS[layerKey],
                  transparent: true,
                  opacity: 0.42,
                  depthWrite: false,
                })
              : new THREE.MeshBasicMaterial({
                  color: WIREFRAME_LAYER_COLORS[layerKey],
                  wireframe: true,
                })
          );
        });
        const xraySelected = new THREE.MeshLambertMaterial({
          color: 0x38bdf8,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.65,
          transparent: false,
          opacity: 1.0,
          depthWrite: true,
          side: THREE.DoubleSide,
        });
        xrayMaterialsRef.current = xrayMap;
        xraySelectedMatRef.current = xraySelected;
        wireframeMaterialsRef.current = wireMap;
        pelvicGhostMatRef.current = new THREE.MeshLambertMaterial({
          color: 0xe2a898,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.FrontSide,
        });

        const masterGroup = new THREE.Group();
        masterGroup.name = 'zAnatomyMasterBody';
        masterGroupRef.current = masterGroup;
        scene.add(masterGroup);

        // Build Female Reproductive Pelvic Assembly immediately
        const { group: femaleGroup, meshes: femaleMeshes } = buildFemaleReproductiveAssembly();
        femaleGroup.visible = reproductiveModeRef.current === 'female';
        femaleGroupRef.current = femaleGroup;
        masterGroup.add(femaleGroup);

        for (const fm of femaleMeshes) {
          fm.userData = {
            ...fm.userData,
            layer: 'organs' as AnatomicalLayerKey,
            isSheath: false,
            isFemaleSpecific: true,
          };
          meshesRef.current.push(fm);
          meshInitialMaterialsRef.current.set(fm, fm.material);
          explodeCacheRef.current.push({
            mesh: fm,
            ox: fm.position.x,
            oy: fm.position.y,
            oz: fm.position.z,
            dx: (fm.position.x === 0 ? 0 : Math.sign(fm.position.x) * 0.45),
            dy: 0.08,
            dz: 0.9,
          });
        }

        let renderBusy = false;
        let renderDirty = false;
        let rafId = 0;
        let syncTimerId = 0;
        let renderCount = 0;

        const afterDraw = (done: () => void) => {
          const gl = renderer.getContext() as WebGL2RenderingContext | null;
          if (!gl || typeof gl.fenceSync !== 'function') {
            syncTimerId = window.setTimeout(done, 80);
            return;
          }
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          if (!sync) {
            syncTimerId = window.setTimeout(done, 80);
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
              syncTimerId = window.setTimeout(poll, 8);
            } else {
              gl.deleteSync(sync);
              syncTimerId = window.setTimeout(done, 96);
            }
          };
          syncTimerId = window.setTimeout(poll, 8);
        };

        const scheduleRender = () => {
          if (disposed) return;
          if (renderBusy) {
            renderDirty = true;
            return;
          }
          renderBusy = true;
          rafId = requestAnimationFrame(() => {
            rafId = 0;
            if (disposed) {
              renderBusy = false;
              return;
            }
            renderDirty = false;
            renderCount += 1;
            const controlsMoved = controls.update();
            if (containerRef.current) {
              containerRef.current.dataset.renders = String(renderCount);
              containerRef.current.dataset.cameraDist = camera.position
                .distanceTo(controls.target)
                .toFixed(3);
              containerRef.current.dataset.cameraTarget = `${controls.target.x.toFixed(2)},${controls.target.y.toFixed(2)},${controls.target.z.toFixed(2)}`;
              containerRef.current.dataset.cameraPos = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}`;
              containerRef.current.dataset.visCount = String(
                meshesRef.current.filter((m) => m.visible).length
              );
            }
            renderer.render(scene, camera);
            const finishFrame = () => {
              renderBusy = false;
              if (containerRef.current) {
                containerRef.current.dataset.frameDone = String(renderCount);
              }
              if (disposed) return;
              if (renderDirty || controlsMoved || (!isSoftwareGl && isRotatingRef.current)) {
                scheduleRender();
              }
            };
            if (isSoftwareGl) {
              afterDraw(finishFrame);
            } else {
              finishFrame();
            }
          });
        };

        requestRenderImplRef.current = scheduleRender;

        const onControlsChange = () => {
          scheduleRender();
        };
        const onControlsStart = () => {
          hasCustomFocusRef.current = true;
        };
        controls.addEventListener('change', onControlsChange);
        controls.addEventListener('start', onControlsStart);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const pickVisibleMeshAt = (clientX: number, clientY: number): THREE.Mesh | null => {
          const rect = container.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return null;
          mouse.set(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1
          );
          raycaster.setFromCamera(mouse, camera);

          const visibleMeshes = meshesRef.current.filter((m) => {
            if (!m.visible) return false;
            if (m.userData.isFemaleSpecific && reproductiveModeRef.current !== 'female') return false;
            if (m.userData.isMaleSpecific && reproductiveModeRef.current === 'female') return false;
            const layerId = (m.userData.layer as AnatomicalLayerKey) || 'muscles';
            if (!(activeLayersRef.current[layerId] ?? true) && isolatedMeshRef.current !== m) {
              return false;
            }
            if (m.userData.isSheath && !showFasciaRef.current) return false;
            return true;
          });

          const intersects = raycaster.intersectObjects(visibleMeshes, false);
          if (intersects.length === 0) return null;
          const primaryHit = intersects.find((i) => !(i.object as THREE.Mesh).userData.isSheath);
          return ((primaryHit || intersects[0]).object as THREE.Mesh) || null;
        };

        let startPos = { x: 0, y: 0 };
        let lastHoverAt = 0;
        const handlePointerDown = (e: PointerEvent) => {
          startPos = { x: e.clientX, y: e.clientY };
        };

        const handlePointerMove = (e: PointerEvent) => {
          if (isSoftwareGl || e.pointerType === 'touch' || e.buttons !== 0) return;
          const now = performance.now();
          if (now - lastHoverAt < 55) return;
          lastHoverAt = now;
          const hit = pickVisibleMeshAt(e.clientX, e.clientY);
          setHoveredName(hit ? cleanZAnatomyName(getMeshStructureName(hit)) : null);
        };

        const handlePointerUp = (e: PointerEvent) => {
          const dist = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);
          if (dist >= 6) return;

          const hitMesh = pickVisibleMeshAt(e.clientX, e.clientY);
          if (hitMesh) {
            const rawName = getMeshStructureName(hitMesh);
            const layerId = (hitMesh.userData.layer as AnatomicalLayerKey) || 'muscles';
            const partDef = getPartDossierInfo(rawName, layerId);
            onSelectPartRef.current(partDef);
            return;
          }
          onSelectPartRef.current(null);
        };

        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerUp);

        const onContextLost = (e: Event) => {
          e.preventDefault();
          setWebglFallbackReason('WebGL2 context lost on graphics device.');
        };
        const onContextRestored = () => {
          setWebglFallbackReason(null);
          scheduleRender();
        };
        canvas.addEventListener('webglcontextlost', onContextLost);
        canvas.addEventListener('webglcontextrestored', onContextRestored);

        const handleResize = () => {
          const nextW = Math.floor(container.clientWidth);
          const nextH = Math.floor(container.clientHeight);
          if (nextW <= 10 || nextH <= 10) return;

          const curSize = new THREE.Vector2();
          renderer.getSize(curSize);
          if (Math.abs(curSize.x - nextW) < 2 && Math.abs(curSize.y - nextH) < 2) return;

          camera.aspect = nextW / nextH;
          camera.updateProjectionMatrix();
          renderer.setSize(nextW, nextH, false);
          scheduleRender();
        };

        const ro = new ResizeObserver(handleResize);
        ro.observe(container);

        scheduleRender();

        // Load Z-Anatomy Draco GLB layers
        dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        let loadedCount = 0;
        onStatusUpdateRef.current?.('Loading Z-Anatomy 3D Blender models & Draco meshes...');

        LAYER_CONFIGS.forEach((layerConfig) => {
          gltfLoader.load(
            layerConfig.file,
            (gltf) => {
              if (disposed) return;

              const layerGroup = gltf.scene;
              layerGroup.name = `layer_${layerConfig.id}`;
              layerGroup.userData = { layerId: layerConfig.id };

              const tmpWorld = new THREE.Vector3();

              layerGroup.traverse((child) => {
                if (!(child as THREE.Mesh).isMesh) return;
                const mesh = child as THREE.Mesh;

                const parentName =
                  mesh.parent && mesh.parent.name && !mesh.parent.name.startsWith('layer_')
                    ? mesh.parent.name
                    : '';
                const zaName =
                  (mesh.userData?.za_name as string) ||
                  (mesh.parent?.userData?.za_name as string) ||
                  (/_\d+$/.test(mesh.name) && parentName ? parentName : mesh.name) ||
                  parentName;

                const firstMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                const matName = firstMat?.name || '';
                const isSheath = isTranslucentSheathMaterialOrMesh(matName, zaName || mesh.name);
                const isMaleSpecific = isMaleSpecificAnatomyMesh(zaName || mesh.name);

                const meshBox =
                  layerConfig.id === 'organs' ? new THREE.Box3().setFromObject(mesh) : null;
                const isAbdominopelvic = meshBox
                  ? meshBox.getCenter(tmpWorld).y < 1.03
                  : false;

                mesh.userData = {
                  ...mesh.userData,
                  layer: layerConfig.id,
                  zaName,
                  isSheath,
                  isMaleSpecific,
                  isAbdominopelvic,
                  matName,
                };
                if ((isSheath && !showFasciaRef.current) || (isMaleSpecific && reproductiveModeRef.current === 'female')) {
                  mesh.visible = false;
                }

                meshesRef.current.push(mesh);
                meshInitialMaterialsRef.current.set(mesh, mesh.material);

                mesh.getWorldPosition(tmpWorld);
                let rx = tmpWorld.x;
                let rz = tmpWorld.z;
                if (Math.hypot(rx, rz) < 0.05) {
                  const isLeft =
                    mesh.name.toLowerCase().includes('.l') ||
                    mesh.name.toLowerCase().includes('left');
                  rx = isLeft ? 1 : -1;
                  rz = 0.25;
                }
                const invLen = 1 / (Math.hypot(rx, rz) || 1);
                const mul = getExplodeMultiplier(layerConfig.id);
                explodeCacheRef.current.push({
                  mesh,
                  ox: mesh.position.x,
                  oy: mesh.position.y,
                  oz: mesh.position.z,
                  dx: rx * invLen * mul,
                  dy: 0,
                  dz: rz * invLen * mul,
                });

                if (isSheath) {
                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                  mats.forEach((mat) => {
                    if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                      (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                    }
                  });
                }
              });

              layerGroupsRef.current.set(layerConfig.id, layerGroup);
              masterGroup.add(layerGroup);

              if (layerConfig.id === 'skeleton' || layerConfig.id === 'muscles') {
                const box = new THREE.Box3().setFromObject(masterGroup);
                if (!box.isEmpty()) {
                  const center = box.getCenter(new THREE.Vector3());
                  const size = box.getSize(new THREE.Vector3());
                  const framedCenter = new THREE.Vector3(center.x, center.y - 0.05, center.z);
                  bodyCenterRef.current.copy(framedCenter);
                  const fovRad = THREE.MathUtils.degToRad(camera.fov);
                  const fitDist = Math.max(2.75, ((size.y / 2) / Math.tan(fovRad / 2)) * 1.28);
                  bodyDistRef.current = fitDist;
                  if (!isolatedMeshRef.current && !hasCustomFocusRef.current) {
                    controls.target.copy(framedCenter);
                    camera.position.set(framedCenter.x, framedCenter.y, framedCenter.z + fitDist);
                    camera.lookAt(framedCenter);
                    controls.update();
                  }
                  if (gridRef.current) {
                    gridRef.current.position.y = box.min.y - 0.015;
                  }
                }
              }

              loadedCount += 1;
              setLoadedLayersCount(loadedCount);
              if (pendingExplodeRef.current > 0.001) {
                applyExplodedImmediate(pendingExplodeRef.current);
              }
              requestRender();

              onStatusUpdateRef.current?.(
                loadedCount === LAYER_CONFIGS.length
                  ? `Z-Anatomy Atlas ready: ${LAYER_CONFIGS.length} systems • ${meshesRef.current.length} structures.`
                  : `Loading Z-Anatomy (${loadedCount}/${LAYER_CONFIGS.length} systems)...`
              );
            },
            undefined,
            (err) => {
              console.warn(`Z-Anatomy layer ${layerConfig.id} load warning:`, err);
            }
          );
        });

        cleanupScene = () => {
          if (rafId) cancelAnimationFrame(rafId);
          if (syncTimerId) clearTimeout(syncTimerId);
          if (explodeRafRef.current !== null) cancelAnimationFrame(explodeRafRef.current);
          requestRenderImplRef.current = () => {};
          ro.disconnect();
          controls.removeEventListener('change', onControlsChange);
          controls.removeEventListener('start', onControlsStart);
          controls.dispose();
          canvas.removeEventListener('pointerdown', handlePointerDown);
          canvas.removeEventListener('pointermove', handlePointerMove);
          canvas.removeEventListener('pointerup', handlePointerUp);
          canvas.removeEventListener('webglcontextlost', onContextLost);
          canvas.removeEventListener('webglcontextrestored', onContextRestored);

          meshesRef.current.forEach((mesh) => {
            mesh.geometry?.dispose();
            const orig = meshInitialMaterialsRef.current.get(mesh);
            if (orig) {
              const mats = Array.isArray(orig) ? orig : [orig];
              mats.forEach((m) => m?.dispose());
            }
          });
          xrayMaterialsRef.current.forEach((m) => m.dispose());
          xraySelectedMatRef.current?.dispose();
          wireframeMaterialsRef.current.forEach((m) => m.dispose());
          pelvicGhostMatRef.current?.dispose();
          pelvicGhostMatRef.current = null;
          xrayMaterialsRef.current.clear();
          wireframeMaterialsRef.current.clear();

          meshesRef.current = [];
          explodeCacheRef.current = [];
          meshInitialMaterialsRef.current.clear();
          layerGroupsRef.current.clear();

          dracoLoader?.dispose();
          envRT.dispose();
          pmremGenerator.dispose();
          renderer.dispose();
        };
      };

      const mountObserver = new ResizeObserver(bootScene);
      mountObserver.observe(container);
      bootScene();

      return () => {
        disposed = true;
        mountObserver.disconnect();
        cleanupScene?.();
      };
    }, [initAttempt, applyExplodedImmediate, getMeshStructureName, getPartDossierInfo, requestRender]);

    // Sync React prop explodedProgress if changed externally (e.g. Reset Complete Body)
    useEffect(() => {
      setExplodedLevel(explodedProgress);
    }, [explodedProgress, setExplodedLevel]);

    // Fast Layer visibility, reproductive sex toggle, isolation, selection highlight & zero-recompile render mode swap
    useEffect(() => {
      if (femaleGroupRef.current) {
        femaleGroupRef.current.visible =
          reproductiveMode === 'female' && (activeLayers.organs || Boolean(isolatedPartId));
      }

      let targetIsolatedMesh: THREE.Mesh | null = null;
      if (isolatedPartId) {
        const cleanId = cleanZAnatomyName(isolatedPartId).toLowerCase();
        targetIsolatedMesh =
          meshesRef.current.find(
            (m) => m.name === isolatedPartId || getMeshStructureName(m) === isolatedPartId
          ) ||
          meshesRef.current.find((m) => {
            const sName = getMeshStructureName(m);
            return sName && cleanZAnatomyName(sName).toLowerCase() === cleanId;
          }) ||
          meshesRef.current.find((m) => {
            const sName = getMeshStructureName(m);
            if (!sName) return false;
            const cName = cleanZAnatomyName(sName).toLowerCase();
            return cName.includes(cleanId) || cleanId.includes(cName);
          }) ||
          null;
      }
      isolatedMeshRef.current = targetIsolatedMesh;

      layerGroupsRef.current.forEach((group, layerId) => {
        if (isolatedPartId && targetIsolatedMesh) {
          group.visible = true;
        } else {
          group.visible = activeLayers[layerId] ?? true;
        }
      });

      const isXRay = renderMode === 'xray';
      const isWire = renderMode === 'wireframe';
      const revealFemalePelvis = Boolean(
        reproductiveMode === 'female' &&
          selectedPart &&
          isFemaleSpecificAnatomyName(selectedPart.id)
      );

      for (let i = 0; i < meshesRef.current.length; i += 1) {
        const mesh = meshesRef.current[i];
        const layerId = (mesh.userData.layer as AnatomicalLayerKey) || 'muscles';
        const layerActive = activeLayers[layerId] ?? true;
        const isSheath = Boolean(mesh.userData.isSheath);
        const isMaleSpecific = Boolean(mesh.userData.isMaleSpecific);
        const isFemaleSpecific = Boolean(mesh.userData.isFemaleSpecific);
        const structureName = getMeshStructureName(mesh);

        const isSelected = Boolean(
          selectedPart &&
            (structureName === selectedPart.id ||
              mesh.name === selectedPart.id ||
              cleanZAnatomyName(structureName) === selectedPart.name)
        );

        // Sex-specific filtering
        if (reproductiveMode === 'female' && isMaleSpecific && !isSelected) {
          mesh.visible = false;
        } else if (reproductiveMode === 'male' && isFemaleSpecific && !isSelected) {
          mesh.visible = false;
        } else if (isolatedPartId && targetIsolatedMesh) {
          const isoTargetName = getMeshStructureName(targetIsolatedMesh);
          mesh.visible = mesh === targetIsolatedMesh || structureName === isoTargetName;
        } else if (!layerActive) {
          mesh.visible = false;
        } else if (isSheath && (!showFascia || isXRay || isWire) && !isSelected) {
          // Hide heavy fascia membranes in X-Ray / Wireframe modes for sharp internal contrast
          mesh.visible = false;
        } else {
          mesh.visible = true;
        }

        if (!mesh.visible) continue;

        const origMat = meshInitialMaterialsRef.current.get(mesh);
        if (!origMat) continue;

        if (isXRay) {
          const pooled = isSelected
            ? xraySelectedMatRef.current
            : xrayMaterialsRef.current.get(layerId);
          if (pooled && mesh.material !== pooled) {
            mesh.material = pooled;
          }
          continue;
        }

        if (isWire) {
          const pooledWire = wireframeMaterialsRef.current.get(layerId);
          if (pooledWire && mesh.material !== pooledWire) {
            mesh.material = pooledWire;
          }
          continue;
        }

        // Translucent pelvic viscera context when inspecting Female Reproductive structures
        if (
          revealFemalePelvis &&
          layerId === 'organs' &&
          Boolean(mesh.userData.isAbdominopelvic) &&
          !isFemaleSpecific &&
          !isSelected &&
          pelvicGhostMatRef.current
        ) {
          if (mesh.material !== pelvicGhostMatRef.current) {
            mesh.material = pelvicGhostMatRef.current;
          }
          continue;
        }

        // Realistic PBR: restore original material without triggering shader recompiles
        if (mesh.material !== origMat) {
          mesh.material = origMat;
        }

        const applyHighlight = (mat: THREE.Material) => {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (!stdMat.isMeshStandardMaterial) return;
          if (isSelected) {
            stdMat.emissive.setHex(0x38bdf8);
            stdMat.emissiveIntensity = 0.85;
          } else if (stdMat.emissiveIntensity !== 0) {
            stdMat.emissive.setHex(0x000000);
            stdMat.emissiveIntensity = 0;
          }
          if (isSheath && !isSelected) {
            stdMat.transparent = true;
            stdMat.opacity = 0.22;
            stdMat.depthWrite = false;
          }
        };

        if (Array.isArray(origMat)) {
          origMat.forEach(applyHighlight);
        } else {
          applyHighlight(origMat);
        }
      }

      if (targetIsolatedMesh && targetIsolatedMesh.visible) {
        frameObject(targetIsolatedMesh, 'front', 0.4);
      }
      requestRender();
    }, [
      activeLayers,
      showFascia,
      reproductiveMode,
      selectedPart,
      isolatedPartId,
      renderMode,
      loadedLayersCount,
      frameObject,
      getMeshStructureName,
      requestRender,
    ]);

    const fallbackStructures =
      reproductiveMode === 'female'
        ? ['Uterus', 'Cervix of uterus', 'Ovary.l', 'Fallopian tube.l', 'Heart', 'Femur.l']
        : ['Prostate', 'Heart', 'Brain', 'Stomach', 'Femur.l', 'Cranium'];

    return (
      <div
        ref={containerRef}
        id="viewer"
        className="relative w-full h-[430px] sm:h-[510px] md:h-[580px] rounded-xl overflow-hidden bg-[#090f19] border border-zinc-300 shadow-md select-none touch-none"
      >
        {/* Top-Right Attribution & Layer Readiness Badge */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-2">
          {hoveredName && (
            <div className="hidden sm:block bg-[#0f172a] border border-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium text-sky-300 shadow-sm">
              {hoveredName}
            </div>
          )}
          <div className="bg-[#0f172a] border border-slate-700 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5 text-[11px] text-slate-200 font-mono">
            <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              {webglFallbackReason
                ? 'Z-Anatomy 2D Fallback'
                : loadedLayersCount < LAYER_CONFIGS.length
                  ? `Z-Anatomy ${loadedLayersCount}/${LAYER_CONFIGS.length}`
                  : `Z-Anatomy • ${reproductiveMode === 'female' ? '♀ Female' : '♂ Male'} Pelvis`}
            </span>
          </div>
        </div>

        {/* 2D Interactive Atlas Fallback when WebGL2 is blocked or unsupported */}
        {webglFallbackReason && (
          <div className="absolute inset-0 z-30 bg-[#090f19] text-slate-100 p-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/15 border border-amber-400/30">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-bold">2D Interactive Z-Anatomy Atlas Mode</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hardware WebGL2 context is unavailable on this graphics driver ({webglFallbackReason}). Search any structure or pick a key landmark below to inspect its Terminologia Anatomica dossier.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {fallbackStructures.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => focusStructure(item)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-700 border border-slate-700 text-xs font-semibold text-slate-100 transition-colors"
                >
                  {cleanZAnatomyName(item)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setWebglFallbackReason(null);
                setInitAttempt((n) => n + 1);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry 3D WebGL2</span>
            </button>
          </div>
        )}

        {/* Bottom Control Dock */}
        {!webglFallbackReason && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100%-20px)] pointer-events-auto">
            {dockCollapsed ? (
              <button
                type="button"
                onClick={() => setDockCollapsed(false)}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-slate-100 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Controls</span>
              </button>
            ) : (
              <div
                id="toolbar"
                className="flex items-center gap-1 bg-[#0f172a] border border-slate-700 px-2 py-1 rounded-lg shadow-lg whitespace-nowrap"
              >
                <button
                  id="zoomIn"
                  type="button"
                  onClick={zoomIn}
                  className="p-1.5 bg-[#1e293b] hover:bg-[#0284c7] text-white rounded text-xs font-semibold flex items-center transition-colors shrink-0"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  id="zoomOut"
                  type="button"
                  onClick={zoomOut}
                  className="p-1.5 bg-[#1e293b] hover:bg-[#0284c7] text-white rounded text-xs font-semibold flex items-center transition-colors shrink-0"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  id="rotate"
                  type="button"
                  onClick={toggleRotate}
                  className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                    isRotating
                      ? 'bg-[#0284c7] text-white ring-1 ring-sky-400'
                      : 'bg-[#1e293b] hover:bg-[#334155] text-white'
                  }`}
                  title="Orbit / Turntable"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Orbit</span>
                </button>

                <button
                  id="reset"
                  type="button"
                  onClick={resetCameraView}
                  className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                  title="Reset Full-Body Framing"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <div className="h-4 w-px bg-slate-700 mx-0.5 shrink-0" />

                <button
                  type="button"
                  onClick={() => setCameraView('front')}
                  className="px-2 py-1 bg-[#1e293b] hover:bg-[#0284c7] text-white rounded text-[11px] font-semibold transition-colors shrink-0"
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setCameraView('side')}
                  className="px-2 py-1 bg-[#1e293b] hover:bg-[#0284c7] text-white rounded text-[11px] font-semibold transition-colors shrink-0"
                >
                  Side
                </button>
                <button
                  type="button"
                  onClick={() => setCameraView('back')}
                  className="px-2 py-1 bg-[#1e293b] hover:bg-[#0284c7] text-white rounded text-[11px] font-semibold transition-colors shrink-0"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setDockCollapsed(true)}
                  className="p-1 text-slate-300 hover:text-white rounded transition-colors shrink-0"
                  title="Collapse toolbar"
                  aria-label="Collapse controls"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        <canvas
          ref={canvasRef}
          aria-label="Z-Anatomy 3D Human Anatomy Viewport"
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />
      </div>
    );
  }
);
