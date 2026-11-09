import React, { useState } from 'react';
import {
  Search,
  Menu,
  X,
  Box,
  BookOpen,
  HelpCircle,
  FileText,
  Sparkles,
  Bot,
  Layers,
  ChevronRight,
  User,
  Zap,
  Palette,
} from 'lucide-react';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from '../utils/anatomyData';
import { UserProfile } from '../utils/userStore';

export type ActiveTab = 'front' | 'anatomy' | 'tutor' | 'mcq' | 'papers' | 'chat' | 'canvas';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onSelectSystemFromSearch: (system: AnatomySystem) => void;
  onOpenGoogleNotes: () => void;
  onOpenAuth: () => void;
  onOpenPayment: () => void;
  onOpenCanva?: () => void;
  currentUser: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onSelectSystemFromSearch,
  onOpenGoogleNotes,
  onOpenAuth,
  onOpenPayment,
  onOpenCanva,
  currentUser,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSystems = ANATOMICAL_SYSTEMS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parts.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'front', label: 'Home', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'anatomy', label: '3D Anatomy', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'tutor', label: 'AI Tutor', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'mcq', label: 'High-Yield MCQs', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'papers', label: 'PubMed Papers', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'canvas', label: 'Study Canvas', icon: <Palette className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Brand Logo: Clean Black & White */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onTabChange('front')}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-7 h-7 rounded bg-black flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-wider text-black leading-none">
                  MEDSTUDY<span className="text-zinc-500 font-semibold text-xs ml-1">STOIC</span>
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                  3D Anatomy &amp; Tutor
                </span>
              </div>
            </button>

            {/* Desktop Navigation Tabs: Clean Monochrome */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Tools: Search, Google Notes, User Profile & Auth */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-zinc-200 text-zinc-500 hover:text-black hover:border-black text-xs font-medium transition-colors"
              aria-label="Search Anatomy"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Search...</span>
              <kbd className="hidden lg:inline px-1 py-0.5 rounded text-[10px] bg-zinc-100 border border-zinc-300 text-zinc-500">
                ⌘K
              </kbd>
            </button>

            {/* Connected Canva Account Button */}
            {onOpenCanva && (
              <button
                onClick={onOpenCanva}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-cyan-200 bg-cyan-50/80 text-cyan-950 hover:bg-cyan-100 hover:border-cyan-400 text-xs font-semibold transition-all shadow-2xs"
                title="Connected Canva Account (saiarts9848@gmail.com)"
              >
                <div className="w-4 h-4 rounded bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white shadow-xs">
                  C
                </div>
                <span>Canva Hub</span>
              </button>
            )}

            {/* Google Notes Button */}
            <button
              onClick={onOpenGoogleNotes}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-zinc-200 text-zinc-700 text-xs font-medium hover:border-black hover:bg-zinc-50 transition-colors"
              title="Open Google Notes & Keep Sync"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-900" />
              <span>Notes</span>
            </button>

            {/* Black Features Button: PRO Pass */}
            <button
              onClick={onOpenPayment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-sm"
              title="Manage Clinician Pass & Database Storage"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentUser.isPro ? 'PRO Member' : 'PRO Pass'}</span>
            </button>

            {/* User Profile / Auth Button */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-zinc-200 hover:border-black transition-colors"
              title="Account Settings & Cloud Storage"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-900 font-bold text-[11px] flex items-center justify-center border border-zinc-300">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-zinc-800 hidden xl:inline">
                {currentUser.name || 'Account'}
              </span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded border border-zinc-200 text-zinc-600 hover:text-black"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium ${
                  activeTab === item.id
                    ? 'bg-black text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-lg border border-zinc-300 w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-3 border-b border-zinc-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organs, clinical notes, or pathology..."
                autoFocus
                className="w-full text-xs outline-none text-zinc-900 placeholder-zinc-400"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 rounded text-zinc-400 hover:text-black text-xs"
              >
                ESC
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredSystems.map((sys) => (
                <button
                  key={sys.id}
                  onClick={() => {
                    onSelectSystemFromSearch(sys);
                    onTabChange('anatomy');
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-2.5 rounded hover:bg-zinc-100 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-zinc-900">{sys.name}</div>
                    <div className="text-[11px] text-zinc-500 truncate max-w-md">
                      {sys.shortSummary}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
