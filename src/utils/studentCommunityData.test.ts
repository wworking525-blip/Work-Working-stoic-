import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { REDDIT_STUDENT_MNEMONICS, searchCommunityMnemonics } from './studentCommunityData';

describe('Reddit & Student Community Study Mnemonics', () => {
  it('contains gold-standard mnemonics with expansions and clinical pitfalls', () => {
    assert.ok(REDDIT_STUDENT_MNEMONICS.length >= 8);
    for (const m of REDDIT_STUDENT_MNEMONICS) {
      assert.ok(m.mnemonic.length > 0);
      assert.ok(m.expansion.length > 5);
      assert.ok(m.clinicalPitfall.length > 10);
      assert.ok(m.redditSource.includes('r/step1'));
      assert.ok(m.upvotesEstimate > 1000);
    }
  });

  it('searches mnemonics by keyword or topic', () => {
    const bestMnemonic = searchCommunityMnemonics('radial');
    assert.ok(bestMnemonic.length >= 1);
    assert.equal(bestMnemonic[0].mnemonic, 'BEST');

    const sadPucker = searchCommunityMnemonics('retroperitoneal');
    assert.ok(sadPucker.length >= 1);
    assert.equal(sadPucker[0].mnemonic, 'SAD PUCKER');
  });

  it('filters mnemonics by anatomical system', () => {
    const nervousMnemonics = searchCommunityMnemonics('', 'nervous');
    assert.ok(nervousMnemonics.length >= 3);
    for (const m of nervousMnemonics) {
      assert.equal(m.system, 'nervous');
    }
  });
});
