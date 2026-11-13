export interface MuscleGroupMeta {
  name: string;
  area: string;
  latin: string;
}

export interface ManifestRegion {
  id: string;
  muscle: string;
  region: string;
  label: string;
  side: 'left' | 'right' | 'midline';
  meshNames: string[];
  focus: {
    target: [number, number, number];
    direction: [number, number, number];
  };
  sourceName?: string;
}

export interface ManifestJoint {
  id: string;
  label: string;
  position: [number, number, number];
}

export interface AnatomyAtlasManifest {
  version: number;
  model: {
    id: string;
    label: string;
    url: string;
  };
  regions: ManifestRegion[];
  joints?: ManifestJoint[];
}

export interface ExerciseMediaRecord {
  sourceId: string;
  sourceName: string;
  match: string;
  images: string[];
}

export interface ExerciseRecord {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string;
  steps: string[];
  media?: ExerciseMediaRecord;
  match?: 'primary' | 'secondary';
}

export interface ExerciseCatalog {
  version: number;
  source?: {
    revision?: string;
  };
  exercises: ExerciseRecord[];
}

export interface ExerciseMediaManifest {
  version: number;
  source?: {
    revision?: string;
  };
  exercises: Record<string, ExerciseMediaRecord>;
}

export const MUSCLE_GROUPS: Record<string, MuscleGroupMeta> = {
  chest: { name: 'Pectorals', area: 'Chest', latin: 'Pectoralis major' },
  'front-shoulders': { name: 'Deltoids · anterior', area: 'Shoulder', latin: 'Deltoideus' },
  'rear-shoulders': {
    name: 'Posterior shoulder',
    area: 'Shoulder and scapula',
    latin: 'Deltoid and scapular muscles',
  },
  biceps: { name: 'Upper arm flexors', area: 'Upper arm · anterior', latin: 'Biceps brachii and brachialis' },
  triceps: { name: 'Triceps', area: 'Upper arm · posterior', latin: 'Triceps brachii' },
  forearms: { name: 'Forearm muscles', area: 'Forearm', latin: 'Flexor and extensor compartments' },
  abdominals: { name: 'Rectus abdominis', area: 'Abdominal wall', latin: 'Rectus abdominis' },
  obliques: { name: 'External obliques', area: 'Lateral abdominal wall', latin: 'Obliquus externus abdominis' },
  traps: { name: 'Upper trapezius', area: 'Neck and upper back', latin: 'Trapezius · descending fibres' },
  'traps-middle': {
    name: 'Mid & lower trapezius',
    area: 'Upper and middle back',
    latin: 'Trapezius · transverse and ascending fibres',
  },
  lats: { name: 'Latissimus dorsi', area: 'Back', latin: 'Latissimus dorsi' },
  lowerback: { name: 'Spinal erectors', area: 'Lower back', latin: 'Erector spinae' },
  glutes: { name: 'Gluteal muscles', area: 'Hip', latin: 'Gluteus maximus and medius' },
  quads: { name: 'Quadriceps', area: 'Thigh · anterior', latin: 'Quadriceps femoris' },
  adductors: { name: 'Adductors', area: 'Thigh · medial', latin: 'Adductor longus and gracilis' },
  hamstrings: { name: 'Hamstrings', area: 'Thigh · posterior', latin: 'Posterior thigh compartment' },
  tibialis: { name: 'Tibialis anterior', area: 'Lower leg · anterior', latin: 'Tibialis anterior' },
  calves: { name: 'Calf muscles', area: 'Lower leg · posterior', latin: 'Gastrocnemius and soleus' },
};

export const ATLAS_SIDE_LABELS: Record<'left' | 'right' | 'midline', string> = {
  left: 'Left',
  right: 'Right',
  midline: 'Midline',
};

