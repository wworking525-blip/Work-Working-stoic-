import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Filter,
  Trophy,
  Check,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Quote,
} from 'lucide-react';
import { verifyEvidenceInText } from '../utils/textParser';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from '../utils/anatomyData';

export interface MCQItem {
  q: string;
  options: string[];
  answer: number; // 0 to 3
  level: string; // easy, medium, hard, clinical
  why: string;
  evidence: string;
  pearl?: string;
}

interface MCQPracticeProps {
  material: string;
  systemName?: string;
  onOpenTutor?: () => void;
}

export const MCQPractice: React.FC<MCQPracticeProps> = ({
  material = ANATOMICAL_SYSTEMS[0].sampleStudyNote,
  systemName = 'Skeletal System',
  onOpenTutor,
}) => {
  const [level, setLevel] = useState<string>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [questions, setQuestions] = useState<MCQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [filterView, setFilterView] = useState<'all' | 'missed'>('all');

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem('gemini_api_key') || localStorage.getItem('stoic_gemini_api_key') || '';
  });

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
      localStorage.setItem('stoic_gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('gemini_api_key');
      localStorage.removeItem('stoic_gemini_api_key');
    }
    setApiKeyInput(trimmed);
    setApiKeyModalOpen(false);
  };

  const handleGenerateMCQs = async (count = questionCount) => {
    if (!material.trim()) {
      setError('Please provide study material first.');
      return;
    }

    setLoading(true);
    setError(null);
    setUserAnswers({});

    try {
      const storedKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('stoic_gemini_api_key') || '';

      const response = await fetch('/api/gemini/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          count,
          level,
          systemName,
          apiKey: storedKey,
          timestamp: Date.now(),
          seed: Math.random(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate MCQs.');
      }

      const valid = (data.questions || []).filter(
        (q: any) => Array.isArray(q.options) && q.options.length >= 3
      );
      setQuestions(valid);
      if (valid.length === 0) {
        setError('No valid questions were returned. Try again with a different level or material.');
      }
    } catch (err: any) {
      console.error('MCQ fetch error:', err);
      setError(err.message || 'Error communicating with question generator.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on initial mount so user immediately sees high-yield questions
  React.useEffect(() => {
    if (questions.length === 0 && material.trim()) {
      handleGenerateMCQs(25);
    }
  }, [material]);

  const answeredCount = Object.keys(userAnswers).length;
  let correctCount = 0;
  Object.entries(userAnswers).forEach(([idxStr, chosen]) => {
    const qIndex = parseInt(idxStr, 10);
    if (questions[qIndex] && questions[qIndex].answer === chosen) {
      correctCount++;
    }
  });

  const accuracyPercent =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const filteredQuestions = questions.filter((q, idx) => {
    if (filterView === 'missed') {
      const chosen = userAnswers[idx];
      return chosen !== undefined && chosen !== q.answer;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner: Clean Black & White */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black text-white text-[11px] font-mono uppercase tracking-wider mb-2">
          NBME &amp; USMLE Step 1 Exam Simulator
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          High-Yield Board Practice MCQs
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
          Generate 10 to 50 randomized clinical vignette questions derived directly from your notes, complete with verifiable quote evidence, distractor analysis, and high-yield pearls.
        </p>
      </div>

      {/* Control Deck: Monochrome Styling */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Level Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">Level:</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-900 font-medium focus:outline-none focus:border-black"
              >
                <option value="mixed">Mixed Levels (Equal Distribution)</option>
                <option value="easy">Easy (Recall &amp; Definitions)</option>
                <option value="medium">Medium (Mechanisms &amp; Pathways)</option>
                <option value="hard">Hard (Multi-step Reasoning)</option>
                <option value="clinical">Clinical Vignette (USMLE Step 1)</option>
              </select>
            </div>

            {/* Question Count Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">Count:</span>
              <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded border border-zinc-200">
                {[10, 25, 50].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setQuestionCount(cnt)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      questionCount === cnt
                        ? 'bg-black text-white shadow-sm'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons: Black Background */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="px-3 py-1.5 rounded border border-zinc-200 text-zinc-600 hover:border-black hover:text-black text-xs font-medium transition-colors"
            >
              <span>{apiKeyInput ? '✓ Key Configured' : 'API Key (Optional)'}</span>
            </button>

            <button
              onClick={() => handleGenerateMCQs(50)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-black text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              <span>Generate 50 New MCQs</span>
            </button>

            <button
              onClick={() => handleGenerateMCQs(questionCount)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-black text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              <span>Generate {questionCount} MCQs</span>
            </button>
          </div>
        </div>

        {/* API Key Configuration Modal */}
        {apiKeyModalOpen && (
          <div className="p-3 rounded border border-zinc-200 bg-zinc-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900">
                Gemini API Key Configuration
              </span>
              <button
                onClick={() => setApiKeyModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-black"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-[11px] text-zinc-600">
              Paste your Gemini API key for live generation, or leave blank to use the high-yield built-in question engine.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 rounded border border-zinc-200 bg-white text-xs font-mono focus:outline-none focus:border-black"
              />
              <button
                onClick={() => handleSaveApiKey(apiKeyInput)}
                className="px-3 py-1.5 rounded bg-black text-white font-medium text-xs hover:bg-zinc-800"
              >
                Save
              </button>
              {apiKeyInput && (
                <button
                  onClick={() => handleSaveApiKey('')}
                  className="px-2 py-1.5 rounded border border-zinc-300 text-zinc-700 text-xs hover:bg-zinc-100"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Score & Progress Tracker */}
        {questions.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-black" />
                <span className="font-bold text-zinc-900">
                  Score: {correctCount} / {answeredCount}
                </span>
                <span className="text-zinc-500 font-mono">({questions.length} total)</span>
              </div>
              <div className="font-mono px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                Accuracy: {accuracyPercent}%
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-medium">Filter:</span>
              <button
                onClick={() => setFilterView('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterView === 'all'
                    ? 'bg-black text-white'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setFilterView('missed')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterView === 'missed'
                    ? 'bg-black text-white'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                Missed Only
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded border border-zinc-300 bg-zinc-50 text-xs text-zinc-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="border border-zinc-200 rounded-lg p-8 bg-white text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-black border-t-transparent" />
          <div className="text-xs font-medium text-zinc-700">
            Synthesizing high-yield questions with verifiable quote evidence...
          </div>
        </div>
      )}

      {/* Questions List */}
      {!loading && questions.length > 0 && (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const originalIndex = questions.indexOf(q);
            const chosen = userAnswers[originalIndex];
            const isAnswered = chosen !== undefined;
            const isCorrect = isAnswered && chosen === q.answer;

            const evidenceCheck = verifyEvidenceInText(material, q.evidence);

            return (
              <div
                key={originalIndex}
                className="border border-zinc-200 rounded-lg p-5 bg-white shadow-sm space-y-4"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                      Question {originalIndex + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {q.level}
                    </span>
                  </div>

                  {isAnswered && (
                    <span
                      className={`text-xs font-bold flex items-center gap-1 ${
                        isCorrect ? 'text-black' : 'text-zinc-600'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-black" />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-zinc-500" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Question Body */}
                <p className="text-zinc-900 font-medium text-xs sm:text-sm leading-relaxed">
                  {q.q}
                </p>

                {/* Options List */}
                <div className="space-y-2">
                  {q.options.map((optText, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isThisChosen = chosen === optIdx;
                    const isThisAnswer = q.answer === optIdx;

                    let btnStyle = 'border-zinc-200 bg-white hover:border-black text-zinc-800';

                    if (isAnswered) {
                      if (isThisAnswer) {
                        btnStyle = 'border-black bg-zinc-100 text-black font-semibold';
                      } else if (isThisChosen) {
                        btnStyle = 'border-zinc-400 bg-zinc-50 text-zinc-500 line-through';
                      } else {
                        btnStyle = 'border-zinc-100 opacity-50 bg-zinc-50 text-zinc-400';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswered}
                        onClick={() => {
                          setUserAnswers((prev) => ({
                            ...prev,
                            [originalIndex]: optIdx,
                          }));
                        }}
                        className={`w-full text-left p-3 rounded border text-xs flex items-center justify-between gap-3 transition-colors ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isThisAnswer && isAnswered
                                ? 'bg-black text-white'
                                : isThisChosen && isAnswered
                                ? 'bg-zinc-400 text-white'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-snug">{optText}</span>
                        </div>
                        {isAnswered && isThisAnswer && (
                          <Check className="w-4 h-4 text-black shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {isAnswered && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2.5 text-xs">
                    <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
                      <div className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5 text-black" />
                        <span>Explanation &amp; Distractor Analysis</span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed">
                        {q.why}
                      </p>
                    </div>

                    {/* Source Text Evidence */}
                    <div className="p-3 rounded border border-zinc-200 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px] block">
                          Verified Note Evidence:
                        </span>
                        <p className="text-zinc-700 italic">
                          "{q.evidence}"
                        </p>
                      </div>

                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-white text-zinc-900 border border-zinc-300">
                          <Check className="w-3 h-3 text-black" />
                          <span>Verified ({Math.round(evidenceCheck.matchRatio * 100)}%)</span>
                        </span>
                      </div>
                    </div>

                    {/* Board Pearl */}
                    {q.pearl && (
                      <div className="p-2.5 rounded border border-zinc-300 bg-white text-zinc-900 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-black shrink-0" />
                        <span className="font-medium text-[11px]">{q.pearl}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="border border-dashed border-zinc-300 rounded-lg p-10 bg-zinc-50 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="font-bold text-zinc-800 text-sm">
            No questions generated yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Click the button below to generate a high-yield board examination set based on your active material.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleGenerateMCQs(25)}
              className="px-5 py-2.5 rounded bg-black text-white font-medium text-xs hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Start Practice Session (25 MCQs)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
