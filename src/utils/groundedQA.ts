/**
 * STOIC / MedStudy Grounded Q&A and Citation Engine
 * Enforces strict material grounding:
 * 1. AI answers strictly based on uploaded study materials.
 * 2. Explicitly states when a question cannot be answered from the material.
 * 3. Extracts and verifies verbatim source quotes with exact character locations.
 */

export interface GroundedCitation {
  sourceNumber: number;
  exactQuote: string;
  startIndex?: number;
  endIndex?: number;
  section?: string;
  relevance: string;
  verifiedInText: boolean;
}

export interface GroundedQAResult {
  answer: string;
  canBeAnswered: boolean;
  unansweredReason?: string;
  citations: GroundedCitation[];
  keyTakeaway?: string;
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'of', 'for',
  'with', 'what', 'how', 'why', 'who', 'when', 'where', 'does', 'do', 'can', 'from',
  'about', 'regarding', 'explain', 'describe', 'tell', 'me', 'please', 'are', 'was',
  'were', 'been', 'has', 'have', 'had', 'its', 'their', 'this', 'that', 'these', 'those'
]);

/**
 * Extract meaningful semantic keywords from user query
 */
export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Verify if a quote exists verbatim or near-verbatim in the material
 */
export function verifyCitationInMaterial(material: string, quote: string): boolean {
  if (!material || !quote) return false;
  const cleanMaterial = material.toLowerCase().replace(/\s+/g, ' ');
  const cleanQuote = quote.toLowerCase().replace(/\s+/g, ' ').trim();
  
  if (cleanMaterial.includes(cleanQuote)) return true;
  
  // Check if a substantial 40-character substring matches
  if (cleanQuote.length > 40) {
    const chunk = cleanQuote.slice(0, 40);
    return cleanMaterial.includes(chunk);
  }
  return false;
}

/**
 * Split text into distinct sentences with positional tracking
 */
export function splitIntoSentences(text: string): { sentence: string; start: number; end: number }[] {
  const result: { sentence: string; start: number; end: number }[] = [];
  const regex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (trimmed.length > 10) {
      result.push({
        sentence: trimmed,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }
  return result;
}

/**
 * Deterministic local Grounded QA Fallback engine.
 * Ensures zero-fail response while strictly adhering to grounding rules:
 * Refuses if content is missing, cites sources if content is present.
 */
export function answerGroundedQuestionLocally(material: string, question: string): GroundedQAResult {
  if (!material || material.trim().length === 0) {
    return {
      answer: 'No study material has been uploaded. Please upload a PDF or paste medical text first.',
      canBeAnswered: false,
      unansweredReason: 'No source material provided.',
      citations: [],
      keyTakeaway: 'Please provide clinical study material.',
    };
  }

  const cleanQuestion = question.trim();
  if (!cleanQuestion) {
    return {
      answer: 'Please ask a specific question related to your uploaded study material.',
      canBeAnswered: false,
      unansweredReason: 'Empty question.',
      citations: [],
    };
  }

  const keywords = extractKeywords(cleanQuestion);
  const sentences = splitIntoSentences(material);

  // Score sentences by keyword matches
  const scored = sentences.map(s => {
    const sLower = s.sentence.toLowerCase();
    let score = 0;
    keywords.forEach(kw => {
      if (sLower.includes(kw)) {
        score += kw.length > 5 ? 2 : 1;
      }
    });
    return { ...s, score };
  });

  const matchingSentences = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  // Check if query is completely absent from the material
  if (matchingSentences.length === 0 || (keywords.length > 2 && matchingSentences[0].score < 2)) {
    return {
      answer: `This question cannot be answered from the provided study material. The uploaded text does not contain information regarding "${cleanQuestion}".\n\nUnder strict MedStudy grounding rules, the AI tutor only provides facts, explanations, and mechanisms explicitly documented in your uploaded material and will not extrapolate external clinical assumptions.`,
      canBeAnswered: false,
      unansweredReason: `The uploaded text lacks coverage of key terms: ${keywords.join(', ')}.`,
      citations: [],
      keyTakeaway: 'The AI will not guess or extrapolate beyond your uploaded text.',
    };
  }

  // Top 1 to 3 matching sentences
  const topMatches = matchingSentences.slice(0, 3);
  const citations: GroundedCitation[] = topMatches.map((m, idx) => ({
    sourceNumber: idx + 1,
    exactQuote: m.sentence,
    startIndex: m.start,
    endIndex: m.end,
    relevance: `Direct statement addressing "${keywords.slice(0, 3).join(', ')}"`,
    verifiedInText: true,
  }));

  const answerParagraphs = [
    `Based directly on your provided study material [Source 1], ${topMatches[0].sentence}`,
  ];

  if (topMatches.length > 1) {
    answerParagraphs.push(
      `Furthermore, the material notes [Source 2]: "${topMatches[1].sentence}"`
    );
  }

  if (topMatches.length > 2) {
    answerParagraphs.push(
      `Additionally, the text specifies [Source 3]: "${topMatches[2].sentence}"`
    );
  }

  return {
    answer: answerParagraphs.join('\n\n'),
    canBeAnswered: true,
    citations,
    keyTakeaway: topMatches[0].sentence.slice(0, 140) + '...',
  };
}
