import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  answerGroundedQuestionLocally,
  extractKeywords,
  verifyCitationInMaterial,
  splitIntoSentences
} from './groundedQA.ts';
import {
  generateFirstPrinciples,
  generateSimplifiedExplanation,
  generatePodcastScript,
  generateMCQSet
} from './medicalEngine.ts';

describe('groundedQA helper algorithms', () => {
  const sampleText = 'The left ventricle has the thickest muscular wall in the human heart. It pumps oxygen-rich blood into the aorta at high systemic pressure.';

  it('extracts non-stopword keywords from clinical query', () => {
    const kws = extractKeywords('Which chamber has the thickest muscular wall?');
    assert.ok(kws.includes('chamber'));
    assert.ok(kws.includes('thickest'));
    assert.ok(kws.includes('muscular'));
    assert.ok(kws.includes('wall'));
    assert.ok(!kws.includes('the'));
    assert.ok(!kws.includes('has'));
  });

  it('verifies exact quote matches in material', () => {
    const verified = verifyCitationInMaterial(
      sampleText,
      'The left ventricle has the thickest muscular wall in the human heart.'
    );
    assert.equal(verified, true);

    const nonExistent = verifyCitationInMaterial(sampleText, 'The pulmonary artery branches into bronchi');
    assert.equal(nonExistent, false);
  });

  it('splits text into sentences with start and end offsets', () => {
    const sentences = splitIntoSentences(sampleText);
    assert.equal(sentences.length, 2);
    assert.ok(sentences[0].sentence.includes('left ventricle'));
    assert.equal(sentences[0].start, 0);
  });

  it('answers questions locally with citations when content matches', () => {
    const res = answerGroundedQuestionLocally(sampleText, 'Which chamber has the thickest muscular wall?');
    assert.equal(res.canBeAnswered, true);
    assert.ok(res.citations.length > 0);
    assert.ok(res.citations[0].exactQuote.includes('left ventricle'));
    assert.ok(res.answer.includes('Based directly on your provided study material'));
  });

  it('refuses ungrounded questions when terms are absent from material', () => {
    const res = answerGroundedQuestionLocally(sampleText, 'What is the function of the nephron in renal failure?');
    assert.equal(res.canBeAnswered, false);
    assert.ok(res.answer.includes('This question cannot be answered from the provided study material'));
    assert.equal(res.citations.length, 0);
  });
});

describe('medicalEngine knowledge synthesizers', () => {
  const heartText = `
    The heart is an electro-mechanical muscular pump consisting of four chambers.
    The sinoatrial (SA) node acts as the intrinsic natural pacemaker, generating action potentials.
  `;

  it('generates first principles breakdown', () => {
    const res = generateFirstPrinciples(heartText, 'Cardiac Mechanics');
    assert.ok(res);
    assert.ok(res.includes('FIRST PRINCIPLES'));
  });

  it('generates ELI5 simplified explanation', () => {
    const res = generateSimplifiedExplanation(heartText, 'Cardiac Cycle');
    assert.ok(res);
    assert.ok(res.includes('SIMPLIFIED'));
    assert.ok(res.includes('Explain It Like I\'m Five'));
  });

  it('generates a 2-host audio podcast dialogue script', () => {
    const res = generatePodcastScript(heartText, 'Heart Physiology');
    assert.ok(res);
    assert.ok(res.includes('Dr. Alex'));
    assert.ok(res.includes('Dr. Taylor'));
  });

  it('generates high-yield USMLE Step 1 MCQ vignette', () => {
    const mcqs = generateMCQSet(heartText, 2, 'Medium');
    assert.ok(mcqs.length > 0);
    assert.equal(mcqs[0].options.length, 4);
    assert.ok(mcqs[0].q);
    assert.ok(mcqs[0].why);
    assert.ok(mcqs[0].evidence);
  });
});
