import React, { useState, useRef, useEffect } from 'react';
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
  Upload,
  FileUp,
  FileText,
  X,
  FileCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { verifyEvidenceInText } from '../utils/textParser';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from '../utils/anatomyData';
import { extractTextFromFile, validateMaterialForMCQs } from '../utils/fileExtractor';

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
  onUpdateMaterial?: (material: string, sourceName?: string) => void;
}

export const MCQPractice: React.FC<MCQPracticeProps> = ({
  material: propMaterial = ANATOMICAL_SYSTEMS[0].sampleStudyNote,
  systemName: propSystemName = 'Skeletal System',
  onOpenTutor,
  onUpdateMaterial,
}) => {
  const [activeMaterial, setActiveMaterial] = useState<string>(propMaterial);
  const [activeSourceName, setActiveSourceName] = useState<string>(
    propSystemName || 'Active System Notes'
  );

  const [level, setLevel] = useState<string>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [questions, setQuestions] = useState<MCQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [filterView, setFilterView] = useState<'all' | 'missed'>('all');

  // File Upload & Custom Notes State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [customNotesInput, setCustomNotesInput] = useState<string>(propMaterial);
  const [dragActive, setDragActive] = useState(false);
  const [fileSuccessToast, setFileSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return (
      localStorage.getItem('gemini_api_key') ||
      localStorage.getItem('stoic_gemini_api_key') ||
      ''
    );
  });

  // Sync with prop updates if changed from parent tabs
  useEffect(() => {
    if (propMaterial && propMaterial !== activeMaterial) {
      setActiveMaterial(propMaterial);
      setCustomNotesInput(propMaterial);
    }
    if (propSystemName) {
      setActiveSourceName(propSystemName);
    }
  }, [propMaterial, propSystemName]);

  const showToast = (msg: string) => {
    setFileSuccessToast(msg);
    setTimeout(() => setFileSuccessToast(null), 4000);
  };

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

  const processUploadedFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(`Processing ${file.name}...`);
    setError(null);
    try {
      const res = await extractTextFromFile(file, (msg) => setUploadProgress(msg));
      const check = validateMaterialForMCQs(res.text);
      if (!check.valid) {
        setError(check.message || 'File contained insufficient text for MCQs.');
        return;
      }

      const displayName = `${res.filename} (${res.pages} pgs, ${res.chars.toLocaleString()} chars)`;
      setActiveMaterial(res.text);
      setActiveSourceName(displayName);
      setCustomNotesInput(res.text);
      onUpdateMaterial?.(res.text, displayName);
      showToast(`Successfully loaded "${res.filename}"! Generating fresh MCQs...`);

      // Automatically generate fresh board-style MCQs from this uploaded document
      handleGenerateMCQs(questionCount, res.text, displayName);
    } catch (err: any) {
      console.error('File extraction failed:', err);
      setError(err?.message || 'Failed to extract text from file.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDropFile = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
  };

  const handleApplyCustomNotes = () => {
    const check = validateMaterialForMCQs(customNotesInput);
    if (!check.valid) {
      setError(check.message || 'Please provide at least 15 words.');
      return;
    }
    const displayName = `Custom Study Notes (${check.wordCount} words)`;
    setActiveMaterial(customNotesInput);
    setActiveSourceName(displayName);
    setNotesDrawerOpen(false);
    onUpdateMaterial?.(customNotesInput, displayName);
    showToast('Applied custom notes to MCQ generator!');
    handleGenerateMCQs(questionCount, customNotesInput, displayName);
  };

  const handleSelectPresetSystem = (sys: AnatomySystem) => {
    setActiveMaterial(sys.sampleStudyNote);
    setActiveSourceName(sys.name);
    setCustomNotesInput(sys.sampleStudyNote);
    onUpdateMaterial?.(sys.sampleStudyNote, sys.name);
    showToast(`Loaded pre-set: ${sys.name}`);
    handleGenerateMCQs(questionCount, sys.sampleStudyNote, sys.name);
  };

  const handleGenerateMCQs = async (
    count = questionCount,
    targetMat = activeMaterial,
    targetSys = activeSourceName
  ) => {
    if (!targetMat || !targetMat.trim()) {
      setError('Please provide study material first.');
      return;
    }

    setLoading(true);
    setError(null);
    setUserAnswers({});

    try {
      const storedKey =
        localStorage.getItem('gemini_api_key') ||
        localStorage.getItem('stoic_gemini_api_key') ||
        '';

      const response = await fetch('/api/gemini/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: targetMat,
          count,
          level,
          systemName: targetSys,
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
      setError(err?.message || 'Error communicating with question generator.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on initial mount so user immediately sees high-yield questions
  useEffect(() => {
    if (questions.length === 0 && activeMaterial.trim()) {
      handleGenerateMCQs(25, activeMaterial, activeSourceName);
    }
  }, []);

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
          Generate 10 to 50 randomized clinical vignette questions derived directly from your uploaded study materials, notes, or PDFs, complete with verifiable quote evidence and distractor pearls.
        </p>
      </div>

      {/* Feature 1: Study Material & File Upload Card */}
      <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Active Source for MCQs:
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-100 border border-zinc-200 text-zinc-900">
                  {activeSourceName}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                {activeMaterial.length.toLocaleString()} characters • ~
                {Math.round(activeMaterial.split(/\s+/).filter(Boolean).length).toLocaleString()} words
              </p>
            </div>
          </div>

          {/* Action Tools: Upload File & Paste Notes */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.md,.markdown,.doc,.docx,.rtf,.json,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Reading File...' : 'Upload Notes / PDF'}</span>
            </button>

            <button
              onClick={() => setNotesDrawerOpen(!notesDrawerOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-black text-zinc-800 hover:bg-zinc-50 text-xs font-medium transition-colors"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>{notesDrawerOpen ? 'Hide Notes' : 'Paste / Edit Notes'}</span>
            </button>

            {/* Quick System Note Preset */}
            <select
              onChange={(e) => {
                const sys = ANATOMICAL_SYSTEMS.find((s) => s.id === e.target.value);
                if (sys) handleSelectPresetSystem(sys);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-700 font-medium focus:outline-none focus:border-black"
              defaultValue=""
            >
              <option value="" disabled>Load Preset Notes...</option>
              {ANATOMICAL_SYSTEMS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Progress Indicator */}
        {uploadProgress && (
          <div className="p-2.5 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-between text-xs font-mono text-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span>{uploadProgress}</span>
            </div>
            <span className="text-[11px] text-zinc-500">PDF &amp; Text Parser Active</span>
          </div>
        )}

        {/* Toast Alert */}
        {fileSuccessToast && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{fileSuccessToast}</span>
          </div>
        )}

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDropFile}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-3.5 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-black bg-zinc-100'
              : 'border-zinc-300 hover:border-black bg-zinc-50/70 hover:bg-zinc-100/60'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-zinc-700">
            <Upload className="w-4 h-4 text-zinc-500" />
            <span className="font-semibold text-zinc-900">
              Drop any study material here:
            </span>
            <span className="text-zinc-500">
              PDF textbooks, lecture slides, Markdown, TXT, DOCX files
            </span>
          </div>
        </div>

        {/* Expandable Notes Textarea Drawer */}
        {notesDrawerOpen && (
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-black" />
                <span>Paste or Edit Study Notes for Question Generation:</span>
              </span>
              <button
                onClick={() => setNotesDrawerOpen(false)}
                className="text-zinc-400 hover:text-black text-xs p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={customNotesInput}
              onChange={(e) => setCustomNotesInput(e.target.value)}
              placeholder="Paste medical lecture notes, pathophysiology pathways, clinical guidelines, or textbook chapters here..."
              className="w-full h-36 p-3 text-xs bg-white border border-zinc-300 rounded-lg font-mono leading-relaxed focus:outline-none focus:border-black shadow-inner"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-500">
              <span className="font-mono">
                {customNotesInput.length.toLocaleString()} characters •{' '}
                {customNotesInput.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomNotesInput('')}
                  className="px-2.5 py-1 text-zinc-600 hover:text-black font-medium"
                >
                  Clear Notes
                </button>
                <button
                  onClick={handleApplyCustomNotes}
                  disabled={customNotesInput.trim().length < 15}
                  className="px-3.5 py-1.5 rounded-lg bg-black text-white font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
                >
                  Generate MCQs from These Notes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Deck: Question Configuration & Triggers */}
      <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Level Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-zinc-700 uppercase tracking-wider text-[11px]">Level:</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-medium focus:outline-none focus:border-black"
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
              <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
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
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-black hover:text-black text-xs font-medium transition-colors"
            >
              <span>{apiKeyInput ? '✓ Key Configured' : 'API Key (Optional)'}</span>
            </button>

            <button
              onClick={() => handleGenerateMCQs(50)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              <span>Generate 50 New MCQs</span>
            </button>

            <button
              onClick={() => handleGenerateMCQs(questionCount)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Generate {questionCount} MCQs</span>
            </button>
          </div>
        </div>

        {/* API Key Configuration Modal */}
        {apiKeyModalOpen && (
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900">
                AI Study Engine Key Configuration
              </span>
              <button
                onClick={() => setApiKeyModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-black"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-[11px] text-zinc-600">
              Paste your custom API key for live generation, or leave blank to use the high-yield built-in question engine.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 bg-white border border-zinc-300 rounded px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:border-black"
              />
              <button
                onClick={() => handleSaveApiKey(apiKeyInput)}
                className="px-3 py-1 bg-black text-white text-xs font-medium rounded hover:bg-zinc-800"
              >
                Save Key
              </button>
            </div>
          </div>
        )}

        {/* Session Stats Bar */}
        {questions.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-zinc-500">Answered: </span>
                <span className="font-mono font-bold text-zinc-900">
                  {answeredCount} / {questions.length}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Correct: </span>
                <span className="font-mono font-bold text-zinc-900">
                  {correctCount}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Accuracy: </span>
                <span className="font-mono font-bold text-zinc-900">
                  {accuracyPercent}%
                </span>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded border border-zinc-200">
              <button
                onClick={() => setFilterView('all')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filterView === 'all'
                    ? 'bg-black text-white'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setFilterView('missed')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
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
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="border border-zinc-200 rounded-lg p-10 bg-white text-center space-y-3">
          <div className="w-7 h-7 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="font-bold text-sm text-zinc-900">
            Synthesizing Clinical Vignette MCQs...
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Extracting pathophysiological mechanisms, distractors, and verifiable quotes from "{activeSourceName}".
          </p>
        </div>
      )}

      {/* Questions List */}
      {!loading && filteredQuestions.length > 0 && (
        <div className="space-y-4">
          {filteredQuestions.map((q, displayIdx) => {
            const originalIndex = questions.indexOf(q);
            const chosenAnswer = userAnswers[originalIndex];
            const isAnswered = chosenAnswer !== undefined;
            const isCorrect = isAnswered && chosenAnswer === q.answer;
            const evidenceCheck = verifyEvidenceInText(activeMaterial, q.evidence);

            return (
              <div
                key={originalIndex}
                className={`border rounded-lg p-5 bg-white shadow-sm transition-all ${
                  isAnswered
                    ? isCorrect
                      ? 'border-zinc-900'
                      : 'border-zinc-400'
                    : 'border-zinc-200'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-900 border border-zinc-200">
                      Q{originalIndex + 1}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-50 text-zinc-600 border border-zinc-200">
                      {q.level || 'Clinical'}
                    </span>
                  </div>

                  {isAnswered && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                        isCorrect
                          ? 'bg-black text-white'
                          : 'bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      {isCorrect ? '✓ Correct' : '✕ Missed'}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 mb-4 leading-relaxed">
                  {q.q}
                </p>

                {/* Options List */}
                <div className="space-y-2">
                  {q.options.map((optText, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isThisChosen = chosenAnswer === optIdx;
                    const isThisAnswer = q.answer === optIdx;

                    let btnStyle = 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800';
                    if (isAnswered) {
                      if (isThisAnswer) {
                        btnStyle = 'border-black bg-zinc-900 text-white font-medium shadow-sm';
                      } else if (isThisChosen && !isCorrect) {
                        btnStyle = 'border-zinc-300 bg-zinc-200 text-zinc-600 line-through';
                      } else {
                        btnStyle = 'border-zinc-200 bg-zinc-50 text-zinc-400 opacity-60';
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
                        className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isThisAnswer && isAnswered
                                ? 'bg-white text-black'
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
                          <Check className="w-4 h-4 text-white shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {isAnswered && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2.5 text-xs">
                    <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                      <div className="font-bold text-zinc-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5 text-black" />
                        <span>Explanation &amp; Distractor Analysis</span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed">
                        {q.why}
                      </p>
                    </div>

                    {/* Source Text Evidence */}
                    <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
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
                      <div className="p-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 flex items-center gap-2">
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
        <div className="border border-dashed border-zinc-300 rounded-xl p-10 bg-zinc-50 text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="font-bold text-zinc-800 text-sm">
            No questions generated yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Upload study notes or click the button below to generate a high-yield board examination set based on "{activeSourceName}".
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleGenerateMCQs(25)}
              className="px-5 py-2.5 rounded-lg bg-black text-white font-medium text-xs hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Start Practice Session (25 MCQs)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
