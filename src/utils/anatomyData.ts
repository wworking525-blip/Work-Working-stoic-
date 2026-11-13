export type AnatomicalLayer = 'integumentary' | 'muscular' | 'skeletal' | 'visceral' | 'nervous_vascular';

export interface AnatomyPartDef {
  id: string;
  name: string;
  latinName: string;
  layer: AnatomicalLayer;
  geometryType: 'sphere' | 'cylinder' | 'box' | 'torus' | 'capsule' | 'cone';
  color: string;
  opacity?: number;
  wireframe?: boolean;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  explosionDir: [number, number, number]; // Vector along which part explodes in mechanical assembly view
  knollingPosition?: [number, number, number]; // Exact coordinates in the master deconstructed layout
  customShape?: string;
  mechanicalRole: string; // Engineering / functional analog
  description: string;
  innervation?: string;
  bloodSupply?: string;
  commonPathology?: string;
  highYieldFact: string;
  wikipediaUrl?: string;
  isOfficialTA?: boolean;
}

export interface AnatomySystem {
  id: string;
  name: string;
  icon: string;
  color: string;
  accent: string;
  shortSummary: string;
  fullOverview: string;
  primaryFunctions: string[];
  clinicalPearls: string[];
  highYieldUSMLE: string;
  sampleStudyNote: string;
  parts: AnatomyPartDef[];
}

