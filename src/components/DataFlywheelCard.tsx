import React from 'react';
import {
  Zap,
  TrendingUp,
  Cpu,
  Brain,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { DataFlywheelState } from '../utils/dataFlywheel';

interface DataFlywheelCardProps {
  flywheelState: DataFlywheelState;
  onNavigateToMCQ?: () => void;
  onNavigateToAnatomy?: () => void;
}

export const DataFlywheelCard: React.FC<DataFlywheelCardProps> = ({
  flywheelState,
  onNavigateToMCQ,
  onNavigateToAnatomy,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Flywheel Status */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-600/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <RotateCw className="w-6 h-6 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-white">
                Data Flywheel Upskilling Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Continuous Learning
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              The app automatically upskills itself with every quiz, 3D exploration, and clinical note you provide.
            </p>
          </div>
        </div>

        {/* Current Upskilling Badge */}
        <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">
              Intelligence Status
            </span>
            <span className="text-xs font-black text-white">
              {flywheelState.upskillingTitle}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/50 flex items-center justify-center text-amber-300 font-black text-sm">
            L{flywheelState.upskillingLevel}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        {/* Momentum Gauge */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>Flywheel Momentum</span>
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-300">
              {flywheelState.flywheelMomentum}%
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Velocity</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${flywheelState.flywheelMomentum}%` }}
            />
          </div>
        </div>

        {/* Data Points Processed */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>Data Nodes Ingested</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">
              {flywheelState.totalDataPoints}
            </span>
            <span className="text-[10px] text-indigo-400 font-bold">Interactions</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Across MCQs, Notes &amp; 3D pins
          </span>
        </div>

        {/* Adaptive Gap Targeting */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>Targeting Weak Gaps</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="truncate text-sm font-extrabold text-rose-300">
            {flywheelState.topWeakSystems.slice(0, 2).join(', ')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Automatically prioritized
          </span>
        </div>

        {/* Strong Systems */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>Mastery Retention</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="truncate text-sm font-extrabold text-emerald-300">
            {flywheelState.topStrongSystems.join(', ')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            High cognitive stability
          </span>
        </div>
      </div>

      {/* Algorithmic Insights Stream */}
      <div className="relative z-10 bg-slate-950/80 p-4 rounded-2xl border border-indigo-500/20 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Live Algorithmic Steering Signals:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Updated {new Date(flywheelState.lastUpskillTimestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="space-y-1.5">
          {flywheelState.algorithmicInsights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-mono">
              <span className="text-indigo-400 select-none">▶</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-indigo-500/20 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Every study action fuels the algorithmic feedback loop.</span>
        </span>

        <div className="flex items-center gap-2">
          {onNavigateToMCQ && (
            <button
              onClick={onNavigateToMCQ}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <span>Feed Flywheel via MCQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
