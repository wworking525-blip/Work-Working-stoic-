export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  points: number; // Charging points / Study XP
  streakDays: number;
  studyHoursTotal: number;
  completedQuizzes: number;
  accuracyRate: number;
  isAuthenticated: boolean;
  isPro?: boolean;
  tier?: 'free' | 'pro' | 'institutional';
  subscriptionExpiry?: string;
}

export interface GoogleNoteItem {
  id: string;
  title: string;
  content: string;
  category: 'Anatomy' | 'Physiology' | 'Pathology' | 'Pharmacology' | 'High-Yield';
  color: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface PastExam {
  id: string;
  title: string;
  system: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
  status: 'Mastered' | 'Review Needed' | 'Passed';
  badgeColor: string;
}

export interface StudyScheduleItem {
  id: string;
  time: string;
  title: string;
  topic: string;
  instructor: string;
  instructorAvatar?: string;
  duration: string;
  status: 'active' | 'upcoming' | 'completed';
  type: '3D Lab' | 'Interactive Q&A' | 'Clinical Case';
}

const DEFAULT_USER: UserProfile = {
  id: 'usr-1',
  name: 'Dr. Sai',
  email: 'saiarts9848@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  title: 'USMLE Step 1 Candidate • Clinical Anatomy',
  points: 329, // Matches screenshot 329 charging points!
  streakDays: 14,
  studyHoursTotal: 48.5,
  completedQuizzes: 34,
  accuracyRate: 88,
  isAuthenticated: true,
  isPro: false,
  tier: 'free',
};

const DEFAULT_GOOGLE_NOTES: GoogleNoteItem[] = [
  {
    id: 'gnote-1',
    title: 'Cardiology Ward Notes: Heart Murmurs & Valvular Mechanics',
    category: 'Physiology',
    color: '#fee2e2',
    updatedAt: '2 hours ago',
    pinned: true,
    content: `Systolic Murmurs:
1. Aortic Stenosis: Crescendo-decrescendo systolic ejection murmur radiating to carotids. Parvus et tardus (weak, delayed carotid pulses).
2. Mitral Regurgitation: Holosystolic, high-pitched "blowing" murmur radiating to left axilla. S3 common due to volume overload.
3. Mitral Valve Prolapse: Late systolic crescendo murmur with midsystolic click (due to sudden tensing of chordae tendineae).

Diastolic Murmurs:
1. Aortic Regurgitation: Early decrescendo, high-pitched diastolic blowing murmur. Wide pulse pressure and bounding pulses (water-hammer pulse).
2. Mitral Stenosis: Opening snap followed by mid-to-late diastolic rumbling murmur loudest at cardiac apex in left lateral decubitus position.`,
  },
  {
    id: 'gnote-2',
    title: 'Anatomy Lab: Brachial Plexus Levers & Nerve Roots',
    category: 'Anatomy',
    color: '#e0e7ff',
    updatedAt: 'Yesterday',
    pinned: true,
    content: `Roots: C5, C6, C7, C8, T1.
Trunks: Superior (C5-C6), Middle (C7), Inferior (C8-T1).
Divisions: Anterior (flexors) and Posterior (extensors).
Cords: Lateral, Posterior, Medial.

High-Yield Lesions:
- Erb-Duchenne palsy: Upper trunk (C5-C6) tear during delivery or motorcycle traction trauma -> "Waiter's tip" hand (adducted shoulder, medially rotated arm, extended elbow).
- Klumpke palsy: Lower trunk (C8-T1) traction injury (grabbing branch while falling) -> Total claw hand (lumbricals paralyzed).
- Radial nerve injury: Saturday night palsy / midshaft humeral fracture -> Wrist drop.`,
  },
  {
    id: 'gnote-3',
    title: 'Renal Countercurrent Multiplier & SGLT2 Pharmacology',
    category: 'Pharmacology',
    color: '#fef3c7',
    updatedAt: 'Nov 4, 2026',
    content: `Countercurrent multiplication:
1. Descending limb of Henle: Permeable to H2O, impermeable to solutes -> Fluid becomes hyperosmolar down to 1200 mOsm/kg.
2. Thick ascending limb: Impermeable to H2O, actively reabsorbs Na-K-2Cl (inhibited by Furosemide). Dilutes luminal fluid.
3. SGLT2 Inhibitors (Empagliflozin, Dapagliflozin): Block proximal tubular sodium-glucose cotransporter 2. Induce glycosuria, lower HbA1c, promote weight loss, and exert powerful cardioprotective and nephroprotective benefits in heart failure.`,
  },
  {
    id: 'gnote-4',
    title: 'Hypothalamic-Pituitary Hormonal Feedback Loops',
    category: 'High-Yield',
    color: '#f3e8ff',
    updatedAt: 'Nov 2, 2026',
    content: `Anterior Pituitary Hormones (FLAT PiG):
FSH, LH, ACTH, TSH (Basophils, cyclic AMP)
Prolactin, GH (Acidophils)

Negative feedback control:
- TRH -> TSH -> T3/T4 (inhibits both TRH and TSH).
- CRH -> ACTH -> Cortisol (inhibits CRH and ACTH).
- GnRH -> LH/FSH -> Sex steroids (pulsatile release stimulates, continuous release suppresses LH/FSH).`,
  },
];

const DEFAULT_PAST_EXAMS: PastExam[] = [
  {
    id: 'exam-1',
    title: 'Skeletal Superstructure & Biomechanics',
    system: 'Skeletal System',
    score: 47,
    total: 50,
    percentage: 94,
    date: 'Today, 10:30 AM',
    status: 'Mastered',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'exam-2',
    title: 'Cardiovascular Hemodynamics & Valve Mechanics',
    system: 'Cardiovascular',
    score: 22,
    total: 25,
    percentage: 88,
    date: 'Yesterday',
    status: 'Mastered',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'exam-3',
    title: 'Neuroanatomy: Spinal Tracts & Cranial Nerves',
    system: 'Nervous System',
    score: 45,
    total: 50,
    percentage: 90,
    date: 'Nov 4, 2026',
    status: 'Mastered',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'exam-4',
    title: 'Renal Acid-Base & Countercurrent Gradient',
    system: 'Urinary System',
    score: 18,
    total: 25,
    percentage: 72,
    date: 'Nov 2, 2026',
    status: 'Review Needed',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
];

const DEFAULT_SCHEDULE: StudyScheduleItem[] = [
  {
    id: 'sch-1',
    time: '12:00 PM - 1:15 PM',
    title: 'History of Physics & Biomechanics',
    topic: 'Lever classes, moment of inertia & musculoskeletal physics',
    instructor: 'Prof. Aalvina Fatehi Islam',
    instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    duration: 'Live in 45 min',
    status: 'active',
    type: '3D Lab',
  },
  {
    id: 'sch-2',
    time: '2:30 PM - 3:45 PM',
    title: 'Cardiovascular 3D Assembly & Valve Mechanics',
    topic: 'Myocardial fiber orientation, coronary perfusion & aortic root',
    instructor: 'Dr. Alex & Dr. Taylor',
    duration: 'Upcoming',
    status: 'upcoming',
    type: 'Interactive Q&A',
  },
  {
    id: 'sch-3',
    time: '5:00 PM - 6:00 PM',
    title: 'USMLE Step 1 Clinical Vignette Marathon',
    topic: '50 rapid-fire clinical cases with evidence verification',
    instructor: 'STOIC Medical Faculty',
    duration: 'Upcoming',
    status: 'upcoming',
    type: 'Clinical Case',
  },
];

export function loadUserFromStorage(): UserProfile {
  try {
    const raw = localStorage.getItem('stoic_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_USER;
}

export function saveUserToStorage(user: UserProfile) {
  try {
    localStorage.setItem('stoic_user', JSON.stringify(user));
  } catch (e) {}
}

export function loadGoogleNotesFromStorage(): GoogleNoteItem[] {
  try {
    const raw = localStorage.getItem('stoic_google_notes');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_GOOGLE_NOTES;
}

export function saveGoogleNotesToStorage(notes: GoogleNoteItem[]) {
  try {
    localStorage.setItem('stoic_google_notes', JSON.stringify(notes));
  } catch (e) {}
}

export function loadPastExamsFromStorage(): PastExam[] {
  try {
    const raw = localStorage.getItem('stoic_past_exams');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_PAST_EXAMS;
}

export function loadSchedule(): StudyScheduleItem[] {
  return DEFAULT_SCHEDULE;
}
