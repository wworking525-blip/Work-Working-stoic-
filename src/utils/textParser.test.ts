import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, verifyEvidenceInText, calculateTextStats } from './textParser.ts';

test('normalizeText cleans punctuation and normalizes spaces', () => {
  const input = 'The Heart (cor) pumps oxygenated blood; through the Aorta!';
  const expected = 'the heart cor pumps oxygenated blood through the aorta';
  assert.equal(normalizeText(input), expected);
});

test('verifyEvidenceInText correctly verifies exact quotes', () => {
  const source = 'The left ventricle pumps oxygenated blood into the systemic circulation via the ascending aorta.';
  const quote = 'pumps oxygenated blood into the systemic circulation';
  const result = verifyEvidenceInText(source, quote);
  assert.equal(result.verified, true);
  assert.equal(result.matchRatio, 1.0);
});

test('verifyEvidenceInText handles case and punctuation differences', () => {
  const source = 'The Sinoatrial (SA) node is the physiological pacemaker of the human heart.';
  const quote = 'sinoatrial sa node is the physiological pacemaker';
  const result = verifyEvidenceInText(source, quote);
  assert.equal(result.verified, true);
});

test('verifyEvidenceInText rejects fabricated evidence not in text', () => {
  const source = 'The thyroid gland secretes T3 and T4 hormones regulating basal metabolic rate.';
  const quote = 'The pancreas produces glucagon from alpha cells in the islets of Langerhans';
  const result = verifyEvidenceInText(source, quote);
  assert.equal(result.verified, false);
});

test('calculateTextStats computes word count and reading time', () => {
  const sample = 'Word '.repeat(400);
  const stats = calculateTextStats(sample);
  assert.equal(stats.words, 400);
  assert.equal(stats.readTimeMin, 2);
});
