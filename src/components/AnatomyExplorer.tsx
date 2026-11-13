import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ANATOMICAL_SYSTEMS, AnatomySystem, AnatomyPartDef } from '../utils/anatomyData';
import {
  ZAnatomySearchEntry,
  ZAnatomySystemKey,
  searchZAnatomyCatalog,
} from '../utils/zAnatomyCatalog';
import {
  AnatomyCanvas3D,
  AnatomyCanvas3DHandle,
  AnatomicalLayerKey,
  ReproductiveMode,
} from './AnatomyCanvas3D';
import { MuscularAtlas3D } from './MuscularAtlas3D';
import {
  BookOpen,
  Box,
  Activity,
  Palette,
  Search,
  ExternalLink,
  CheckCircle2,
  X,
  Dumbbell,
} from 'lucide-react';

interface AnatomyExplorerProps {
  system?: AnatomySystem;
  onSelectSystem?: (system: AnatomySystem) => void;
  onSelectSystemForTutor: (system: AnatomySystem) => void;
  onSelectSystemForMCQ: (system: AnatomySystem) => void;
  onAskTutorWithTopic: (topic: string, material: string) => void;
  onOpenCanvasWhiteboard?: () => void;
}

type AtlasEngineMode = 'z-anatomy' | 'muscular-atlas';

const DEFAULT_ACTIVE_LAYERS: Record<AnatomicalLayerKey, boolean> = {
  muscles: true,
  skeleton: true,
  organs: true,
  nervous: true,
  circulatory: true,
  lymphatic: false,
  joints: false,
};

const SYSTEM_TO_LAYER: Record<ZAnatomySystemKey, AnatomicalLayerKey> = {
  skeletal: 'skeleton',
  visceral: 'organs',
  muscular: 'muscles',
  nervous: 'nervous',
  cardiovascular: 'circulatory',
  lymphatic: 'lymphatic',
  joints: 'joints',
};

