import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CANVA_PROFILE,
  MOCK_CANVAS_LMS_COURSES,
  generateCanvaExportUrl,
  formatCanvaStudyExport,
} from './canvaIntegration.ts';

test('DEFAULT_CANVA_PROFILE connects to saiarts9848@gmail.com', () => {
  assert.equal(DEFAULT_CANVA_PROFILE.email, 'saiarts9848@gmail.com');
  assert.equal(DEFAULT_CANVA_PROFILE.connected, true);
  assert.equal(DEFAULT_CANVA_PROFILE.accountType, 'Canva for Education');
});

test('generateCanvaExportUrl generates valid deep search URL', () => {
  const url = generateCanvaExportUrl('flashcards', 'Brachial Plexus');
  assert.equal(url.includes('https://www.canva.com/search'), true);
  assert.equal(url.includes('Brachial'), true);
});

test('MOCK_CANVAS_LMS_COURSES provides gross anatomy and pathology courses', () => {
  assert.equal(MOCK_CANVAS_LMS_COURSES.length >= 3, true);
  const anat = MOCK_CANVAS_LMS_COURSES.find((c) => c.code === 'ANAT-501');
  assert.ok(anat);
  assert.equal(anat.name, 'Gross Human Anatomy & Embryology');
  assert.equal(anat.sampleLectureNote.includes('BRACHIAL PLEXUS'), true);
});

test('formatCanvaStudyExport structures export bundle correctly', () => {
  const bundle = formatCanvaStudyExport(
    'Heart Murmurs',
    'medical-card',
    'Aortic stenosis crescendo-decrescendo murmur',
    'data:image/png;base64,sample'
  );
  assert.equal(bundle.account, 'saiarts9848@gmail.com');
  assert.equal(bundle.hasDrawing, true);
  assert.equal(bundle.title, 'Heart Murmurs');
});
