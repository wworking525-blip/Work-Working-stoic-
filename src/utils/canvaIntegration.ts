export interface CanvaAccountProfile {
  email: string;
  connected: boolean;
  name: string;
  accountType: 'Personal' | 'Canva Pro' | 'Canva for Education' | 'Canva Enterprise';
  workspaceName: string;
  connectedSince: string;
  autoSyncDrawings: boolean;
  exportFormat: 'png' | 'pdf' | 'svg';
  canvasLmsUrl?: string;
  canvasLmsConnected?: boolean;
}

export interface CanvasLmsCourse {
  id: string;
  code: string;
  name: string;
  term: string;
  moduleCount: number;
  filesCount: number;
  syllabusSnippet: string;
  sampleLectureNote: string;
}

export const DEFAULT_CANVA_PROFILE: CanvaAccountProfile = {
  email: 'saiarts9848@gmail.com',
  connected: true,
  name: 'Dr. Sai Arts',
  accountType: 'Canva for Education',
  workspaceName: 'Sai Medical Arts & Anatomy Lab',
  connectedSince: 'Nov 2026',
  autoSyncDrawings: true,
  exportFormat: 'png',
  canvasLmsUrl: 'https://canvas.instructure.com',
  canvasLmsConnected: true,
};

export const MOCK_CANVAS_LMS_COURSES: CanvasLmsCourse[] = [
  {
    id: 'lms-anat-501',
    code: 'ANAT-501',
    name: 'Gross Human Anatomy & Embryology',
    term: 'Fall 2026',
    moduleCount: 14,
    filesCount: 42,
    syllabusSnippet: 'Comprehensive cadaveric dissection, axial skeleton biomechanics, brachial plexus innervation, and abdominopelvic viscera.',
    sampleLectureNote: `WEEK 4: BRACHIAL PLEXUS & UPPER EXTREMITY INNERVATION
Roots: Ventral rami of C5-T1.
Trunks:
- Superior Trunk (C5, C6): Damage precipitates Erb-Duchenne palsy ("waiter's tip" posture - arm adducted, internally rotated, elbow extended).
- Middle Trunk (C7): Continues as posterior division.
- Inferior Trunk (C8, T1): Traction trauma leads to Klumpke palsy (intrinsic hand clawing, Horner syndrome if sympathetic chain injured).

Axillary Nerve (C5, C6): Winds around surgical neck of humerus. Supplies deltoid (abduction 15-90 degrees) and teres minor.
Radial Nerve (C5-T1): Traverses radial groove of humerus. Supplies triceps, brachioradialis, wrist extensors. Fractures of humeral midshaft cause wrist drop.
Median Nerve (C5-T1): Passes through pronator teres and carpal tunnel under transverse carpal ligament.
Ulnar Nerve (C8-T1): Traverses cubital tunnel behind medial epicondyle. Innervates hypothenar muscles, adductor pollicis, interossei.`,
  },
  {
    id: 'lms-path-602',
    code: 'PATH-602',
    name: 'Systemic Pathology & Cardiovascular Disease',
    term: 'Fall 2026',
    moduleCount: 12,
    filesCount: 38,
    syllabusSnippet: 'Atherosclerosis pathogenesis, ischemic heart disease, valvular stenosis, cardiac remodeling, and Windkessel biomechanics.',
    sampleLectureNote: `WEEK 6: VALVULAR HEART DISEASE & PRESSURE-VOLUME LOOPS
1. Aortic Stenosis:
- Etiology: Age-related calcification, bicuspid aortic valve.
- Hemodynamics: High peak systolic transvalvular gradient (>40 mmHg). Concentric left ventricular hypertrophy.
- Auscultation: Harsh crescendo-decrescendo systolic murmur at right 2nd intercostal space radiating to carotids. Pulsus parvus et tardus.

2. Mitral Regurgitation:
- Etiology: Mitral valve prolapse, ischemic papillary muscle rupture (posteromedial papillary muscle single supply from PDA).
- Hemodynamics: Systolic regurgitation into left atrium -> left ventricular volume overload -> eccentric hypertrophy.
- Auscultation: Holosystolic blowing murmur radiating to left axilla.

3. Aortic Regurgitation:
- Widened pulse pressure, water-hammer pulses, Corrigan sign. Diastolic decrescendo murmur.`,
  },
  {
    id: 'lms-phys-503',
    code: 'PHYS-503',
    name: 'Medical Physiology & Biomechanical Levers',
    term: 'Fall 2026',
    moduleCount: 10,
    filesCount: 29,
    syllabusSnippet: 'Biomechanical lever systems in human kinematics, cardiac pressure dynamics, renal countercurrent multipliers, and respiratory compliance.',
    sampleLectureNote: `WEEK 2: BIOMECHANICAL LEVERS IN HUMAN ANATOMY
Class 1 Lever (Fulcrum in middle):
- Anatomical exemplar: Atlanto-occipital joint (head extension).
- Effort: Posterior neck muscles (Splenius capitis, Trapezius).
- Fulcrum: Atlanto-occipital condyles.
- Load: Weight of facial skeleton anterior to fulcrum.

Class 2 Lever (Load in middle):
- Anatomical exemplar: Plantarflexion at metatarsophalangeal joints (standing on tiptoes).
- Fulcrum: Metatarsal heads.
- Load: Entire body weight transmitted via tibia.
- Effort: Gastrocnemius and soleus contracting via Achilles tendon.
- Mechanical Advantage: Always > 1.0 (magnifies force).

Class 3 Lever (Effort in middle):
- Anatomical exemplar: Elbow flexion via Biceps brachii.
- Fulcrum: Humero-ulnar elbow joint.
- Effort: Biceps insertion on radial tuberosity.
- Load: Weight in hand.
- Mechanical Advantage: Always < 1.0 (trades force for angular velocity and range of motion).`,
  },
];

export function getStoredCanvaProfile(): CanvaAccountProfile {
  try {
    const raw = localStorage.getItem('medstudy_canva_account');
    if (raw) return { ...DEFAULT_CANVA_PROFILE, ...JSON.parse(raw) };
  } catch (e) {}
  return DEFAULT_CANVA_PROFILE;
}

export function saveStoredCanvaProfile(profile: CanvaAccountProfile): void {
  try {
    localStorage.setItem('medstudy_canva_account', JSON.stringify(profile));
  } catch (e) {}
}

export function generateCanvaExportUrl(type: 'whiteboard' | 'infographic' | 'flashcards' | 'presentation', title: string): string {
  const encodedTitle = encodeURIComponent(`MedStudy - ${title}`);
  // Canva deep link for creating or opening design templates
  return `https://www.canva.com/search?q=${encodeURIComponent(type + ' ' + title)}`;
}

export function formatCanvaStudyExport(
  title: string,
  type: string,
  material: string,
  drawingImageBase64?: string
) {
  return {
    appName: 'MedStudy STOIC',
    account: 'saiarts9848@gmail.com',
    exportedAt: new Date().toISOString(),
    title,
    type,
    textLength: material.length,
    hasDrawing: Boolean(drawingImageBase64),
    summary: material.slice(0, 300),
  };
}
