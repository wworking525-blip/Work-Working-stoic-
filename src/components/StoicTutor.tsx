import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Upload,
  BookOpen,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Quote,
  ExternalLink,
  Sparkles,
  FileUp,
  X,
  FileCheck,
  Layers,
  ArrowRight,
  Film,
  PlayCircle,
  Eye,
  Compass,
} from 'lucide-react';
import { ANATOMICAL_SYSTEMS } from '../utils/anatomyData';
import { calculateTextStats } from '../utils/textParser';
import { GroundedCitation, GroundedQAResult } from '../utils/groundedQA';
import { VisualVideoPlayer } from './VisualVideoPlayer';
import { generateVisualStoryboard } from '../utils/videoExplanationEngine';

interface StoicTutorProps {
  initialMaterial?: string;
  initialTopic?: string;
  sourceName?: string;
  onUpdateMaterial?: (material: string, sourceName?: string) => void;
  onNavigateToMCQ?: (material: string) => void;
}

export const StoicTutor: React.FC<StoicTutorProps> = ({
  initialMaterial = '',
  initialTopic = '',
  sourceName: propSourceName,
  onUpdateMaterial,
  onNavigateToMCQ,
}) => {
  const [material, setMaterial] = useState<string>(
    initialMaterial || ANATOMICAL_SYSTEMS[0].sampleStudyNote
  );
  const [sourceName, setSourceName] = useState<string>(
    propSourceName || (initialMaterial ? 'Active System Notes' : 'Pre-loaded: Skeletal Biomechanics')
  );
  const [question, setQuestion] = useState<string>(initialTopic || '');
  const [mode, setMode] = useState<'video' | 'qa' | 'first_principles' | 'simple' | 'podcast'>('video');

  const currentStoryboard = useMemo(() => {
    return generateVisualStoryboard(material, question.trim() || undefined);
  }, [material, question]);

  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [qaResult, setQaResult] = useState<GroundedQAResult | null>(null);
  const [textOutput, setTextOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [highlightedQuote, setHighlightedQuote] = useState<string | null>(null);

  // Audio Podcast Player state for "Deep Dive"
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechSynthesisAvailable, setSpeechSynthesisAvailable] = useState(false);

  const materialTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (initialMaterial && initialMaterial !== material) {
      setMaterial(initialMaterial);
    }
    if (propSourceName) {
      setSourceName(propSourceName);
    }
  }, [initialMaterial, propSourceName]);

  useEffect(() => {
    if (initialTopic) {
      setQuestion(initialTopic);
    }
  }, [initialTopic]);

  const stats = calculateTextStats(material);

  // High-speed client-side PDF extraction via PDF.js with server fallback
  const extractPdfText = async (file: File): Promise<{ text: string; pages: number; chars: number }> => {
    // 1. Attempt Client-side PDF extraction via window.pdfjsLib for instant parsing
    const pdfjs = (window as any).pdfjsLib;
    if (pdfjs) {
      try {
        setUploadProgress('Initializing client PDF parser...');
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;
        const extractedPages: string[] = [];

        for (let i = 1; i <= totalPages; i++) {
          setUploadProgress(`Extracting page ${i} of ${totalPages}...`);
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str || '');
          const pageText = strings.join(' ').trim();
          if (pageText) {
            extractedPages.push(`--- PAGE ${i} ---\n${pageText}`);
          }
        }

        const fullExtracted = extractedPages.join('\n\n').trim();
        if (fullExtracted.length > 25) {
          return {
            text: fullExtracted,
            pages: totalPages,
            chars: fullExtracted.length,
          };
        }
      } catch (clientErr) {
        console.warn('Client-side PDF extraction warning, trying server fallback:', clientErr);
      }
    }

    // 2. Server-side fallback with AbortController timeout (max 8s)
    setUploadProgress('Sending to medical document extraction server...');
    const reader = new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(new Error('Failed to read file into memory.'));
      fr.readAsDataURL(file);
    });

    const base64Data = await reader;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('/api/pdf/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, filename: file.name }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server extraction failed.');
      }
      return {
        text: data.text,
        pages: data.pages || 1,
        chars: data.characters || data.text.length,
      };
    } catch (serverErr: any) {
      clearTimeout(timeoutId);
      if (serverErr.name === 'AbortError') {
        throw new Error('PDF extraction timed out. If your PDF is large or scanned, try copying the text directly.');
      }
      throw serverErr;
    }
  };

  // Handle PDF & Text file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const fileName = file.name;
    const isPdf = fileName.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setUploadingPdf(true);
      setUploadProgress('Reading PDF file...');
      setSourceName(`Processing: ${fileName}...`);
      try {
        const { text, pages, chars } = await extractPdfText(file);
        if (!text || text.trim().length < 20) {
          throw new Error('No readable text found in this PDF. It may contain scanned images without OCR text. Please paste text directly.');
        }

        const newSource = `${fileName} (${pages} pages, ${chars.toLocaleString()} chars)`;
        setMaterial(text);
        setSourceName(newSource);
        onUpdateMaterial?.(text, newSource);
        setQaResult(null);
        setTextOutput('');
      } catch (pdfErr: any) {
        console.error('PDF parsing error:', pdfErr);
        setError(`PDF parsing note: ${pdfErr.message}`);
        setSourceName('Failed to parse PDF');
      } finally {
        setUploadingPdf(false);
        setUploadProgress(null);
      }
    } else {
      // Plain text / Markdown file
      try {
        const text = await file.text();
        const newSource = fileName;
        setMaterial(text);
        setSourceName(newSource);
        onUpdateMaterial?.(text, newSource);
        setQaResult(null);
        setTextOutput('');
      } catch (err: any) {
        setError(`Failed to read text file: ${err.message}`);
      }
    }

    // Reset file input so same file can be re-uploaded if desired
    if (e.target) e.target.value = '';
  };

  // Submit Grounded Q&A
  const handleAskQuestion = async () => {
    if (!material.trim()) {
      setError('Please upload or provide study material first.');
      return;
    }
    if (!question.trim()) {
      setError('Please type a question regarding your uploaded study material.');
      return;
    }

    setLoading(true);
    setError(null);
    setQaResult(null);
    stopAudio();

    try {
      const storedKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('stoic_gemini_api_key') || '';
      const response = await fetch('/api/gemini/tutor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          question: question.trim(),
          apiKey: storedKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate grounded answer.');
      }

      setQaResult(data);
    } catch (err: any) {
      console.error('Q&A Error:', err);
      setError(err.message || 'Error generating grounded answer.');
    } finally {
      setLoading(false);
    }
  };

  // Submit First-Principles / Simplified / Podcast synthesis
  const handleGenerateSynthesis = async (targetMode: 'first_principles' | 'simple' | 'podcast') => {
    if (!material.trim()) {
      setError('Please upload or provide study material first.');
      return;
    }

    setLoading(true);
    setError(null);
    setTextOutput('');
    stopAudio();

    try {
      const storedKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('stoic_gemini_api_key') || '';
      const response = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          question: question.trim() || undefined,
          mode: targetMode,
          apiKey: storedKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize explanation.');
      }

      setTextOutput(data.result);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setError(err.message || 'Error generating explanation.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to and highlight quote in the material textarea
  const handleHighlightInMaterial = (quote: string) => {
    setHighlightedQuote(quote);
    const textarea = materialTextareaRef.current;
    if (!textarea) return;

    const lowerMaterial = material.toLowerCase();
    const cleanQuote = quote.toLowerCase().trim();
    const idx = lowerMaterial.indexOf(cleanQuote);

    if (idx >= 0) {
      textarea.focus();
      textarea.setSelectionRange(idx, idx + quote.length);
      // Compute rough scroll position
      const linesBefore = material.slice(0, idx).split('\n').length;
      textarea.scrollTop = Math.max(0, (linesBefore - 2) * 20);
    }
  };

  // Audio Speech Player
  const togglePlayAudio = () => {
    const textToRead = mode === 'qa' ? qaResult?.answer : textOutput;
    if (!textToRead || !speechSynthesisAvailable) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = textToRead
        .replace(/\[Source \d+\]/g, '')
        .replace(/[*#_`]/g, '')
        .replace(/---/g, '')
        .replace(/\n+/g, ' ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const samplePresets = [
    {
      label: 'Cardiovascular (Left Ventricle & Aorta)',
      system: 'Cardiovascular',
      note: 'The left ventricle is the thickest of the heart\'s chambers and is responsible for pumping oxygenated blood to the tissues all over the body. During ventricular systole, the left ventricle overcomes high systemic vascular resistance (~120 mmHg) to eject blood through the aortic valve. Left coronary artery blood flow occurs primarily during diastole because intramyocardial tissue pressure compresses subendocardial vessels during systole.',
      sampleQuestion: 'Why does left coronary artery blood flow occur primarily during diastole?',
    },
    {
      label: 'Respiratory (Alveolar Surfactant & ARDS)',
      system: 'Respiratory',
      note: 'Type II pneumocytes synthesize dipalmitoylphosphatidylcholine (pulmonary surfactant), which reduces surface tension across the alveolar air-fluid interface. According to the Law of Laplace (P = 2T / r), without surfactant, smaller alveoli would have higher collapsing pressures and empty into larger alveoli, leading to diffuse atelectasis and neonatal respiratory distress syndrome.',
      sampleQuestion: 'Which cell produces pulmonary surfactant and what is its primary phospholipid component?',
    },
    {
      label: 'Renal (NKCC2 & Loop Diuretics)',
      system: 'Urinary',
      note: 'The thick ascending limb of the loop of Henle expresses the apical Na+/K+/2Cl- cotransporter (NKCC2). This segment is impermeable to water, resulting in solute reabsorption that establishes the hypertonic medullary osmotic gradient. Loop diuretics such as furosemide inhibit NKCC2, dissipating this gradient and promoting rapid diuresis.',
      sampleQuestion: 'Which cotransporter in the thick ascending limb of the loop of Henle is inhibited by furosemide?',
    },
    {
      label: 'Neuroanatomy (Cranial Nerve IV Trochlear)',
      system: 'Nervous',
      note: 'The trochlear nerve (cranial nerve IV) is the only cranial nerve that exits from the dorsal (posterior) surface of the brainstem. It completely decussates before exiting to supply the contralateral superior oblique extraocular muscle. Patients with CN IV palsy present with vertical diplopia that worsens when looking down and in (such as when walking downstairs or reading).',
      sampleQuestion: 'What is unique about the exit point and course of the trochlear nerve?',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black text-white text-[11px] font-mono uppercase tracking-wider mb-2">
            STOIC AI Tutor
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Strict Grounded Study Material Tutor
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Upload text or PDF materials. STOIC AI answers strictly using facts from your material and cites exact source quotes.
          </p>
        </div>

        {onNavigateToMCQ && (
          <button
            onClick={() => onNavigateToMCQ(material)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-black text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <span>Practice High-Yield MCQs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Multimodal Cognitive Learning Pathway (Dual-Coding Progression) */}
      <div className="border border-zinc-200 rounded-xl p-3.5 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
            <Film className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="font-bold text-zinc-900 flex items-center gap-2">
              <span>Scientific Multimodal Learning Pipeline</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Paivio Dual-Coding Science
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              1. Ingest Notes/PDF ➔ 2. Grounded Q&amp;A ➔ 3. First Principles &amp; Audio ➔ 4. 3D Visual Video Masterclass
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMode('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              mode === 'video'
                ? 'bg-rose-600 text-white'
                : 'bg-black hover:bg-zinc-800 text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-rose-300" />
            <span>3D Visual Video Masterclass</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Material Column & Tutor QA Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Study Material Source (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-900" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                  Study Material Source
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {stats.words.toLocaleString()} words • {stats.chars.toLocaleString()} chars
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.md,.doc"
              className="hidden"
            />

            {/* Upload Action Zone */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPdf}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-black text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingPdf ? (uploadProgress || 'Parsing PDF...') : 'Upload PDF / Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMaterial('');
                  setSourceName('Custom blank draft');
                  onUpdateMaterial?.('', 'Custom blank draft');
                  setQaResult(null);
                  setTextOutput('');
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded border border-zinc-300 text-zinc-700 text-xs font-medium hover:bg-zinc-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Material</span>
              </button>
            </div>

            {/* Active Source Name Badge & Live Progress */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1.5 text-zinc-700">
                <FileCheck className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                <span className="truncate font-medium">{sourceName}</span>
              </div>
              {uploadProgress && (
                <div className="text-[11px] font-mono text-zinc-600 px-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                  <span>{uploadProgress}</span>
                </div>
              )}
            </div>

            {/* Material Text Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 flex items-center justify-between">
                <span>Material Content (Editable):</span>
                {highlightedQuote && (
                  <button
                    onClick={() => setHighlightedQuote(null)}
                    className="text-[11px] text-zinc-500 hover:text-black flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Highlight</span>
                  </button>
                )}
              </label>
              <textarea
                ref={materialTextareaRef}
                value={material}
                onChange={(e) => {
                  setMaterial(e.target.value);
                  onUpdateMaterial?.(e.target.value, sourceName);
                }}
                rows={12}
                placeholder="Upload a PDF, paste lecture notes, textbook chapters, or clinical case summaries..."
                className="w-full text-xs font-mono p-3 rounded border border-zinc-200 focus:outline-none focus:border-black transition-colors leading-relaxed resize-y bg-zinc-50/50"
              />
            </div>

            {/* Quick-Load Medical Presets */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Load High-Yield Material Presets:
              </div>
              <div className="flex flex-col gap-1.5">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newSrc = `Preset: ${preset.label}`;
                      setMaterial(preset.note);
                      setSourceName(newSrc);
                      onUpdateMaterial?.(preset.note, newSrc);
                      setQuestion(preset.sampleQuestion);
                      setQaResult(null);
                      setTextOutput('');
                    }}
                    className="text-left text-xs p-2 rounded border border-zinc-200 hover:border-black hover:bg-zinc-50 transition-colors text-zinc-800"
                  >
                    <div className="font-semibold text-zinc-900">{preset.label}</div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      Sample Q: "{preset.sampleQuestion}"
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Q&A & Multi-Mode Tutor Execution (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mode Switcher */}
          <div className="border border-zinc-200 rounded-lg p-1.5 bg-white shadow-sm flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setMode('video')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors shrink-0 ${
                mode === 'video'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-700 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-rose-300" />
              <span>3D Video Explanation</span>
            </button>

            <button
              onClick={() => setMode('qa')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors shrink-0 ${
                mode === 'qa'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Grounded Q&A</span>
            </button>

            <button
              onClick={() => {
                setMode('first_principles');
                handleGenerateSynthesis('first_principles');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors shrink-0 ${
                mode === 'first_principles'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>First Principles</span>
            </button>

            <button
              onClick={() => {
                setMode('simple');
                handleGenerateSynthesis('simple');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors shrink-0 ${
                mode === 'simple'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>ELI5 Simplified</span>
            </button>

            <button
              onClick={() => {
                setMode('podcast');
                handleGenerateSynthesis('podcast');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors shrink-0 ${
                mode === 'podcast'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Audio Podcast</span>
            </button>
          </div>

          {/* Mode: 3D Visual Video Explanation (YouTube Masterclass Level) */}
          {mode === 'video' && (
            <div className="space-y-4">
              <VisualVideoPlayer
                storyboard={currentStoryboard}
                material={material}
                onJumpToQuote={handleHighlightInMaterial}
              />

              {/* Storyboard Objectives & Pedagogical Blueprint */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                      Cognitive Learning Objectives (Dual-Coding Model)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {currentStoryboard.scenes.length} Scenes • {currentStoryboard.totalDurationSeconds}s Runtime
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {currentStoryboard.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-zinc-50 border border-zinc-200 text-zinc-700">
                      <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center shrink-0 font-bold">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{obj}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 text-xs">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <span className="font-bold text-zinc-900">Formulas Grounded in Notes:</span>
                    {currentStoryboard.keyFormulas.map((f, i) => (
                      <span key={i} className="font-mono bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300 text-[11px] text-zinc-800">
                        {f}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setMode('first_principles');
                      handleGenerateSynthesis('first_principles');
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-rose-600 transition-colors"
                  >
                    <span>Read Step-by-Step First Principles ➔</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Q&A Input Panel */}
          {mode === 'qa' && (
            <div className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
              <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
                Ask a question about the uploaded material:
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskQuestion();
                  }}
                  placeholder="e.g. Which chamber is the thickest and where does it pump blood?"
                  className="flex-1 text-xs px-3 py-2.5 rounded border border-zinc-200 focus:outline-none focus:border-black transition-colors"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={loading}
                  className="px-5 py-2.5 rounded bg-black text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Consulting Material...' : 'Ask AI'}</span>
                </button>
              </div>

              {/* Strict Grounding Notice */}
              <div className="flex items-start gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-zinc-900 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Grounding Guarantee:</strong> The AI tutor answers strictly from the provided text and provides exact source citations. If your question cannot be answered from the text, it will state that explicitly.
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-zinc-50 border border-zinc-400 rounded text-xs text-zinc-800">
              <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Notice:</strong> {error}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="border border-zinc-200 rounded-lg p-8 bg-white text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-black border-t-transparent" />
              <div className="text-xs font-medium text-zinc-700">
                Grounding answer strictly against uploaded material & verifying citations...
              </div>
            </div>
          )}

          {/* Grounded Q&A Output */}
          {mode === 'qa' && qaResult && !loading && (
            <div className="space-y-4">
              {/* Question Refusal Banner if Unanswerable */}
              {!qaResult.canBeAnswered && (
                <div className="border border-zinc-900 bg-zinc-100 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-black uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    <span>Question Cannot Be Answered From Provided Material</span>
                  </div>
                  <p className="text-xs text-zinc-800 leading-relaxed">
                    {qaResult.answer}
                  </p>
                  {qaResult.unansweredReason && (
                    <div className="text-[11px] font-mono text-zinc-600 bg-white p-2 rounded border border-zinc-200 mt-2">
                      Reason: {qaResult.unansweredReason}
                    </div>
                  )}
                </div>
              )}

              {/* Answer Box if Answered */}
              {qaResult.canBeAnswered && (
                <div className="border border-zinc-200 rounded-lg p-5 bg-white shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                        Grounded Clinical Answer
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {speechSynthesisAvailable && (
                        <button
                          onClick={togglePlayAudio}
                          className="flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                        >
                          {isPlayingAudio ? (
                            <>
                              <Pause className="w-3 h-3" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleCopy(qaResult.answer)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered Answer with Interactive Citation Badges */}
                  <div className="prose prose-sm max-w-none text-xs text-zinc-800 leading-relaxed space-y-3 font-sans">
                    {qaResult.answer.split('\n\n').map((paragraph, pIdx) => {
                      // Highlight inline citations like [Source 1], [Source 2]
                      const parts = paragraph.split(/(\[Source \d+\])/g);
                      return (
                        <p key={pIdx}>
                          {parts.map((part, partIdx) => {
                            const match = part.match(/\[Source (\d+)\]/);
                            if (match) {
                              const sNum = parseInt(match[1], 10);
                              const citation = qaResult.citations.find(
                                (c) => c.sourceNumber === sNum
                              );
                              return (
                                <button
                                  key={partIdx}
                                  onClick={() => {
                                    if (citation) handleHighlightInMaterial(citation.exactQuote);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black text-white text-[10px] font-mono mx-1 hover:bg-zinc-800 transition-colors align-middle"
                                  title={`Click to highlight quote in study material:\n"${citation?.exactQuote}"`}
                                >
                                  <Quote className="w-2.5 h-2.5" />
                                  <span>Source {sNum}</span>
                                </button>
                              );
                            }
                            return <span key={partIdx}>{part}</span>;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {/* Key Takeaway */}
                  {qaResult.keyTakeaway && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-800 space-y-1">
                      <span className="font-bold text-zinc-900 uppercase tracking-wider text-[10px] block">
                        High-Yield Pearl:
                      </span>
                      <p>{qaResult.keyTakeaway}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Feature: Cite Sources Card */}
              {qaResult.citations && qaResult.citations.length > 0 && (
                <div className="border border-zinc-200 rounded-lg p-5 bg-white shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Quote className="w-4 h-4 text-black" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                        Cited Sources &amp; Exact Text Evidence ({qaResult.citations.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Click any quote to highlight in material
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {qaResult.citations.map((citation, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-black text-white text-[10px] font-mono font-bold">
                              Source {citation.sourceNumber}
                            </span>
                            <span className="text-[11px] font-medium text-zinc-600">
                              {citation.relevance || 'Textual evidence'}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-900">
                            <Check className="w-3 h-3 text-black" />
                            <span>Verified In Text</span>
                          </span>
                        </div>

                        <blockquote className="text-xs italic text-zinc-800 pl-3 border-l-2 border-black font-sans leading-relaxed">
                          "{citation.exactQuote}"
                        </blockquote>

                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleHighlightInMaterial(citation.exactQuote)}
                            className="text-[11px] font-semibold text-black hover:underline flex items-center gap-1"
                          >
                            <span>Highlight in Study Material</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* First Principles, Simplified, Podcast Outputs */}
          {mode !== 'qa' && textOutput && !loading && (
            <div className="border border-zinc-200 rounded-lg p-5 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-black" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                    {mode === 'first_principles'
                      ? 'First Principles Breakdown'
                      : mode === 'simple'
                      ? 'ELI5 Simplified Explanation'
                      : 'Dual-Speaker Audio Overview Podcast'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {speechSynthesisAvailable && (
                    <button
                      onClick={togglePlayAudio}
                      className="flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(textOutput)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-zinc-800 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                {textOutput}
              </div>
            </div>
          )}

          {/* Empty State Prompt */}
          {!loading && !qaResult && !textOutput && (
            <div className="border border-dashed border-zinc-300 rounded-lg p-8 bg-zinc-50 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto" />
              <div className="text-sm font-semibold text-zinc-800">
                Ready for Medical Material Synthesis
              </div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Type a question above to test strict grounding with verifiable source citations, or switch tabs to synthesize First Principles or an Audio Podcast.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
