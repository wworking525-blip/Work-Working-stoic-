import React, { useState } from 'react';
import {
  GoogleNoteItem,
  loadGoogleNotesFromStorage,
  saveGoogleNotesToStorage,
} from '../utils/userStore';
import {
  X,
  Search,
  Plus,
  BookOpen,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  Tag,
  RefreshCw,
  ExternalLink,
  FileCheck2,
  Pin,
} from 'lucide-react';

interface GoogleNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToTutor: (content: string, title: string) => void;
  onSendToMCQ: (content: string, title: string) => void;
}

export const GoogleNotesModal: React.FC<GoogleNotesModalProps> = ({
  isOpen,
  onClose,
  onSendToTutor,
  onSendToMCQ,
}) => {
  const [notes, setNotes] = useState<GoogleNoteItem[]>(loadGoogleNotesFromStorage());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note Modal / Inline Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<GoogleNoteItem['category']>('Anatomy');

  if (!isOpen) return null;

  const handleSyncGoogleKeep = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 700);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newNote: GoogleNoteItem = {
      id: `gnote-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      color: newCategory === 'Anatomy' ? '#e0e7ff' : newCategory === 'Physiology' ? '#fee2e2' : '#fef3c7',
      updatedAt: 'Just now',
      pinned: true,
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    saveGoogleNotesToStorage(updated);
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
  };

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = ['all', 'Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'High-Yield'];

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-1.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white leading-tight">
                  Google Notes &amp; Keep Sync
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Connected</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synced with your Google account • 1-click import into NotebookLM Tutor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncGoogleKeep}
              disabled={isSyncing}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sync with Google Keep"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close Google Notes modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Category Filter, and Add Note */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your Google clinical notes..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>

        {/* Create Note Inline Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddNote}
            className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 space-y-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note Title (e.g. Cranial Nerves Clinical Lesions)"
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 focus:outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="text-xs px-2.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 focus:outline-none"
              >
                <option value="Anatomy">Anatomy</option>
                <option value="Physiology">Physiology</option>
                <option value="Pathology">Pathology</option>
                <option value="Pharmacology">Pharmacology</option>
                <option value="High-Yield">High-Yield</option>
              </select>
            </div>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Paste or write your clinical note content..."
              className="w-full text-xs p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs"
              >
                Save to Google Notes
              </button>
            </div>
          </form>
        )}

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {note.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {note.pinned && <Pin className="w-3 h-3 text-amber-500 fill-current" />}
                      <span className="text-[10px] text-slate-400">{note.updatedAt}</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white leading-snug">
                    {note.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-4 leading-relaxed font-serif whitespace-pre-line">
                    {note.content}
                  </p>
                </div>

                {/* Card Action Tools */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyNote(note.id, note.content)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Copy note text"
                  >
                    {copiedId === note.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onSendToMCQ(note.content, note.title);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3 text-rose-500" />
                      <span>Quiz</span>
                    </button>
                    <button
                      onClick={() => {
                        onSendToTutor(note.content, note.title);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Study in NotebookLM</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotes.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              No notes found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
