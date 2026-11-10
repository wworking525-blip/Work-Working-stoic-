import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractClinicalThemes,
  generateVisualStoryboard,
} from './videoExplanationEngine';

test('extractClinicalThemes correctly flags cardiac terms', () => {
  const cardiacNote = 'The left ventricle pumps against high systemic vascular resistance and coronary blood flow occurs in diastole.';
  const themes = extractClinicalThemes(cardiacNote);
  assert.equal(themes.isCardiac, true);
  assert.equal(themes.detectedTerms.includes('Cardiovascular Hemodynamics'), true);
});

test('extractClinicalThemes correctly flags pulmonary respiratory terms', () => {
  const respNote = 'Type II pneumocytes secrete pulmonary surfactant reducing surface tension and preventing alveolar atelectasis.';
  const themes = extractClinicalThemes(respNote);
  assert.equal(themes.isRespiratory, true);
  assert.equal(themes.detectedTerms.includes('Pulmonary Gas Exchange'), true);
});

test('generateVisualStoryboard builds 4 cinematic scenes with valid timing', () => {
  const note = 'The left ventricle generates 120 mmHg of systolic force. The ascending aorta acts as an elastic Windkessel buffer. Loss of compliance leads to subendocardial ischemia. Reassembly preserves homeostatic perfusion.';
  const storyboard = generateVisualStoryboard(note, 'Left Ventricle Hemodynamics');

  assert.equal(storyboard.scenes.length, 4);
  assert.equal(storyboard.totalDurationSeconds > 40, true);
  assert.equal(storyboard.videoTitle, 'Left Ventricle Hemodynamics');

  // Verify camera coordinates and scene structure
  storyboard.scenes.forEach((scene, index) => {
    assert.equal(scene.sceneNumber, index + 1);
    assert.equal(scene.cameraPosition.length, 3);
    assert.equal(scene.cameraTarget.length, 3);
    assert.equal(scene.durationSeconds > 10, true);
    assert.equal(scene.visualCallouts.length >= 1, true);
    assert.equal(scene.subtitles.length >= 2, true);
  });
});

test('generateVisualStoryboard embeds verified verbatim quote evidence', () => {
  const testQuote = 'Type II pneumocytes synthesize dipalmitoylphosphatidylcholine preventing atelectasis.';
  const note = `Clinical Pulmonology: ${testQuote} Fick's law dictates diffusion limits across the membrane.`;
  const storyboard = generateVisualStoryboard(note, 'Pulmonology');

  const allCallouts = storyboard.scenes.flatMap(s => s.visualCallouts);
  const foundVerified = allCallouts.some(c => c.isVerified);
  assert.equal(foundVerified, true);
});

test('generateVisualStoryboard calculates appropriate explosion and camera vectors', () => {
  const note = 'Axial spine compresses under gravity. Class 3 levers dominate extremity articulation. Decussation occurs at medullary pyramids.';
  const storyboard = generateVisualStoryboard(note);

  // Scene 1 should have minimal explosion (macro view)
  assert.equal(storyboard.scenes[0].explosionLevel <= 0.2, true);
  // Scene 2 should dispatch layers (internal inspection)
  assert.equal(storyboard.scenes[1].explosionLevel >= 0.5, true);
  // Scene 4 should re-assemble the structure
  assert.equal(storyboard.scenes[3].explosionLevel, 0.0);
});
