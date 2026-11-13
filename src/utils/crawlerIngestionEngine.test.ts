import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanHtmlToMarkdown, extractClinicalFactsFromMarkdown, generateTrainingPairsFromDocument, crawlStudyUrl } from './crawlerIngestionEngine';

describe('Firecrawl-Compatible Medical Ingestion Engine', () => {
  it('cleans raw HTML into clean Markdown without script or style tags', () => {
    const rawHtml = `
      <html>
        <head><script>alert('bad');</script><style>.box { color: red; }</style></head>
        <body>
          <nav><a href="/home">Home</a></nav>
          <h1>USMLE Step 1 Clinical Review</h1>
          <p>Midshaft humerus fracture injures the <strong>radial nerve</strong> in the spiral groove.</p>
          <footer>Copyright 2026</footer>
        </body>
      </html>
    `;
    const markdown = cleanHtmlToMarkdown(rawHtml);
    assert.ok(!markdown.includes('<script>'));
    assert.ok(!markdown.includes('alert'));
    assert.ok(!markdown.includes('<style>'));
    assert.ok(!markdown.includes('<nav>'));
    assert.ok(!markdown.includes('<footer>'));
    assert.ok(markdown.includes('# USMLE Step 1 Clinical Review'));
    assert.ok(markdown.includes('**radial nerve**'));
  });

  it('extracts clinical facts and mnemonics from markdown content', () => {
    const markdown = `
      The radial nerve innervates all extensor muscles of the upper extremity.
      Midshaft humerus fracture leads to wrist drop and impaired sensation over the first web space.
      Coronary artery perfusion to the left ventricle occurs predominantly during diastole.
    `;
    const facts = extractClinicalFactsFromMarkdown(markdown);
    assert.ok(facts.length >= 2);
    assert.ok(facts.some((f) => f.fullFact.includes('radial nerve')));
    assert.ok(facts.some((f) => f.fullFact.includes('diastole')));
  });

  it('crawls and generates training pairs for LLM fine-tuning', async () => {
    const doc = await crawlStudyUrl('https://en.wikipedia.org/wiki/Brachial_plexus');
    assert.ok(doc.markdownContent.length > 50);
    assert.ok(doc.extractedFacts.length >= 1);
    assert.ok(doc.generatedTrainingPairs.length >= 1);
    const pair = doc.generatedTrainingPairs[0];
    assert.ok(pair.instruction.startsWith('Explain the verified anatomical rule'));
    assert.ok(pair.output.includes('Under STOIC strict evidence grounding'));
  });
});
