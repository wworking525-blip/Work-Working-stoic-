import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MUSCLE_GROUPS,
  bindExerciseMedia,
  getExercisesForMuscle,
  filterRegionsByQuery,
  ExerciseCatalog,
  ExerciseMediaManifest,
  ManifestRegion,
} from './muscularAtlasData.ts';

describe('muscularAtlasData', () => {
  it('defines all 18 anatomical muscle groups with Latin nomenclature', () => {
    assert.equal(Object.keys(MUSCLE_GROUPS).length, 18);
    assert.equal(MUSCLE_GROUPS.chest.latin, 'Pectoralis major');
    assert.equal(MUSCLE_GROUPS.quads.area, 'Thigh · anterior');
  });

  it('binds exercise media and filters exercises cleanly by primary/secondary role', () => {
    const catalog: ExerciseCatalog = {
      version: 1,
      exercises: [
        {
          id: '001',
          name: 'Barbell Bench Press',
          category: 'strength',
          equipment: 'barbell',
          target: 'pectorals',
          secondaryMuscles: ['triceps', 'shoulders'],
          instructions: 'Press barbell upward.',
          steps: ['Lie on bench', 'Press up'],
        },
        {
          id: '002',
          name: 'Push-Up',
          category: 'strength',
          equipment: 'body weight',
          target: 'pectorals',
          secondaryMuscles: ['triceps', 'abs'],
          instructions: 'Push body up.',
          steps: ['Plank', 'Push'],
        },
      ],
    };

    const media: ExerciseMediaManifest = {
      version: 1,
      exercises: {
        '001': {
          sourceId: 'Barbell_Bench_Press',
          sourceName: 'Barbell Bench Press',
          match: 'normalized-name',
          images: ['/assets/exercises/media/Barbell_Bench_Press/0.jpg'],
        },
      },
    };

    const bound = bindExerciseMedia(catalog, media);
    assert.equal(bound.exercises.length, 1);
    assert.equal(bound.exercises[0].id, '001');

    const chestMatches = getExercisesForMuscle(catalog, 'chest');
    assert.equal(chestMatches.length, 2);
    assert.equal(chestMatches[0].match, 'primary');

    const tricepsMatches = getExercisesForMuscle(catalog, 'triceps', { relationship: 'secondary' });
    assert.equal(tricepsMatches.length, 2);
    assert.equal(tricepsMatches[0].match, 'secondary');
  });

  it('filters regions by Latin or English search query', () => {
    const regions: ManifestRegion[] = [
      {
        id: 'pec-left',
        muscle: 'chest',
        region: 'pec',
        label: 'Clavicular head of pectoralis major muscle',
        side: 'left',
        meshNames: ['m1'],
        focus: { target: [0, 1, 0], direction: [0, 0, 1] },
      },
      {
        id: 'quad-left',
        muscle: 'quads',
        region: 'quad',
        label: 'Rectus femoris muscle',
        side: 'left',
        meshNames: ['m2'],
        focus: { target: [0, 0.5, 0], direction: [0, 0, 1] },
      },
    ];

    const hits = filterRegionsByQuery(regions, 'rectus femoris');
    assert.ok(hits);
    assert.equal(hits.size, 1);
    assert.equal(hits.has('quad-left'), true);
  });
});
