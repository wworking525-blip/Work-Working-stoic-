import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { FrontHub } from './components/FrontHub';
import { AnatomyExplorer } from './components/AnatomyExplorer';
import { StoicTutor } from './components/StoicTutor';
import { MCQPractice } from './components/MCQPractice';
import { BiomedicalPapers } from './components/BiomedicalPapers';
import { StoicChatbot } from './components/StoicChatbot';
import { AuthModal } from './components/AuthModal';
import { GoogleNotesModal } from './components/GoogleNotesModal';
import { PaymentModal } from './components/PaymentModal';
import { CanvaModal } from './components/CanvaModal';
import { StudyCanvasWhiteboard } from './components/StudyCanvasWhiteboard';
import { AdaptiveKILearning } from './components/AdaptiveKILearning';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from './utils/anatomyData';
import { UserProfile, loadUserFromStorage, saveUserToStorage } from './utils/userStore';
import { CanvasLmsCourse } from './utils/canvaIntegration';
import { auth, onAuthStateChanged, testConnection, fetchUserProfileFromFirestore, syncUserProfileToFirestore } from './utils/firebase';
import { ShieldCheck, Sparkles, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('front');
  const [currentUser, setCurrentUser] = useState<UserProfile>(loadUserFromStorage());

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [googleNotesModalOpen, setGoogleNotesModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [canvaModalOpen, setCanvaModalOpen] = useState(false);

  // Test persistent Firestore connection on startup & sync user
  useEffect(() => {
    testConnection().catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const remoteProfile = await fetchUserProfileFromFirestore();
          if (remoteProfile) {
            setCurrentUser(remoteProfile);
            saveUserToStorage(remoteProfile);
          } else {
            // Initial sync to Firestore
            await syncUserProfileToFirestore(currentUser);
          }
        } catch (e) {
          console.warn('Persistent database profile sync status:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Shared study context across modules
  const [currentSystem, setCurrentSystem] = useState<AnatomySystem>(ANATOMICAL_SYSTEMS[0]);
  const [studyMaterial, setStudyMaterial] = useState<string>(ANATOMICAL_SYSTEMS[0].sampleStudyNote);
  const [sourceName, setSourceName] = useState<string>('Pre-loaded: Skeletal Biomechanics');
  const [targetTopic, setTargetTopic] = useState<string>('');



  const handleUpdateMaterial = (newMaterial: string, newSourceName?: string) => {
    setStudyMaterial(newMaterial);
    if (newSourceName) {
      setSourceName(newSourceName);
    }
  };

  const handleSelectSystemForTutor = (sys: AnatomySystem) => {
    setCurrentSystem(sys);
    setStudyMaterial(sys.sampleStudyNote);
    setSourceName(`System Note: ${sys.name}`);
    setTargetTopic('');
    setActiveTab('tutor');
  };

  const handleSelectSystemForMCQ = (sys: AnatomySystem) => {
    setCurrentSystem(sys);
    setStudyMaterial(sys.sampleStudyNote);
    setSourceName(`System Note: ${sys.name}`);
    setActiveTab('mcq');
  };

  const handleAskTutorWithTopic = (topic: string, material: string) => {
    setStudyMaterial(material);
    setSourceName(`Anatomy Part: ${topic}`);
    setTargetTopic(topic);
    setActiveTab('tutor');
  };

  const handleSendPaperToTutor = (abstractText: string, title: string) => {
    const paperContent = `RESEARCH ARTICLE: ${title}\n\nPEER-REVIEWED ABSTRACT:\n${abstractText}`;
    setStudyMaterial(paperContent);
    setSourceName(`PubMed: ${title.slice(0, 45)}...`);
    setTargetTopic(`Explain the clinical mechanisms and findings of: ${title}`);
    setActiveTab('tutor');
  };

  const handleSendGoogleNoteToTutor = (content: string, title: string) => {
    const noteContent = `GOOGLE NOTE: ${title}\n\n${content}`;
    setStudyMaterial(noteContent);
    setSourceName(`Google Note: ${title}`);
    setTargetTopic(title);
    setActiveTab('tutor');
  };

  const handleSendGoogleNoteToMCQ = (content: string, title: string) => {
    const noteContent = `GOOGLE NOTE: ${title}\n\n${content}`;
    setStudyMaterial(noteContent);
    setSourceName(`Google Note: ${title}`);
    setActiveTab('mcq');
  };

  const handleIngestCourseToTutor = (course: CanvasLmsCourse) => {
    const courseContent = `CANVAS LMS COURSE: ${course.code} - ${course.name} (${course.term})\n\nSYLLABUS & OVERVIEW:\n${course.syllabusSnippet}\n\nLECTURE MODULE NOTES:\n${course.sampleLectureNote}`;
    setStudyMaterial(courseContent);
    setSourceName(`Canvas LMS: ${course.code}`);
    setTargetTopic(`Explain the core clinical mechanisms from ${course.name} (${course.code})`);
    setActiveTab('tutor');
  };

  const handleIngestCourseToMCQ = (course: CanvasLmsCourse) => {
    const courseContent = `CANVAS LMS COURSE: ${course.code} - ${course.name}\n\n${course.sampleLectureNote}`;
    setStudyMaterial(courseContent);
    setSourceName(`Canvas LMS: ${course.code}`);
    setActiveTab('mcq');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    saveUserToStorage(user);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      {/* Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenGoogleNotes={() => setGoogleNotesModalOpen(true)}
        onOpenPayment={() => setPaymentModalOpen(true)}
        onOpenCanva={() => setCanvaModalOpen(true)}
        onSelectSystemFromSearch={(sys) => {
          setCurrentSystem(sys);
          setStudyMaterial(sys.sampleStudyNote);
          setSourceName(`System Note: ${sys.name}`);
        }}
      />

      {/* Main Content Viewport: Persistent Tabs to Prevent Re-render State Loss */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={activeTab === 'front' ? 'block' : 'hidden'}>
          <FrontHub
            user={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
            onNavigateToAnatomy={() => setActiveTab('anatomy')}
            onNavigateToTutor={() => setActiveTab('tutor')}
            onNavigateToMCQ={() => setActiveTab('mcq')}
            onNavigateToPapers={() => setActiveTab('papers')}
            onNavigateToCanvas={() => setActiveTab('canvas')}
            onSelectSystem={(sys) => {
              setCurrentSystem(sys);
              setStudyMaterial(sys.sampleStudyNote);
              setSourceName(`System Note: ${sys.name}`);
              setActiveTab('anatomy');
            }}
            onOpenGoogleNotes={() => setGoogleNotesModalOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        </div>

        <div className={activeTab === 'anatomy' ? 'block' : 'hidden'}>
          <AnatomyExplorer
            system={currentSystem}
            onSelectSystem={(sys) => {
              setCurrentSystem(sys);
              setStudyMaterial(sys.sampleStudyNote);
              setSourceName(`System Note: ${sys.name}`);
            }}
            onSelectSystemForTutor={handleSelectSystemForTutor}
            onSelectSystemForMCQ={handleSelectSystemForMCQ}
            onAskTutorWithTopic={handleAskTutorWithTopic}
            onOpenCanvasWhiteboard={() => setActiveTab('canvas')}
          />
        </div>

        <div className={activeTab === 'adaptive' ? 'block' : 'hidden'}>
          <AdaptiveKILearning
            userId={currentUser.id || 'usr-1'}
            onNavigateToAnatomy={() => setActiveTab('anatomy')}
            onOpenWhiteboard={() => setActiveTab('canvas')}
          />
        </div>

        <div className={activeTab === 'tutor' ? 'block' : 'hidden'}>
          <StoicTutor
            initialMaterial={studyMaterial}
            initialTopic={targetTopic}
            sourceName={sourceName}
            onUpdateMaterial={handleUpdateMaterial}
            onNavigateToMCQ={(mat) => {
              handleUpdateMaterial(mat);
              setActiveTab('mcq');
            }}
          />
        </div>

        <div className={activeTab === 'mcq' ? 'block' : 'hidden'}>
          <MCQPractice
            material={studyMaterial}
            systemName={sourceName || currentSystem.name}
            onOpenTutor={() => setActiveTab('tutor')}
            onUpdateMaterial={handleUpdateMaterial}
          />
        </div>

        <div className={activeTab === 'papers' ? 'block' : 'hidden'}>
          <BiomedicalPapers onSendToTutor={handleSendPaperToTutor} />
        </div>

        <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
          <StoicChatbot
            currentSystem={currentSystem}
            uploadedMaterial={studyMaterial}
          />
        </div>

        <div className={activeTab === 'canvas' ? 'block' : 'hidden'}>
          {activeTab === 'canvas' && (
            <StudyCanvasWhiteboard
              onSendToTutor={handleAskTutorWithTopic}
              onSendToMCQ={(topic) => {
                setTargetTopic(topic);
                setActiveTab('mcq');
              }}
              onSaveToNotes={(title, content) => {
                handleSendGoogleNoteToTutor(content, title);
              }}
            />
          )}
        </div>
      </main>

      {/* Canva & Canvas LMS Account Hub Modal */}
      <CanvaModal
        isOpen={canvaModalOpen}
        onClose={() => setCanvaModalOpen(false)}
        onOpenWhiteboard={() => setActiveTab('canvas')}
        onIngestCourseToTutor={handleIngestCourseToTutor}
        onIngestCourseToMCQ={handleIngestCourseToMCQ}
      />

      {/* Email Login / Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Google Notes Modal & Sync Manager */}
      <GoogleNotesModal
        isOpen={googleNotesModalOpen}
        onClose={() => setGoogleNotesModalOpen(false)}
        onSendToTutor={handleSendGoogleNoteToTutor}
        onSendToMCQ={handleSendGoogleNoteToMCQ}
      />

      {/* Pillar 4: Simulated Sandbox Paywall Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          saveUserToStorage(updated);
        }}
      />

      {/* Minimalist Monochrome Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 px-4 text-xs text-zinc-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-black text-white font-bold text-xs flex items-center justify-center">
              S
            </div>
            <span className="font-bold text-zinc-900">
              STOIC
            </span>
            <span>•</span>
            <span>3D Anatomy, Strict Grounded Tutor &amp; USMLE Simulators</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
              <span>Grounded Evidence Citations</span>
            </span>
            <span>•</span>
            <span>Google Notes Sync</span>
            <span>•</span>
            <span>NCBI PubMed Grounded</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 leading-relaxed">
          Disclaimer: STOIC is an interactive medical &amp; biomechanical education platform designed for students, residents, and instructors. Content is synthesized from uploaded materials, peer-reviewed literature, standard anatomical texts, and physical principles.
        </div>
      </footer>
    </div>
  );
}