export const ANATOMICAL_SYSTEMS: AnatomySystem[] = [
  {
    id: 'master_knolling',
    name: 'Master Deconstructed Assembly (Knolling Kit)',
    icon: '🧩',
    color: '#f43f5e',
    accent: '#be123c',
    shortSummary: 'Complete deconstructed human anatomical knolling kit. Smoothly assemble or deconstruct all body systems into an organized mechanical parts matrix.',
    fullOverview: 'Anatomical knolling is the process of arranging all constituent components of the human body in parallel, 90-degree organized arrays. This complete deconstruction reveals the exact mechanical relationships between the axial skeleton, muscular actuators, visceral pumps and filtration organs, electro-chemical conduits, and systemic vascular trees.',
    primaryFunctions: [
      'Systematic mechanical deconstruction and knolling analysis',
      'Simultaneous spatial cross-correlation across all 5 anatomical layers',
      'Real-time physiological animation (cardiac systole, thoracic breathing, neural action potential pulses)',
      'Dynamic assembly and disassembly transition via the exploded slider',
    ],
    clinicalPearls: [
      'Knolling visualization reveals anatomical choke points where multiple systems converge (such as the thoracic inlet, femoral triangle, and hepatoduodenal ligament).',
      'Mechanical compliance in one system directly compensates for failure in another (e.g. respiratory compensation for metabolic acidosis).',
      'True biological systems function as interconnected kinematic linkages rather than isolated compartments.',
    ],
    highYieldUSMLE: 'High-yield board exams frequently test multi-system failure modes: e.g. how aortic valvular stenosis leads to left ventricular hypertrophy, pulmonary congestion, secondary pulmonary hypertension, and right ventricular failure with peripheral edema.',
    sampleStudyNote: `MASTER DECONSTRUCTED ANATOMY (KNOLLING KIT) OVERVIEW
This comprehensive 3D kit deconstructs the complete human body into an organized rectangular mechanical layout matching standard medical anatomical knolling:
1. Central Core: Striated muscular body in anatomical T-pose with superficial and deep myological fascial layers.
2. Cranial Assembly: Superior neurocranium with eye sockets, maxilla, and dentition, paired with cerebral hemispheres and cerebellum.
3. Axial & Appendicular Skeleton: Full segmented vertebral column with sacrum, paired left/right ribcage arches, pelvic girdle, femurs, and long limb levers.
4. Hemodynamic Circulation: Pulsating 4-chamber myogenic heart, systemic arterial tree (red aorta), and deep venous drainage (blue IVC).
5. Visceral Metabolism: Dual-lobed liver with biliary gallbladder, J-shaped stomach, framed colon, and coiled small intestines.
6. Pulmonary Ventilation: Cartilaginous trachea with bronchial arborization and dual breathing lungs.
7. Data Upskilling Loop: Algorithmic cognitive feedback engine mapping high-yield diagnostic precision.`,
    parts: [
      {
        id: 'knolling_muscular_body',
        name: 'Muscular Anatomy Chassis (T-Pose)',
        latinName: 'Systema musculare centrale',
        layer: 'muscular',
        geometryType: 'capsule',
        color: '#be123c',
        position: [0, 0.45, 0],
        knollingPosition: [0, 0.45, 0],
        scale: [0.65, 1.25, 0.38],
        explosionDir: [0, 0, 0],
        mechanicalRole: 'Central multi-axis muscular motor and contractile kinetic chassis',
        description: 'Superficial and deep skeletal muscle layers in anatomical T-pose including deltoids, pectoralis major, rectus abdominis, and latissimus dorsi.',
        highYieldFact: 'Skeletal muscle contraction requires ATP binding to cause myosin head detachment from the actin filament.',
      },
      {
        id: 'knolling_muscular_calves',
        name: 'Lower Muscular Bundles (Gastrocnemius & Soleus)',
        latinName: 'Musculi tricipites surae',
        layer: 'muscular',
        geometryType: 'capsule',
        color: '#9f1239',
        position: [0, -1.35, 0],
        knollingPosition: [0, -1.35, 0],
        scale: [0.32, 0.65, 0.22],
        explosionDir: [0, -0.2, 0],
        mechanicalRole: 'Plantarflexion muscle motor and venous muscle pump for lower extremities',
        description: 'Separated bilateral calf musculature showing gastrocnemius medial and lateral heads merging into the calcaneal (Achilles) tendon.',
        highYieldFact: 'Contraction of the gastrocnemius/soleus acts as a peripheral venous pump propelling blood toward the heart against gravity.',
      },
      {
        id: 'knolling_cranium',
        name: 'Human Skull & Craniofacial Skeleton',
        latinName: 'Cranium & ossa faciei',
        layer: 'skeletal',
        geometryType: 'sphere',
        color: '#f8fafc',
        position: [0, 1.52, 0],
        knollingPosition: [1.38, 1.55, 0],
        scale: [0.38, 0.44, 0.38],
        explosionDir: [1.2, 0.2, 0],
        mechanicalRole: 'Rigid spherical protective helmet shielding the encephalon',
        description: 'Deconstructed skull showing orbital cavities, nasal aperture, zygomatic arches, maxilla, and alveolar dental ridge.',
        highYieldFact: 'The pterion overlies the anterior division of the middle meningeal artery; fracture here risks an epidural hematoma.',
      },
      {
        id: 'knolling_brain',
        name: 'Cerebral Hemispheres & Brainstem',
        latinName: 'Encephalon & truncus encephali',
        layer: 'nervous_vascular',
        geometryType: 'sphere',
        color: '#fb7185',
        position: [0, 1.52, 0],
        knollingPosition: [-1.38, 1.55, 0],
        scale: [0.36, 0.32, 0.4],
        explosionDir: [-1.2, 0.2, 0],
        mechanicalRole: 'Central command processor, autonomic regulator, and neural coordinator',
        description: 'Complete brain with paired cerebral hemispheres, gyri and sulci, cerebellar folia, and brainstem (midbrain, pons, medulla).',
        highYieldFact: 'The medulla oblongata contains the primary respiratory rhythmicity centers regulated by blood CO2/pH via central chemoreceptors.',
      },
      {
        id: 'knolling_vertebral_column',
        name: 'Segmented Vertebral Column & Sacrum',
        latinName: 'Columna vertebralis & os sacrum',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#f1f5f9',
        position: [0, 0.55, -0.06],
        knollingPosition: [-1.55, 0.15, 0],
        scale: [0.12, 1.55, 0.12],
        explosionDir: [-1.3, -0.3, 0],
        mechanicalRole: 'Axial structural mast and protective armored conduit for the spinal cord',
        description: 'Full articulated spine containing cervical (C1-C7), thoracic (T1-T12), lumbar (L1-L5) vertebrae, sacrum, and coccyx.',
        highYieldFact: 'Lumbar puncture safely enters the subarachnoid space at the L3-L4 or L4-L5 interspace, well below the conus medullaris (ending at L1-L2 in adults).',
      },
      {
        id: 'knolling_spinal_cord',
        name: 'Spinal Cord & Cauda Equina Roots',
        latinName: 'Medulla spinalis & cauda equina',
        layer: 'nervous_vascular',
        geometryType: 'cylinder',
        color: '#fef08a',
        position: [0, 0.55, -0.05],
        knollingPosition: [1.55, 0.15, 0],
        scale: [0.06, 1.55, 0.06],
        explosionDir: [1.3, -0.3, 0],
        mechanicalRole: 'High-speed electro-chemical bus conducting sensory afferents and motor efferents',
        description: 'Intact spinal neural cable showing cervical and lumbar enlargements, terminating in the conus medullaris and cauda equina fibers.',
        highYieldFact: 'Anterior spinal artery supplies anterior 2/3 of the cord; occlusion (anterior spinal artery syndrome) spares dorsal columns (vibration/proprioception).',
      },
      {
        id: 'knolling_ribcage_left',
        name: 'Left Ribcage Arches (Costae Sinistrae)',
        latinName: 'Costae thoracicae sinistrae',
        layer: 'skeletal',
        geometryType: 'torus',
        color: '#e2e8f0',
        position: [-0.22, 0.88, 0],
        knollingPosition: [-1.1, 0.52, 0],
        scale: [0.32, 0.55, 0.16],
        rotation: [Math.PI / 2, 0, 0],
        explosionDir: [-0.8, 0, 0],
        mechanicalRole: 'Bellows ribcage protecting left cardiopulmonary organs',
        description: 'Curved thoracic ribs 1 through 12 on the left side with costal cartilage margins.',
        highYieldFact: 'The intercostal neurovascular bundle runs in the costal groove along the inferior margin of each rib (VAN: Vein, Artery, Nerve).',
      },
      {
        id: 'knolling_ribcage_right',
        name: 'Right Ribcage Arches (Costae Dextrae)',
        latinName: 'Costae thoracicae dextrae',
        layer: 'skeletal',
        geometryType: 'torus',
        color: '#e2e8f0',
        position: [0.22, 0.88, 0],
        knollingPosition: [1.1, 0.52, 0],
        scale: [0.32, 0.55, 0.16],
        rotation: [Math.PI / 2, 0, 0],
        explosionDir: [0.8, 0, 0],
        mechanicalRole: 'Bellows ribcage protecting right pulmonary lobes and liver',
        description: 'Curved thoracic ribs 1 through 12 on the right side shielding the right lung and hepatic dome.',
        highYieldFact: 'Rib fractures of ribs 9-11 on the right risk hepatic laceration; on the left they risk splenic rupture.',
      },
      {
        id: 'knolling_pelvis_left',
        name: 'Left Pelvic Girdle (Os Coxae Sinistrum)',
        latinName: 'Os coxae sinistrum',
        layer: 'skeletal',
        geometryType: 'box',
        color: '#f8fafc',
        position: [-0.22, 0.08, 0],
        knollingPosition: [-0.75, 0.52, 0],
        scale: [0.24, 0.32, 0.15],
        explosionDir: [-0.5, 0.4, 0],
        mechanicalRole: 'Rigid basin transferring upper body weight to left lower limb',
        description: 'Left hemipelvis comprising the broad iliac blade, ischial tuberosity, and acetabulum socket.',
        highYieldFact: 'The ischial spine is the landmark used for pudendal nerve blocks during vaginal delivery.',
      },
      {
        id: 'knolling_pelvis_right',
        name: 'Right Pelvic Girdle (Os Coxae Dextrum)',
        latinName: 'Os coxae dextrum',
        layer: 'skeletal',
        geometryType: 'box',
        color: '#f8fafc',
        position: [0.22, 0.08, 0],
        knollingPosition: [0.75, 0.52, 0],
        scale: [0.24, 0.32, 0.15],
        explosionDir: [0.5, 0.4, 0],
        mechanicalRole: 'Rigid basin transferring upper body weight to right lower limb',
        description: 'Right hemipelvis comprising the broad iliac blade, ischial tuberosity, and acetabulum socket.',
        highYieldFact: 'Bone marrow aspirates for biopsy are most commonly harvested from the posterior superior iliac spine (PSIS).',
      },
      {
        id: 'knolling_femur_left',
        name: 'Left Femur Bone (Os Femoris Sinistrum)',
        latinName: 'Os femoris sinistrum',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#f1f5f9',
        position: [-0.26, -0.48, 0],
        knollingPosition: [-0.88, -0.18, 0],
        scale: [0.1, 0.78, 0.1],
        explosionDir: [-0.6, 0.2, 0],
        mechanicalRole: 'Longest, strongest biological weight-bearing lever arm',
        description: 'Left femoral shaft showing proximal femoral head, greater and lesser trochanters, and distal condyles.',
        highYieldFact: 'Fractures of the femoral neck disrupt the medial circumflex femoral artery, predisposing to avascular necrosis of the femoral head.',
      },
      {
        id: 'knolling_femur_right',
        name: 'Right Femur Bone (Os Femoris Dextrum)',
        latinName: 'Os femoris dextrum',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#f1f5f9',
        position: [0.26, -0.48, 0],
        knollingPosition: [0.88, -0.18, 0],
        scale: [0.1, 0.78, 0.1],
        explosionDir: [0.6, 0.2, 0],
        mechanicalRole: 'Longest, strongest biological weight-bearing lever arm',
        description: 'Right femoral shaft showing proximal femoral head, greater and lesser trochanters, and distal condyles.',
        highYieldFact: 'The angle of inclination between the femoral neck and shaft averages 125 degrees; coxa vara reduces it while coxa valga increases it.',
      },
      {
        id: 'knolling_tibia_left',
        name: 'Left Tibia & Fibula (Ossa Cruris Sinistra)',
        latinName: 'Tibia & fibula sinistra',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#e2e8f0',
        position: [-0.26, -1.35, 0],
        knollingPosition: [-0.88, -1.15, 0],
        scale: [0.08, 0.78, 0.08],
        explosionDir: [-0.6, 0.1, 0],
        mechanicalRole: 'Lower leg load-bearing strut and lateral muscular attachment anchor',
        description: 'Paired left lower leg bones: broad weight-bearing tibia and slender lateral fibula with medial/lateral malleoli.',
        highYieldFact: 'Fractures of the proximal fibular neck risk lacerating the common fibular (peroneal) nerve, resulting in foot drop.',
      },
      {
        id: 'knolling_tibia_right',
        name: 'Right Tibia & Fibula (Ossa Cruris Dextra)',
        latinName: 'Tibia & fibula dextra',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#e2e8f0',
        position: [0.26, -1.35, 0],
        knollingPosition: [0.88, -1.15, 0],
        scale: [0.08, 0.78, 0.08],
        explosionDir: [0.6, 0.1, 0],
        mechanicalRole: 'Lower leg load-bearing strut and lateral muscular attachment anchor',
        description: 'Paired right lower leg bones: broad weight-bearing tibia and slender lateral fibula with medial/lateral malleoli.',
        highYieldFact: 'Anterior tibial compartment syndrome compresses the deep fibular nerve and anterior tibial artery, causing loss of sensation in the first web space.',
      },
      {
        id: 'knolling_venous_tree',
        name: 'Deep Venous Drainage (Blue IVC & Iliac Branches)',
        latinName: 'Vena cava inferior & venae iliacae',
        layer: 'nervous_vascular',
        geometryType: 'cylinder',
        color: '#2563eb',
        position: [-0.04, 0.38, 0.02],
        knollingPosition: [-0.96, -0.15, 0],
        scale: [0.1, 0.72, 0.08],
        explosionDir: [-0.7, -0.4, 0],
        mechanicalRole: 'Low-pressure venous return compliance reservoir',
        description: 'Venous vascular tree: Inferior Vena Cava collecting blood from bilateral renal veins, gonadal veins, and common iliac veins.',
        highYieldFact: 'The left renal vein crosses anterior to the abdominal aorta and posterior to the superior mesenteric artery, where it can be compressed (Nutcracker syndrome).',
      },
      {
        id: 'knolling_arterial_tree',
        name: 'Systemic Arterial Tree (Red Aorta & Iliac Branches)',
        latinName: 'Aorta abdominalis & arteriae iliacae',
        layer: 'nervous_vascular',
        geometryType: 'cylinder',
        color: '#dc2626',
        position: [0.04, 0.38, 0.02],
        knollingPosition: [0.96, -0.15, 0],
        scale: [0.1, 0.72, 0.08],
        explosionDir: [0.7, -0.4, 0],
        mechanicalRole: 'High-pressure distribution pipeline and Windkessel accumulator',
        description: 'Abdominal aorta branching into celiac trunk, superior mesenteric, renal, and bifurcating into left/right common iliac arteries.',
        highYieldFact: 'Abdominal aortic aneurysms (AAA) most commonly occur infrarenally due to a deficiency of vasa vasorum and high pulse reflection pressure.',
      },
      {
        id: 'knolling_kidneys',
        name: 'Bilateral Kidneys & Suprarenal Adrenals',
        latinName: 'Renes & glandulae suprarenales',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#7f1d1d',
        position: [0, 0.38, -0.06],
        knollingPosition: [-1.32, -0.08, 0],
        scale: [0.32, 0.22, 0.16],
        explosionDir: [-1.1, -0.3, 0],
        mechanicalRole: 'High-precision plasma filtration and osmolar regulation plant',
        description: 'Bean-shaped bilateral kidneys with adrenal caps, renal hila, pelvis, and descending ureter beginnings.',
        highYieldFact: 'The kidneys receive 20-25% of resting cardiac output to filter ~180 L of plasma daily, maintaining systemic fluid-electrolyte homeostasis.',
      },
      {
        id: 'knolling_digestive_liver',
        name: 'Dual-Lobed Liver & Gallbladder',
        latinName: 'Hepar & vesica biliaris',
        layer: 'visceral',
        geometryType: 'box',
        color: '#78350f',
        position: [0.14, 0.52, 0.08],
        knollingPosition: [-1.08, -0.78, 0],
        scale: [0.38, 0.26, 0.24],
        explosionDir: [-0.9, -0.8, 0],
        mechanicalRole: 'Primary biochemical refinery, bile synthesizer, and glycogen battery',
        description: 'Large right and smaller left hepatic lobes with inferior quadrate and caudate lobes and green gallbladder.',
        highYieldFact: 'The liver has a dual blood supply: 75% venous from the portal vein (rich in nutrients) and 25% arterial from the hepatic artery (oxygenated).',
      },
      {
        id: 'knolling_digestive_stomach',
        name: 'Esophagus & J-Shaped Stomach',
        latinName: 'Esophagus & gaster',
        layer: 'visceral',
        geometryType: 'torus',
        color: '#f43f5e',
        position: [-0.12, 0.55, 0.08],
        knollingPosition: [-1.45, -0.98, 0],
        scale: [0.26, 0.34, 0.16],
        explosionDir: [-1.2, -0.9, 0],
        mechanicalRole: 'Acidic chemical hydrolysis and mechanical churning chamber',
        description: 'Muscular J-shaped reservoir featuring the cardia, fundus, body with gastric rugae, and pyloric sphincter.',
        highYieldFact: 'Gastric parietal cells secrete hydrochloric acid (HCl) and intrinsic factor, essential for vitamin B12 absorption in the terminal ileum.',
      },
      {
        id: 'knolling_digestive_colon',
        name: 'Framed Large Intestine (Colon with Haustra)',
        latinName: 'Intestinum crassum (Colon)',
        layer: 'visceral',
        geometryType: 'torus',
        color: '#d97706',
        position: [0, 0.32, 0.08],
        knollingPosition: [-1.02, -1.28, 0],
        scale: [0.42, 0.48, 0.16],
        explosionDir: [-0.8, -1.1, 0],
        mechanicalRole: 'Water reclamation, electrolyte resorption, and fecal compaction frame',
        description: 'Square-framed large bowel: cecum, ascending colon, transverse colon, descending colon, sigmoid colon, and rectum with taenia coli.',
        highYieldFact: 'The watershed areas of the colon (splenic flexure and rectosigmoid junction) are most susceptible to ischemic colitis during hypovolemic shock.',
      },
      {
        id: 'knolling_digestive_small_intestine',
        name: 'Small Intestine Mesenteric Loops (Jejunum & Ileum)',
        latinName: 'Intestinum tenue (Jejunum & ileum)',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#fb923c',
        position: [0, 0.22, 0.1],
        knollingPosition: [-1.45, -1.52, 0],
        scale: [0.32, 0.26, 0.2],
        explosionDir: [-1.2, -1.3, 0],
        mechanicalRole: 'Enzymatic nutrient absorption over thousands of microvillar folds',
        description: 'Convoluted 6-meter bowel loops suspended by mesentery, featuring plicae circulares for maximized absorption.',
        highYieldFact: 'Celiac disease causes autoimmune-mediated villous atrophy and crypt hyperplasia primarily in the duodenum and proximal jejunum.',
      },
      {
        id: 'knolling_cardiovascular_heart',
        name: 'Beating 4-Chamber Heart & Coronary Vessels',
        latinName: 'Cor & arteriae coronariae',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#e11d48',
        position: [-0.06, 0.82, 0.08],
        knollingPosition: [1.38, -0.78, 0],
        scale: [0.28, 0.34, 0.26],
        explosionDir: [1.2, -0.8, 0],
        mechanicalRole: 'Four-chamber myogenic displacement pump driving systemic and pulmonary circulation',
        description: 'Contoured myocardial pump with left/right atria and ventricles, ascending aortic root, pulmonary trunk, and LAD coronaries.',
        highYieldFact: 'Left anterior descending (LAD) coronary artery occlusion is the most common cause of fatal myocardial infarction (the "widow maker").',
      },
      {
        id: 'knolling_respiratory_trachea',
        name: 'Cartilaginous Trachea & Bronchial Arborization',
        latinName: 'Trachea & arbor bronchialis',
        layer: 'visceral',
        geometryType: 'cylinder',
        color: '#fed7aa',
        position: [0, 1.12, 0.04],
        knollingPosition: [1.12, -1.15, 0],
        scale: [0.12, 0.44, 0.12],
        explosionDir: [0.9, -1.1, 0],
        mechanicalRole: 'Conducting airway conduit reinforced with C-shaped cartilaginous rings',
        description: 'Tracheal tube bifurcating at the carina into the wider, more vertical right main bronchus and angled left main bronchus.',
        highYieldFact: 'Aspirated foreign bodies most frequently lodge in the right mainstem bronchus because it is wider, shorter, and runs more vertically.',
      },
      {
        id: 'knolling_respiratory_lungs',
        name: 'Bilateral Breathing Lungs (Pulmones)',
        latinName: 'Pulmo dexter & sinister',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#f472b6',
        position: [0, 0.84, 0.04],
        knollingPosition: [1.45, -1.15, 0],
        scale: [0.48, 0.52, 0.28],
        explosionDir: [1.2, -1.1, 0],
        mechanicalRole: 'Elastic alveolar gas-exchange bellows with ~300 million alveoli',
        description: 'Right lung with 3 lobes (superior, middle, inferior) and left lung with 2 lobes and cardiac notch, expanding rhythmically in inspiration.',
        highYieldFact: 'Pulmonary surfactant synthesized by Type II pneumocytes prevents alveolar collapse at low lung volumes by reducing surface tension.',
      },
      {
        id: 'knolling_respiratory_diaphragm',
        name: 'Diaphragmatic Muscular Dome',
        latinName: 'Diaphragma thoracicum',
        layer: 'muscular',
        geometryType: 'torus',
        color: '#fb7185',
        position: [0, 0.58, 0],
        knollingPosition: [1.12, -1.48, 0],
        scale: [0.42, 0.16, 0.32],
        rotation: [Math.PI / 2, 0, 0],
        explosionDir: [0.9, -1.3, 0],
        mechanicalRole: 'Primary respiratory muscle piston driving negative intrathoracic pressure',
        description: 'Broad dome-shaped musculotendinous sheet separating thoracic and abdominal cavities, featuring Caval (T8), Esophageal (T10), and Aortic (T12) apertures.',
        highYieldFact: 'I Ate (T8: IVC) Ten Eggs (T10: Esophagus) At Twelve (T12: Aorta) is the classic mnemonic for diaphragmatic hiatus levels.',
      },
    ],
  },
  {
    id: 'skeletal',
    name: 'Skeletal System',
    icon: '🦴',
    color: '#e2d9cc',
    accent: '#b45309',
    shortSummary: 'Rigid mineral framework providing mechanical support, organ protection, hematopoiesis, and mineral homeostasis.',
    fullOverview: 'The human adult skeleton contains 206 distinct bones divided into the axial skeleton (skull, vertebral column, thoracic cage) and the appendicular skeleton (pectoral girdle, upper limbs, pelvic girdle, lower limbs). Bones act as levers for mechanical locomotion, store 99% of total body calcium, and harbor bone marrow for blood cell synthesis.',
    primaryFunctions: [
      'Mechanical leverage and structural load-bearing',
      'Vital visceral protection (brain, spinal cord, heart, lungs)',
      'Calcium and phosphate reservoir regulated by PTH & calcitonin',
      'Hematopoiesis in red bone marrow',
    ],
    clinicalPearls: [
      'Osteoporosis predominantly affects trabecular (cancellous) bone in the femoral neck and vertebral bodies.',
      'Scoliosis involves lateral curvature and rotational deformity of the thoracolumbar spine.',
      'Salter-Harris classification grades pediatric growth plate (physis) fractures.',
    ],
    highYieldUSMLE: 'Primary bone healing occurs without callus formation under rigid internal fixation. PTH activates osteoblasts to express RANKL, which binds RANK on pre-osteoclasts to induce bone resorption and release ionic calcium into systemic circulation.',
    sampleStudyNote: `SKELETAL SYSTEM HIGH-YIELD OVERVIEW
The skeletal system serves as the primary mechanical superstructure of the human body. Composed of 206 bones in the mature adult, it is divided into the Axial skeleton (80 bones: Cranium, Vertebral column, Sternum, Ribs) and Appendicular skeleton (126 bones: Pectoral girdle, Upper limbs, Pelvic girdle, Lower limbs).

1. Cranial Architecture: The neurocranium protects the encephalon, with fontanelles in neonates allowing birth canal molding. The pterion marks the junction of the frontal, parietal, temporal, and sphenoid bones; trauma here risks rupture of the middle meningeal artery, precipitating an epidural hematoma with a classic lucid interval.
2. Axial Column: Comprising 7 cervical, 12 thoracic, 5 lumbar vertebrae, sacrum, and coccyx. Intervertebral discs feature an outer anulus fibrosus and inner gelatinous nucleus pulposus. Herniation posterolaterally compresses descending nerve roots.
3. Thoracic Ribcage: True ribs (1-7), false ribs (8-10), and floating ribs (11-12) protect the cardiopulmonary viscera. The neurovascular bundle (intercostal vein, artery, nerve: VAN) runs along the inferior costal groove; thoracocentesis needles must always enter immediately superior to the lower rib margin to avoid laceration.
4. Appendicular Levers: The femur is the strongest weight-bearing lever. The femoral head articulates within the acetabulum of the pelvis. Fractures of the femoral neck disrupt the medial circumflex femoral artery, predisposing to avascular necrosis (osteonecrosis) of the femoral head.`,
    parts: [
      {
        id: 'cranium',
        name: 'Neurocranium & Facial Bones',
        latinName: 'Cranium cerebrale',
        layer: 'skeletal',
        geometryType: 'sphere',
        color: '#f1ede4',
        position: [0, 1.48, 0],
        scale: [0.38, 0.44, 0.42],
        explosionDir: [0, 0.8, 0],
        mechanicalRole: 'Rigid spherical pressure-resistant vault shielding the encephalon',
        description: 'Fused cranial vault comprising frontal, parietal, occipital, temporal, sphenoid, and ethmoid bones.',
        innervation: 'Cranial nerves (CN V trigeminal branches)',
        bloodSupply: 'Middle meningeal artery, superficial temporal artery',
        commonPathology: 'Basilar skull fracture (Battle sign, raccoon eyes), epidural hematoma at pterion',
        highYieldFact: 'The pterion overlies the anterior branch of the middle meningeal artery.',
      },
      {
        id: 'cervical_spine',
        name: 'Cervical Spine (C1-C7)',
        latinName: 'Vertebrae cervicales',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#ebe5d8',
        position: [0, 1.05, -0.05],
        scale: [0.12, 0.28, 0.12],
        explosionDir: [0, 0.3, -0.4],
        mechanicalRole: 'Multi-axis pivot and hinge supporting head rotation and flexion',
        description: 'Seven cervical vertebrae including C1 (Atlas) and C2 (Axis with dens/odontoid process) allowing nodding and shaking.',
        innervation: 'Cervical spinal nerves C1-C8',
        bloodSupply: 'Vertebral arteries passing through transversarium foramina',
        commonPathology: 'Whiplash hyperextension injury, Jefferson fracture (C1 burst), Hangman fracture (C2)',
        highYieldFact: 'C3, C4, C5 keep the diaphragm alive via the phrenic nerve.',
      },
      {
        id: 'thoracic_cage',
        name: 'Thoracic Ribcage & Sternum',
        latinName: 'Cavea thoracis',
        layer: 'skeletal',
        geometryType: 'torus',
        color: '#f5f0e6',
        position: [0, 0.52, 0],
        scale: [0.52, 0.62, 0.32],
        rotation: [Math.PI / 2, 0, 0],
        explosionDir: [0, 0, 0.6],
        mechanicalRole: 'Compliant protective bellows cage allowing volume expansion during inspiration',
        description: 'Bony framework consisting of 12 thoracic vertebrae, 12 pairs of ribs, and the anterior manubrium/sternum.',
        innervation: 'Intercostal nerves (T1-T11)',
        bloodSupply: 'Anterior and posterior intercostal arteries',
        commonPathology: 'Flail chest (paradoxical breathing motion), rib fractures causing pneumothorax',
        highYieldFact: 'The neurovascular bundle runs VAN (vein, artery, nerve) top to bottom beneath each rib.',
      },
      {
        id: 'lumbar_spine',
        name: 'Lumbar Spine (L1-L5)',
        latinName: 'Vertebrae lumbales',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#ebe5d8',
        position: [0, 0.05, -0.06],
        scale: [0.14, 0.42, 0.14],
        explosionDir: [0, 0, -0.5],
        mechanicalRole: 'Heavy axial compressive load-bearing pillar with high moment resistance',
        description: 'Massive vertebral bodies designed to support upper body mass and transmit weight to the pelvis.',
        innervation: 'Lumbar spinal nerves L1-L5',
        bloodSupply: 'Lumbar arteries branching off abdominal aorta',
        commonPathology: 'L4-L5 and L5-S1 disc herniation producing sciatica and foot drop',
        highYieldFact: 'Spinal tap (lumbar puncture) is performed between L3/L4 or L4/L5 below the conus medullaris.',
      },
      {
        id: 'pelvic_girdle',
        name: 'Pelvic Girdle & Sacrum',
        latinName: 'Pelvis ossea',
        layer: 'skeletal',
        geometryType: 'box',
        color: '#e8e1d3',
        position: [0, -0.28, 0],
        scale: [0.65, 0.28, 0.38],
        explosionDir: [0, -0.4, 0],
        mechanicalRole: 'Structural basin transferring trunk load to lower limb struts and shielding reproductive viscera',
        description: 'Ring formed by two coxal bones (ilium, ischium, pubis) articulating posteriorly with the triangular sacrum.',
        innervation: 'Sacral plexus (L4-S4), Pudendal nerve',
        bloodSupply: 'Internal and external iliac arteries',
        commonPathology: 'Open-book pelvic fractures with catastrophic retroperitoneal venous hemorrhage',
        highYieldFact: 'The female pelvis features a wider subpubic angle (>90°) and oval pelvic inlet for parturition.',
      },
      {
        id: 'femurs',
        name: 'Femoral Columns (Bilateral)',
        latinName: 'Femur',
        layer: 'skeletal',
        geometryType: 'cylinder',
        color: '#f0ece2',
        position: [0, -0.92, 0],
        scale: [0.38, 0.78, 0.14],
        explosionDir: [0, -0.8, 0],
        mechanicalRole: 'Primary high-tensile cantilever columns supporting ambulatory ground forces',
        description: 'Longest, heaviest, and strongest bones in the human body, articulating at the hip and knee.',
        innervation: 'Femoral nerve (L2-L4)',
        bloodSupply: 'Profunda femoris and medial/lateral circumflex femoral arteries',
        commonPathology: 'Femoral neck fracture resulting in avascular necrosis from retrograde arterial disruption',
        highYieldFact: 'Fractures of the femoral shaft can sequester 1 to 1.5 liters of internal blood.',
      },
    ],
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular System',
    icon: '🫀',
    color: '#ef4444',
    accent: '#dc2626',
    shortSummary: 'High-pressure closed hydraulic circuit driven by a 4-chamber myogenic pump circulating oxygenated and deoxygenated blood.',
    fullOverview: 'The cardiovascular system consists of the heart, systemic arteries, capillaries, and venous return network. Operating in two serial loops (pulmonary low-pressure circuit and systemic high-pressure circuit), it transports oxygen, nutrients, hormones, and metabolic wastes across 100,000 kilometers of blood vessels.',
    primaryFunctions: [
      'Continuous systemic perfusion and gas transport (O2 delivery, CO2 clearance)',
      'Distribution of endocrine signaling hormones and immune leukocytes',
      'Thermoregulation via peripheral cutaneous vasoconstriction and vasodilation',
      'Acid-base and fluid volume balance maintenance',
    ],
    clinicalPearls: [
      'Myocardial infarction most frequently involves the Left Anterior Descending (LAD) coronary artery ("widow-maker").',
      'The Frank-Starling law dictates that end-diastolic sarcomere stretch increases myocardial contractile stroke volume.',
      'S1 heart sound corresponds to mitral/tricuspid closure; S2 corresponds to aortic/pulmonic closure.',
    ],
    highYieldUSMLE: 'Cardiac output = Stroke Volume × Heart Rate. Mean Arterial Pressure (MAP) = Diastolic BP + 1/3(Systolic BP - Diastolic BP) = CO × Total Peripheral Resistance (TPR). The Sinoatrial node functions as the dominant cardiac pacemaker (60-100 bpm) through Phase 4 funny sodium channels (If).',
    sampleStudyNote: `CARDIOVASCULAR SYSTEM & HEMODYNAMICS
The human heart is a dual-phase muscular pump organized into four chambers: right atrium, right ventricle, left atrium, and left ventricle.

1. Systemic and Pulmonary Circulation Pathways:
Deoxygenated blood returns from systemic tissues via the superior and inferior venae cavae into the right atrium. It traverses the tricuspid atrioventricular valve into the right ventricle, which ejects it through the pulmonary valve into the pulmonary trunk. In alveolar capillaries, carbon dioxide diffuses out and oxygen binds hemoglobin. Four pulmonary veins return freshly oxygenated blood to the left atrium. Flow proceeds through the bicuspid (mitral) valve into the high-pressure left ventricle, which generates systolic pressures of ~120 mmHg to eject blood across the aortic valve into the ascending aorta.

2. Cardiac Conduction Hierarchy:
- Sinoatrial (SA) node (located at the junction of superior vena cava and right atrium): intrinsic rate 60-100 bpm. Initiates atrial depolarization (P wave on ECG).
- Atrioventricular (AV) node (Koch's triangle): introduces a 0.1-second physiological delay (PR segment) ensuring complete ventricular end-diastolic filling.
- Bundle of His, Left and Right Bundle Branches, and Purkinje fibers: rapid conduction (4 m/s) ensuring synchronized apical-to-basal ventricular contraction (QRS complex).

3. Coronary Perfusion:
Coronary arteries fill during ventricular DIASTOLE when aortic backpressure closes aortic semilunar cusps. The Left Anterior Descending (LAD) supplies the anterior two-thirds of the interventricular septum, anterior left ventricular wall, and cardiac apex.`,
    parts: [
      {
        id: 'heart_ventricles',
        name: 'Myocardial Pump (Heart)',
        latinName: 'Cor (Ventriculi cordis)',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#b91c1c',
        position: [0.08, 0.42, 0.12],
        scale: [0.26, 0.32, 0.24],
        explosionDir: [0.2, 0.2, 0.6],
        mechanicalRole: 'Dual-stroke continuous positive-displacement muscular hydraulic pump',
        description: 'Four-chambered muscular organ encased in pericardium, generating pulsatile flow across systemic and pulmonary circuits.',
        innervation: 'Cardiac plexus (Sympathetic T1-T4, Parasympathetic Vagus CN X)',
        bloodSupply: 'Left and right coronary arteries arising from aortic root sinuses',
        commonPathology: 'Coronary artery disease, myocardial infarction, congestive heart failure',
        highYieldFact: 'Coronary blood flow to the left ventricle occurs almost exclusively during diastole.',
      },
      {
        id: 'aorta_arch',
        name: 'Aortic Arch & Systemic Conduit',
        latinName: 'Arcus aortae',
        layer: 'nervous_vascular',
        geometryType: 'torus',
        color: '#dc2626',
        position: [0.04, 0.62, 0.08],
        scale: [0.18, 0.18, 0.08],
        rotation: [0, Math.PI / 2, 0],
        explosionDir: [0, 0.5, 0.3],
        mechanicalRole: 'Elastic Windkessel pressure reservoir buffering pulsatile systolic shockwaves',
        description: 'Main arterial trunk giving rise to brachiocephalic trunk, left common carotid, and left subclavian arteries.',
        innervation: 'Aortic baroreceptors via Vagus nerve (CN X)',
        bloodSupply: 'Vasa vasorum supplying tunica adventitia and media',
        commonPathology: 'Aortic dissection (Stanford Type A requires emergency surgery), thoracic aortic aneurysm',
        highYieldFact: 'The ligamentum arteriosum connects aortic arch to pulmonary trunk; site of traumatic aortic rupture in deceleration.',
      },
      {
        id: 'vena_cava',
        name: 'Vena Cava & Venous Reservoir',
        latinName: 'Vena cava superior et inferior',
        layer: 'nervous_vascular',
        geometryType: 'cylinder',
        color: '#2563eb',
        position: [-0.06, 0.35, 0.08],
        scale: [0.08, 0.55, 0.08],
        explosionDir: [-0.3, 0, 0.3],
        mechanicalRole: 'Low-resistance high-capacitance venous conduit returning blood to the right heart',
        description: 'Large capacitance vessels carrying deoxygenated blood from upper and lower extremities to right atrium.',
        innervation: 'Splanchnic sympathetics modulating venous capacitance tone',
        bloodSupply: 'Internal venous drainage',
        commonPathology: 'Superior Vena Cava (SVC) syndrome from apical bronchogenic carcinoma, Deep Vein Thrombosis (DVT)',
        highYieldFact: 'Veins contain 60-70% of total blood volume at rest, serving as the physiological capacitance reservoir.',
      },
    ],
  },
  {
    id: 'respiratory',
    name: 'Respiratory System',
    icon: '🫁',
    color: '#f87171',
    accent: '#ef4444',
    shortSummary: 'Conducting airways and alveolar exchange zone driven by negative intrathoracic pressure mechanics.',
    fullOverview: 'The respiratory system comprises conducting zones (nasal cavity, pharynx, larynx, trachea, bronchi, bronchioles) and respiratory zones (alveolar ducts and sacs). Negative pressure generated by diaphragmatic descent draws ambient air across 300 million alveoli with a combined surface area of 100 m².',
    primaryFunctions: [
      'Alveolar-capillary gas exchange (O2 uptake, CO2 elimination)',
      'Acid-base regulation via respiratory compensation of arterial PCO2',
      'Vocal phonation and laryngeal sound modulation',
      'Mucociliary clearance and immune airborne filtration',
    ],
    clinicalPearls: [
      'Type II pneumocytes synthesize pulmonary surfactant (dipalmitoylphosphatidylcholine), reducing alveolar surface tension.',
      'Aspiration pneumonia most commonly lodges in the right lower lobe due to the wider, more vertical right main bronchus.',
      'Ventilation/Perfusion (V/Q) ratio is highest at the lung apex (~3.0) and lowest at the base (~0.6).',
    ],
    highYieldUSMLE: 'Boyle’s law (P1V1 = P2V2) governs pulmonary ventilation. Diaphragm contraction increases thoracic volume, dropping alveolar pressure below atmospheric (negative intrapleural pressure, normally -5 cm H2O at rest, dropping to -8 cm H2O on inspiration). Compliance = ΔV / ΔP.',
    sampleStudyNote: `RESPIRATORY SYSTEM MECHANICS & GAS EXCHANGE
Pulmonary ventilation relies on the active expansion of the thoracic cage to generate sub-atmospheric intrapleural pressures.

1. Mechanics of Ventilation:
- Quiet Inspiration: Active process mediated primarily by the Diaphragm (innervated by C3-C5 phrenic nerves) and external intercostal muscles. Diaphragmatic contraction pulls the central tendon downward, increasing vertical thoracic dimensions while the "bucket-handle" and "pump-handle" rib motions expand transverse and anteroposterior diameters.
- Quiet Expiration: Passive recoil of elastic lung tissue and surface tension within alveoli.
- Forced Expiration: Active engagement of abdominal wall musculature (rectus abdominis, transversus abdominis) and internal intercostals.

2. Alveolar Histology & Gas Diffusion:
The blood-air barrier is approximately 0.2-0.5 μm thick, composed of:
- Alveolar fluid and surfactant layer
- Type I pneumocyte thin squamous epithelium (covers 95% of alveolar surface)
- Shared fused basement membrane
- Capillary endothelial cells
Type II pneumocytes act as stem cell progenitors and secrete surfactant. Surfactant deficiency in premature neonates causes Neonatal Respiratory Distress Syndrome (NRDS) due to alveolar collapse according to the Law of Laplace (P = 2T / r).`,
    parts: [
      {
        id: 'trachea_tree',
        name: 'Tracheobronchial Tree',
        latinName: 'Trachea et arbor bronchialis',
        layer: 'visceral',
        geometryType: 'cylinder',
        color: '#fca5a5',
        position: [0, 0.72, 0.05],
        scale: [0.08, 0.42, 0.08],
        explosionDir: [0, 0.5, 0.2],
        mechanicalRole: 'Cartilaginous non-collapsible pneumatic delivery duct with mucociliary escalator',
        description: 'Rigid tube supported by C-shaped hyaline cartilage rings dividing at the carina (T4/T5 level) into left and right main bronchi.',
        innervation: 'Recurrent laryngeal nerve and pulmonary plexus',
        bloodSupply: 'Bronchial arteries originating directly from thoracic aorta',
        commonPathology: 'Tracheobronchitis, foreign body aspiration (predominantly into wider, steeper right main bronchus)',
        highYieldFact: 'The carina has the highest concentration of cough reflex receptors in the airway.',
      },
      {
        id: 'right_lung',
        name: 'Right Lung (3 Lobes)',
        latinName: 'Pulmo dexter',
        layer: 'visceral',
        geometryType: 'cone',
        color: '#fda4af',
        position: [-0.28, 0.46, 0.04],
        scale: [0.24, 0.48, 0.24],
        explosionDir: [-0.6, 0, 0.3],
        mechanicalRole: 'Elastic high-surface-area gas diffusion sponge',
        description: 'Larger lung featuring superior, middle, and inferior lobes separated by horizontal and oblique fissures.',
        innervation: 'Pulmonary plexus (Vagus CN X and sympathetic T2-T5)',
        bloodSupply: 'Pulmonary arteries (deoxygenated functional blood) and bronchial arteries (nutritive systemic blood)',
        commonPathology: 'Lobar pneumonia, bronchogenic carcinoma, pulmonary embolism',
        highYieldFact: 'The right lung has 10 bronchopulmonary segments and is shorter but wider than the left due to the liver below.',
      },
      {
        id: 'left_lung',
        name: 'Left Lung (2 Lobes & Lingula)',
        latinName: 'Pulmo sinister',
        layer: 'visceral',
        geometryType: 'cone',
        color: '#fda4af',
        position: [0.28, 0.46, 0.04],
        scale: [0.22, 0.48, 0.22],
        explosionDir: [0.6, 0, 0.3],
        mechanicalRole: 'Compliant alveolar gas exchange matrix accommodation for the cardiac notch',
        description: 'Two-lobed lung with a prominent cardiac impression notch and lingula, matching left ventricular apex.',
        innervation: 'Pulmonary plexus',
        bloodSupply: 'Pulmonary arteries and two left bronchial arteries from descending aorta',
        commonPathology: 'Tension pneumothorax, chronic obstructive pulmonary disease (emphysema)',
        highYieldFact: 'The lingula of the left superior lobe is the anatomical homologue of the right middle lobe.',
      },
    ],
  },
  {
    id: 'nervous',
    name: 'Nervous System',
    icon: '🧠',
    color: '#f59e0b',
    accent: '#d97706',
    shortSummary: 'High-speed electro-chemical signaling network coordinating sensory perception, motor control, and cognitive consciousness.',
    fullOverview: 'Divided anatomically into the Central Nervous System (brain, brainstem, spinal cord) and Peripheral Nervous System (12 pairs of cranial nerves, 31 pairs of spinal nerves, autonomic ganglia). Contains approximately 86 billion neurons and 100 trillion synaptic junctions.',
    primaryFunctions: [
      'Rapid neuro-electrical signal propagation via action potentials',
      'Sensory integration and executive motor command processing',
      'Autonomic visceral homeostasis (sympathetic fight-or-flight vs parasympathetic rest-and-digest)',
      'Higher cognitive executive functions, memory retention, and emotion',
    ],
    clinicalPearls: [
      'Upper motor neuron lesions present with hyperreflexia, spasticity, and a positive Babinski sign; lower motor neuron lesions cause flaccidity and fasciculations.',
      'The Circle of Willis provides collateral cerebral perfusion connecting internal carotids and vertebral systems.',
      'Brown-Séquard syndrome involves ipsilateral motor/proprioception loss and contralateral pain/temperature loss.',
    ],
    highYieldUSMLE: 'Resting membrane potential is -70 mV maintained by 3Na+/2K+ ATPase. Depolarization opens voltage-gated Na+ channels (Phase 0). Myelination by Schwann cells (PNS) or Oligodendrocytes (CNS) allows saltatory conduction at Nodes of Ranvier.',
    sampleStudyNote: `NERVOUS SYSTEM ARCHITECTURE & SYNAPTIC NEUROLOGY
The nervous system acts as the master electrical control grid of the human organism.

1. Brain & Cranial Organization:
- Cerebrum: Cerebral cortex with frontal (executive motor), parietal (somatosensory), temporal (auditory and language comprehension - Wernicke area), and occipital (primary visual cortex) lobes.
- Cerebellum: Motor coordination, balance, and error-correction via climbing and mossy fiber inputs to Purkinje cells.
- Brainstem: Midbrain, Pons, and Medulla oblongata controlling cardiac pacing, vasomotor tone, and involuntary respiratory rhythm centers.
- Blood-Brain Barrier (BBB): High-resistance continuous tight junctions between capillary endothelial cells, enveloped by astrocyte end-feet podocytes.

2. Spinal Cord Pathways:
- Dorsal Columns (Fasciculus gracilis and cuneatus): Fine touch, vibration, conscious proprioception. Decussates in the medulla.
- Lateral Spinothalamic tract: Pain and temperature. Decussates immediately across anterior white commissure.
- Lateral Corticospinal tract: Primary voluntary motor innervation. Decussates in the medullary pyramids.`,
    parts: [
      {
        id: 'cerebrum',
        name: 'Cerebral Hemispheres',
        latinName: 'Cerebrum (Telencephalon)',
        layer: 'nervous_vascular',
        geometryType: 'sphere',
        color: '#fde68a',
        position: [0, 1.54, 0.02],
        scale: [0.32, 0.28, 0.36],
        explosionDir: [0, 0.8, 0],
        mechanicalRole: 'Distributed parallel neural computing core and sensorimotor command processor',
        description: 'Folded cerebral cortex with gyri and sulci, housing sensory, motor, and association areas.',
        innervation: 'Direct cortical processing (CN I-XII origin)',
        bloodSupply: 'Anterior, middle, and posterior cerebral arteries (Circle of Willis)',
        commonPathology: 'Ischemic stroke, glioblastoma, Alzheimer neurodegenerative disease',
        highYieldFact: 'Middle cerebral artery (MCA) strokes classically cause contralateral face and arm weakness/sensory loss.',
      },
      {
        id: 'spinal_cord',
        name: 'Spinal Cord & Brainstem',
        latinName: 'Medulla spinalis',
        layer: 'nervous_vascular',
        geometryType: 'cylinder',
        color: '#fef08a',
        position: [0, 0.65, -0.15],
        scale: [0.04, 1.25, 0.04],
        explosionDir: [0, 0, -0.6],
        mechanicalRole: 'Protected high-bandwidth fiber optic signaling trunk channeling bidirectional nerve impulse traffic',
        description: 'Cylindrical bundle of nerve tissue extending from the foramen magnum to the conus medullaris at L1/L2.',
        innervation: '31 pairs of mixed spinal nerves',
        bloodSupply: 'One anterior spinal artery (supplies anterior 2/3) and two posterior spinal arteries',
        commonPathology: 'Anterior spinal artery syndrome (bilateral motor loss and spinothalamic loss below lesion, preserved dorsal columns)',
        highYieldFact: 'The spinal cord terminates as the conus medullaris at the L1-L2 vertebral interspace in adults.',
      },
    ],
  },
  {
    id: 'digestive',
    name: 'Digestive System',
    icon: '🍽️',
    color: '#ea580c',
    accent: '#c2410c',
    shortSummary: 'Gastrointestinal tract and accessory glands executing mechanical mastication, acid hydrolysis, and nutrient absorption.',
    fullOverview: 'The GI tract forms a continuous 9-meter lumen running from mouth to anus, supported by vital metabolic accessory glands (liver, gallbladder, pancreas). It breaks down macromolecules into absorbable monomers and eliminates undigested fibrous residue.',
    primaryFunctions: [
      'Motility: Ingestion, mastication, deglutition, peristalsis, and segmentation',
      'Secretions: Gastric acid, bile salts, pancreatic digestive enzymes',
      'Enzymatic macromolecule hydrolysis into glucose, amino acids, and free fatty acids',
      'Immune defense via gut-associated lymphoid tissue (GALT / Peyer patches)',
    ],
    clinicalPearls: [
      'Parietal cells secrete HCl and intrinsic factor (required for terminal ileum Vitamin B12 absorption).',
      'The portal triad consists of the hepatic portal vein, proper hepatic artery, and common bile duct within the hepatoduodenal ligament.',
      'Celiac disease causes blunting of duodenal villi and crypt hyperplasia, impairing fat and nutrient absorption.',
    ],
    highYieldUSMLE: 'Gastric acid secretion is stimulated by Histamine (H2 receptors via cAMP), Acetylcholine (M3 via IP3/Ca2+), and Gastrin (CCK-B via IP3/Ca2+). The final common pathway is the apical H+/K+ ATPase pump inhibited by PPIs like omeprazole.',
    sampleStudyNote: `DIGESTIVE TRACT PHYSIOLOGY & HEPATOBILIARY METABOLISM
The digestive system transforms ingested nutrition into cellular fuel through coordinated chemical and mechanical processing.

1. Gastric Phase & Secretory Cells:
- Parietal Cells: Located in the body and fundus of the stomach. Produce hydrochloric acid (pH 1.5-2.0) to denature proteins and activate pepsinogen. Secrete intrinsic factor; loss of parietal cells (autoimmune gastritis) results in pernicious anemia.
- Chief Cells: Secrete pepsinogen, cleaved autocatalytically to active pepsin at low pH.
- G Cells: Found in the antrum, secrete gastrin into circulation in response to stomach distention and peptides.

2. Small Intestine & Pancreatobiliary Access:
- Duodenum: Brunner glands secrete alkaline mucus neutralizing gastric chyme. CCK release stimulates gallbladder contraction and pancreatic acinar enzyme secretion (trypsinogen, lipase, amylase).
- Jejunum: Primary site of monosaccharide and amino acid absorption via brush border hydrolases and Na+-coupled transporters (SGLT1).
- Terminal Ileum: Specialized for bile salt recycling via enterohepatic circulation and intrinsic factor-mediated Vitamin B12 absorption.

3. The Liver:
The largest metabolic internal organ. Receives dual blood supply: 75% deoxygenated nutrient-rich venous blood from the Portal Vein, and 25% oxygenated blood from the Hepatic Artery. Synthesizes albumin, clotting factors (II, VII, IX, X), and clears toxic ammonia via the urea cycle.`,
    parts: [
      {
        id: 'liver',
        name: 'Hepatic Metabolic Center (Liver)',
        latinName: 'Hepar',
        layer: 'visceral',
        geometryType: 'box',
        color: '#9a3412',
        position: [-0.18, 0.12, 0.12],
        scale: [0.38, 0.22, 0.28],
        explosionDir: [-0.6, 0.2, 0.4],
        mechanicalRole: 'Massive biochemical synthesis factory, chemical detoxification plant, and bile production unit',
        description: 'Largest internal organ located in the right upper quadrant, organized into microscopic hexagonal hepatic lobules.',
        innervation: 'Hepatic plexus (Celiac ganglion and Vagus CN X)',
        bloodSupply: 'Dual supply: Hepatic portal vein (75%) and proper hepatic artery (25%)',
        commonPathology: 'Cirrhosis, portal hypertension leading to esophageal varices and ascites, viral hepatitis',
        highYieldFact: 'The functional unit of the liver is the hepatic acinus, where Zone 3 is most susceptible to ischemic shock.',
      },
      {
        id: 'stomach',
        name: 'Gastric Hydrolysis Chamber (Stomach)',
        latinName: 'Gaster / Ventriculus',
        layer: 'visceral',
        geometryType: 'capsule',
        color: '#c2410c',
        position: [0.16, 0.14, 0.1],
        scale: [0.24, 0.32, 0.22],
        explosionDir: [0.6, 0.2, 0.4],
        mechanicalRole: 'Acidic chemical hydrolysis vat and muscular chyme-grinding mill',
        description: 'J-shaped muscular organ featuring three muscular layers (longitudinal, circular, oblique) allowing churning.',
        innervation: 'Vagus nerve (anterior and posterior vagal trunks)',
        bloodSupply: 'Left gastric, right gastric, gastroepiploic, and short gastric arteries',
        commonPathology: 'Peptic ulcer disease (H. pylori infection, NSAID use), gastric adenocarcinoma',
        highYieldFact: 'Short gastric arteries lack anastomoses; vulnerable to infarction following splenic artery occlusion.',
      },
      {
        id: 'intestines',
        name: 'Intestinal Tract & Colon',
        latinName: 'Intestinum tenue et crassum',
        layer: 'visceral',
        geometryType: 'cylinder',
        color: '#ea580c',
        position: [0, -0.15, 0.1],
        scale: [0.42, 0.32, 0.28],
        explosionDir: [0, -0.4, 0.5],
        mechanicalRole: 'High-surface peristaltic absorption tube and fluid reclaiming bioreactor',
        description: '6 meters of small intestine (duodenum, jejunum, ileum) surrounded by the frame of the large colon.',
        innervation: 'Enteric nervous system (Myenteric Auerbach and Submucosal Meissner plexuses)',
        bloodSupply: 'Superior mesenteric artery (midgut) and inferior mesenteric artery (hindgut)',
        commonPathology: 'Appendicitis, Crohn disease, Ulcerative colitis, bowel obstruction',
        highYieldFact: 'The pectinate line separates visceral endodermal rectum (painless) from somatic ectodermal anus (painful).',
      },
    ],
  },
  {
    id: 'muscular',
    name: 'Muscular System',
    icon: '💪',
    color: '#b91c1c',
    accent: '#991b1b',
    shortSummary: 'Contractile skeletal muscle motor network executing voluntary movement, joint stabilization, and thermogenesis.',
    fullOverview: 'Over 600 skeletal muscles convert metabolic ATP into mechanical tension via cross-bridge actin-myosin cycling. Arranged in agonist-antagonist pairs across bone articulations, muscles provide posture maintenance and generate shivering thermogenesis.',
    primaryFunctions: [
      'Force production and voluntary kinetic movement',
      'Joint stability and posture maintenance counteracting gravity',
      'Thermogenesis through ATP hydrolysis and shivering',
      'Venous blood return via skeletal muscle pump action',
    ],
    clinicalPearls: [
      'Myasthenia gravis is an autoimmune disorder with antibodies against postsynaptic nicotinic ACh receptors at the neuromuscular junction.',
      'Duchenne muscular dystrophy is an X-linked recessive frameshift mutation in the dystrophin gene.',
      'Malignant hyperthermia is triggered by volatile anesthetics causing uncontrolled Ryanodine receptor (RyR1) Ca2+ release.',
    ],
    highYieldUSMLE: 'Skeletal muscle contraction requires Ca2+ binding to Troponin C, shifting Tropomyosin away from actin binding sites. Myosin head releases ADP and Pi during power stroke. New ATP binding is required to detach myosin head from actin (absence of ATP causes rigor mortis).',
    sampleStudyNote: `MUSCULOSKELETAL BIOMECHANICS & EXCITATION-CONTRACTION
Skeletal muscles represent the biological motors of the human chassis.

1. Microscopic Contractile Architecture:
- Sarcomere: The basic contractile unit bounded between two Z-discs. Contains thick myosin filaments (A-band) and thin actin filaments (I-band). During contraction, the H-zone and I-band narrow while the A-band length remains constant.
- T-Tubules & Sarcoplasmic Reticulum: Invaginations of the sarcolemma that conduct electrical action potentials deep into muscle fibers. Dihydropyridine (DHP) voltage-sensitive receptors couple directly to Ryanodine (RyR1) calcium release channels on the terminal cisternae of the sarcoplasmic reticulum.

2. Major Muscle Groups:
- Pectoralis Major: Adducts and medially rotates the humerus.
- Quadriceps Femoris: Four heads (rectus femoris, vastus lateralis, medialis, intermedius) acting as the primary knee extensor. Innervated by the femoral nerve.
- Biceps Brachii: Powerful supinator of the flexed forearm and elbow flexor. Innervated by the musculocutaneous nerve.`,
    parts: [
      {
        id: 'pectoralis',
        name: 'Pectoralis Major & Chest Muscles',
        latinName: 'Musculus pectoralis major',
        layer: 'muscular',
        geometryType: 'box',
        color: '#b91c1c',
        position: [0, 0.58, 0.16],
        scale: [0.55, 0.22, 0.12],
        explosionDir: [0, 0.2, 0.6],
        mechanicalRole: 'Powerful anterior adductor and internal rotator pulling upper limbs forward',
        description: 'Large fan-shaped chest muscle originating from clavicle, sternum, and costal cartilages to insert into humerus.',
        innervation: 'Medial and lateral pectoral nerves',
        bloodSupply: 'Pectoral branch of thoracoacromial trunk',
        commonPathology: 'Pectoralis major tendon tear during heavy bench-press deceleration',
        highYieldFact: 'Forms the anterior axillary fold.',
      },
      {
        id: 'rectus_abdominis',
        name: 'Rectus Abdominis (Core Stabilizer)',
        latinName: 'Musculus rectus abdominis',
        layer: 'muscular',
        geometryType: 'box',
        color: '#991b1b',
        position: [0, 0.12, 0.14],
        scale: [0.32, 0.44, 0.1],
        explosionDir: [0, 0, 0.5],
        mechanicalRole: 'Tension tie-rod flexing the lumbar spine and increasing intra-abdominal pressure',
        description: 'Paired vertical muscle strap separated by the linea alba, intercepted by fibrous tendinous intersections.',
        innervation: 'Thoracoabdominal intercostal nerves (T7-T11)',
        bloodSupply: 'Superior and inferior epigastric arteries',
        commonPathology: 'Diastasis recti in postpartum patients, rectus sheath hematoma',
        highYieldFact: 'The arcuate line marks the lower limit of the posterior rectus sheath.',
      },
      {
        id: 'quadriceps',
        name: 'Quadriceps Femoris Groups',
        latinName: 'Musculus quadriceps femoris',
        layer: 'muscular',
        geometryType: 'cylinder',
        color: '#dc2626',
        position: [0, -0.92, 0.12],
        scale: [0.42, 0.74, 0.2],
        explosionDir: [0, -0.5, 0.4],
        mechanicalRole: 'Massive hydraulic-like extension actuators propelling bipedal gait and jumping',
        description: 'Four-headed muscle mass (rectus femoris, vastus lateralis, intermedius, medialis) inserting into patella and tibial tuberosity.',
        innervation: 'Femoral nerve (L2, L3, L4)',
        bloodSupply: 'Femoral and lateral circumflex femoral arteries',
        commonPathology: 'Patellofemoral pain syndrome, quadriceps tendon rupture, Osgood-Schlatter disease',
        highYieldFact: 'Tests the L3-L4 reflex arc via the patellar tendon tap.',
      },
    ],
  },
  {
    id: 'urinary',
    name: 'Urinary System',
    icon: '💧',
    color: '#0284c7',
    accent: '#0369a1',
    shortSummary: 'High-precision plasma filtration and osmolar regulation system maintaining systemic fluid balance.',
    fullOverview: 'Includes paired retroperitoneal kidneys, ureters, urinary bladder, and urethra. Filters approximately 180 liters of blood plasma daily, concentrating waste into 1.5 liters of urine while regulating blood pressure via renin-angiotensin-aldosterone.',
    primaryFunctions: [
      'Ultrafiltration of metabolic waste products (urea, creatinine, uric acid)',
      'Extracellular fluid volume and systemic blood pressure regulation (RAAS)',
      'Electrolyte (Na+, K+, Cl-, HCO3-, Ca2+) homeostasis',
      'Endocrine synthesis of Erythropoietin (EPO), 1,25-(OH)2 Vitamin D (Calcitriol), and Renin',
    ],
    clinicalPearls: [
      'Loop diuretics (furosemide) inhibit the Na+-K+-2Cl- cotransporter in the thick ascending limb of Henle.',
      'Glomerular Filtration Rate (GFR) is clinically estimated using serum creatinine clearance.',
      'Ureteral stones cause severe colicky flank pain radiating to the groin along the T11-L2 dermatomes.',
    ],
    highYieldUSMLE: 'Macula densa cells in the distal convoluted tubule sense decreased NaCl delivery and trigger juxtaglomerular (JG) cells to release renin. Renin cleaves angiotensinogen into angiotensin I, converted by pulmonary ACE into angiotensin II, a potent systemic vasoconstrictor.',
    sampleStudyNote: `RENAL PHYSIOLOGY & COUNTERCURRENT MULTIPLICATION
The kidneys operate as sophisticated biochemical reclamation units maintaining body fluid homeostasis.

1. The Nephron Functional Unit:
- Glomerulus & Bowman Capsule: Hydrostatic pressure in glomerular capillaries (~50 mmHg) forces plasma across the filtration barrier (fenestrated endothelium, negative charge heparan sulfate basement membrane, podocyte slit diaphragms).
- Proximal Convoluted Tubule (PCT): Reabsorbs 65-70% of filtered water and sodium, and 100% of glucose and amino acids via sodium-glucose cotransporters (SGLT2).
- Loop of Henle: Descending limb is permeable to water but impermeable to solutes (concentrating segment). Thick ascending limb actively pumps Na+, K+, and 2Cl- out of lumen, establishing the hyperosmotic medullary gradient (up to 1200 mOsm/kg).
- Distal Convoluted Tubule & Collecting Duct: Fine-tunes sodium reabsorption under Aldosterone and water permeability under Antidiuretic Hormone (ADH/Vasopressin via Aquaporin-2 channels).`,
    parts: [
      {
        id: 'kidneys',
        name: 'Paired Renal Organs (Kidneys)',
        latinName: 'Renes (Ren dexter et sinister)',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#7f1d1d',
        position: [0, 0.15, -0.1],
        scale: [0.42, 0.22, 0.18],
        explosionDir: [0, 0.2, -0.6],
        mechanicalRole: 'Dual multi-stage cross-flow plasma ultrafiltration and chemical recycling stations',
        description: 'Bean-shaped retroperitoneal organs located between T12 and L3; right kidney sits slightly lower due to liver.',
        innervation: 'Renal plexus (T10-T11 splanchnic nerves)',
        bloodSupply: 'Left and right renal arteries receiving 20-25% of resting cardiac output',
        commonPathology: 'Acute kidney injury, polycystic kidney disease, nephrotic syndrome, renal cell carcinoma',
        highYieldFact: 'The left renal vein is crossed by the superior mesenteric artery ("nutcracker syndrome").',
      },
      {
        id: 'bladder',
        name: 'Urinary Bladder Reservoir',
        latinName: 'Vesica urinaria',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#38bdf8',
        position: [0, -0.36, 0.1],
        scale: [0.22, 0.18, 0.2],
        explosionDir: [0, -0.3, 0.5],
        mechanicalRole: 'Compliant muscular reservoir with high-elasticity detrusor and hydraulic exit sphincters',
        description: 'Hollow, distensible muscular balloon seated in the anterior pelvic basin lined by transitional urothelium.',
        innervation: 'Parasympathetic pelvic splanchnic (S2-S4 contracts detrusor), Sympathetic hypogastric (relaxes detrusor)',
        bloodSupply: 'Superior and inferior vesical arteries',
        commonPathology: 'Urinary tract infection (cystitis), bladder urothelial carcinoma, urinary incontinence',
        highYieldFact: 'The trigone of the bladder is smooth and embryologically derived from mesoderm.',
      },
    ],
  },
  {
    id: 'endocrine',
    name: 'Endocrine System',
    icon: '🧪',
    color: '#8b5cf6',
    accent: '#7c3aed',
    shortSummary: 'Ductless glandular axis broadcasting hormonal chemical messengers into the bloodstream for long-range systemic regulation.',
    fullOverview: 'Comprises the hypothalamus, pituitary gland, thyroid, parathyroids, adrenals, endocrine pancreas, and gonads. Controls cellular metabolism, circadian rhythms, stress responses, glycemic control, and reproduction via closed-loop feedback mechanisms.',
    primaryFunctions: [
      'Metabolic rate regulation via thyroid hormones T3 and T4',
      'Blood glucose homeostasis via pancreatic insulin and glucagon',
      'Stress and hemodynamic response via adrenal cortisol and catecholamines',
      'Growth, reproductive maturation, and water balance',
    ],
    clinicalPearls: [
      'Cushing syndrome manifests with central obesity, moon facies, abdominal striae, and hypertension from cortisol excess.',
      'Graves disease involves autoimmune TSH-receptor stimulating antibodies causing hyperthyroidism and exophthalmos.',
      'Pheochromocytoma is a tumor of adrenal medulla chromaffin cells causing episodic headaches, sweating, and tachycardia.',
    ],
    highYieldUSMLE: 'Hypothalamic-pituitary axes use negative feedback. Anterior pituitary hormones (FSH, LH, ACTH, TSH, Prolactin, GH: "FLAT PiG") are regulated by hypothalamic releasing factors. Posterior pituitary stores Oxytocin and ADH synthesized in the paraventricular and supraoptic nuclei.',
    sampleStudyNote: `ENDOCRINE AXIS & HORMONAL SIGNALING
The endocrine system coordinates physiological responses over longer timescales compared to synaptic transmission.

1. The Hypothalamic-Pituitary Hub:
- Hypothalamus connects directly to the Anterior Pituitary (Adenohypophysis) through the hypophyseal portal system.
- Posterior Pituitary (Neurohypophysis) consists of axonal terminals from magnocellular neurosecretory cells whose cell bodies reside in the supraoptic (ADH) and paraventricular (oxytocin) nuclei.

2. Thyroid & Parathyroid System:
- Thyroid Follicular Cells: Synthesize thyroglobulin, iodinated by thyroid peroxidase (TPO) to form T3 (triiodothyronine) and T4 (thyroxine).
- Parafollicular C-cells: Produce Calcitonin, which lowers serum calcium by inhibiting osteoclastic resorption.
- Parathyroid Chief Cells: Secrete Parathyroid Hormone (PTH) in response to low ionized calcium, stimulating osteoclasts, renal calcium reabsorption, and activation of 1-alpha-hydroxylase for Vitamin D.`,
    parts: [
      {
        id: 'pituitary',
        name: 'Pituitary Master Gland',
        latinName: 'Hypophysis',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#c084fc',
        position: [0, 1.42, 0.08],
        scale: [0.08, 0.08, 0.08],
        explosionDir: [0, 0.6, 0.4],
        mechanicalRole: 'Master endocrine signal modulation switchboard resting in the sella turcica',
        description: 'Pea-sized gland situated at the base of the skull, directing thyroid, adrenals, and gonads.',
        innervation: 'Hypothalamic neurosecretory projections',
        bloodSupply: 'Superior and inferior hypophyseal arteries',
        commonPathology: 'Pituitary adenoma compressing optic chiasm causing bitemporal hemianopsia',
        highYieldFact: 'Prolactinomas are the most common secretory pituitary adenomas.',
      },
      {
        id: 'thyroid',
        name: 'Thyroid Gland (Butterfly)',
        latinName: 'Glandula thyroidea',
        layer: 'visceral',
        geometryType: 'box',
        color: '#a855f7',
        position: [0, 1.02, 0.12],
        scale: [0.24, 0.14, 0.12],
        explosionDir: [0, 0.3, 0.5],
        mechanicalRole: 'Metabolic accelerator gland adjusting systemic cellular oxygen consumption and temperature',
        description: 'Bi-lobed gland sitting anterior to the trachea below the cricoid cartilage connected by an isthmus.',
        innervation: 'Cervical sympathetic ganglia and recurrent laryngeal nerve proximity',
        bloodSupply: 'Superior thyroid (from external carotid) and inferior thyroid (from thyrocervical trunk) arteries',
        commonPathology: 'Hashimoto thyroiditis (anti-TPO antibodies), Graves disease',
        highYieldFact: 'Thyroid surgery carries risk of injuring the recurrent laryngeal nerve, causing hoarseness.',
      },
      {
        id: 'adrenals',
        name: 'Adrenal Suprarenal Glands',
        latinName: 'Glandulae suprarenales',
        layer: 'visceral',
        geometryType: 'cone',
        color: '#e9d5ff',
        position: [0, 0.28, -0.08],
        scale: [0.38, 0.12, 0.12],
        explosionDir: [0, 0.3, -0.5],
        mechanicalRole: 'Dual-zone emergency stress response and steroid synthesis cap',
        description: 'Pyramidal glands capping each kidney, featuring an outer cortex (zona glomerulosa, fasciculata, reticularis) and inner chromaffin medulla.',
        innervation: 'Preganglionic sympathetic fibers directly synapsing on medullary chromaffin cells',
        bloodSupply: 'Superior, middle, and inferior suprarenal arteries',
        commonPathology: 'Addison primary adrenal insufficiency, Cushing syndrome, Conn primary hyperaldosteronism',
        highYieldFact: 'Remember adrenal cortex layers from outer to inner: Glomerulosa (Aldosterone), Fasciculata (Cortisol), Reticularis (Androgens) - "GFR corresponds to Salt, Sugar, Sex".',
      },
    ],
  },
  {
    id: 'lymphatic',
    name: 'Immune & Lymphatic System',
    icon: '🛡️',
    color: '#10b981',
    accent: '#059669',
    shortSummary: 'Specialized surveillance vascular network reclaiming interstitial fluid and training adaptive and innate immune cells.',
    fullOverview: 'Encompasses primary lymphoid organs (thymus, red bone marrow) and secondary lymphoid tissues (lymph nodes, spleen, tonsils, Peyer patches, appendix). Reclaims 3-4 liters of extravasated capillary lymph daily, passing it through filtration stations teeming with T-cells, B-cells, and macrophages.',
    primaryFunctions: [
      'Interstitial fluid balance returning protein-rich lymph to the venous circulation',
      'Antigen presentation and adaptive immune activation in lymph nodes',
      'Filtration of blood-borne pathogens and clearance of senescent erythrocytes (Spleen)',
      'Dietary lipid transport from intestinal lacteals via the thoracic duct',
    ],
    clinicalPearls: [
      'The spleen’s red pulp filters old RBCs; white pulp houses periarteriolar lymphoid sheaths (PALS) rich in T-cells.',
      'Post-splenectomy patients are at profound risk of encapsulated bacterial sepsis (Streptococcus pneumoniae, Neisseria meningitidis, Haemophilus influenzae).',
      'Virchow node (enlarged left supraclavicular lymph node) classically signals metastatic abdominal malignancy (Troisier sign).',
    ],
    highYieldUSMLE: 'The Thoracic Duct drains lymph from the entire body EXCEPT the right upper quadrant (right side of head, neck, thorax, and right upper extremity, which drain into the Right Lymphatic Duct). It empties into the left venous angle (junction of left internal jugular and subclavian veins).',
    sampleStudyNote: `IMMUNE & LYMPHATIC ARCHITECTURE
The lymphatic system fulfills dual responsibilities: returning interstitial fluid to maintain hemodynamic volume and providing an immunological surveillance network.

1. Primary vs Secondary Lymphoid Organs:
- Bone Marrow: Origin of all hematopoietic precursors and site of B-cell maturation.
- Thymus: Anterior mediastinal organ where T-cells undergo positive selection (cortex: can T-cell receptor bind MHC?) and negative selection (medulla: does it bind self-antigen too strongly?). Undergoes progressive involution after puberty.
- Lymph Nodes: Bean-shaped filters containing an outer cortex (B-cell germinal centers), paracortex (T-cells, site of HEVs and viral swelling), and inner medulla (cords and sinuses containing plasma cells and macrophages).

2. Splenic Microarchitecture:
- White Pulp: Immunological defense. Central arterioles surrounded by T-cell PALS and B-cell follicles.
- Red Pulp: Mechanical erythrocyte quality control. Cords of Billroth and splenic sinusoids test RBC deformability. Spherocytes and sickle cells cannot traverse the narrow endothelial slits, leading to extravascular hemolysis.`,
    parts: [
      {
        id: 'spleen',
        name: 'Splenic Blood Filter',
        latinName: 'Splen / Lien',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#065f46',
        position: [0.24, 0.18, 0.04],
        scale: [0.18, 0.22, 0.16],
        explosionDir: [0.6, 0.2, 0.2],
        mechanicalRole: 'High-efficiency continuous blood filter and erythrocyte quality-assurance sieve',
        description: 'Fist-sized secondary lymphoid organ tucked behind the stomach beneath left ribs 9-11.',
        innervation: 'Celiac plexus',
        bloodSupply: 'Tortuous splenic artery branching off celiac trunk',
        commonPathology: 'Splenic rupture following blunt abdominal trauma or infectious mononucleosis (EBV)',
        highYieldFact: 'Asplenic patients require vaccination against encapsulated organisms: Strep pneumoniae, N. meningitidis, H. influenzae.',
      },
      {
        id: 'lymph_nodes',
        name: 'Major Lymphatic Chains & Nodes',
        latinName: 'Nodi lymphoidei',
        layer: 'nervous_vascular',
        geometryType: 'sphere',
        color: '#34d399',
        position: [0, 0.45, 0.08],
        scale: [0.44, 0.65, 0.14],
        explosionDir: [0, 0, 0.4],
        mechanicalRole: 'Distributed antigen security checkpoints and white-blood-cell clonal selection zones',
        description: 'Chains of cervical, axillary, mediastinal, mesenteric, and inguinal lymph nodes linked by lymphatic vessels.',
        innervation: 'Autonomic vasomotor fibers',
        bloodSupply: 'High endothelial venules (HEVs) facilitating lymphocyte homing',
        commonPathology: 'Hodgkin and non-Hodgkin lymphoma, lymphadenopathy, lymphedema after axillary node dissection',
        highYieldFact: 'The paracortex of lymph nodes contains T cells and undergoes marked hyperplasia during viral infections.',
      },
    ],
  },
  {
    id: 'integumentary',
    name: 'Integumentary System',
    icon: '🧍',
    color: '#f59e0b',
    accent: '#d97706',
    shortSummary: 'Continuous protective bodily envelope consisting of epidermis, dermis, hypodermis, and sensory appendages.',
    fullOverview: 'The skin is the largest organ by surface area (~1.8 m²) and mass (~16% body weight). It acts as an environmental barrier against mechanical abrasion, microbial pathogens, and UV radiation, while housing millions of cutaneous mechanoreceptors and thermoregulatory sweat glands.',
    primaryFunctions: [
      'Physical, microbial, and chemical barrier protection (keratinized stratum corneum)',
      'Thermoregulation via sweat evaporation and arteriovenous anastomoses',
      'Cutaneous somatosensory perception (Merkel discs, Meissner, Pacinian corpuscles)',
      'Ultraviolet-induced photolysis of 7-dehydrocholesterol into Vitamin D3',
    ],
    clinicalPearls: [
      'Rule of Nines estimates total body surface area (TBSA) affected in adult burn resuscitation.',
      'Melanoma ABCD rules: Asymmetry, Border irregularity, Color variegation, Diameter >6mm, Evolving.',
      'Pemphigus vulgaris involves anti-desmoglein-3 antibodies producing flaccid intraepidermal blisters and positive Nikolsky sign.',
    ],
    highYieldUSMLE: 'Epidermal layers from deep to superficial: Stratum Basale (stem cell mitosis, melanocytes), Stratum Spinosum (desmosomes, Langerhans dendritic cells), Stratum Granulosum (keratohyalin granules), Stratum Lucidum (thick skin of palms/soles only), Stratum Corneum (anucleated dead corneocytes). Mnemonic: "Come, Let\'s Get Sun Burned".',
    sampleStudyNote: `INTEGUMENTARY BIOPHYSICS & CUTANEOUS BARRIERS
The skin acts as the dynamic interface between the human organism and the external biosphere.

1. Epidermal Stratification:
- Stratum Basale: Single layer of cuboidal/columnar keratinocyte stem cells attached to the basement membrane via hemidesmosomes. Melanocytes transfer melanin granules to keratinocytes to protect nuclear DNA from ultraviolet mutagenesis.
- Stratum Spinosum: Polyhedral cells bound tightly by desmosomes (spines on light microscopy). Contains Langerhans antigen-presenting dendritic cells.
- Stratum Granulosum: Contains basophilic keratohyalin granules containing profilaggrin and lamellar bodies that exocytose hydrophobic lipid sheets, waterproofing the skin.
- Stratum Corneum: 15-30 layers of dead, flattened, keratin-packed squames providing mechanical and desiccation resistance.

2. Dermal Layer & Sensory Mechanoreceptors:
- Papillary Dermis: Loose collagen and elastin with capillary loops and Meissner corpuscles (light touch/flutter).
- Reticular Dermis: Dense irregular collagen bundles providing tensile strength. Houses Pacinian corpuscles (deep pressure and high-frequency vibration) and Ruffini endings (skin stretch).`,
    parts: [
      {
        id: 'epidermis_silhouette',
        name: 'Translucent Cutaneous Envelope',
        latinName: 'Epidermis et dermis',
        layer: 'integumentary',
        geometryType: 'cylinder',
        color: '#fed7aa',
        opacity: 0.35,
        position: [0, 0.45, 0],
        scale: [0.65, 1.7, 0.45],
        explosionDir: [0, 0, 0.8],
        mechanicalRole: 'Continuous waterproof flexible protective casing and thermal insulation envelope',
        description: 'Outer protective boundary of the body housing epidermis, dermis, skin appendages, and tactile corpuscles.',
        innervation: 'Cutaneous somatic sensory nerves',
        bloodSupply: 'Subpapillary and deep dermal vascular plexuses',
        commonPathology: 'Basal cell carcinoma, squamous cell carcinoma, melanoma, psoriasis',
        highYieldFact: 'Stratum corneum provides the principal physical barrier against microbial penetration.',
      },
    ],
  },
  {
    id: 'female_reproductive',
    name: 'Female Reproductive System',
    icon: '♀',
    color: '#ec4899',
    accent: '#db2777',
    shortSummary: 'Internal reproductive tract and gonads supporting gametogenesis, fertilization, gestation, and parturition.',
    fullOverview: 'Includes paired ovaries, fallopian tubes (uterine tubes), uterus, cervix, and vagina. Governed by the cyclical hypothalamic-pituitary-ovarian axis (GnRH, FSH, LH, Estrogen, Progesterone) directing the menstrual and endometrial cycles.',
    primaryFunctions: [
      'Oogenesis and cyclical release of mature secondary oocytes',
      'Endocrine synthesis of estradiol, progesterone, and inhibin',
      'Site of gamete fertilization (ampulla of fallopian tube)',
      'Embryonic and fetal gestation in muscular uterine wall',
    ],
    clinicalPearls: [
      'Ectopic pregnancy most frequently implants in the ampulla of the fallopian tube.',
      'HPV serotypes 16 and 18 are strongly associated with cervical squamous cell carcinoma.',
      'Endometriosis involves ectopic endometrial glands and stroma outside the uterine cavity.',
    ],
    highYieldUSMLE: 'The LH surge triggers ovulation ~24-36 hours after peak, induced by sustained high estrogen positive feedback from the mature follicle. After ovulation, the ruptured follicle transforms into the corpus luteum, secreting progesterone to prepare the secretory endometrium for implantation.',
    sampleStudyNote: `FEMALE REPRODUCTIVE CYCLE & UTERINE ANATOMY
The female reproductive system is coordinated by cyclical hormonal fluctuations.

1. The Ovarian and Menstrual Cycles:
- Follicular Phase (Days 1-14): Pulsatile GnRH stimulates anterior pituitary FSH and LH. FSH stimulates recruitment of ovarian follicles. Granulosa cells convert theca cell androgens to estradiol via aromatase.
- Ovulation (Day 14): Peak estradiol exerts positive feedback on the pituitary, producing the LH surge. The primary oocyte completes meiosis I and arrests in metaphase of meiosis II as a secondary oocyte.
- Luteal Phase (Days 15-28): Corpus luteum produces high levels of progesterone, rendering the endometrium receptive to blastocyst implantation. In the absence of hCG from a trophoblast, the corpus luteum degenerates into the fibrous corpus albicans, triggering menstruation.`,
    parts: [
      {
        id: 'uterus',
        name: 'Uterus & Cervix',
        latinName: 'Uterus',
        layer: 'visceral',
        geometryType: 'cone',
        color: '#f43f5e',
        position: [0, -0.32, 0.08],
        scale: [0.18, 0.22, 0.16],
        explosionDir: [0, -0.2, 0.4],
        mechanicalRole: 'Thick muscular gestational chamber capable of 500-fold volumetric expansion during pregnancy',
        description: 'Hollow, pear-shaped muscular organ featuring perimetrium, myometrium, and cyclical endometrium.',
        innervation: 'Uterovaginal plexus from inferior hypogastric plexus',
        bloodSupply: 'Uterine artery arising from internal iliac artery, crossing anterior to the ureter ("water under the bridge")',
        commonPathology: 'Uterine leiomyomas (fibroids), cervical intraepithelial neoplasia (CIN), endometrial cancer',
        highYieldFact: 'The ureter passes immediately inferior to the uterine artery in the cardinal (transverse cervical) ligament.',
      },
      {
        id: 'ovaries',
        name: 'Ovaries & Fallopian Tubes',
        latinName: 'Ovaria et tubae uterinae',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#fb7185',
        position: [0, -0.26, 0.06],
        scale: [0.38, 0.09, 0.12],
        explosionDir: [0, 0, 0.4],
        mechanicalRole: 'Primary endocrine gonads and ovum conduit with ciliated fimbriated funnel',
        description: 'Paired female gonads suspended by the suspensory ligament (infundibulopelvic ligament) and ovarian ligament.',
        innervation: 'Ovarian plexus',
        bloodSupply: 'Ovarian arteries originating directly from abdominal aorta',
        commonPathology: 'Ovarian torsion (involves twisting of suspensory ligament), polycystic ovary syndrome (PCOS)',
        highYieldFact: 'Suspensory ligament of the ovary contains the ovarian neurovascular bundle.',
      },
    ],
  },
  {
    id: 'male_reproductive',
    name: 'Male Reproductive System',
    icon: '♂',
    color: '#06b6d4',
    accent: '#0891b2',
    shortSummary: 'Testicular gametogenesis unit and accessory ducts supporting spermatogenesis and testosterone synthesis.',
    fullOverview: 'Includes testes, epididymides, vasa deferentia, seminal vesicles, prostate gland, bulbourethral glands, and penis. Testes require temperatures 2-3°C below core body temperature for optimal spermatogenesis.',
    primaryFunctions: [
      'Spermatogenesis: generation of haploid male gametes',
      'Endocrine synthesis of testosterone by Leydig interstitial cells',
      'Synthesis of seminal fluid and fructose by seminal vesicles and prostate',
      'Erection and ejaculation via autonomic neurovascular mechanics',
    ],
    clinicalPearls: [
      'Varicocele occurs more commonly on the left side due to the left gonadal vein draining at a right angle into the left renal vein.',
      'Benign Prostatic Hyperplasia (BPH) originates in the transition zone, compressing the prostatic urethra.',
      'Prostate cancer predominantly arises in the peripheral posterior zone, palpable on digital rectal examination.',
    ],
    highYieldUSMLE: 'Sertoli cells line the seminiferous tubules, nourish developing sperm, form the blood-testis barrier via tight junctions, and secrete inhibin B to inhibit FSH. Leydig cells reside in the interstitium and secrete testosterone when stimulated by LH.',
    sampleStudyNote: `MALE REPRODUCTIVE ANATOMY & SPERMATOGENESIS
The male reproductive apparatus executes both endocrine steroidogenesis and gamete production.

1. Testicular Thermoregulation & Histology:
- Countercurrent Heat Exchange: The pampiniform venous plexus envelops the testicular artery, extracting heat so arterial blood enters testes cooler than core temperature.
- Dartos & Cremaster Muscles: Contract to elevate testes closer to the pelvic floor in cold environments.
- Seminiferous Tubules: Spermatogonia undergo mitosis and meiosis, supported by Sertoli cells. Mature spermatozoa travel to the Epididymis for 12-14 days to acquire motility.

2. Path of Sperm during Ejaculation (SEVEN UP):
Seminiferous tubules -> Epididymis -> Vas deferens -> Ejaculatory duct -> (Nothing) -> Urethra -> Penis.
Autonomic control of erection and ejaculation:
- "Point and Shoot": Parasympathetic (Pelvic splanchnic S2-S4, nitric oxide-mediated cGMP vasodilation) mediates erection. Sympathetic (Hypogastric T11-L2) mediates emission and ejaculation.`,
    parts: [
      {
        id: 'prostate',
        name: 'Prostate Gland & Seminal Vesicles',
        latinName: 'Prostata',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#0891b2',
        position: [0, -0.42, 0.08],
        scale: [0.16, 0.14, 0.16],
        explosionDir: [0, -0.3, 0.4],
        mechanicalRole: 'Exocrine alkaline fluid synthesis gland and muscular ejaculatory sphincter crossroads',
        description: 'Walnut-sized glandular organ encircling the urethra at the base of the bladder.',
        innervation: 'Prostatic plexus (cavernous nerves branch off to erectile tissue)',
        bloodSupply: 'Inferior vesical and middle rectal arteries',
        commonPathology: 'BPH, prostate adenocarcinoma (elevated serum PSA), prostatitis',
        highYieldFact: 'Prostatectomy can injure cavernous nerves passing adjacent to the prostatic capsule, leading to erectile dysfunction.',
      },
      {
        id: 'testes',
        name: 'Testes & Epididymis',
        latinName: 'Testes',
        layer: 'visceral',
        geometryType: 'sphere',
        color: '#22d3ee',
        position: [0, -0.58, 0.12],
        scale: [0.18, 0.16, 0.14],
        explosionDir: [0, -0.4, 0.5],
        mechanicalRole: 'Thermally isolated continuous sperm manufacturing facility and testosterone synthesis factory',
        description: 'Paired male gonads housed outside the peritoneal cavity in the scrotum.',
        innervation: 'Testicular plexus (T10 sympathetics)',
        bloodSupply: 'Testicular arteries from abdominal aorta; pampiniform venous plexus',
        commonPathology: 'Testicular torsion (surgical emergency), seminoma, hydrocele',
        highYieldFact: 'Lymphatic drainage from testes goes directly to para-aortic (retroperitoneal) lymph nodes, not inguinal nodes.',
      },
    ],
  },
];
