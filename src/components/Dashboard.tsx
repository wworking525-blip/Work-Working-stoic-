import React, { useState } from 'react';
import {
  UserProfile,
  PastExam,
  StudyScheduleItem,
  GoogleNoteItem,
  loadSchedule,
  loadPastExamsFromStorage,
  loadGoogleNotesFromStorage,
} from '../utils/userStore';
import { DataFlywheelCard } from './DataFlywheelCard';
import { getInitialFlywheelState, DataFlywheelState } from '../utils/dataFlywheel';
import {
  Box,
  BookOpen,
  HelpCircle,
  Sparkles,
  Zap,
  Flame,
  Clock,
  Calendar,
  ChevronRight,
  Play,
  CheckCircle2,
  Trophy,
  ArrowUpRight,
  TrendingUp,
  FileText,
  User,
  GraduationCap,
  Layers,
  Award,
} from 'lucide-react';
import { ANATOMICAL_SYSTEMS, AnatomySystem } from '../utils/anatomyData';

interface DashboardProps {
  user: UserProfile;
  onNavigateToAnatomy: () => void;
  onNavigateToTutor: () => void;
  onNavigateToMCQ: () => void;
  onNavigateToPapers: () => void;
  onNavigateToChat: () => void;
  onOpenGoogleNotes: () => void;
  onOpenAuth: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onNavigateToAnatomy,
  onNavigateToTutor,
  onNavigateToMCQ,
  onNavigateToPapers,
  onNavigateToChat,
  onOpenGoogleNotes,
  onOpenAuth,
}) => {
  const [schedule] = useState<StudyScheduleItem[]>(loadSchedule());
  const [pastExams] = useState<PastExam[]>(loadPastExamsFromStorage());
  const [googleNotes] = useState<GoogleNoteItem[]>(loadGoogleNotesFromStorage());
  const [flywheelState] = useState<DataFlywheelState>(getInitialFlywheelState());
  const [selectedDay, setSelectedDay] = useState<number>(3); // Wednesday / Today

  const weekDays = [
    { day: 'Mon', date: 4 },
    { day: 'Tue', date: 5 },
    { day: 'Wed', date: 6, isToday: true },
    { day: 'Thu', date: 7 },
    { day: 'Fri', date: 8 },
    { day: 'Sat', date: 9 },
    { day: 'Sun', date: 10 },
  ];

  const subjectTimes = [
    { name: '3D Anatomy', hours: '3h 15m', color: 'from-rose-500 to-pink-500', barHeight: '85%' },
    { name: 'Physiology', hours: '2h 45m', color: 'from-amber-500 to-orange-500', barHeight: '70%' },
    { name: 'Pathology', hours: '3h 10m', color: 'from-purple-500 to-indigo-500', barHeight: '80%' },
    { name: 'Pharmacology', hours: '2h 15m', color: 'from-emerald-500 to-teal-500', barHeight: '60%' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Greeting, Charging Points, User Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Soft decorative glow circles */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>STOIC Medical Intelligence</span>
              </span>
              <span className="text-xs text-slate-400">
                Today is Wednesday, 6 November 2026
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Track your 3D mechanical anatomy progress, study notes with our AI Study Tutor,
              and test your knowledge with grounded USMLE clinical MCQs.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onNavigateToAnatomy}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Box className="w-4 h-4" />
                <span>Launch 3D Explorer</span>
              </button>
              <button
                onClick={onOpenGoogleNotes}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Google Notes ({googleNotes.length})</span>
              </button>
            </div>
          </div>

          {/* Right Metrics Pill Cluster matching the attached screenshot */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white/10 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            {/* Charging Points (Matching screenshot '329') */}
            <div className="flex items-center gap-3 pr-4 border-r border-white/15">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-400/20">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-white">
                  {user.points}
                </div>
                <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
                  Charging Points
                </div>
              </div>
            </div>

            {/* Streak & Accuracy */}
            <div className="space-y-1.5 pl-2">
              <div className="flex items-center gap-2 text-xs">
                <Flame className="w-4 h-4 text-orange-400 fill-current" />
                <span className="font-bold text-slate-200">
                  {user.streakDays} Day Study Streak
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">
                  {user.accuracyRate}% Board Accuracy
                </span>
              </div>
              <button
                onClick={onOpenAuth}
                className="text-[11px] text-rose-300 hover:text-white font-semibold underline flex items-center gap-1"
              >
                <span>{user.email}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Learning Progress, Today's Class, Schedule, Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Study Progress Dial + Class Schedule + Past Exams */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pillar: Algorithmic Data Flywheel & Upskilling Engine */}
          <DataFlywheelCard
            flywheelState={flywheelState}
            onNavigateToMCQ={onNavigateToMCQ}
            onNavigateToAnatomy={onNavigateToAnatomy}
          />

          {/* Learning Progress Dial Card (Directly inspired by screenshot '72% Track your learning progress') */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <span>Weekly Mastery</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Study Smarter Every Single Day
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                Organize your clinical notes, practice multi-step anatomical reasoning,
                and achieve your shelf examination milestones effortlessly.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onNavigateToMCQ}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>Start Learning</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-xs text-slate-400">
                  Next milestone: <strong>350 Points</strong>
                </div>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-rose-600"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset="74"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  72%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Mastery
                </span>
              </div>
            </div>
          </div>

          {/* Today's Class & Interactive Schedule (Matching screenshot 'Today Class') */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Today's Clinical Class &amp; Assembly
                </h3>
                <p className="text-xs text-slate-400">
                  Live interactive session and anatomical timeline
                </p>
              </div>

              {/* Weekly Calendar strip */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
                {weekDays.map((w, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(idx)}
                    className={`flex flex-col items-center px-2 py-1 rounded-xl text-xs transition-all ${
                      selectedDay === idx
                        ? 'bg-rose-600 text-white font-bold shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] font-medium">{w.day}</span>
                    <span className="text-xs font-bold">{w.date}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Active Class Card (Directly inspired by screenshot 'Creative Sketching / History of Physics') */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={schedule[0].instructorAvatar}
                  alt={schedule[0].instructor}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                      Live in 45m
                    </span>
                    <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                      {schedule[0].time}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                    {schedule[0].title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {schedule[0].instructor} • {schedule[0].topic}
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToAnatomy}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Join 3D Lab</span>
              </button>
            </div>

            {/* Timeline sessions */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Upcoming Timeline
              </span>
              <div className="space-y-2">
                {schedule.slice(1).map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {s.title}
                        </span>
                        <div className="text-[11px] text-slate-400">{s.topic}</div>
                      </div>
                    </div>
                    <span className="text-slate-500 font-medium shrink-0">
                      {s.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Past Exams & Board Quizzes (Matching screenshot 'Past Exams') */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Recent Examination Scores
                </h3>
                <p className="text-xs text-slate-400">
                  Performance on high-yield clinical question sets
                </p>
              </div>
              <button
                onClick={onNavigateToMCQ}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <span>Take New Exam</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {pastExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-800 dark:text-slate-200 shadow-sm shrink-0">
                      {exam.percentage}%
                    </div>
                    <div>
                      <div className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                        {exam.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {exam.system} • {exam.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${exam.badgeColor}`}
                    >
                      {exam.score}/{exam.total} Correct
                    </span>
                    <button
                      onClick={onNavigateToMCQ}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      title="Retake Exam"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Analytics + Google Notes + Quick Launch */}
        <div className="lg:col-span-4 space-y-6">
          {/* Analytics Bars Card (Directly inspired by screenshot 'Analytics / Hours') */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Subject Analytics
              </h3>
              <span className="text-xs font-bold text-slate-400">This Week</span>
            </div>

            {/* Vertical Bar Chart representation */}
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {subjectTimes.map((sub, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {sub.hours}
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden h-28 flex items-end">
                    <div
                      className={`w-full bg-gradient-to-t ${sub.color} rounded-xl transition-all duration-500`}
                      style={{ height: sub.barHeight }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[55px]">
                    {sub.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs flex items-center justify-between">
              <span className="text-indigo-950 dark:text-indigo-200 font-semibold">
                Total Focus Time
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                11h 25m
              </span>
            </div>
          </div>

          {/* Synced Google Notes Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Google Notes Sync
                </h3>
              </div>
              <button
                onClick={onOpenGoogleNotes}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {googleNotes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  onClick={onOpenGoogleNotes}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold uppercase text-amber-600">
                      {note.category}
                    </span>
                    <span>{note.updatedAt}</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                    {note.title}
                  </h5>
                </div>
              ))}
            </div>

            <button
              onClick={onOpenGoogleNotes}
              className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-300/40 dark:border-amber-800/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Open Google Notes Studio</span>
            </button>
          </div>

          {/* Quick Shortcuts to STOIC Tools */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
              Quick Launchpad
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={onNavigateToAnatomy}
                className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-left transition-colors flex flex-col justify-between h-20"
              >
                <Box className="w-4 h-4 text-rose-600" />
                <span>3D Anatomy</span>
              </button>
              <button
                onClick={onNavigateToTutor}
                className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-left transition-colors flex flex-col justify-between h-20"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>AI Study Tutor</span>
              </button>
              <button
                onClick={onNavigateToMCQ}
                className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-left transition-colors flex flex-col justify-between h-20"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>50 MCQs</span>
              </button>
              <button
                onClick={onNavigateToChat}
                className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-left transition-colors flex flex-col justify-between h-20"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>STOIC Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
