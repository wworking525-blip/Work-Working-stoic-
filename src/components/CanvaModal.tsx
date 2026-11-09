import React, { useState } from 'react';
import {
  X,
  Palette,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Download,
  Share2,
  Sparkles,
  GraduationCap,
  Layers,
  ArrowRight,
  Settings,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  CanvaAccountProfile,
  getStoredCanvaProfile,
  saveStoredCanvaProfile,
  MOCK_CANVAS_LMS_COURSES,
  CanvasLmsCourse,
} from '../utils/canvaIntegration';

interface CanvaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWhiteboard: () => void;
  onIngestCourseToTutor: (course: CanvasLmsCourse) => void;
  onIngestCourseToMCQ: (course: CanvasLmsCourse) => void;
}

export const CanvaModal: React.FC<CanvaModalProps> = ({
  isOpen,
  onClose,
  onOpenWhiteboard,
  onIngestCourseToTutor,
  onIngestCourseToMCQ,
}) => {
  const [profile, setProfile] = useState<CanvaAccountProfile>(getStoredCanvaProfile());
  const [activeTab, setActiveTab] = useState<'canva' | 'canvas_lms'>('canva');
  const [notification, setNotification] = useState<string | null>(null);
  const [lmsUrl, setLmsUrl] = useState(profile.canvasLmsUrl || 'https://canvas.instructure.com');
  const [lmsToken, setLmsToken] = useState('canv_med_9848_saiarts_edu');
  const [courses, setCourses] = useState<CanvasLmsCourse[]>(MOCK_CANVAS_LMS_COURSES);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenCanva = (path = '') => {
    const url = path ? `https://www.canva.com/${path}` : 'https://www.canva.com';
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening Canva in a new tab with your connected account.');
  };

  const handleSaveLms = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      canvasLmsUrl: lmsUrl,
      canvasLmsConnected: true,
    };
    setProfile(updated);
    saveStoredCanvaProfile(updated);
    showToast('Canvas LMS connection updated and synced with MedStudy.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-lg">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">
                  Canva &amp; Canvas LMS Studio Hub
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Connected to <span className="font-semibold text-zinc-700">{profile.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-zinc-200 bg-white px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('canva')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'canva'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Canva Design &amp; Whiteboard</span>
          </button>
          <button
            onClick={() => setActiveTab('canvas_lms')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'canvas_lms'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Canvas LMS Courses (Medical School)</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="px-6 py-2 bg-zinc-900 text-white text-xs flex items-center justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-800 text-xs">
          {activeTab === 'canva' ? (
            <div className="space-y-6">
              {/* Account Status Card */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900">{profile.workspaceName}</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-200 font-mono text-[10px] text-zinc-700">
                      {profile.accountType}
                    </span>
                  </div>
                  <p className="text-zinc-600">
                    User: <strong className="text-zinc-900">{profile.name}</strong> ({profile.email})
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Synced with Canva API • Instant drawing export &amp; presentation slide generator
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCanva()}
                  className="px-3.5 py-2 rounded-lg bg-black hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch Canva</span>
                </button>
              </div>

              {/* Quick Actions Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Canva Study Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Action 1: Interactive Whiteboard */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-black transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold">
                        <Palette className="w-4 h-4 text-cyan-600" />
                        <span>Interactive Study Canvas</span>
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        Draw, annotate, and mark surgical planes or nerve vectors over 3D anatomical models.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenWhiteboard();
                      }}
                      className="w-full py-1.5 px-3 rounded bg-zinc-900 hover:bg-black text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open Drawing Canvas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action 2: Medical Flashcards in Canva */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-black transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>Canva Medical Flashcards</span>
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        Generate high-yield visual flashcards in Canva with USMLE Step 1 pearls and diagrams.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenCanva('search?q=medical+flashcards')}
                      className="w-full py-1.5 px-3 rounded border border-zinc-300 hover:border-black text-zinc-900 hover:bg-zinc-50 font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Create Flashcard Set</span>
                    </button>
                  </div>

                  {/* Action 3: Anatomical Infographics */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-black transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>Anatomy Infographics</span>
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        Design clinical infographics for organ systems, valve hemodynamics, and biomechanical levers.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenCanva('search?q=medical+infographic')}
                      className="w-full py-1.5 px-3 rounded border border-zinc-300 hover:border-black text-zinc-900 hover:bg-zinc-50 font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Create Infographic</span>
                    </button>
                  </div>

                  {/* Action 4: Clinical Presentation Slides */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-black transition-all flex flex-col justify-between space-y-3 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>Clinical Case Slides</span>
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        Build ward-round and morbidity/mortality clinical presentation slides directly in Canva.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenCanva('search?q=medical+presentation')}
                      className="w-full py-1.5 px-3 rounded border border-zinc-300 hover:border-black text-zinc-900 hover:bg-zinc-50 font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                      <span>Open Slide Templates</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Canvas LMS Form */}
              <form onSubmit={handleSaveLms} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-black" />
                    <span>Canvas LMS Integration (Instructure)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Token
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Connect your medical university's Canvas LMS endpoint to pull lecture slides, syllabus, and reading materials into the NotebookLM tutor.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                      Institution Canvas URL
                    </label>
                    <input
                      type="url"
                      value={lmsUrl}
                      onChange={(e) => setLmsUrl(e.target.value)}
                      placeholder="https://canvas.instructure.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                      API Access Token
                    </label>
                    <input
                      type="password"
                      value={lmsToken}
                      onChange={(e) => setLmsToken(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 text-xs bg-white focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-black text-white font-medium text-xs hover:bg-zinc-800 transition-colors"
                  >
                    Update Connection
                  </button>
                </div>
              </form>

              {/* Course List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Enrolled Medical Courses ({courses.length})
                  </h3>
                  <span className="text-[11px] text-zinc-400">Click to import into AI Tutor or MCQs</span>
                </div>

                <div className="space-y-2.5">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px] font-bold text-zinc-800">
                              {course.code}
                            </span>
                            <span className="font-bold text-zinc-900 text-xs">{course.name}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{course.syllabusSnippet}</p>
                        </div>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap">{course.term}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                        <span className="text-[11px] text-zinc-500">
                          {course.moduleCount} modules • {course.filesCount} lecture PDFs
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onIngestCourseToTutor(course);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-black hover:bg-zinc-800 text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Study in Tutor</span>
                          </button>
                          <button
                            onClick={() => {
                              onIngestCourseToMCQ(course);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded border border-zinc-300 hover:border-black text-zinc-800 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>Generate Exam</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>Canva Account: <strong>{profile.email}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-300 hover:border-black text-zinc-800 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