const EXERCISE_MAPPINGS: Record<string, { primary: string[]; secondary: string[]; note?: string }> = {
  chest: { primary: ['pectorals'], secondary: ['chest', 'upper chest'] },
  'front-shoulders': {
    primary: ['delts'],
    secondary: ['deltoids', 'shoulders'],
    note: 'The dataset uses general deltoid and shoulder labels; matches apply to either side.',
  },
  'rear-shoulders': {
    primary: [],
    secondary: ['rear deltoids', 'rotator cuff'],
    note: 'Identifies rear deltoids and rotator cuff muscles as secondary targets.',
  },
  biceps: { primary: ['biceps'], secondary: ['biceps', 'brachialis'] },
  triceps: { primary: ['triceps'], secondary: ['triceps'] },
  forearms: {
    primary: ['forearms'],
    secondary: ['forearms', 'wrist flexors', 'wrist extensors', 'grip muscles'],
  },
  abdominals: { primary: ['abs'], secondary: ['abdominals', 'lower abs'] },
  obliques: {
    primary: [],
    secondary: ['obliques'],
    note: 'Lists obliques as secondary stabilizers across lateral/rotational exercises.',
  },
  traps: {
    primary: ['traps'],
    secondary: ['traps', 'trapezius'],
    note: 'Groups upper, middle, and lower trapezius fibres together.',
  },
  'traps-middle': {
    primary: ['traps'],
    secondary: ['traps', 'trapezius'],
    note: 'Groups upper, middle, and lower trapezius fibres together.',
  },
  lats: { primary: ['lats'], secondary: ['lats', 'latissimus dorsi'] },
  lowerback: {
    primary: ['spine'],
    secondary: ['lower back'],
    note: 'Uses spine and lower-back tags across spinal erectors.',
  },
  glutes: { primary: ['glutes'], secondary: ['glutes'] },
  quads: { primary: ['quads'], secondary: ['quadriceps'] },
  adductors: { primary: ['adductors'], secondary: ['inner thighs'] },
  hamstrings: { primary: ['hamstrings'], secondary: ['hamstrings'] },
  tibialis: {
    primary: [],
    secondary: [],
    note: 'No exercises in the Free Exercise DB dataset are explicitly tagged for tibialis anterior.',
  },
  calves: { primary: ['calves'], secondary: ['calves', 'soleus'] },
};

const normalized = (val: string) => String(val || '').trim().toLowerCase();

export function getMuscleExerciseInfo(muscleId: string): { note: string; aliases: string[] } {
  const mapping = EXERCISE_MAPPINGS[muscleId];
  return {
    note:
      mapping?.note ||
      'Matches use dataset muscle tags across both sides for clinical & biomechanical study.',
    aliases: mapping ? [...new Set([...mapping.primary, ...mapping.secondary])] : [],
  };
}

export function bindExerciseMedia(
  catalog: ExerciseCatalog,
  manifest: ExerciseMediaManifest
): ExerciseCatalog {
  return {
    ...catalog,
    exercises: catalog.exercises
      .filter((exercise) => Object.prototype.hasOwnProperty.call(manifest.exercises, exercise.id))
      .map((exercise) => ({
        ...exercise,
        media: manifest.exercises[exercise.id],
      })),
  };
}

export function getExercisesForMuscle(
  catalog: ExerciseCatalog | null,
  muscleId: string,
  options: { query?: string; equipment?: string; relationship?: 'all' | 'primary' | 'secondary' } = {}
): ExerciseRecord[] {
  if (!catalog) return [];
  const mapping = EXERCISE_MAPPINGS[muscleId];
  if (!mapping) return [];

  const { query = '', equipment = 'all', relationship = 'all' } = options;
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  const equipmentKey = normalized(equipment);

  return catalog.exercises
    .flatMap((exercise) => {
      const match: 'primary' | 'secondary' | null = mapping.primary.includes(normalized(exercise.target))
        ? 'primary'
        : exercise.secondaryMuscles.some((name) => mapping.secondary.includes(normalized(name)))
          ? 'secondary'
          : null;

      if (
        !match ||
        (relationship !== 'all' && relationship !== match) ||
        (equipmentKey && equipmentKey !== 'all' && normalized(exercise.equipment) !== equipmentKey)
      ) {
        return [];
      }

      const haystack = normalized(
        `${exercise.name} ${exercise.equipment} ${exercise.target} ${exercise.secondaryMuscles.join(' ')}`
      );
      if (!terms.every((term) => haystack.includes(term))) {
        return [];
      }

      return [{ ...exercise, match }];
    })
    .sort((a, b) => {
      if (a.match !== b.match) return a.match === 'primary' ? -1 : 1;
      return a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id);
    });
}

export function filterRegionsByQuery(
  regions: ManifestRegion[],
  query: string
): Set<string> | null {
  const q = normalized(query);
  if (!q) return null;
  const matches = new Set<string>();
  for (const region of regions) {
    const group = MUSCLE_GROUPS[region.muscle];
    const haystack = `${group?.name || ''} ${group?.area || ''} ${group?.latin || ''} ${region.label}`.toLowerCase();
    if (haystack.includes(q)) {
      matches.add(region.id);
    }
  }
  return matches;
}
