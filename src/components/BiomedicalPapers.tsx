import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  Sparkles,
  FileText,
  Calendar,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface PaperItem {
  id: string;
  pmid?: string;
  doi?: string;
  title: string;
  authorString: string;
  journalTitle: string;
  pubYear: string;
  abstractText: string;
  isOpenAccess: boolean;
  fullTextUrl: string | null;
  sourceBadge?: string;
}

interface BiomedicalPapersProps {
  onSendToTutor?: (abstract: string, title: string) => void;
}

export const BiomedicalPapers: React.FC<BiomedicalPapersProps> = ({
  onSendToTutor,
}) => {
  const [topic, setTopic] = useState<string>('cardiovascular biomechanics');
  const [source, setSource] = useState<'all' | 'pubmed' | 'europepmc'>('all');
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded explanations map: paperId -> explanationString
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainingId, setExplainingId] = useState<string | null>(null);

  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  const presetTopics = [
    'cardiovascular biomechanics',
    'spinal cord tract lesions',
    'renal countercurrent multiplier',
    'action potential voltage gated channels',
    'spleen red pulp filtration',
    'femoral neck avascular necrosis',
  ];

  const searchPapers = async (query = topic, selectedSource = source) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/literature/search?q=${encodeURIComponent(query)}&pageSize=8&source=${selectedSource}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search medical literature.');
      }
      setPapers(data.results || []);
      if ((data.results || []).length === 0) {
        setError('No peer-reviewed papers found for this query. Try a broader topic.');
      }
    } catch (err: any) {
      console.error('Literature fetch error:', err);
      setError(err.message || 'Error communicating with medical knowledge API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchPapers('cardiovascular biomechanics');
  }, []);

  const handleExplainSimply = async (paper: PaperItem) => {
    if (explanations[paper.id]) return;

    setExplainingId(paper.id);
    try {
      const res = await fetch('/api/gemini/explain-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstractText,
          authors: paper.authorString,
          journal: paper.journalTitle,
          year: paper.pubYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to explain paper.');
      }

      setExplanations((prev) => ({
        ...prev,
        [paper.id]: data.explanation,
      }));
    } catch (err: any) {
      console.error('Explain paper error:', err);
    } finally {
      setExplainingId(null);
    }
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header: Clean Black & White */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black text-white text-[11px] font-mono uppercase tracking-wider mb-2">
          NCBI PubMed &amp; NIH E-Utilities Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          Peer-Reviewed Biomedical Literature
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl leading-relaxed">
          Search millions of verified open-access clinical and anatomical studies. Export abstracts directly into your STOIC notes for instant AI Tutor grounding.
        </p>
      </div>

      {/* Search Bar & Topic Pills */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-4">
        {/* Academic Source Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3">
          <span className="text-xs font-bold text-zinc-500 mr-2 uppercase tracking-wider text-[11px]">API Source:</span>
          {[
            { id: 'all', label: 'All Sources (NCBI + PMC)' },
            { id: 'pubmed', label: 'NCBI PubMed (NIH)' },
            { id: 'europepmc', label: 'Europe PMC Open Access' },
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => {
                const s = src.id as 'all' | 'pubmed' | 'europepmc';
                setSource(s);
                searchPapers(topic, s);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                source === src.id
                  ? 'bg-black text-white shadow-sm'
                  : 'border border-zinc-200 text-zinc-600 hover:text-black hover:border-black'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchPapers(topic, source);
          }}
          className="flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Search medical topic, e.g. ventricular hypertrophy, alveolar surfactant..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded border border-zinc-200 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2 rounded bg-black text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching PubMed...' : 'Search Papers'}</span>
          </button>
        </form>

        {/* Preset Topic Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium text-[11px] mr-1 uppercase tracking-wider">
            Suggested:
          </span>
          {presetTopics.map((pt) => (
            <button
              key={pt}
              onClick={() => {
                setTopic(pt);
                searchPapers(pt, source);
              }}
              className="text-[11px] px-2.5 py-1 rounded border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-black hover:bg-white transition-colors capitalize font-medium"
            >
              {pt}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded border border-zinc-300 bg-zinc-50 text-xs text-zinc-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Papers Results */}
      <div className="space-y-4">
        {papers.map((p) => {
          const isExplaining = explainingId === p.id;
          const explanation = explanations[p.id];
          const isAbstractOpen = expandedAbstracts[p.id];

          return (
            <div
              key={p.id}
              className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm space-y-3"
            >
              {/* Title & Metadata */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-900 border border-zinc-300">
                    {p.sourceBadge || (p.pmid ? 'NCBI PubMed (NIH)' : 'Europe PMC')}
                  </span>
                  {p.pmid && (
                    <span className="font-mono text-[10px] text-zinc-500">
                      PMID: {p.pmid}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-zinc-900 text-sm md:text-base leading-snug">
                  {p.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{p.authorString || 'Authors'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{p.pubYear}</span>
                  </span>
                  <span>•</span>
                  <span className="font-medium text-zinc-700">
                    {p.journalTitle}
                  </span>
                  {p.isOpenAccess && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
                      Open Access
                    </span>
                  )}
                </div>
              </div>

              {/* Action Links & Triggers */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAbstract(p.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-black"
                  >
                    <span>{isAbstractOpen ? 'Hide Abstract' : 'View Full Abstract'}</span>
                    {isAbstractOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {p.fullTextUrl && (
                    <a
                      href={p.fullTextUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-zinc-900 underline hover:text-zinc-600"
                    >
                      <span>Read Original</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onSendToTutor && (
                    <button
                      onClick={() => onSendToTutor(p.abstractText, p.title)}
                      className="px-3 py-1.5 rounded bg-black hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-sm"
                    >
                      Study in AI Tutor
                    </button>
                  )}
                  <button
                    onClick={() => handleExplainSimply(p)}
                    disabled={isExplaining}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-300 text-zinc-800 hover:border-black hover:bg-zinc-50 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                    <span>{isExplaining ? 'Explaining...' : 'Explain Simply'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Original Abstract */}
              {isAbstractOpen && (
                <div className="p-3.5 rounded bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 leading-relaxed font-sans">
                  <div className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                    Peer-Reviewed Scientific Abstract ({p.abstractText.length.toLocaleString()} chars):
                  </div>
                  {p.abstractText}
                </div>
              )}

              {/* Simplified Breakdown Card */}
              {explanation && (
                <div className="p-4 rounded border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>Simplified Medical Breakdown</span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">
                    {explanation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
