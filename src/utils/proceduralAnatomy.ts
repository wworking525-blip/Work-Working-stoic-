import * as THREE from 'three';

// Procedural material and geometry helpers
const MT = (c: number | string, o = 1) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(c),
    roughness: 0.45,
    metalness: 0.08,
    transparent: o < 1,
    opacity: o,
  });

const SP = new THREE.SphereGeometry(1, 24, 18);
const CY = new THREE.CylinderGeometry(1, 1, 1, 20);
const BX = new THREE.BoxGeometry(1, 1, 1);

const M = (
  g: THREE.BufferGeometry,
  c: number | string,
  sc: [number, number, number] = [1, 1, 1],
  o = 1
): THREE.Mesh => {
  const m = new THREE.Mesh(g, MT(c, o));
  m.scale.set(...sc);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

const at = <T extends THREE.Object3D>(
  m: T,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0
): T => {
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
};

const G = (...children: (THREE.Object3D | null | undefined)[]): THREE.Group => {
  const g = new THREE.Group();
  children.forEach((c) => {
    if (c) g.add(c);
  });
  return g;
};

const TB = (
  p: [number, number, number][],
  r: number,
  c: number | string,
  n = 50
): THREE.Mesh => {
  const curve = new THREE.CatmullRomCurve3(
    p.map((pt) => new THREE.Vector3(...pt))
  );
  return M(new THREE.TubeGeometry(curve, n, r, 8, false), c);
};

const CAP = (r: number, l: number): THREE.CapsuleGeometry =>
  new THREE.CapsuleGeometry(r, l, 6, 14);

const BONE = 0xf2ebdc; // Anatomical bone ivory
const MUS = 0xcc4949;  // Striated skeletal muscle
const ORG = 0xe59a9a;  // Soft visceral tissue
const S2 = [-1, 1] as const;
const Z = Math.PI / 2;

// Folded gyri geometry for cerebral cortex
const createBrainGyri = (): THREE.IcosahedronGeometry => {
  const g = new THREE.IcosahedronGeometry(0.5, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 1 + 0.07 * Math.sin(x * 20) * Math.sin(y * 18 + z * 10);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
};

// Anatomical mesh builders
export const AnatomicalGeometries = {
  // 1. Skull & Craniofacial Skeleton
  skull: (): THREE.Group =>
    G(
      // Cranial Vault (Neurocranium)
      M(SP, BONE, [0.42, 0.48, 0.46], 0.95),
      // Facial Skeleton & Maxilla
      at(M(BX, BONE, [0.34, 0.22, 0.3]), 0, -0.42, 0.12),
      // Left and Right Eye Orbits (dark indentations)
      ...S2.map((s) =>
        at(M(SP, 0x1e293b, [0.09, 0.09, 0.05]), s * 0.14, -0.02, 0.4)
      ),
      // Mandible (Lower Jaw)
      at(M(BX, BONE, [0.3, 0.1, 0.24]), 0, -0.55, 0.1)
    ),

  // 2. Cerebrum, Cerebellum & Brainstem
  brain: (): THREE.Group =>
    G(
      // Left & Right Cerebral Hemispheres with Gyri
      M(createBrainGyri(), 0xe3a3ae, [0.72, 0.62, 0.82]),
      // Cerebellum (Posterior and Inferior)
      at(M(SP, 0xd08b97, [0.18, 0.12, 0.16]), 0, -0.22, -0.28),
      // Brainstem (Pons & Medulla oblongata)
      at(M(CY, 0xe8c4ca, [0.06, 0.28, 0.06]), 0, -0.4, -0.08)
    ),

  // 3. Vertebral Column (Spine & Spinal Cord)
  spine: (): THREE.Group => {
    const g = G();
    // 24 Segmented Vertebrae with Natural Cervical Lordosis & Thoracic Kyphosis
    for (let i = 0; i < 24; i++) {
      const k = 0.6 + i / 55;
      const z = -Math.sin((i / 23) * Math.PI * 1.5) * 0.12;
      // Vertebral Body
      g.add(at(M(CY, BONE, [0.1 * k, 0.07, 0.1 * k]), 0, -i * 0.1, z));
      // Spinous Process
      g.add(
        at(M(BX, BONE, [0.03, 0.07, 0.12 * k]), 0, -i * 0.1 - 0.02, z - 0.1 * k)
      );
    }
    // Spinal Cord (passing inside)
    g.add(at(M(CY, 0xfde047, [0.022, 2.4, 0.022], 0.9), 0, -1.15, -0.05));
    // Sacrum & Coccyx
    g.add(
      at(
        M(new THREE.ConeGeometry(0.14, 0.28, 8), BONE),
        0,
        -2.48,
        -0.05,
        Math.PI,
        0,
        0
      )
    );
    return g;
  },

  // 4. Rib Cage & Sternum
  ribs: (): THREE.Group => {
    const g = G();
    // 12 Pairs of curved thoracic ribs
    for (let i = 0; i < 12; i++) {
      for (const s of S2) {
        const w = 0.28 + Math.sin(((i + 1.5) / 13) * Math.PI) * 0.22;
        const y = -i * 0.12;
        g.add(
          TB(
            [
              [0, y, -0.25],
              [s * w * 0.8, y - 0.02, -0.15],
              [s * w, y - 0.07, 0.1],
              [s * w * 0.6, y - 0.14, 0.3],
              [s * 0.05, y - 0.2, 0.36],
            ],
            0.014,
            BONE,
            24
          )
        );
      }
    }
    // Sternum (Manubrium, Body, Xiphoid Process)
    g.add(at(M(BX, BONE, [0.1, 1.15, 0.04]), 0, -0.6, 0.38));
    return g;
  },

  // 5. Clavicles & Scapulae (Shoulder Girdle)
  girdle: (): THREE.Group =>
    G(
      ...S2.map((s) =>
        G(
          // Curved Clavicle (Collar bone)
          TB(
            [
              [s * 0.1, 0, 0.1],
              [s * 0.35, 0.04, 0.05],
              [s * 0.72, 0, -0.02],
            ],
            0.026,
            BONE,
            20
          ),
          // Scapula (Shoulder blade)
          at(
            M(new THREE.ConeGeometry(0.3, 0.52, 3), BONE, [1, 1, 0.1]),
            s * 0.52,
            -0.35,
            -0.25,
            Math.PI,
            0,
            0
          )
        )
      )
    ),

  // 6. Pelvis (Ilium, Ischium, Pubis)
  pelvis: (): THREE.Group =>
    G(
      ...S2.map((s) =>
        at(
          M(
            new THREE.TorusGeometry(0.34, 0.08, 8, 20, Math.PI * 1.25),
            BONE,
            [1, 1, 0.5]
          ),
          s * 0.26,
          0.05,
          0,
          0,
          0,
          s > 0 ? 0.3 : -Math.PI * 0.25 - 0.3
        )
      ),
      at(M(new THREE.ConeGeometry(0.18, 0.42, 8), BONE), 0, -0.1, -0.2, Math.PI, 0, 0)
    ),

  // 7. Femur (Thigh bone)
  femur: (s: number): THREE.Group =>
    G(
      // Shaft (Diaphysis)
      M(CY, BONE, [0.052, 1.58, 0.052]),
      // Femoral Head
      at(M(SP, BONE, [0.095, 0.095, 0.095]), -s * 0.2, 0.82, 0),
      // Femoral Neck
      at(M(CY, BONE, [0.034, 0.2, 0.034]), -s * 0.1, 0.76, 0, 0, 0, s * 0.9),
      // Condyles at knee joint
      at(M(SP, BONE, [0.11, 0.08, 0.1]), 0, -0.82, 0)
    ),

  // 8. Tibia & Fibula (Shin bones)
  tibia: (s: number): THREE.Group =>
    G(
      // Tibia (Weight-bearing shin)
      M(CY, BONE, [0.054, 1.42, 0.054]),
      // Lateral Fibula
      at(M(CY, BONE, [0.026, 1.32, 0.026]), s * 0.11, 0, -0.03),
      // Tibial Plateau
      at(M(CY, BONE, [0.12, 0.04, 0.1]), 0, 0.7, 0)
    ),

  // 9. Humerus (Upper arm bone)
  humerus: (s: number): THREE.Group =>
    G(
      at(M(CY, BONE, [0.046, 1.08, 0.046]), 0, 0, 0, 0, 0, Z),
      at(M(SP, BONE, [0.092, 0.092, 0.092]), -s * 0.55, 0, 0)
    ),

  // 10. Radius & Ulna (Forearm bones)
  forearm: (): THREE.Group =>
    G(
      at(M(CY, BONE, [0.036, 0.92, 0.036]), 0, 0, 0.03, 0, 0, Z),
      at(M(CY, BONE, [0.028, 0.9, 0.028]), 0, 0, -0.03, 0, 0, Z)
    ),

  // 11. Heart (Myocardium, Aortic Arch & Vena Cava)
  heart: (): THREE.Group =>
    G(
      // Myocardial Chambers (Left & Right Ventricles and Atria)
      at(M(SP, 0xb83a3a, [0.22, 0.28, 0.21]), 0, 0, 0, 0, 0, 0.35),
      // Ascending Aorta and Aortic Arch (Systemic High-Pressure Arterial Tube)
      TB(
        [
          [0, 0.2, 0],
          [0, 0.44, 0],
          [-0.15, 0.48, 0.05],
          [-0.22, 0.2, -0.05],
        ],
        0.05,
        0xd04a4a,
        20
      ),
      // Superior Vena Cava (Deoxygenated Venous Return)
      TB(
        [
          [0.12, 0.2, 0],
          [0.12, 0.56, 0],
        ],
        0.045,
        0x3b6fb6,
        10
      )
    ),

  // 12. Lungs & Tracheobronchial Tree
  lungs: (): THREE.Group =>
    G(
      // Left and Right Lungs
      ...S2.map((s) => at(M(SP, ORG, [0.28, 0.52, 0.21]), s * 0.32, -0.05, 0)),
      // Trachea (Cartilaginous windpipe)
      M(CY, 0xdde3e8, [0.04, 0.52, 0.04]),
      // Primary Bronchi
      ...S2.map((s) =>
        TB(
          [
            [0, 0.15, 0],
            [s * 0.1, 0, 0],
            [s * 0.24, -0.2, 0],
          ],
          0.025,
          0xdde3e8,
          12
        )
      )
    ),

  // 13. Liver & Gallbladder
  liver: (): THREE.Group =>
    G(
      // Hepatic Lobes
      M(SP, 0x8a4b2d, [0.44, 0.21, 0.29]),
      // Gallbladder (Green storage sac for bile)
      at(M(SP, 0x4f8a3a, [0.065, 0.11, 0.055]), 0.13, -0.19, 0.1)
    ),

  // 14. Stomach & Esophagus
  stomach: (): THREE.Group =>
    G(
      // J-shaped Gastric Reservoir
      at(M(SP, 0xd9777a, [0.21, 0.32, 0.16]), 0, 0, 0, 0, 0, 0.6),
      // Distal Esophagus
      TB(
        [
          [-0.1, 0.5, 0],
          [-0.08, 0.3, 0],
          [-0.05, 0.15, 0],
        ],
        0.03,
        0xd9a0a0,
        12
      )
    ),

  // 15. Kidneys & Ureters
  kidneys: (): THREE.Group =>
    G(
      ...S2.map((s) =>
        G(
          // Reniform Kidney Body
          at(M(SP, 0x9b3d3d, [0.11, 0.18, 0.085]), s * 0.26, 0, 0),
          // Descending Ureter Tube
          TB(
            [
              [s * 0.2, -0.1, 0],
              [s * 0.1, -0.42, 0],
            ],
            0.013,
            0xe8d070,
            10
          )
        )
      )
    ),

  // 16. Small Intestine (Jejunum & Ileum)
  small: (): THREE.Mesh =>
    TB(
      Array.from({ length: 60 }, (_, i) => [
        Math.sin(i * 0.9) * 0.3 + Math.sin(i * 0.3) * 0.1,
        (i / 59 - 0.5) * 0.6 + Math.cos(i * 1.7) * 0.05,
        Math.cos(i * 0.9) * 0.1,
      ]),
      0.036,
      0xe6a0a0,
      240
    ),

  // 17. Large Intestine (Colon & Rectum)
  large: (): THREE.Mesh =>
    TB(
      [
        [-0.32, -0.32, 0],
        [-0.32, 0.26, 0],
        [0.32, 0.26, 0],
        [0.32, -0.32, 0],
        [0.15, -0.42, 0],
      ],
      0.062,
      0xcf8f6d,
      60
    ),

  // 18. Pectoralis Major (Chest muscles)
  pecs: (): THREE.Group =>
    G(
      ...S2.map((s) =>
        at(M(SP, MUS, [0.3, 0.22, 0.1], 0.8), s * 0.3, 1.45, 0.22, 0, 0, s * 0.2)
      )
    ),

  // 19. Rectus Abdominis (6-Pack Core Muscles)
  abs: (): THREE.Group =>
    G(
      ...S2.flatMap((s) =>
        [0, 1, 2, 3].map((j) =>
          at(M(BX, MUS, [0.17, 0.2, 0.07], 0.8), s * 0.1, 0.75 - j * 0.24, 0.24)
        )
      )
    ),

  // 20. Deltoids (Shoulder Muscles)
  delts: (): THREE.Group =>
    G(
      ...S2.map((s) =>
        at(M(SP, MUS, [0.21, 0.23, 0.21], 0.8), s * 0.64, 1.85, 0)
      )
    ),

  // 21. Biceps & Triceps (Arm Muscles)
  armM: (): THREE.Group =>
    G(
      ...S2.flatMap((s) =>
        [
          [1.35, 0.75],
          [2.3, 0.65],
        ].map(([x, l]) =>
          at(M(CAP(0.1, l), MUS, [1, 1, 1], 0.8), s * x, 1.85, 0, 0, 0, Z)
        )
      )
    ),

  // 22. Quadriceps Femoris (Thigh Muscles)
  quads: (): THREE.Group =>
    G(
      ...S2.map((s) =>
        at(M(CAP(0.17, 0.95), MUS, [1, 1, 1], 0.8), s * 0.3, -1.15, 0.04)
      )
    ),

  // 23. Gastrocnemius (Calf Muscles)
  calves: (): THREE.Group =>
    G(
      ...S2.map((s) =>
        at(M(CAP(0.11, 0.8), MUS, [1, 1, 1], 0.8), s * 0.3, -2.55, -0.03)
      )
    ),
};

export interface ProceduralPartInfo {
  id: string;
  name: string;
  latinName: string;
  systemId: string;
  layer: 'skeletal' | 'muscular' | 'visceral' | 'nervous_vascular';
  fn: string;
  highYieldFact: string;
  home: [number, number, number];
  far: [number, number, number];
  createMesh: () => THREE.Object3D;
}

export const PROCEDURAL_PARTS: ProceduralPartInfo[] = [
  {
    id: 'skull',
    name: 'Skull & Craniofacial Skeleton',
    latinName: 'Cranium & ossa faciei',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Protects the brain and shapes the face; holds the eyes, ears, nose and jaw.',
    highYieldFact: 'Fracture at the pterion ruptures the anterior middle meningeal artery, causing an epidural hematoma with a lucid interval.',
    home: [0, 2.6, 0],
    far: [1.8, 2.9, 0],
    createMesh: AnatomicalGeometries.skull,
  },
  {
    id: 'brain',
    name: 'Brain & Brainstem',
    latinName: 'Encephalon',
    systemId: 'nervous',
    layer: 'nervous_vascular',
    fn: 'Control centre: thought, memory, movement, senses and autonomic body regulation.',
    highYieldFact: 'The blood-brain barrier is formed by capillary endothelial tight junctions, astrocytic foot processes, and basement membranes.',
    home: [0, 2.65, 0],
    far: [-1.8, 2.9, 0],
    createMesh: AnatomicalGeometries.brain,
  },
  {
    id: 'spine',
    name: 'Vertebral Column & Spinal Cord',
    latinName: 'Columna vertebralis & medulla spinalis',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: '24 stacked vertebrae protect the spinal cord, support the trunk and allow multi-axis bending.',
    highYieldFact: 'In adults, the spinal cord terminates at the L1-L2 conus medullaris; lumbar puncture is safely performed at L3-L4 or L4-L5.',
    home: [0, 2.15, -0.2],
    far: [-2.7, 2.6, 0],
    createMesh: AnatomicalGeometries.spine,
  },
  {
    id: 'ribs',
    name: 'Rib Cage & Sternum',
    latinName: 'Cavea thoracis & sternum',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Shields the heart and lungs and drives pulmonary ventilation by bucket-handle and pump-handle movements.',
    highYieldFact: 'Intercostal neurovascular bundles run in the costal groove along the INFERIOR border of each rib (Order: Vein, Artery, Nerve).',
    home: [0, 1.75, 0],
    far: [-1.5, 2.3, 0],
    createMesh: AnatomicalGeometries.ribs,
  },
  {
    id: 'girdle',
    name: 'Clavicles & Scapulae (Shoulder Girdle)',
    latinName: 'Cingulum pectorale',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Connects the upper limbs to the axial trunk and allows wide multi-planar arm movement.',
    highYieldFact: 'The clavicle is the most commonly fractured bone in childhood, typically at the junction of the middle and lateral thirds.',
    home: [0, 1.95, 0],
    far: [1.5, 2.35, 0],
    createMesh: AnatomicalGeometries.girdle,
  },
  {
    id: 'pelvis',
    name: 'Pelvis & Sacral Ring',
    latinName: 'Pelvis',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Transfers body weight from the spine to the legs and protects the bladder, reproductive organs, and rectum.',
    highYieldFact: 'Pelvic ring fractures carry high risk of severe retroperitoneal venous plexus hemorrhage and sciatic nerve injury.',
    home: [0, -0.35, 0],
    far: [1.2, 0.1, 0],
    createMesh: AnatomicalGeometries.pelvis,
  },
  {
    id: 'femur_right',
    name: 'Right Femur',
    latinName: 'Femur dextrum',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Thigh bone, the longest and strongest bone in the body; bears weight and drives bipedal walking.',
    highYieldFact: 'Femoral neck intracapsular fractures rupture medial circumflex femoral arteries, precipitating avascular necrosis of the femoral head.',
    home: [-0.3, -1.15, 0],
    far: [-2.7, -1.5, 0],
    createMesh: () => AnatomicalGeometries.femur(-1),
  },
  {
    id: 'femur_left',
    name: 'Left Femur',
    latinName: 'Femur sinistrum',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Thigh bone, bearing load and providing mechanical lever arm for quadriceps and hamstrings.',
    highYieldFact: 'The angle of inclination between femoral neck and shaft averages 125 degrees; alterations cause coxa vara or coxa valga.',
    home: [0.3, -1.15, 0],
    far: [2.7, -1.5, 0],
    createMesh: () => AnatomicalGeometries.femur(1),
  },
  {
    id: 'tibia_right',
    name: 'Right Tibia & Fibula',
    latinName: 'Tibia et fibula dextra',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Shin bones: the medial tibia bears axial body weight, while the lateral fibula stabilizes the ankle joint.',
    highYieldFact: 'Common fibular (peroneal) nerve winds around the fibular neck; fracture here causes foot drop and loss of dorsiflexion.',
    home: [-0.3, -2.6, 0],
    far: [-2.0, -2.4, 0],
    createMesh: () => AnatomicalGeometries.tibia(-1),
  },
  {
    id: 'tibia_left',
    name: 'Left Tibia & Fibula',
    latinName: 'Tibia et fibula sinistra',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Weight-bearing column and lateral strut stabilizing the talocrural ankle mortise.',
    highYieldFact: 'The anterior compartment of the leg is most vulnerable to compartment syndrome following tibial shaft fractures.',
    home: [0.3, -2.6, 0],
    far: [2.0, -2.4, 0],
    createMesh: () => AnatomicalGeometries.tibia(1),
  },
  {
    id: 'humerus_right',
    name: 'Right Humerus',
    latinName: 'Humerus dexter',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Upper arm bone; articulates with the glenoid cavity at the shoulder and the radius/ulna at the elbow.',
    highYieldFact: 'Midshaft humeral fracture injures the radial nerve in the radial groove, leading to wrist drop.',
    home: [-1.2, 1.85, 0],
    far: [-1.0, 3.4, 0],
    createMesh: () => AnatomicalGeometries.humerus(-1),
  },
  {
    id: 'humerus_left',
    name: 'Left Humerus',
    latinName: 'Humerus sinister',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Upper arm bone forming the gleno-humeral joint and trochlea/capitulum at the elbow.',
    highYieldFact: 'Supracondylar fractures of the humerus in children threaten the brachial artery and anterior interosseous nerve.',
    home: [1.2, 1.85, 0],
    far: [1.0, 3.4, 0],
    createMesh: () => AnatomicalGeometries.humerus(1),
  },
  {
    id: 'forearm_right',
    name: 'Right Radius & Ulna',
    latinName: 'Radius et ulna dextra',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Forearm bones; allow elbow flexion/extension and radioulnar pronation/supination.',
    highYieldFact: 'Colles fracture is a distal radius fracture with dorsal displacement resulting from a fall onto an outstretched hand (FOOSH).',
    home: [-2.2, 1.85, 0],
    far: [-2.4, 3.4, 0],
    createMesh: AnatomicalGeometries.forearm,
  },
  {
    id: 'forearm_left',
    name: 'Left Radius & Ulna',
    latinName: 'Radius et ulna sinistra',
    systemId: 'skeletal',
    layer: 'skeletal',
    fn: 'Forearm bones providing leverage for hand movement and wrist stabilization.',
    highYieldFact: 'The scaphoid bone articulates with the distal radius; fracture risks avascular necrosis due to retrograde blood supply.',
    home: [2.2, 1.85, 0],
    far: [2.4, 3.4, 0],
    createMesh: AnatomicalGeometries.forearm,
  },
  {
    id: 'heart',
    name: 'Heart & Great Vessels',
    latinName: 'Cor & vasa magna',
    systemId: 'cardiovascular',
    layer: 'visceral',
    fn: 'Muscular hydraulic pump: sends deoxygenated blood to lungs and oxygen-rich blood to the entire body via the aorta.',
    highYieldFact: 'Left coronary artery blood flow occurs primarily during ventricular DIASTOLE because systolic myocardial compression collapses intramural vessels.',
    home: [0.1, 1.2, 0.08],
    far: [1.5, 1.5, 0],
    createMesh: AnatomicalGeometries.heart,
  },
  {
    id: 'lungs',
    name: 'Lungs & Bronchial Tree',
    latinName: 'Pulmones & arbor bronchialis',
    systemId: 'respiratory',
    layer: 'visceral',
    fn: 'Gas exchange apparatus: oxygenates blood across the alveolocapillary membrane and expels carbon dioxide.',
    highYieldFact: 'Type II pneumocytes secrete dipalmitoylphosphatidylcholine (surfactant) to reduce alveolar surface tension and prevent atelectasis.',
    home: [0, 1.2, 0],
    far: [2.3, 0.4, 0],
    createMesh: AnatomicalGeometries.lungs,
  },
  {
    id: 'liver',
    name: 'Liver & Gallbladder',
    latinName: 'Hepar & vesica biliaris',
    systemId: 'digestive',
    layer: 'visceral',
    fn: 'Metabolic hub: detoxifies blood, synthesizes albumin and clotting factors, stores glycogen, and produces bile.',
    highYieldFact: 'The liver receives a dual blood supply: 75% deoxygenated nutrient-rich portal vein, 25% oxygenated hepatic artery.',
    home: [-0.2, 0.55, 0.05],
    far: [-1.5, -0.1, 0],
    createMesh: AnatomicalGeometries.liver,
  },
  {
    id: 'stomach',
    name: 'Stomach & Esophagus',
    latinName: 'Gaster & oesophagus',
    systemId: 'digestive',
    layer: 'visceral',
    fn: 'Gastric reservoir: secretes hydrochloric acid and pepsinogen to initiate chemical protein digestion.',
    highYieldFact: 'Gastric parietal cells secrete both intrinsic factor (essential for terminal ileum Vitamin B12 absorption) and hydrochloric acid.',
    home: [0.2, 0.6, 0],
    far: [-1.4, -0.9, 0],
    createMesh: AnatomicalGeometries.stomach,
  },
  {
    id: 'kidneys',
    name: 'Kidneys & Ureters',
    latinName: 'Renes & ureteres',
    systemId: 'urinary',
    layer: 'visceral',
    fn: 'Bilateral filtration units: filter plasma, excrete nitrogenous wastes, regulate fluid balance, electrolytes, and blood pressure.',
    highYieldFact: 'Juxtaglomerular apparatus cells secrete renin in response to decreased renal perfusion pressure, stimulating the renin-angiotensin-aldosterone axis.',
    home: [0, 0.3, -0.2],
    far: [2.1, -0.7, 0],
    createMesh: AnatomicalGeometries.kidneys,
  },
  {
    id: 'small_intestine',
    name: 'Small Intestine (Jejunum & Ileum)',
    latinName: 'Intestinum tenue',
    systemId: 'digestive',
    layer: 'visceral',
    fn: 'Primary nutrient absorption surface: digests carbohydrates, proteins, and lipids across brush-border enterocytes.',
    highYieldFact: 'Peyer patches in the ileum contain specialized M cells that sample luminal antigens and present them to immune dendritic cells.',
    home: [0, -0.05, 0.1],
    far: [-1.2, -1.8, 0],
    createMesh: AnatomicalGeometries.small,
  },
  {
    id: 'large_intestine',
    name: 'Large Intestine (Colon & Rectum)',
    latinName: 'Intestinum crassum',
    systemId: 'digestive',
    layer: 'visceral',
    fn: 'Reabsorbs water, electrolytes, and short-chain fatty acids while forming solid fecal matter.',
    highYieldFact: 'Teniae coli are three longitudinal smooth muscle bands that converge at the base of the appendix, serving as an anatomical locator.',
    home: [0, -0.05, 0.05],
    far: [1.2, -1.8, 0],
    createMesh: AnatomicalGeometries.large,
  },
  {
    id: 'pecs',
    name: 'Pectoralis Major',
    latinName: 'Musculus pectoralis major',
    systemId: 'muscular',
    layer: 'muscular',
    fn: 'Pulls the arm forward and across the chest (adduction and internal rotation of the humerus).',
    highYieldFact: 'Innervated by both lateral and medial pectoral nerves (roots C5-T1).',
    home: [0, 0, 0],
    far: [0, 0.2, 0.8],
    createMesh: AnatomicalGeometries.pecs,
  },
  {
    id: 'abs',
    name: 'Rectus Abdominis (Core Muscles)',
    latinName: 'Musculus rectus abdominis',
    systemId: 'muscular',
    layer: 'muscular',
    fn: 'Flexes the lumbar spine, stabilizes the pelvis, and increases intra-abdominal pressure.',
    highYieldFact: 'Enclosed within the rectus sheath formed by the aponeuroses of the external oblique, internal oblique, and transversus abdominis.',
    home: [0, 0, 0],
    far: [0, -0.2, 0.8],
    createMesh: AnatomicalGeometries.abs,
  },
  {
    id: 'delts',
    name: 'Deltoid Muscles',
    latinName: 'Musculus deltoideus',
    systemId: 'muscular',
    layer: 'muscular',
    fn: 'Abducts the arm beyond 15 degrees (supraspinatus initiates the first 15 degrees).',
    highYieldFact: 'Innervated by the axillary nerve (C5-C6), which circles the surgical neck of the humerus.',
    home: [0, 0, 0],
    far: [0, 0.5, 0.5],
    createMesh: AnatomicalGeometries.delts,
  },
  {
    id: 'arm_muscles',
    name: 'Biceps & Triceps Brachii',
    latinName: 'Musculi brachii',
    systemId: 'muscular',
    layer: 'muscular',
    fn: 'Biceps flexes and supinates the forearm; triceps extends the elbow joint.',
    highYieldFact: 'Biceps is innervated by the musculocutaneous nerve; triceps by the radial nerve.',
    home: [0, 0, 0],
    far: [0, 0.4, 0.4],
    createMesh: AnatomicalGeometries.armM,
  },
  {
    id: 'quads',
    name: 'Quadriceps Femoris',
    latinName: 'Musculus quadriceps femoris',
    systemId: 'muscular',
    layer: 'muscular',
    fn: 'Powerful primary extensor of the knee joint; essential for walking, running, and jumping.',
    highYieldFact: 'Rectus femoris also flexes the hip; innervated by the femoral nerve (L2-L4).',
    home: [0, 0, 0],
    far: [0, -0.4, 0.5],
    createMesh: AnatomicalGeometries.quads,
  },
  {
    id: 'calves',
    name: 'Gastrocnemius & Soleus',
    latinName: 'Musculus triceps surae',
    systemId: 'muscular',
    layer: 'muscular',
    fn: 'Plantarflexes the foot at the talocrural ankle joint and acts as a peripheral muscle venous pump.',
    highYieldFact: 'Inserts via the calcaneal (Achilles) tendon; innervated by the tibial nerve (S1-S2).',
    home: [0, 0, 0],
    far: [0, -0.5, 0.4],
    createMesh: AnatomicalGeometries.calves,
  },
];
