import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanZAnatomyName,
  stripLaterality,
  isTranslucentSheathMaterialOrMesh,
  parseZAnatomyDefinition,
  lookupZAnatomyMetadata,
  buildSearchableCatalog,
  searchZAnatomyCatalog,
  isMaleSpecificAnatomyMesh,
  isFemaleSpecificAnatomyName,
} from './zAnatomyCatalog.ts';

describe('zAnatomyCatalog', () => {
  it('cleans left/right suffixes and parentheses cleanly', () => {
    assert.equal(cleanZAnatomyName('Medulla oblongata.l'), 'Medulla oblongata (Left)');
    assert.equal(cleanZAnatomyName('Olive.r'), 'Olive (Right)');
    assert.equal(cleanZAnatomyName('(Adductor minimus)'), 'Adductor minimus');
    assert.equal(
      cleanZAnatomyName('(Abdominal part of pectoralis major muscle).l'),
      'Abdominal part of pectoralis major muscle (Left)'
    );
    assert.equal(
      cleanZAnatomyName('Pectoralis major.r_1'),
      'Pectoralis major (Right)'
    );
    assert.equal(stripLaterality('(Abdominal part of pectoralis major muscle).r'), 'Abdominal part of pectoralis major muscle');
  });

  it('classifies fascia, peritoneum, LCR, and articular capsules as translucent sheaths', () => {
    assert.equal(isTranslucentSheathMaterialOrMesh('Fascia', 'Trapezius.l'), true);
    assert.equal(isTranslucentSheathMaterialOrMesh('Peritoneum', 'Greater omentum'), true);
    assert.equal(isTranslucentSheathMaterialOrMesh('LCR', 'Cerebrospinal fluid'), true);
    assert.equal(isTranslucentSheathMaterialOrMesh('Articular capsule', 'Shoulder capsule.r'), true);
    assert.equal(isTranslucentSheathMaterialOrMesh('Internal rotator', 'Deltoid muscle.l'), false);
    assert.equal(isTranslucentSheathMaterialOrMesh('Bone-1', 'Femur.l'), false);
    assert.equal(isTranslucentSheathMaterialOrMesh('Organ-6', 'Superficial investing cervical fascia'), true);
  });

  it('extracts Wikipedia URLs and cleans heading markers from definitions', () => {
    const raw =
      '==Structure== The pectoralis major is a thick, fan-shaped muscle. https://en.wikipedia.org/wiki/Pectoralis_major';
    const parsed = parseZAnatomyDefinition(raw);
    assert.equal(parsed.wikipediaUrl, 'https://en.wikipedia.org/wiki/Pectoralis_major');
    assert.equal(parsed.summary, 'Structure: The pectoralis major is a thick, fan-shaped muscle.');
  });

  it('resolves Z-Anatomy lexicon, definition, and system metadata', () => {
    const meta = lookupZAnatomyMetadata(
      'Pectoralis major.l',
      'muscular',
      {
        'Pectoralis major': 'Chest muscle flexing the humerus. https://en.wikipedia.org/wiki/Pectoralis_major',
      },
      {
        'Pectoralis major': { la: 'Musculus pectoralis major', official: true },
      },
      {
        muscular: ['Pectoralis major.l'],
      }
    );

    assert.equal(meta.displayName, 'Pectoralis major (Left)');
    assert.equal(meta.latinName, 'Musculus pectoralis major');
    assert.equal(meta.isOfficialTA, true);
    assert.equal(meta.system, 'muscular');
    assert.equal(meta.wikipediaUrl, 'https://en.wikipedia.org/wiki/Pectoralis_major');
  });

  it('builds deduplicated searchable catalog and ranks prefix matches first', () => {
    const catalog = buildSearchableCatalog(
      {
        skeletal: ['Femur.l', 'Femur.r', 'Frontal bone'],
        nervous: ['Facial nerve.l'],
      },
      {
        Femur: { la: 'Os femoris', official: true },
        'Facial nerve': { la: 'Nervus facialis', official: true },
      }
    );

    // 4 Z-Anatomy items + 7 female reproductive entries
    assert.equal(catalog.length, 11);
    const femurHits = searchZAnatomyCatalog(catalog, 'fem', 5);
    assert.equal(femurHits.length, 2);
    assert.ok(femurHits[0].displayName.startsWith('Femur'));

    const latinHits = searchZAnatomyCatalog(catalog, 'nervus facialis', 5);
    assert.equal(latinHits.length, 1);
    assert.equal(latinHits[0].displayName, 'Facial nerve (Left)');

    const uterusHits = searchZAnatomyCatalog(catalog, 'uterus', 5);
    assert.ok(uterusHits.some((e) => e.rawName === 'Uterus'));
  });

  it('identifies sex-specific pelvic structures and resolves female metadata', () => {
    assert.equal(isMaleSpecificAnatomyMesh('Prostate'), true);
    assert.equal(isMaleSpecificAnatomyMesh('Testis.l'), true);
    assert.equal(isMaleSpecificAnatomyMesh('Urinary bladder'), false);
    assert.equal(isFemaleSpecificAnatomyName('Uterus'), true);
    assert.equal(isFemaleSpecificAnatomyName('Fallopian tube.r'), true);

    const ovaryMeta = lookupZAnatomyMetadata('Ovary.l', 'visceral', {}, {}, {});
    assert.equal(ovaryMeta.displayName, 'Ovary (Left)');
    assert.equal(ovaryMeta.latinName, 'Ovarium');
    assert.equal(ovaryMeta.isOfficialTA, true);
    assert.ok(ovaryMeta.wikipediaUrl?.includes('Ovary'));
  });
});