export const AnatomyExplorer: React.FC<AnatomyExplorerProps> = ({
  system = ANATOMICAL_SYSTEMS[0],
  onSelectSystem,
  onAskTutorWithTopic,
  onOpenCanvasWhiteboard,
}) => {
  const canvasRef = useRef<AnatomyCanvas3DHandle | null>(null);
  const explodeBadgeRef = useRef<HTMLSpanElement | null>(null);

  const [atlasEngine, setAtlasEngine] = useState<AtlasEngineMode>('z-anatomy');
  const [selectedPart, setSelectedPart] = useState<AnatomyPartDef | null>(null);
  const [isolatedPartId, setIsolatedPartId] = useState<string | null>(null);
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [renderMode, setRenderMode] = useState<'realistic' | 'xray' | 'wireframe'>('realistic');
  const [showFascia, setShowFascia] = useState<boolean>(false);
  const [reproductiveMode, setReproductiveMode] = useState<ReproductiveMode>('male');
  const [activeClinicalSysId, setActiveClinicalSysId] = useState<string>(system.id);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Initializing Z-Anatomy open-source 3D atlas...'
  );

  // Z-Anatomy structure search
  const [catalog, setCatalog] = useState<ZAnatomySearchEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

  const [activeLayers, setActiveLayers] = useState<Record<AnatomicalLayerKey, boolean>>(
    DEFAULT_ACTIVE_LAYERS
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && !searchFocused) return [];
    return searchZAnatomyCatalog(catalog, searchQuery, 10);
  }, [catalog, searchQuery, searchFocused]);

  const toggleLayer = (layerKey: AnatomicalLayerKey) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const handleEnsureLayerVisible = useCallback((layerKey: AnatomicalLayerKey) => {
    setActiveLayers((prev) => (prev[layerKey] ? prev : { ...prev, [layerKey]: true }));
  }, []);

  const handleShowCompleteBody = () => {
    setActiveLayers(DEFAULT_ACTIVE_LAYERS);
    setShowFascia(false);
    setIsolatedPartId(null);
    setExplodedProgress(0);
    if (explodeBadgeRef.current) explodeBadgeRef.current.textContent = '0%';
    canvasRef.current?.setExplodedLevel(0);
    setSelectedPart(null);
    setSearchQuery('');
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

  const handleSelectSearchEntry = (entry: ZAnatomySearchEntry) => {
    if (
      /uterus|cervix|vagina|ovary|fallopian/i.test(entry.rawName) &&
      reproductiveMode !== 'female'
    ) {
      setReproductiveMode('female');
    }
    const layerKey = SYSTEM_TO_LAYER[entry.system];
    if (layerKey) {
      handleEnsureLayerVisible(layerKey);
    }
    setSearchQuery(entry.displayName);
    setSearchFocused(false);
    requestAnimationFrame(() => {
      canvasRef.current?.focusStructure(entry.rawName);
    });
  };

  const handleClinicalSystemSelect = (sys: AnatomySystem) => {
    setActiveClinicalSysId(sys.id);
    onSelectSystem?.(sys);
    setIsolatedPartId(null);

    if (sys.id === 'skeletal') {
      setActiveLayers({
        muscles: false,
        skeleton: true,
        organs: false,
        nervous: false,
        circulatory: false,
        lymphatic: false,
        joints: true,
      });
    } else if (sys.id === 'cardiovascular') {
      setActiveLayers({
        muscles: false,
        skeleton: false,
        organs: true,
        nervous: false,
        circulatory: true,
        lymphatic: false,
        joints: false,
      });
    } else if (sys.id === 'nervous') {
      setActiveLayers({
        muscles: false,
        skeleton: true,
        organs: false,
        nervous: true,
        circulatory: false,
        lymphatic: false,
        joints: false,
      });
    } else if (sys.id === 'respiratory' || sys.id === 'digestive') {
      setActiveLayers({
        muscles: false,
        skeleton: true,
        organs: true,
        nervous: false,
        circulatory: false,
        lymphatic: false,
        joints: false,
      });
    } else if (sys.id === 'female_reproductive') {
      setAtlasEngine('z-anatomy');
      setReproductiveMode('female');
      setActiveLayers({
        muscles: false,
        skeleton: true,
        organs: true,
        nervous: false,
        circulatory: true,
        lymphatic: false,
        joints: false,
      });
      setTimeout(() => {
        canvasRef.current?.focusStructure('Uterus');
      }, 90);
    } else if (sys.id === 'male_reproductive') {
      setAtlasEngine('z-anatomy');
      setReproductiveMode('male');
      setActiveLayers({
        muscles: false,
        skeleton: true,
        organs: true,
        nervous: false,
        circulatory: true,
        lymphatic: false,
        joints: false,
      });
      setTimeout(() => {
        canvasRef.current?.focusStructure('Prostate');
      }, 90);
    } else {
      setActiveLayers(DEFAULT_ACTIVE_LAYERS);
    }
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="border border-zinc-200 rounded-xl p-3 sm:px-4 sm:py-3 bg-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black text-white text-[10px] font-mono uppercase tracking-wider">
              <Box className="w-3 h-3" />
              <span>Z-Anatomy + Anatomy Atlas 3D</span>
            </div>
            {/* Engine Switcher */}
            <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setAtlasEngine('z-anatomy')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  atlasEngine === 'z-anatomy'
                    ? 'bg-black text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <Box className="w-3 h-3" />
                <span>Full Body (7 Systems + Pelvis)</span>
              </button>
              <button
                type="button"
                onClick={() => setAtlasEngine('muscular-atlas')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  atlasEngine === 'muscular-atlas'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                <Dumbbell className="w-3 h-3" />
                <span>Muscular &amp; Exercise Atlas</span>
              </button>
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900">
            Interactive 3D Anatomical Atlas
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-600 max-w-2xl leading-snug">
            {atlasEngine === 'z-anatomy'
              ? 'Full 7-system Z-Anatomy models (CC BY-SA 4.0) with fast X-Ray pooling, smooth Exploded View & Male/Female pelvic anatomy.'
              : 'Cloned from SirwanAfifi/anatomy-atlas: 126 sculpted muscle subdivisions with 2K fibre maps, joint landmarks, and local Exercise Library.'}
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedPart ? (
            <button
              type="button"
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
              type="button"
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
              type="button"
              onClick={onOpenCanvasWhiteboard}
              className="px-3.5 py-2 rounded border border-cyan-300 bg-cyan-50/80 hover:bg-cyan-100 hover:border-cyan-500 text-cyan-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Draw and annotate over this anatomical system on the Study Canvas"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-700" />
              <span>Annotate in Study Canvas</span>
            </button>
          )}

          {atlasEngine === 'z-anatomy' && (
            <button
              type="button"
              onClick={handleShowCompleteBody}
              className="px-3.5 py-2 rounded border border-zinc-300 hover:border-black text-zinc-900 hover:bg-zinc-50 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-black" />
              <span>Reset Complete Body</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode 2: Muscular & Exercise Atlas (SirwanAfifi/anatomy-atlas) */}
      {atlasEngine === 'muscular-atlas' ? (
        <MuscularAtlas3D onAskTutorWithTopic={onAskTutorWithTopic} />
      ) : (
        <>
          {/* Clinical Systems Selector Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1 text-xs">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
              Clinical System:
            </span>
            {ANATOMICAL_SYSTEMS.map((sys) => {
              const isActive = (onSelectSystem ? system.id : activeClinicalSysId) === sys.id;
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => handleClinicalSystemSelect(sys)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <span>{sys.icon}</span>
                  <span>{sys.name.split(' (')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Main Container: Sticky 3D Viewer + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="flex-1 min-w-0 w-full lg:sticky lg:top-20 self-start">
              <AnatomyCanvas3D
                ref={canvasRef}
                onSelectPart={setSelectedPart}
                selectedPart={selectedPart}
                explodedProgress={explodedProgress}
                onExplodedProgressChange={setExplodedProgress}
                activeLayers={activeLayers}
                showFascia={showFascia}
                reproductiveMode={reproductiveMode}
                renderMode={renderMode}
                onStatusUpdate={setStatusMessage}
                isolatedPartId={isolatedPartId}
                onIsolatePart={setIsolatedPartId}
                onCatalogReady={setCatalog}
                onEnsureLayerVisible={handleEnsureLayerVisible}
              />
            </div>

            <aside
              id="sidebar"
              className="w-full lg:w-[340px] bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-4 shrink-0 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Z-Anatomy Structure Search & Focus */}
                <div className="relative space-y-1.5 border-b border-zinc-100 pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-zinc-900">Z-Anatomy 3D Atlas</h2>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {catalog.length > 0 ? `${catalog.length.toLocaleString()} structures` : 'Loading index'}
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setSearchFocused(false), 180);
                      }}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchFocused(true);
                      }}
                      placeholder="Search Z-Anatomy (e.g. Uterus, Femur)..."
                      aria-label="Search Z-Anatomy structures"
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-black text-zinc-900 placeholder:text-zinc-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear structure search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {searchFocused && searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-zinc-100">
                        {searchResults.map((entry) => (
                          <button
                            key={`${entry.system}-${entry.rawName}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSearchEntry(entry);
                            }}
                            onClick={() => handleSelectSearchEntry(entry)}
                            className="w-full text-left px-2.5 py-2 hover:bg-zinc-50 transition-colors flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-zinc-900 truncate">
                                {entry.displayName}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 shrink-0">
                                {entry.system}
                              </span>
                            </div>
                            {entry.latinName && (
                              <span className="text-[11px] italic text-zinc-500 font-serif truncate">
                                {entry.latinName}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pelvic Reproductive Anatomy Switcher */}
                <div className="space-y-1.5 border-b border-zinc-100 pb-3">
                  <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                    Reproductive Pelvis Model
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setReproductiveMode('male');
                        setActiveLayers((prev) => ({ ...prev, organs: true }));
                        setTimeout(() => canvasRef.current?.focusStructure('Prostate'), 60);
                      }}
                      className={`py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1 ${
                        reproductiveMode === 'male'
                          ? 'bg-cyan-700 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-black'
                      }`}
                    >
                      <span>♂ Male Pelvis</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReproductiveMode('female');
                        setActiveLayers((prev) => ({ ...prev, organs: true, muscles: false }));
                        setTimeout(() => canvasRef.current?.focusStructure('Uterus'), 60);
                      }}
                      className={`py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1 ${
                        reproductiveMode === 'female'
                          ? 'bg-pink-700 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-black'
                      }`}
                    >
                      <span>♀ Female Pelvis</span>
                    </button>
                  </div>
                </div>

                {/* Selected Anatomy Dossier */}
                {selectedPart && (
                  <div className="section space-y-2 border-b border-zinc-100 pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Selected Anatomy
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedPart(null)}
                        className="text-[11px] text-zinc-400 hover:text-black"
                      >
                        Clear
                      </button>
                    </div>

                    <div
                      id="info"
                      className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-xs leading-relaxed break-words space-y-2"
                    >
                      <div className="border-b border-zinc-200 pb-2 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-zinc-900 text-sm">
                            {selectedPart.name}
                          </h4>
                          {selectedPart.isOfficialTA && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-semibold shrink-0"
                              title="Official Terminologia Anatomica entry"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>TA</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] italic text-zinc-500 font-serif">
                          {selectedPart.latinName}
                        </p>
                      </div>

                      <p className="text-zinc-700 text-xs">{selectedPart.description}</p>

                      {selectedPart.wikipediaUrl && (
                        <a
                          href={selectedPart.wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-2"
                        >
                          <span>Read Z-Anatomy Reference</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {selectedPart.highYieldFact && (
                        <div className="bg-white p-2 rounded border border-zinc-200 text-[11px] text-zinc-800">
                          <span className="font-bold text-black">Clinical Focus: </span>
                          {selectedPart.highYieldFact}
                        </div>
                      )}

                      <div className="pt-1 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onAskTutorWithTopic(
                              `Explain the clinical anatomy and pathology of: ${selectedPart.name}`,
                              `${selectedPart.name} (${selectedPart.latinName})\n${selectedPart.description}\nClinical: ${selectedPart.highYieldFact}`
                            )
                          }
                          className="flex-1 py-1.5 px-2 bg-black hover:bg-zinc-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Study in Tutor</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleIsolateSelected}
                          className="py-1.5 px-2.5 border border-zinc-300 hover:border-black text-zinc-800 hover:bg-zinc-100 rounded text-xs font-medium transition-colors"
                        >
                          Isolate
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anatomical Systems Layer Checkboxes */}
                <div className="section space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Anatomical Systems
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLayers(DEFAULT_ACTIVE_LAYERS);
                          setShowFascia(false);
                        }}
                        className="text-zinc-800 hover:text-black font-semibold"
                      >
                        Full Ecorché
                      </button>
                      <span className="text-zinc-300">•</span>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveLayers({
                            muscles: false,
                            skeleton: true,
                            organs: false,
                            nervous: false,
                            circulatory: false,
                            lymphatic: false,
                            joints: true,
                          })
                        }
                        className="text-zinc-500 hover:text-black font-medium"
                      >
                        Skeleton
                      </button>
                      <span className="text-zinc-300">•</span>
                      <button
                        type="button"
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
                        className="text-zinc-500 hover:text-black font-medium"
                      >
                        All On
                      </button>
                      <span className="text-zinc-300">•</span>
                      <button
                        type="button"
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
                        className="text-zinc-500 hover:text-black font-medium"
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {(
                      [
                        ['muscles', 'Muscular System'],
                        ['skeleton', 'Skeletal System'],
                        ['organs', 'Internal Organs (Viscera)'],
                        ['nervous', 'Nervous System'],
                        ['circulatory', 'Cardiovascular System'],
                        ['lymphatic', 'Lymphatic System'],
                        ['joints', 'Joints & Ligaments'],
                      ] as [AnatomicalLayerKey, string][]
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2.5 p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg cursor-pointer text-xs font-medium text-zinc-800 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={activeLayers[key]}
                          onChange={() => toggleLayer(key)}
                          className="w-4 h-4 accent-black rounded"
                        />
                        <span>{label}</span>
                      </label>
                    ))}

                    <label className="flex items-center justify-between gap-2.5 p-2 bg-sky-50/60 hover:bg-sky-100/60 border border-sky-200 rounded-lg cursor-pointer text-xs font-medium text-sky-950 transition-colors">
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={showFascia}
                          onChange={(e) => setShowFascia(e.target.checked)}
                          className="w-4 h-4 accent-sky-700 rounded"
                        />
                        <span>Fascia &amp; Membranes (Translucent)</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Dissection Controls */}
                <div className="section space-y-2 border-t border-zinc-100 pt-3">
                  <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Dissection Controls
                  </h3>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={handleIsolateSelected}
                      disabled={!selectedPart}
                      className="py-1.5 px-2.5 border border-zinc-300 hover:border-black text-zinc-800 disabled:opacity-40 disabled:pointer-events-none hover:bg-zinc-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Isolate Selected
                    </button>

                    <button
                      type="button"
                      onClick={handleShowAllStructures}
                      className="py-1.5 px-2.5 border border-zinc-300 hover:border-black text-zinc-800 hover:bg-zinc-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Show All Parts
                    </button>
                  </div>

                  {/* Imperative 60fps Exploded Separation Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700">
                      <span>Exploded Separation:</span>
                      <span
                        ref={explodeBadgeRef}
                        className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200"
                      >
                        {Math.round(explodedProgress * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      defaultValue={explodedProgress}
                      onInput={(e) => {
                        const val = parseFloat((e.target as HTMLInputElement).value);
                        if (explodeBadgeRef.current) {
                          explodeBadgeRef.current.textContent = `${Math.round(val * 100)}%`;
                        }
                        canvasRef.current?.setExplodedLevel(val);
                      }}
                      onChange={(e) => setExplodedProgress(parseFloat(e.target.value))}
                      aria-label="Exploded anatomical separation"
                      className="w-full accent-black cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
                    />
                  </div>

                  {/* Render Modes */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-zinc-700 block">
                      Visual Render Mode:
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs font-semibold">
                      {(
                        [
                          ['realistic', 'Realistic'],
                          ['xray', 'X-Ray'],
                          ['wireframe', 'Wireframe'],
                        ] as const
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setRenderMode(mode)}
                          className={`py-1 rounded transition-colors ${
                            renderMode === mode
                              ? 'bg-black text-white shadow-sm'
                              : 'text-zinc-600 hover:text-black'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {!selectedPart && (
                  <div className="section space-y-2 border-t border-zinc-100 pt-3">
                    <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Selected Anatomy
                    </h3>
                    <div
                      id="info"
                      className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-xs leading-relaxed text-zinc-500 italic"
                    >
                      Click any structure in the 3D viewport or switch to Female/Male pelvis to inspect its Latin nomenclature, definition, and clinical role.
                    </div>
                  </div>
                )}
              </div>

              <div
                id="status"
                className="text-[11px] text-zinc-500 border-t border-zinc-100 pt-3 leading-normal space-y-1"
              >
                <div>{statusMessage}</div>
                <div className="text-[10px] text-zinc-400">
                  Models &amp; Atlas: github.com/Z-Anatomy &amp; SirwanAfifi/anatomy-atlas (CC BY-SA 4.0)
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
