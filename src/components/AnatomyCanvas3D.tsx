import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { AnatomyPartDef, AnatomySystem } from '../utils/anatomyData';
import { PROCEDURAL_PARTS } from '../utils/proceduralAnatomy';
import {
  RotateCw,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Box,
  Check,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
} from 'lucide-react';

export type AnatomicalLayerKey =
  | 'muscles'
  | 'skeleton'
  | 'organs'
  | 'nervous'
  | 'circulatory'
  | 'lymphatic'
  | 'joints';

export interface AnatomyCanvas3DHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  toggleRotate: () => void;
  resetView: () => void;
  setView: (view: 'front' | 'side' | 'back') => void;
  isolateCurrentPart: () => void;
  showAllStructures: () => void;
}

export interface AnatomyCanvas3DProps {
  system?: AnatomySystem;
  onSelectPart: (part: AnatomyPartDef | null) => void;
  selectedPart: AnatomyPartDef | null;
  explodedProgress: number; // 0 to 1
  onExplodedProgressChange?: (progress: number) => void;
  activeLayers: Record<AnatomicalLayerKey, boolean>;
  renderMode: 'realistic' | 'xray' | 'wireframe';
  onStatusUpdate?: (status: string) => void;
  isolatedPartId?: string | null;
  onIsolatePart?: (partId: string | null) => void;
}

const LAYER_CONFIGS: {
  id: AnatomicalLayerKey;
  name: string;
  file: string;
  defaultColor: number;
}[] = [
  { id: 'skeleton', name: 'Skeletal System', file: '/models/skeletal.glb', defaultColor: 0xe2e8f0 },
  { id: 'organs', name: 'Internal Organs', file: '/models/visceral.glb', defaultColor: 0xef4444 },
  { id: 'muscles', name: 'Muscular System', file: '/models/muscular.glb', defaultColor: 0xc2410c },
  { id: 'nervous', name: 'Nervous System', file: '/models/nervous.glb', defaultColor: 0xeab308 },
  { id: 'circulatory', name: 'Circulatory System', file: '/models/cardiovascular.glb', defaultColor: 0xdc2626 },
  { id: 'lymphatic', name: 'Lymphatic System', file: '/models/lymphatic.glb', defaultColor: 0x10b981 },
  { id: 'joints', name: 'Joints & Ligaments', file: '/models/joints.glb', defaultColor: 0x38bdf8 },
];

// Ergonomic camera & body coordinates (Meters)
const BODY_CENTER = new THREE.Vector3(0, 0.95, 0);
const DEFAULT_CAMERA_DIST = 2.45;

