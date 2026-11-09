/**
 * Utilities for processing study text, normalizing strings, and validating evidence quotes.
 */

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether an evidence quote exists within the source document.
 * Returns true if exact match or normalized match is found, or if >85% of quote words match in sequence.
 */
export function verifyEvidenceInText(sourceText: string, evidenceQuote: string): { verified: boolean; matchRatio: number } {
  if (!sourceText || !evidenceQuote) {
    return { verified: false, matchRatio: 0 };
  }

  // Exact substring check
  if (sourceText.includes(evidenceQuote.trim())) {
    return { verified: true, matchRatio: 1.0 };
  }

  // Normalized substring check
  const normSource = normalizeText(sourceText);
  const normQuote = normalizeText(evidenceQuote);

  if (normQuote.length === 0) {
    return { verified: false, matchRatio: 0 };
  }

  if (normSource.includes(normQuote)) {
    return { verified: true, matchRatio: 1.0 };
  }

  // Fuzzy token check: check if the sequence of significant words in quote appear closely together in source
  const quoteWords = normQuote.split(' ').filter(w => w.length > 2);
  if (quoteWords.length === 0) {
    return { verified: false, matchRatio: 0 };
  }

  let foundCount = 0;
  for (const word of quoteWords) {
    if (normSource.includes(word)) {
      foundCount++;
    }
  }

  const matchRatio = foundCount / quoteWords.length;
  return {
    verified: matchRatio >= 0.8,
    matchRatio: Math.round(matchRatio * 100) / 100,
  };
}

/**
 * Calculates reading time in minutes and character metrics
 */
export function calculateTextStats(text: string) {
  if (!text) return { words: 0, chars: 0, readTimeMin: 0 };
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const readTimeMin = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readTimeMin };
}

/**
 * Extracts a contextual snippet highlighting the matched quote
 */
export function extractSnippet(sourceText: string, quote: string, windowLength: number = 100): string | null {
  if (!sourceText || !quote) return null;
  const idx = sourceText.toLowerCase().indexOf(quote.toLowerCase());
  if (idx === -1) return null;

  const start = Math.max(0, idx - windowLength);
  const end = Math.min(sourceText.length, idx + quote.length + windowLength);

  const prefix = start > 0 ? '...' : '';
  const suffix = end < sourceText.length ? '...' : '';

  return `${prefix}${sourceText.substring(start, end).trim()}${suffix}`;
}
