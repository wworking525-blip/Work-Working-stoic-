import React, { useState, useRef, useEffect } from 'react';
import { AnatomySystem, AnatomyPartDef } from '../utils/anatomyData';
import { AnatomyLabel, LearningPlan } from '../utils/adaptiveLearningBridge';
import {
  AnatomyCanvas3D,
  AnatomyCanvas3DHandle,
  AnatomicalLayerKey,
} from './AnatomyCanvas3D';
import {
  Layers,
  Sparkles,
  Sliders,
  BookOpen,
  HelpCircle,
  Eye,
  EyeOff,
  Maximize2,
  Box,
  RotateCw,
  Crosshair,
  Check,
  Shield,
  Activity,
  X,
  Palette,
} from 'lucide-react';

interface AnatomyExplorerProps {
  onSelectSystemForTutor: (system: AnatomySystem) => void;
  onSelectSystemForMCQ: (system: AnatomySystem) => void;
  onAskTutorWithTopic: (topic: string, material: string) => void;
  onOpenCanvasWhiteboard?: () => void;
}

export const AnatomyExplorer: React.FC<AnatomyExplorerProps> = ({
  onSelectSystemForTutor,
  onSelectSystemForMCQ,
  onAskTutorWithTopic,
  onOpenCanvasWhiteboard,
}) => {
  const canvasRef = useRef<AnatomyCanvas3DHandle | null>(null);

  const [selectedPart, setSelectedPart] = useState<AnatomyPartDef | null>(null);
  const [isolatedPartId, setIsolatedPartId] = useState<string | null>(null);
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [renderMode, setRenderMode] = useState<'realistic' | 'xray' | 'wireframe'>('realistic');
  const [statusMessage, setStatusMessage] = useState<string>(
    'All anatomical systems loaded successfully.'
  );

  // Adaptive KI Learning state
  const [adaptiveLabels, setAdaptiveLabels] = useState<AnatomyLabel[]>([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);

  // Fetch adaptive anatomy labels and learning plan
  useEffect(() => {
    async function fetchAdaptiveData() {
      try {
        const labelsRes = await fetch('/api/adaptive/anatomy-labels?userId=default_user&modelId=human_anatomy');
        if (labelsRes.ok) {
          const data = await labelsRes.json();
          if (data.labels) {
            setAdaptiveLabels(data.labels);
          }
        }

        const planRes = await fetch('/api/adaptive/plan?userId=default_user&topic=femur');
        if (planRes.ok) {
          const pData = await planRes.json();
          if (pData.plan) {
            setLearningPlan(pData.plan);
          }
        }
      } catch (e) {
        console.warn('Could not load adaptive learning data:', e);
      }
    }
    fetchAdaptiveData();
  }, []);

  // Check if selected part has reviewed adaptive label binding
  const matchingAdaptiveLabel = selectedPart
    ? adaptiveLabels.find((l) => {
        const pId = selectedPart.id.toLowerCase();
        const pName = selectedPart.name.toLowerCase();
        const mName = l.mesh_name.toLowerCase();
        return pId.includes(mName) || mName.includes(pId) || pName.includes(mName) || mName.includes(pName);
      })
    : null;

  // Active layers state
  const [activeLayers, setActiveLayers] = useState<Record<AnatomicalLayerKey, boolean>>({
    muscles: true,
    skeleton: true,
    organs: true,
    nervous: true,
    circulatory: true,
    lymphatic: false,
    joints: false,
  });

  const toggleLayer = (layerKey: AnatomicalLayerKey) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const handleShowCompleteBody = () => {
    setActiveLayers({
      muscles: true,
      skeleton: true,
      organs: true,
      nervous: true,
      circulatory: true,
      lymphatic: true,
      joints: true,
    });
    setIsolatedPartId(null);
    setExplodedProgress(0);
    canvasRef.current?.resetView();
  };

  const handleIsolateSelected = () => {
    if (selectedPart) {
      setIsolatedPartId(selectedPart.id);
    }
  };

  const handleShowAllStructures = () => {
    setIsolatedPartId(null);
    canvasRef.current?.showAllStructures();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header Card: Minimalist Monochrome Style */}
      <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black text-white text-[11px] font-mono uppercase tracking-wider">
            <Box className="w-3.5 h-3.5" />
            <span>Advanced 3D Human Anatomy System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900">
            Interactive 3D Anatomical Atlas
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 border border-zinc-300 text-zinc-700">
              Adaptive KI Engine Active
            </span>
            {learningPlan && learningPlan.recommend_3d_review && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 border border-amber-300 text-amber-900 animate-pulse">
                ★ 3D Review Recommended (Mastery: {Math.round(learningPlan.mastery_estimate * 100)}%)
              </span>
            )}
            {learningPlan && !learningPlan.recommend_3d_review && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 border border-emerald-300 text-emerald-900">
                ✓ Mastered ({learningPlan.difficulty.toUpperCase()})
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 max-w-2xl leading-relaxed mt-0.5">
            Exploded disassembly, multi-layer peel, realistic PBR organ rendering, and USMLE clinical dossiers.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedPart ? (
            <button
              onClick={() =>
                onAskTutorWithTopic(
                  `Explain the clinical anatomy, biomechanics, and pathology of: ${selectedPart.name}`,
                  `${selectedPart.name} (${selectedPart.latinName})\nSystem: ${selectedPart.layer}\nClinical Role: ${selectedPart.description}\nUSMLE Pearl: ${selectedPart.highYieldFact}`
                )
              }
              className="px-3.5 py-2 rounded bg-black hover:bg-zinc-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ask AI Tutor about {selectedPart.name}</span>
            </button>
          ) : (
            <button
              onClick={() =>
                onAskTutorWithTopic(
                  'Explain the systemic anatomical relationships between the skeletal, muscular, and visceral organ systems',
                  'Systemic Human Anatomy:\n- Skeletal framework supports viscera and muscular insertions\n- Circulatory and nervous trees coordinate metabolic function\n- Visceral organs fit within the thoracic cage and abdominopelvic cavity'
                )
              }
              className="px-3.5 py-2 rounded bg-black hover:bg-zinc-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ask AI Tutor</span>
            </button>
          )}

          {onOpenCanvasWhiteboard && (
            <button
              onClick={onOpenCanvasWhiteboard}
              className="px-3.5 py-2 rounded border border-cyan-300 bg-cyan-50/80 hover:bg-cyan-100 hover:border-cyan-500 text-cyan-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Draw and annotate over this anatomical system on the Study Canvas"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-700" />
              <span>Annotate in Study Canvas</span>
            </button>
          )}

          <button
            onClick={handleShowCompleteBody}
            className="px-3.5 py-2 rounded border border-zinc-300 hover:border-black text-zinc-900 hover:bg-zinc-50 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-black" />
            <span>Reset Complete Body</span>
          </button>
        </div>
      </div>

      {/* Main Container: 3D Viewer + Sidebar Matching User HTML Reference */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* 3D Viewer Canvas */}
        <div className="flex-1 min-w-0">
          <AnatomyCanvas3D
            ref={canvasRef}
            onSelectPart={setSelectedPart}
            selectedPart={selectedPart}
            explodedProgress={explodedProgress}
            onExplodedProgressChange={setExplodedProgress}
            activeLayers={activeLayers}
            renderMode={renderMode}
            onStatusUpdate={setStatusMessage}
            isolatedPartId={isolatedPartId}
            onIsolatePart={setIsolatedPartId}
          />
        </div>

        {/* Sidebar Matching User's Exact Layout & Sections */}
        <aside
          id="sidebar"
          className="w-full lg:w-[320px] bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-4 shrink-0 flex flex-col justify-between"
        >
          <div className="space-y-4">
            {/* Title & Subtitle */}
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">Human Anatomy 3D</h2>
              <p className="text-xs text-zinc-500">Advanced anatomical exploration system</p>
            </div>

            {/* Anatomical Systems Layer Checkboxes */}
            <div className="section space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Anatomical Systems
                </h3>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() =>
                      setActiveLayers({
                        muscles: true,
                        skeleton: true,
                        organs: true,
                        nervous: true,
                        circulatory: true,
                        lymphatic: true,
                        joints: true,
                      })
                    }
                    className="text-zinc-500 hover:text-black font-semibold"
                  >
                    All On
                  </button>
                  <span className="text-zinc-300">•</span>
                  <button
                    onClick={() =>
                      setActiveLayers({
                        muscles: false,
                        skeleton: false,
                        organs: false,
                        nervous: false,
                        circulatory: false,
                        lymphatic: false,
                        joints: false,
                      })
                    }
                    className="text-zinc-500 hover:text-black font-semibold"
                  >
                    All Off
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeLayers.muscles}
                    onChange={() => toggleLayer('muscles')}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span>Muscular System</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeLayers.skeleton}
                    onChange={() => toggleLayer('skeleton')}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span>Skeletal System</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeLayers.organs}
                    onChange={() => toggleLayer('organs')}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span>Internal Organs</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeLayers.nervous}
                    onChange={() => toggleLayer('nervous')}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span>Nervous System</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeLayers.circulatory}
                    onChange={() => toggleLayer('circulatory')}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span>Circulatory System</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeLayers.lymphatic}
                    onChange={() => toggleLayer('lymphatic')}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span>Lymphatic System</span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeLayers.joints}
                    onChange={() => toggleLayer('joints')}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span>Joints &amp; Ligaments</span>
                </label>
              </div>
            </div>

            {/* Model Controls */}
            <div className="section space-y-2 border-t border-zinc-100 pt-3">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Model Controls
              </h3>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={handleShowCompleteBody}
                  className="w-full py-2 px-3 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Show Complete Human Body
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleIsolateSelected}
                    disabled={!selectedPart}
                    className="py-1.5 px-2.5 border border-zinc-300 hover:border-black text-zinc-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-zinc-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Isolate Selected
                  </button>

                  <button
                    onClick={handleShowAllStructures}
                    className="py-1.5 px-2.5 border border-zinc-300 hover:border-black text-zinc-800 hover:bg-zinc-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Show All Structures
                  </button>
                </div>
              </div>

              {/* Exploded Separation Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700">
                  <span>Exploded Separation:</span>
                  <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                    {Math.round(explodedProgress * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedProgress}
                  onChange={(e) => setExplodedProgress(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
                />
              </div>

              {/* Render Modes */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-zinc-700 block">Visual Render Mode:</span>
                <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs font-semibold">
                  <button
                    onClick={() => setRenderMode('realistic')}
                    className={`py-1 rounded transition-colors ${
                      renderMode === 'realistic'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    Realistic
                  </button>
                  <button
                    onClick={() => setRenderMode('xray')}
                    className={`py-1 rounded transition-colors ${
                      renderMode === 'xray'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    X-Ray
                  </button>
                  <button
                    onClick={() => setRenderMode('wireframe')}
                    className={`py-1 rounded transition-colors ${
                      renderMode === 'wireframe'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    Wireframe
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Anatomy Dossier */}
            <div className="section space-y-2 border-t border-zinc-100 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Selected Anatomy
                </h3>
                {selectedPart && (
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="text-[11px] text-zinc-400 hover:text-black"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div
                id="info"
                className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-xs leading-relaxed overflow-wrap-anywhere space-y-2"
              >
                {selectedPart ? (
                  <>
                    <div className="border-b border-zinc-200 pb-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                        <h4 className="font-extrabold text-zinc-900 text-sm">
                          {selectedPart.name}
                        </h4>
                      </div>
                      <p className="text-[11px] italic text-zinc-500 font-serif">
                        {selectedPart.latinName}
                      </p>
                    </div>

                    <p className="text-zinc-700 text-xs">
                      {selectedPart.description}
                    </p>

                    {matchingAdaptiveLabel && (
                      <div className="bg-sky-50 p-2.5 rounded border border-sky-200 text-[11px] text-sky-950 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-sky-900">
                          <Sparkles className="w-3 h-3 text-sky-600" />
                          <span>Reviewed Clinical Mesh Label:</span>
                        </div>
                        <p className="font-semibold">{matchingAdaptiveLabel.label}</p>
                        <p className="text-sky-800">{matchingAdaptiveLabel.description}</p>
                      </div>
                    )}

                    {selectedPart.highYieldFact && (
                      <div className="bg-white p-2 rounded border border-zinc-200 text-[11px] text-zinc-800">
                        <span className="font-bold text-black">USMLE Pearl: </span>
                        {selectedPart.highYieldFact}
                      </div>
                    )}

                    <div className="pt-1 flex flex-col gap-1.5">
                      <button
                        onClick={() =>
                          onAskTutorWithTopic(
                            `Explain the clinical anatomy and pathology of: ${selectedPart.name}`,
                            `${selectedPart.name} (${selectedPart.latinName})\n${selectedPart.description}\nUSMLE: ${selectedPart.highYieldFact}`
                          )
                        }
                        className="w-full py-1.5 px-2 bg-black hover:bg-zinc-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Study in AI Tutor</span>
                      </button>

                      <button
                        onClick={handleIsolateSelected}
                        className="w-full py-1.5 px-2 border border-zinc-300 hover:border-black text-zinc-800 hover:bg-zinc-100 rounded text-xs font-medium transition-colors"
                      >
                        Isolate Structure
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-500 italic">
                    Click on any anatomical structure in the 3D viewer to inspect its details, Latin name, system, and clinical function.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div
            id="status"
            className="text-[11px] text-zinc-500 border-t border-zinc-100 pt-3 leading-normal"
          >
            {statusMessage}
          </div>
        </aside>
      </div>
    </div>
  );
};
