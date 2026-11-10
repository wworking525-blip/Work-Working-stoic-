import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMaterialForMCQs } from './fileExtractor.ts';

test('validateMaterialForMCQs detects empty or whitespace-only inputs', () => {
  const resultEmpty = validateMaterialForMCQs('');
  assert.equal(resultEmpty.valid, false);

  const resultSpaces = validateMaterialForMCQs('   \n\t  ');
  assert.equal(resultSpaces.valid, false);
});

test('validateMaterialForMCQs flags inputs that are too short for MCQs', () => {
  const shortText = 'Heart pumps blood.';
  const result = validateMaterialForMCQs(shortText);
  assert.equal(result.valid, false);
  assert.equal(result.wordCount, 3);
});

test('validateMaterialForMCQs approves sufficient medical note texts', () => {
  const clinicalNote = `
    The sinoatrial (SA) node is the primary pacemaker of the human heart located in the right atrium.
    Action potentials propagate across the internodal tracts to the atrioventricular (AV) node,
    followed by the bundle of His, left and right bundle branches, and Purkinje fibers.
  `;
  const result = validateMaterialForMCQs(clinicalNote);
  assert.equal(result.valid, true);
  assert.equal(result.wordCount > 20, true);
});
