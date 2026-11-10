import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  Upload,
  ShieldCheck,
  Award,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Box,
  Layers,
  ArrowRight,
  Check,
  Lock,
  Unlock,
  Tag,
  FileText,
  Activity,
  Compass,
} from 'lucide-react';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from '../utils/anatomyData';

export interface LearningPlan {
  topic: string;
  attempts: number;
  mastery_estimate: number; // e.g. 0.65
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommend_3d_review: boolean;
}

export interface AdaptiveResource {
  id: string;
  owner_id: string;
  topic: string;
  approved: number;
  content_length: number;
  preview: string;
}

interface AdaptiveKILearningProps {
  userId?: string;
  onNavigateToAnatomy?: () => void;
  onOpenWhiteboard?: () => void;
}

export const AdaptiveKILearning: React.FC<AdaptiveKILearningProps> = ({
  userId = 'usr-1',
  onNavigateToAnatomy,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('Cardiovascular');
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [resources, setResources] = useState<AdaptiveResource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Ingestion form state
  const [newTopic, setNewTopic] = useState<string>('Cardiovascular');
  const [newContent, setNewContent] = useState<string>(
    ANATOMICAL_SYSTEMS[1].sampleStudyNote
  );
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);

  // Reviewer Anatomy Label form state
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [meshName, setMeshName] = useState<string>('left_ventricle');
  const [meshLabel, setMeshLabel] = useState<string>('Left Ventricular Myocardium');
  const [meshDescription, setMeshDescription] = useState<string>(
    'Pumps blood against high systemic vascular resistance (120 mmHg). Perfused primarily during diastole.'
  );

  // Generation state
  const [genMode, setGenMode] = useState<'tutor' | 'mcq'>('tutor');
  const [genQuestion, setGenQuestion] = useState<string>(
    'Why does left coronary artery blood flow occur primarily during diastole?'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [userSelectedOption, setUserSelectedOption] = useState<number | null>(null);
  const [recordedResult, setRecordedResult] = useState<boolean | null>(null);

  // Fetch learning plan and resources when topic changes
  const fetchTopicData = async (topic: string) => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, resListRes] = await Promise.all([
        fetch(`/api/adaptive/learning-plan?userId=${encodeURIComponent(userId)}&topic=${encodeURIComponent(topic)}`),
        fetch(`/api/adaptive/resources?userId=${encodeURIComponent(userId)}&topic=${encodeURIComponent(topic)}`),
      ]);

      const planData = await planRes.json();
      const resListData = await resListRes.json();

      if (planData.success) {
        setLearningPlan(planData.learningPlan);
      }
      if (resListData.success) {
        setResources(resListData.resources || []);
        if (resListData.resources?.length > 0 && !selectedResourceId) {
          setSelectedResourceId(resListData.resources[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch adaptive KI data:', err);
      setError(err?.message || 'Failed to load adaptive learning state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicData(selectedTopic);
  }, [selectedTopic, userId]);

  // Handle uploading and approving resources
  const handleAddResource = async (autoApprove: boolean = true) => {
    if (!newTopic.trim() || !newContent.trim()) {
      setError('Topic and content are required.');
      return;
    }
    setIsSubmittingResource(true);
    setError(null);
    try {
      const addRes = await fetch('/api/adaptive/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topic: newTopic.trim(),
          content: newContent.trim(),
        }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) throw new Error(addData.error || 'Failed to add resource.');

      const resourceId = addData.resourceId;

      if (autoApprove) {
        const appRes = await fetch('/api/adaptive/resources/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId }),
        });
        const appData = await appRes.json();
        if (!appRes.ok) throw new Error(appData.error || 'Failed to approve resource.');
        setStatusMessage(`Resource added and approved (ID: ${resourceId.slice(0, 8)}...).`);
      } else {
        setStatusMessage(`Resource added in pending status (ID: ${resourceId.slice(0, 8)}...).`);
      }

      setSelectedTopic(newTopic.trim());
      await fetchTopicData(newTopic.trim());
    } catch (err: any) {
      console.error('Error submitting resource:', err);
      setError(err?.message || 'Failed to submit resource.');
    } finally {
      setIsSubmittingResource(false);
    }
  };

  // Reviewer approval button for pending items
  const handleApproveResource = async (resourceId: string) => {
    try {
      const res = await fetch('/api/adaptive/resources/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve resource.');
      setStatusMessage(`Resource ${resourceId.slice(0, 8)}... successfully approved.`);
      await fetchTopicData(selectedTopic);
    } catch (err: any) {
      setError(err?.message || 'Approval failed.');
    }
  };

  // Reviewer binding of reviewed resource to 3D Anatomy mesh
  const handleBindAnatomyLabel = async () => {
    if (!selectedResourceId || !meshName.trim() || !meshLabel.trim()) {
      setError('Please select a resource and provide mesh name and label.');
      return;
    }
    try {
      const res = await fetch('/api/adaptive/anatomy-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          modelId: 'human-body',
          meshName: meshName.trim(),
          label: meshLabel.trim(),
          description: meshDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bind anatomy label.');
      setStatusMessage(`Anatomy label successfully bound to 3D mesh: "${meshName}".`);
    } catch (err: any) {
      setError(err?.message || 'Failed to bind anatomy label.');
    }
  };

  // Trigger Adaptive KI Generation (Tutor or MCQ)
  const handleGenerate = async () => {
    if (!genQuestion.trim()) {
      setError('Please provide a medical question or concept.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGenResult(null);
    setUserSelectedOption(null);
    setRecordedResult(null);

    try {
      const storedKey =
        localStorage.getItem('gemini_api_key') ||
        localStorage.getItem('stoic_gemini_api_key') ||
        '';

      const res = await fetch('/api/adaptive/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topic: selectedTopic,
          question: genQuestion.trim(),
          mode: genMode,
          apiKey: storedKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adaptive generation failed.');

      if (data.status === 'needs_resources') {
        setError(data.message || 'No approved resources available for this topic. Upload notes below first.');
        return;
      }

      setGenResult(data.result);
      if (data.learningPlan) {
        setLearningPlan(data.learningPlan);
      }
    } catch (err: any) {
      console.error('Adaptive generate error:', err);
      setError(err?.message || 'Adaptive KI generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Record Answer & update adaptive mastery
  const handleAnswerSubmit = async (chosenIdx: number) => {
    if (!genResult || genResult.correct_index === undefined) return;
    setUserSelectedOption(chosenIdx);

    const isCorrect = chosenIdx === genResult.correct_index;
    setRecordedResult(isCorrect);

    try {
      const res = await fetch('/api/adaptive/record-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topic: selectedTopic,
          correct: isCorrect,
        }),
      });
      const data = await res.json();
      if (data.success && data.learningPlan) {
        setLearningPlan(data.learningPlan);
      }
    } catch (err: any) {
      console.warn('Failed to record answer:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black text-white text-[11px] font-mono uppercase tracking-wider mb-2">
          <Brain className="w-3.5 h-3.5 text-rose-400" />
          <span>Adaptive KI Learning Engine (KI-Gestütztes Lernen)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
          Adaptive Knowledge Intelligence &amp; 3D Review
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-3xl leading-relaxed">
          Dynamic student difficulty calibration, smoothed Bayesian mastery estimation, server-validated performance tracking, and verified provenance chunking bound to 3D anatomical meshes.
        </p>
      </div>

      {/* Status or Error Notifications */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-500 font-bold">✕</button>
        </div>
      )}

      {/* Top Deck: Learning Plan & Adaptive Mastery HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Topic Selector */}
        <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Active Topic
            </span>
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full text-xs font-semibold p-2 rounded-lg border border-zinc-200 bg-zinc-50 focus:border-black outline-none"
          >
            {ANATOMICAL_SYSTEMS.map((s) => (
              <option key={s.id} value={s.name.split(' ')[0]}>
                {s.name}
              </option>
            ))}
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Neuroanatomy">Neuroanatomy</option>
            <option value="Respiratory">Respiratory</option>
            <option value="Musculoskeletal">Musculoskeletal</option>
          </select>
          <div className="text-[10px] text-zinc-400 font-mono">
            {resources.length} approved/pending resources
          </div>
        </div>

        {/* Metric 2: Mastery Estimate */}
        <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Mastery Estimate
            </span>
            <Award className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            {learningPlan ? `${Math.round(learningPlan.mastery_estimate * 100)}%` : '50%'}
          </div>
          <div className="text-[11px] text-zinc-500">
            {learningPlan?.attempts || 0} attempts recorded
          </div>
        </div>

        {/* Metric 3: Dynamic Difficulty Tier */}
        <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Adaptive Difficulty
            </span>
            <Activity className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase font-mono ${
                learningPlan?.difficulty === 'advanced'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : learningPlan?.difficulty === 'intermediate'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {learningPlan?.difficulty || 'beginner'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500">
            Steers KI question depth to current competency.
          </p>
        </div>

        {/* Metric 4: 3D Review Recommendation */}
        <div
          className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between ${
            learningPlan?.recommend_3d_review
              ? 'border-amber-300 bg-amber-50/60'
              : 'border-zinc-200 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                3D Spatial Review
              </span>
              <Box className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xs font-bold text-zinc-900 mt-1">
              {learningPlan?.recommend_3d_review ? 'Recommended' : 'Mastered'}
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
              {learningPlan?.recommend_3d_review
                ? 'Mastery < 60% or < 5 attempts. Visual inspection advised.'
                : 'Cognitive retention verified.'}
            </p>
          </div>
          {onNavigateToAnatomy && (
            <button
              onClick={onNavigateToAnatomy}
              className="mt-2 text-[11px] font-semibold text-black hover:underline flex items-center gap-1"
            >
              <span>Launch 3D Atlas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Grid: Ingestion & Adaptive Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Resource Ingestion & Reviewer Approval (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Upload Study Resource (Private)</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-400">Max 500k Chars</span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Topic (e.g. Cardiovascular)"
                className="w-full text-xs p-2 rounded-lg border border-zinc-200 font-medium focus:border-black outline-none"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                placeholder="Paste plain text extracted from your PDF or notes..."
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-zinc-200 focus:border-black outline-none resize-y"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddResource(true)}
                disabled={isSubmittingResource}
                className="flex-1 py-2 px-3 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSubmittingResource ? 'Processing...' : 'Upload & Approve'}</span>
              </button>

              <button
                onClick={() => handleAddResource(false)}
                disabled={isSubmittingResource}
                className="py-2 px-3 rounded-lg border border-zinc-200 hover:border-black text-zinc-700 text-xs font-medium transition-colors"
                title="Store as pending for reviewer inspection"
              >
                Pending
              </button>
            </div>
          </div>

          {/* List of Topic Resources */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Grounded Knowledge Base ({resources.length})
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">Owner Private</span>
            </div>

            {resources.length === 0 ? (
              <p className="text-xs text-zinc-500 italic p-3 bg-zinc-50 rounded-lg">
                No resources found for topic "{selectedTopic}". Upload notes above to enable adaptive retrieval.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {resources.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-zinc-600">
                        ID: {r.id.slice(0, 8)}...
                      </span>
                      <div className="flex items-center gap-1.5">
                        {r.approved ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveResource(r.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Click to Approve</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-600 line-clamp-2 italic">
                      "{r.preview}..."
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviewer Mesh Binding Tool */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-zinc-900" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Reviewer: Bind Label to 3D Mesh
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500">
              Bind verified clinical facts to 3D interactive anatomical models for visual spatial exploration.
            </p>

            <div className="space-y-2 text-xs">
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full p-2 border border-zinc-200 rounded bg-zinc-50"
              >
                <option value="" disabled>Select approved resource...</option>
                {resources.filter((r) => r.approved).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.topic} ({r.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={meshName}
                onChange={(e) => setMeshName(e.target.value)}
                placeholder="Mesh ID (e.g. left_ventricle, calvarium)"
                className="w-full p-2 border border-zinc-200 rounded bg-white"
              />

              <input
                type="text"
                value={meshLabel}
                onChange={(e) => setMeshLabel(e.target.value)}
                placeholder="Anatomical Label"
                className="w-full p-2 border border-zinc-200 rounded bg-white"
              />

              <textarea
                value={meshDescription}
                onChange={(e) => setMeshDescription(e.target.value)}
                rows={2}
                placeholder="Clinical description verified from text"
                className="w-full p-2 border border-zinc-200 rounded bg-white resize-none"
              />

              <button
                onClick={handleBindAnatomyLabel}
                disabled={!selectedResourceId}
                className="w-full py-1.5 px-3 rounded bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors disabled:opacity-40"
              >
                Attach Label to 3D Anatomy
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Adaptive KI Generation (Tutor & MCQ) (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
                <button
                  onClick={() => setGenMode('tutor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    genMode === 'tutor'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Adaptive Tutor</span>
                </button>

                <button
                  onClick={() => setGenMode('mcq')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    genMode === 'mcq'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Adaptive MCQ</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-zinc-500">
                Depth: <strong className="text-black uppercase">{learningPlan?.difficulty || 'beginner'}</strong>
              </span>
            </div>

            {/* Input Question / Topic */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-900 block">
                Question / Concept to Practice:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={genQuestion}
                  onChange={(e) => setGenQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerate();
                  }}
                  placeholder="e.g. When does coronary artery perfusion occur?"
                  className="flex-1 text-xs p-2.5 rounded-lg border border-zinc-200 focus:border-black outline-none"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                  <span>{isGenerating ? 'Synthesizing...' : 'Generate with KI'}</span>
                </button>
              </div>
            </div>

            {/* Teaching depth prompt banner */}
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed">
              <strong>Grounded Rule:</strong> Answers strictly adhere to approved resources. Untrusted input cannot override clinical evidence. If sources are insufficient, the engine safely refuses.
            </div>
          </div>

          {/* Generated Result Container */}
          {genResult && (
            <div className="border border-zinc-200 rounded-xl p-5 bg-white shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Grounded KI Response</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Provenance: {genResult.source_ids?.length || 0} cited sources
                </span>
              </div>

              {/* Tutor Mode Result */}
              {genMode === 'tutor' && genResult.answer && (
                <div className="text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap font-sans p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  {genResult.answer}
                </div>
              )}

              {/* MCQ Mode Result */}
              {genMode === 'mcq' && genResult.options && (
                <div className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 leading-relaxed">
                    {genResult.question}
                  </h4>

                  <div className="space-y-2">
                    {genResult.options.map((option: string, idx: number) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isChosen = userSelectedOption === idx;
                      const isAnswer = genResult.correct_index === idx;
                      const isRevealed = userSelectedOption !== null;

                      let btnStyle = 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800';
                      if (isRevealed) {
                        if (isAnswer) {
                          btnStyle = 'border-black bg-zinc-900 text-white font-medium shadow-sm';
                        } else if (isChosen && !isAnswer) {
                          btnStyle = 'border-zinc-300 bg-zinc-200 text-zinc-600 line-through';
                        } else {
                          btnStyle = 'border-zinc-200 bg-zinc-50 text-zinc-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isRevealed}
                          onClick={() => handleAnswerSubmit(idx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isRevealed && isAnswer
                                  ? 'bg-white text-black'
                                  : isRevealed && isChosen
                                  ? 'bg-zinc-400 text-white'
                                  : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="leading-snug">{option}</span>
                          </div>
                          {isRevealed && isAnswer && (
                            <Check className="w-4 h-4 text-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {userSelectedOption !== null && (
                    <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs space-y-1.5 mt-3">
                      <div className="flex items-center gap-2">
                        {recordedResult ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct! Adaptive mastery incremented.</span>
                          </span>
                        ) : (
                          <span className="text-amber-800 font-bold flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            <span>Incorrect. Focus area targeted for spaced review.</span>
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-700 leading-relaxed">
                        {genResult.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
