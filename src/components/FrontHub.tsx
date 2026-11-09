import React from 'react';
import {
  Box,
  BookOpen,
  HelpCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Database,
  Activity,
  CheckCircle,
  Palette,
} from 'lucide-react';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from '../utils/anatomyData';
import { UserProfile } from '../utils/userStore';

import { ActiveTab } from './Navbar';

interface FrontHubProps {
  user?: UserProfile;
  onNavigate?: (tab: ActiveTab) => void;
  onNavigateToAnatomy?: () => void;
  onNavigateToTutor?: () => void;
  onNavigateToMCQ?: () => void;
  onNavigateToPapers?: () => void;
  onNavigateToCanvas?: () => void;
  onSelectSystem: (sys: AnatomySystem) => void;
  onOpenGoogleNotes?: () => void;
  onOpenAuth?: () => void;
}

export const FrontHub: React.FC<FrontHubProps> = ({
  user = { name: 'Dr. Sai', email: 'saiarts9848@gmail.com', isPro: true, streakDays: 14, accuracyRate: 88, completedQuizzes: 34 },
  onNavigate,
  onNavigateToAnatomy,
  onNavigateToTutor,
  onNavigateToMCQ,
  onNavigateToPapers,
  onNavigateToCanvas,
  onSelectSystem,
  onOpenGoogleNotes,
  onOpenAuth,
}) => {
  const handleNav = (tab: ActiveTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (tab === 'anatomy') {
      onNavigateToAnatomy?.();
    } else if (tab === 'tutor') {
      onNavigateToTutor?.();
    } else if (tab === 'mcq') {
      onNavigateToMCQ?.();
    } else if (tab === 'papers') {
      onNavigateToPapers?.();
    } else if (tab === 'canvas') {
      onNavigateToCanvas?.();
    }
  };
  const coreFeatures = [
    {
      id: 'anatomy',
      title: '3D Human Anatomy Engine',
      category: 'Three.js Spatial Engine',
      description:
        'Deconstruct and assemble the complete human anatomical matrix. Inspect 26 knolled parts, muscular actuators, cardiac chambers, and biomechanical lever arms.',
      badge: 'Interactive 3D Engine',
      actionLabel: 'Launch 3D Anatomy',
      onAction: onNavigateToAnatomy,
      icon: Box,
    },
    {
      id: 'tutor',
      title: 'NotebookLM Grounded Tutor',
      category: 'Strict Evidence Grounding',
      description:
        'Upload study materials (PDFs, text). Gemini answers questions strictly from your content with exact source citations and explicit refusal if content is missing.',
      badge: 'PDF Upload & Citations',
      actionLabel: 'Open AI Tutor',
      onAction: onNavigateToTutor,
      icon: BookOpen,
    },
    {
      id: 'mcq',
      title: 'High-Yield Board MCQs',
      category: 'USMLE Step 1 Simulator',
      description:
        'Practice 10 to 50 randomized clinical vignette questions generated directly from study notes, complete with verifiable quote evidence and distractor pearls.',
      badge: 'Randomized Question Bank',
      actionLabel: 'Practice High-Yield MCQs',
      onAction: onNavigateToMCQ,
      icon: HelpCircle,
    },
    {
      id: 'papers',
      title: 'NCBI PubMed Research Papers',
      category: 'Peer-Reviewed Academic Data',
      description:
        'Search millions of open-access biomedical literature papers directly via NCBI E-Utilities API. Export clinical abstracts directly into study notes.',
      badge: 'Live Academic Search',
      actionLabel: 'Explore PubMed Papers',
      onAction: onNavigateToPapers,
      icon: FileText,
    },
    {
      id: 'canvas',
      title: 'Canva & Medical Whiteboard',
      category: 'Interactive Drawing Studio',
      description:
        'Sketch and annotate directly over 3D anatomical models, trace arterial trees, and export high-res diagrams to your connected Canva account (saiarts9848@gmail.com).',
      badge: 'Canva Connected',
      actionLabel: 'Launch Study Canvas',
      onAction: onNavigateToCanvas || (() => handleNav('canvas')),
      icon: Palette,
    },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-2">
      {/* Hero Section: Simple Black and White */}
      <div className="border-b border-zinc-200 pb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-black text-white text-[11px] font-mono uppercase tracking-wider">
            <span>MEDSTUDY</span>
            <span>•</span>
            <span>STOIC CLINICAL PLATFORM</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span>Database: Firestore Synced</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
          Evidence-Grounded Medical Intelligence &amp; 3D Anatomy
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
          A minimalist platform engineered for medical students and clinicians. Study with strict source-cited AI tutoring, interactive 3D anatomical deconstruction, high-yield board question simulators, and real-time PubMed literature.
        </p>

        {/* Quick System Context Selector */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
            Quick-Select Clinical System:
          </span>
          <div className="flex flex-wrap gap-2">
            {ANATOMICAL_SYSTEMS.slice(0, 6).map((sys) => (
              <button
                key={sys.id}
                onClick={() => onSelectSystem(sys)}
                className="text-xs px-3 py-1.5 rounded border border-zinc-200 bg-white hover:border-black hover:bg-zinc-50 transition-colors text-zinc-800 font-medium"
              >
                {sys.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Four Core Features Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Four Core Features
          </h2>
          <span className="text-xs text-zinc-400 font-mono">Select a feature to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="border border-zinc-200 rounded-lg p-6 bg-white hover:border-zinc-400 transition-all shadow-sm flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-300 text-zinc-700 font-medium">
                      {feat.badge}
                    </span>
                    <Icon className="w-5 h-5 text-zinc-900" />
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
                      {feat.category}
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 mt-0.5">
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                {/* Feature Button: Black Background, White Text */}
                <button
                  type="button"
                  onClick={feat.onAction}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-black text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <span>{feat.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* High-Yield Study Metrics & Persistence Row */}
      <div className="border border-zinc-200 rounded-lg p-5 bg-white shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-black" />
            <span>Data Upskilling Flywheel</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">
            {Math.round(user.accuracyRate || 84)}% Momentum
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Adaptive cognitive momentum based on your quiz accuracy and notes ingested.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5 text-black" />
            <span>Board Examination Quizzes</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">
            {user.completedQuizzes || 48} Completed
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Current streak: {user.streakDays || 12} days of continuous active study.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-black" />
            <span>Persistent Database</span>
          </div>
          <div className="text-2xl font-black text-zinc-900">
            Active Cloud
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug">
            Cloud Firestore stores your notes, quiz records, and study bookmarks persistently.
          </p>
        </div>
      </div>
    </div>
  );
};