export const AnatomyCanvas3D = forwardRef<AnatomyCanvas3DHandle, AnatomyCanvas3DProps>(
  (
    {
      onSelectPart,
      selectedPart,
      explodedProgress,
      onExplodedProgressChange,
      activeLayers,
      renderMode,
      onStatusUpdate,
      isolatedPartId,
      onIsolatePart,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    const masterGroupRef = useRef<THREE.Group | null>(null);
    const layerGroupsRef = useRef<Map<AnatomicalLayerKey, THREE.Group>>(new Map());
    const proceduralGroupRef = useRef<THREE.Group | null>(null);

    // Dictionaries
    const definitionsRef = useRef<Record<string, string>>({});
    const lexiconRef = useRef<Record<string, { la?: string; official?: boolean }>>({});
    const systemsMapRef = useRef<Record<string, string[]>>({});

    // Tracking meshes & original states
    const meshesRef = useRef<THREE.Mesh[]>([]);
    const meshInitialPositionsRef = useRef<Map<THREE.Mesh, THREE.Vector3>>(new Map());
    const meshWorldRadialDirRef = useRef<Map<THREE.Mesh, THREE.Vector3>>(new Map());
    const meshInitialMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
    const isolatedMeshRef = useRef<THREE.Mesh | null>(null);

    // State
    const [isRotating, setIsRotating] = useState(false);
    const isRotatingRef = useRef(false);
    const [loadedLayersCount, setLoadedLayersCount] = useState(0);
    const [isUsingProceduralFallback, setIsUsingProceduralFallback] = useState(true);

    // Dynamic ref for callbacks to avoid re-triggering Three.js mount effects
    const onSelectPartRef = useRef(onSelectPart);
    onSelectPartRef.current = onSelectPart;

    // Load medical dictionaries once on mount
    useEffect(() => {
      let isMounted = true;
      async function loadData() {
        try {
          const [defsRes, lexRes, sysRes] = await Promise.all([
            fetch('/data/definitions.json'),
            fetch('/data/lexicon.json'),
            fetch('/data/systems.json'),
          ]);
          if (defsRes.ok && lexRes.ok && sysRes.ok) {
            const defs = await defsRes.json();
            const lex = await lexRes.json();
            const sys = await sysRes.json();
            if (isMounted) {
              definitionsRef.current = defs;
              lexiconRef.current = lex;
              systemsMapRef.current = sys;
            }
          }
        } catch (err) {
          console.warn('Could not load anatomical definitions JSON:', err);
        }
      }
      loadData();
      return () => {
        isMounted = false;
      };
    }, []);

    // Clean name helper
    const cleanMeshName = useCallback((rawName: string) => {
      return rawName
        .replace(/\.l$/i, ' (Left)')
        .replace(/\.r$/i, ' (Right)')
        .replace(/^\(|\)$/g, '')
        .replace(/[_]+/g, ' ')
        .trim();
    }, []);

    // Camera view setter
    const setCameraView = useCallback((view: 'front' | 'side' | 'back') => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      let target = BODY_CENTER.clone();
      let dist = DEFAULT_CAMERA_DIST;

      if (isolatedMeshRef.current && isolatedMeshRef.current.visible) {
        const box = new THREE.Box3().setFromObject(isolatedMeshRef.current);
        if (!box.isEmpty()) {
          target = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          dist = Math.max(0.4, maxDim * 2.2);
        }
      }

      controls.target.copy(target);

      if (view === 'front') {
        camera.position.set(target.x, target.y, target.z + dist);
      } else if (view === 'side') {
        camera.position.set(target.x + dist, target.y, target.z);
      } else if (view === 'back') {
        camera.position.set(target.x, target.y, target.z - dist);
      }
      camera.lookAt(target);
      controls.update();
    }, []);

    const resetCameraView = useCallback(() => {
      isolatedMeshRef.current = null;
      setCameraView('front');
    }, [setCameraView]);

    const zoomIn = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const dir = camera.position.clone().sub(controls.target);
      if (dir.length() > 0.35) {
        dir.multiplyScalar(0.75);
        camera.position.copy(controls.target).add(dir);
        controls.update();
      }
    }, []);

    const zoomOut = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const dir = camera.position.clone().sub(controls.target);
      if (dir.length() < 9.0) {
        dir.multiplyScalar(1.3);
        camera.position.copy(controls.target).add(dir);
        controls.update();
      }
    }, []);

    const toggleRotate = useCallback(() => {
      setIsRotating((prev) => {
        const next = !prev;
        isRotatingRef.current = next;
        if (controlsRef.current) {
          controlsRef.current.autoRotate = next;
        }
        return next;
      });
    }, []);

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

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      zoomIn,
      zoomOut,
      toggleRotate,
      resetView: resetCameraView,
      setView: setCameraView,
      isolateCurrentPart,
      showAllStructures,
    }));

    // Find Latin name and clinical definition for a mesh
    const getPartDossierInfo = useCallback(
      (meshName: string, layerId: AnatomicalLayerKey): AnatomyPartDef => {
        const cleaned = cleanMeshName(meshName);
        const bareName = meshName.replace(/\.[lr]$/i, '').replace(/^\(|\)$/g, '').trim();

        // Check lexicon
        const lexEntry =
          lexiconRef.current[meshName] ||
          lexiconRef.current[bareName] ||
          lexiconRef.current[`(${bareName})`];
        const latinName = lexEntry?.la || `${cleaned} Humani`;

        // Check definitions
        let defText =
          definitionsRef.current[meshName] ||
          definitionsRef.current[bareName] ||
          definitionsRef.current[`(${bareName})`];

        if (!defText) {
          defText = `The ${cleaned} is a fundamental structural component of the ${layerId} system, providing crucial anatomical coordination, biomechanical integrity, and physiological support.`;
        } else {
          // Clean up formatting
          defText = defText.replace(/==.*?==/g, '').replace(/\s+/g, ' ').trim();
        }

        // Check systems map
        let systemName = layerId;
        for (const [sys, list] of Object.entries(systemsMapRef.current)) {
          if (list.includes(meshName) || list.includes(bareName)) {
            systemName = sys as any;
            break;
          }
        }

        const highYield = `High-yield landmark for USMLE board questions; essential for surgical margins, innervations, and regional pathologies of the ${systemName} system.`;

        return {
          id: meshName,
          name: cleaned,
          latinName,
          layer: layerId === 'muscles' ? 'muscular' : layerId === 'skeleton' ? 'skeletal' : layerId === 'organs' ? 'visceral' : 'nervous_vascular',
          geometryType: 'sphere',
          color: '#38bdf8',
          position: [0, 0, 0],
          scale: [1, 1, 1],
          explosionDir: [0, 0, 0],
          mechanicalRole: `Primary anatomical unit of the ${systemName} system.`,
          description: defText,
          highYieldFact: highYield,
        };
      },
      [cleanMeshName]
    );

    // Initialize Three.js scene ONCE on mount
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 560;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x080d16); // High-contrast clinical dark viewport
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0.95, DEFAULT_CAMERA_DIST);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxDistance = 10;
      controls.minDistance = 0.3;
      controls.target.copy(BODY_CENTER);
      controls.autoRotate = isRotatingRef.current;
      controls.autoRotateSpeed = 2.0;
      controlsRef.current = controls;

      // Realistic medical lighting
      const ambientLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.8);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
      dirLight1.position.set(4, 6, 5);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 1.2);
      dirLight2.position.set(-4, -1, -3);
      scene.add(dirLight2);

      const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
      rimLight.position.set(0, 4, -5);
      scene.add(rimLight);

      // Floor grid at base of feet (y = 0)
      const grid = new THREE.GridHelper(4, 20, 0x334155, 0x1e293b);
      grid.position.y = 0;
      (grid.material as THREE.Material).opacity = 0.35;
      (grid.material as THREE.Material).transparent = true;
      scene.add(grid);

      // Master group for all body models
      const masterGroup = new THREE.Group();
      masterGroup.name = 'masterHumanBody';
      masterGroupRef.current = masterGroup;
      scene.add(masterGroup);

      // Pointer click detection & Raycasting
      let startPos = { x: 0, y: 0 };
      const handlePointerDown = (e: MouseEvent) => {
        startPos = { x: e.clientX, y: e.clientY };
      };

      const handlePointerUp = (e: MouseEvent) => {
        const dist = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);
        if (dist >= 6) return; // Ignore drag operations

        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const visibleMeshes = meshesRef.current.filter((m) => m.visible);
        const intersects = raycaster.intersectObjects(visibleMeshes, false);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const rawName = hitMesh.name || 'Anatomical Structure';
          const layerId = (hitMesh.userData.layer as AnatomicalLayerKey) || 'skeleton';

          const partDef = getPartDossierInfo(rawName, layerId);
          onSelectPartRef.current(partDef);
          return;
        }

        onSelectPartRef.current(null);
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointerup', handlePointerUp);

      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Animation loop
      let animFrameId: number;
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        if (controlsRef.current) {
          controlsRef.current.autoRotate = isRotatingRef.current;
          controlsRef.current.update();
        }
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      return () => {
        cancelAnimationFrame(animFrameId);
        resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointerup', handlePointerUp);
        renderer.dispose();
      };
    }, [getPartDossierInfo]);

    // Build procedural fallback models (runs once on mount)
    useEffect(() => {
      const masterGroup = masterGroupRef.current;
      if (!masterGroup) return;

      const procGroup = new THREE.Group();
      procGroup.name = 'proceduralFallback';
      proceduralGroupRef.current = procGroup;

      PROCEDURAL_PARTS.forEach((part) => {
        const meshGroup = part.createMesh();
        meshGroup.name = part.id;
        meshGroup.userData = {
          layer: part.layer === 'muscular' ? 'muscles' : part.layer === 'visceral' ? 'organs' : part.layer === 'skeletal' ? 'skeleton' : 'nervous',
          isProcedural: true,
        };
        meshGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.name = part.name;
            m.userData = {
              layer: meshGroup.userData.layer,
              isProcedural: true,
              origPos: m.position.clone(),
            };
            meshesRef.current.push(m);
            meshInitialPositionsRef.current.set(m, m.position.clone());
            meshInitialMaterialsRef.current.set(m, m.material);

            // Compute horizontal radial vector away from midline
            const radDir = new THREE.Vector3(m.position.x, 0, m.position.z);
            if (radDir.length() < 0.05) radDir.set(m.position.x >= 0 ? 1 : -1, 0, 0.2);
            meshWorldRadialDirRef.current.set(m, radDir.normalize());
          }
        });
        procGroup.add(meshGroup);
      });

      // Position procedural body vertically at Y = 0 to 1.75
      const box = new THREE.Box3().setFromObject(procGroup);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetHeight = 1.75;
      const scale = targetHeight / maxDim;
      procGroup.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(procGroup);
      const scaledMin = scaledBox.min;
      procGroup.position.set(0, -scaledMin.y, 0); // Ground feet at y = 0

      masterGroup.add(procGroup);

      return () => {
        masterGroup.remove(procGroup);
      };
    }, []);

    // Load authentic GLTF models via GLTFLoader + DRACOLoader
    useEffect(() => {
      const masterGroup = masterGroupRef.current;
      if (!masterGroup) return;

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');

      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);

      let isMounted = true;
      let loadedCount = 0;

      onStatusUpdate?.('Initializing 3D anatomical engine & Draco decoders...');

      LAYER_CONFIGS.forEach((layerConfig) => {
        gltfLoader.load(
          layerConfig.file,
          (gltf) => {
            if (!isMounted) return;

            const layerGroup = gltf.scene;
            layerGroup.name = `layer_${layerConfig.id}`;
            layerGroup.userData = { layerId: layerConfig.id };

            layerGroup.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.userData = {
                  ...mesh.userData,
                  layer: layerConfig.id,
                  origPos: mesh.position.clone(),
                };
                meshesRef.current.push(mesh);
                meshInitialPositionsRef.current.set(mesh, mesh.position.clone());
                meshInitialMaterialsRef.current.set(mesh, mesh.material);

                // Compute horizontal radial vector away from spinal column
                const worldPos = new THREE.Vector3();
                mesh.getWorldPosition(worldPos);
                const radDir = new THREE.Vector3(worldPos.x, 0, worldPos.z);
                if (radDir.length() < 0.05) {
                  const isLeft = mesh.name.toLowerCase().includes('.l') || mesh.name.toLowerCase().includes('left');
                  radDir.set(isLeft ? 1 : -1, 0, 0.2);
                }
                meshWorldRadialDirRef.current.set(mesh, radDir.normalize());

                // Double sided rendering for thin membranes & organs
                if (mesh.material) {
                  const setMatProps = (mat: THREE.Material) => {
                    if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                      (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                    }
                  };
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(setMatProps);
                  } else {
                    setMatProps(mesh.material);
                  }
                }
              }
            });

            layerGroupsRef.current.set(layerConfig.id, layerGroup);
            masterGroup.add(layerGroup);

            loadedCount += 1;
            setLoadedLayersCount(loadedCount);

            // Hide procedural fallback as soon as primary systems are active
            if (loadedCount >= 2 && proceduralGroupRef.current) {
              proceduralGroupRef.current.visible = false;
              setIsUsingProceduralFallback(false);
            }

            onStatusUpdate?.(
              `${loadedCount} of ${LAYER_CONFIGS.length} anatomical systems loaded (${meshesRef.current.length} structures ready).`
            );
          },
          undefined,
          (err) => {
            console.warn(`Layer ${layerConfig.id} warning:`, err);
          }
        );
      });

      return () => {
        isMounted = false;
        dracoLoader.dispose();
      };
    }, [onStatusUpdate]);

    // Handle Exploded View separation (clean outward translation)
    useEffect(() => {
      meshesRef.current.forEach((mesh) => {
        const origPos = meshInitialPositionsRef.current.get(mesh);
        if (!origPos) return;

        if (explodedProgress <= 0.001) {
          mesh.position.copy(origPos);
        } else {
          const radDir = meshWorldRadialDirRef.current.get(mesh) || new THREE.Vector3(1, 0, 0);
          const layerId = (mesh.userData.layer as AnatomicalLayerKey) || 'skeleton';

          // Multiplier by layer depth: muscles float furthest, viscera mid, skeleton core
          const layerMul = layerId === 'muscles' ? 1.5 : layerId === 'organs' ? 1.0 : 0.55;
          const separationDist = explodedProgress * 0.42 * layerMul;

          mesh.position.copy(origPos).addScaledVector(radDir, separationDist);
        }
      });
    }, [explodedProgress]);

    // Handle Layer Visibility, Isolation Mode, and Render Modes
    useEffect(() => {
      // 1. If an isolation part is selected, determine the matching mesh
      let targetIsolatedMesh: THREE.Mesh | null = null;
      if (isolatedPartId) {
        const cleanId = cleanMeshName(isolatedPartId).toLowerCase();
        targetIsolatedMesh =
          meshesRef.current.find((m) => {
            if (!m.name) return false;
            if (m.name === isolatedPartId) return true;
            const cName = cleanMeshName(m.name).toLowerCase();
            return cName === cleanId || cName.includes(cleanId) || cleanId.includes(cName);
          }) || null;
      }
      isolatedMeshRef.current = targetIsolatedMesh;

      // 2. Set visibility on layer groups
      layerGroupsRef.current.forEach((group, layerId) => {
        if (isolatedPartId && targetIsolatedMesh) {
          // Keep all groups visible during isolation so isolated child is never hidden by parent
          group.visible = true;
        } else {
          group.visible = activeLayers[layerId] ?? true;
        }
      });

      // 3. Set visibility & materials on each individual mesh
      meshesRef.current.forEach((mesh) => {
        const layerId = mesh.userData.layer as AnatomicalLayerKey;
        const layerActive = activeLayers[layerId] ?? true;

        if (isolatedPartId && targetIsolatedMesh) {
          mesh.visible = mesh === targetIsolatedMesh;
        } else {
          mesh.visible = layerActive;
        }

        const isSelected = Boolean(
          selectedPart &&
            (mesh.name === selectedPart.id || cleanMeshName(mesh.name) === selectedPart.name)
        );

        const origMat = meshInitialMaterialsRef.current.get(mesh);
        if (!origMat) return;

        const applyStyles = (mat: THREE.Material) => {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (!stdMat.isMeshStandardMaterial) return;

          // Emissive glow for selected structure
          if (isSelected) {
            stdMat.emissive = new THREE.Color(0x38bdf8);
            stdMat.emissiveIntensity = 0.95;
          } else {
            stdMat.emissive = new THREE.Color(0x000000);
            stdMat.emissiveIntensity = 0;
          }

          // Render modes
          if (renderMode === 'xray') {
            stdMat.transparent = true;
            stdMat.opacity = isSelected ? 1.0 : 0.32;
            stdMat.depthWrite = isSelected;
            stdMat.wireframe = false;
          } else if (renderMode === 'wireframe') {
            stdMat.transparent = false;
            stdMat.opacity = 1.0;
            stdMat.wireframe = true;
          } else {
            // Realistic PBR
            stdMat.transparent = false;
            stdMat.opacity = 1.0;
            stdMat.wireframe = false;
          }
        };

        if (Array.isArray(origMat)) {
          origMat.forEach(applyStyles);
        } else {
          applyStyles(origMat);
        }
      });

      // 4. If an isolated structure is active, center and frame camera directly onto it
      if (targetIsolatedMesh && targetIsolatedMesh.visible) {
        const box = new THREE.Box3().setFromObject(targetIsolatedMesh);
        if (!box.isEmpty() && controlsRef.current && cameraRef.current) {
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const dist = Math.max(0.4, maxDim * 2.2);

          controlsRef.current.target.copy(center);
          cameraRef.current.position.set(center.x, center.y, center.z + dist);
          controlsRef.current.update();
        }
      }
    }, [activeLayers, selectedPart, isolatedPartId, renderMode, cleanMeshName]);

    return (
      <div
        ref={containerRef}
        id="viewer"
        className="relative w-full h-[520px] md:h-[650px] rounded-xl overflow-hidden bg-[#080d16] border border-zinc-300 shadow-md select-none"
      >
        {/* Floating Toolbar matching User Reference */}
        <div
          id="toolbar"
          className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-1.5 bg-[#111a28]/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#29374a] shadow-lg pointer-events-auto"
        >
          <button
            id="zoomIn"
            onClick={zoomIn}
            className="px-2.5 py-1 bg-[#1c2b40] hover:bg-[#0879bd] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>＋ Zoom</span>
          </button>

          <button
            id="zoomOut"
            onClick={zoomOut}
            className="px-2.5 py-1 bg-[#1c2b40] hover:bg-[#0879bd] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span>－ Zoom</span>
          </button>

          <button
            id="rotate"
            onClick={toggleRotate}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              isRotating ? 'bg-[#0879bd] text-white ring-1 ring-sky-400' : 'bg-[#1c2b40] hover:bg-[#285078] text-white'
            }`}
            title="Toggle 360 Turntable Orbit"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>360° Rotate</span>
          </button>

          <button
            id="reset"
            onClick={resetCameraView}
            className="px-2.5 py-1 bg-[#1c2b40] hover:bg-[#285078] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Reset Camera Center"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>

          <div className="h-4 w-px bg-[#29374a] mx-1" />

          {/* Camera View Angle Presets */}
          <button
            onClick={() => setCameraView('front')}
            className="px-2 py-1 bg-[#1c2b40] hover:bg-[#0879bd] text-white rounded text-[11px] font-semibold transition-colors"
          >
            Front
          </button>
          <button
            onClick={() => setCameraView('side')}
            className="px-2 py-1 bg-[#1c2b40] hover:bg-[#0879bd] text-white rounded text-[11px] font-semibold transition-colors"
          >
            Side
          </button>
          <button
            onClick={() => setCameraView('back')}
            className="px-2 py-1 bg-[#1c2b40] hover:bg-[#0879bd] text-white rounded text-[11px] font-semibold transition-colors"
          >
            Back
          </button>
        </div>

        {/* Top Right System Status Pill */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="bg-[#111a28]/95 backdrop-blur-md px-3 py-1 rounded-lg border border-[#29374a] shadow-sm flex items-center gap-2 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">
              {isUsingProceduralFallback
                ? 'Loading 3D Anatomy GLB...'
                : `${loadedLayersCount} of ${LAYER_CONFIGS.length} Systems Active`}
            </span>
          </div>
        </div>

        {/* Floating Instructions Overlay matching User Reference */}
        <div
          id="instructions"
          className="absolute bottom-3 left-3 z-20 text-[#b6c5d7] text-[11px] bg-[#0a111c]/85 backdrop-blur-md px-3 py-2 rounded-lg border border-[#29374a] pointer-events-none"
        >
          Drag: Rotate | Scroll: Zoom | Right drag: Pan | Click: Select anatomy
        </div>

        {/* Bottom Right Exploded View Quick Indicator */}
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
          <div className="bg-[#111a28]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#29374a] text-[11px] font-mono text-zinc-300">
            {explodedProgress > 0.05
              ? `Exploded: ${Math.round(explodedProgress * 100)}%`
              : 'Assembled Body (0%)'}
          </div>
        </div>

        {/* Three.js Canvas Element */}
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
      </div>
    );
  }
);
