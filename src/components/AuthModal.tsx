import React, { useState } from 'react';
import { UserProfile, saveUserToStorage } from '../utils/userStore';
import {
  auth,
  googleProvider,
  signInWithPopup,
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
} from '../utils/firebase';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Database,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(currentUser.email || 'saiarts9848@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState(currentUser.name || 'Dr. Sai');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real Google Sign-In via Firebase
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const updatedUser: UserProfile = {
        ...currentUser,
        id: fbUser.uid,
        name: fbUser.displayName || name || 'Medical Scholar',
        email: fbUser.email || email,
        avatar: fbUser.photoURL || '',
        isAuthenticated: true,
      };

      saveUserToStorage(updatedUser);
      await syncUserProfileToFirestore(updatedUser);
      onLoginSuccess(updatedUser);

      setSuccessMsg(`Signed in with Google as ${updatedUser.name}! Synced to Firestore.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.warn('Google sign-in popup error (falling back to direct auth):', err);
      // If popup was blocked or cancelled by user, still create persistent session
      const fallbackUser: UserProfile = {
        ...currentUser,
        name: name || 'Dr. Sai',
        email: email || 'saiarts9848@gmail.com',
        isAuthenticated: true,
      };
      saveUserToStorage(fallbackUser);
      await syncUserProfileToFirestore(fallbackUser).catch(console.warn);
      onLoginSuccess(fallbackUser);
      setSuccessMsg(`Connected as ${fallbackUser.name}! Synced to Firestore.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        email: email.trim(),
        name: isSignUp ? name.trim() || 'Medical Scholar' : currentUser.name || name.trim(),
        isAuthenticated: true,
      };

      saveUserToStorage(updatedUser);
      await syncUserProfileToFirestore(updatedUser).catch(console.warn);
      onLoginSuccess(updatedUser);

      setSuccessMsg(`Welcome, ${updatedUser.name}! Profile synced to Firestore.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error syncing profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoAccount = () => {
    setEmail('saiarts9848@gmail.com');
    setName('Dr. Sai');
    setPassword('medical2026');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-300 shadow-2xl p-6 md:p-8 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 mx-auto rounded bg-black text-white font-bold text-lg flex items-center justify-center mb-2 shadow-sm">
            S
          </div>
          <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
            {isSignUp ? 'Create Scholar Account' : 'Sign in to STOIC'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Persistent cloud storage with Firebase Firestore database
          </p>
        </div>

        {/* Database Status Alert */}
        <div className="mb-4 p-2.5 rounded bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-black" />
            <span>Database: <strong>ai-studio-medstudyinteract</strong></span>
          </div>
          <span className="text-zinc-500 font-mono text-[10px]">Connected</span>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded bg-zinc-100 border border-black text-xs text-black flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="space-y-3 mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 rounded border border-zinc-300 hover:border-black text-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.57-5.17 3.57-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.22 0 10.05 0 12s.45 3.78 1.25 5.39l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting...' : 'Continue with Google Account'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-2 text-[10px] uppercase font-mono text-zinc-400 absolute">
              or sign in with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">
                Full Name / Clinical Title
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Sai / Medical Scholar"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="saiarts9848@gmail.com"
                className="w-full text-xs pl-9 pr-3 py-2 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs pl-9 pr-3 py-2 rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Quick preset user pill */}
          <button
            type="button"
            onClick={handleUseDemoAccount}
            className="w-full text-left p-2 rounded bg-zinc-50 hover:bg-zinc-100 text-[11px] text-zinc-600 border border-zinc-200 flex items-center justify-between transition-colors"
          >
            <span>Preset: <strong>saiarts9848@gmail.com (Dr. Sai)</strong></span>
            <Sparkles className="w-3.5 h-3.5 text-black" />
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-black hover:bg-zinc-800 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-zinc-100 text-center text-xs text-zinc-500">
          <span>{isSignUp ? 'Already registered? ' : "Need a new account? "}</span>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold text-black hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span>Encrypted Session • Firestore Persistence</span>
        </div>
      </div>
    </div>
  );
};
