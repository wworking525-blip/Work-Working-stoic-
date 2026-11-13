import React from 'react';
import { AnatomyPartDef, AnatomySystem } from '../utils/anatomyData';
import { X, Sparkles, BookOpen, Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface PartDossierProps {
  part: AnatomyPartDef | null;
  system: AnatomySystem;
  onClose: () => void;
  onAskTutor: (topic: string) => void;
  onPracticeMCQ: () => void;
}

export const PartDossier: React.FC<PartDossierProps> = ({
  part,
  system,
  onClose,
  onAskTutor,
  onPracticeMCQ,
}) => {
  if (!part) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-md p-5 transition-all space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-black text-white">
              {part.layer.replace('_', ' ')}
            </span>
            <span className="text-xs text-zinc-500">{system.name}</span>
          </div>
          <h3 className="text-lg font-extrabold text-zinc-900 leading-tight">
            {part.name}
          </h3>
          <p className="text-xs italic text-zinc-500 font-serif">
            {part.latinName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
          aria-label="Close dossier"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Function Description */}
      <div>
        <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-black" />
          <span>Biological &amp; Mechanical Function</span>
        </h4>
        <p className="text-xs text-zinc-700 leading-relaxed">
          {part.description}
        </p>
      </div>

      {/* Mechanical Role */}
      {part.mechanicalRole && (
        <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded text-xs">
          <div className="flex items-center gap-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[10px] mb-1">
            <Cpu className="w-3.5 h-3.5 text-black" />
            <span>Biomechanical Kinematics</span>
          </div>
          <p className="text-zinc-700">{part.mechanicalRole}</p>
        </div>
      )}

      {/* Neurovascular & Clinical Supply Grid */}
      {(part.innervation || part.bloodSupply) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {part.innervation && (
            <div className="p-2.5 rounded border border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider text-[10px] mb-0.5">
                <Zap className="w-3 h-3 text-amber-700" />
                <span>Innervation</span>
              </div>
              <p className="text-amber-950 font-medium text-[11px] leading-snug">{part.innervation}</p>
            </div>
          )}
          {part.bloodSupply && (
            <div className="p-2.5 rounded border border-rose-200 bg-rose-50/50">
              <div className="flex items-center gap-1.5 font-bold text-rose-900 uppercase tracking-wider text-[10px] mb-0.5">
                <Activity className="w-3 h-3 text-rose-700" />
                <span>Vascular Supply</span>
              </div>
              <p className="text-rose-950 font-medium text-[11px] leading-snug">{part.bloodSupply}</p>
            </div>
          )}
        </div>
      )}

      {/* Common Pathology */}
      {part.commonPathology && (
        <div className="p-2.5 rounded border border-red-200 bg-red-50/40 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-red-900 uppercase tracking-wider text-[10px] mb-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
            <span>Clinical Pathology</span>
          </div>
          <p className="text-red-950 font-medium text-[11px] leading-relaxed">{part.commonPathology}</p>
        </div>
      )}

      {/* USMLE High-Yield Fact */}
      <div className="p-3 rounded border border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>USMLE High-Yield Fact</span>
        </div>
        <p className="text-xs text-zinc-800 font-medium leading-relaxed">
          {part.highYieldFact}
        </p>
      </div>

      {/* Action Buttons: Solid Black */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
        <button
          onClick={() =>
            onAskTutor(
              `Explain the clinical anatomy and mechanical function of the ${part.name} (${part.latinName})`
            )
          }
          className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-black hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Ask AI Tutor</span>
        </button>
        <button
          onClick={onPracticeMCQ}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded border border-zinc-300 hover:border-black text-zinc-800 hover:bg-zinc-50 text-xs font-medium transition-colors"
        >
          <span>Practice MCQs</span>
        </button>
      </div>
    </div>
  );
};
