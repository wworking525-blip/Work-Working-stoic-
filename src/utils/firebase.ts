import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

export {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
};
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  getDocFromServer,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from './userStore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the specific provisioned databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify network connection.');
      return false;
    }
    // Permissions error on non-existent test doc is expected and indicates server connection is alive
    return true;
  }
}

// 1. Sync User Profile To Firestore
export async function syncUserProfileToFirestore(user: UserProfile): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}`;
  try {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(
      userDocRef,
      {
        uid: auth.currentUser.uid,
        name: user.name || auth.currentUser.displayName || 'Medical Scholar',
        email: user.email || auth.currentUser.email || 'scholar@stoic.med',
        points: user.points ?? 0,
        streak: user.streakDays ?? 1,
        lastActiveDate: new Date().toISOString(),
        isPro: Boolean(user.isPro),
        tier: user.tier || 'free',
        subscriptionExpiry: user.subscriptionExpiry || '',
        quizzesTaken: user.completedQuizzes ?? 0,
        averageScore: user.accuracyRate ?? 0,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2. Fetch User Profile From Firestore
export async function fetchUserProfileFromFirestore(): Promise<UserProfile | null> {
  if (!auth.currentUser) return null;
  const path = `users/${auth.currentUser.uid}`;
  try {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: data.uid || auth.currentUser.uid,
        name: data.name || auth.currentUser.displayName || 'Medical Scholar',
        email: data.email || auth.currentUser.email || 'scholar@stoic.med',
        avatar: auth.currentUser.photoURL || '',
        title: 'Medical Scholar',
        points: data.points ?? 0,
        streakDays: data.streak ?? 1,
        studyHoursTotal: 12.5,
        completedQuizzes: data.quizzesTaken ?? 0,
        accuracyRate: data.averageScore ?? 0,
        isAuthenticated: true,
        isPro: Boolean(data.isPro),
        tier: data.tier || 'free',
        subscriptionExpiry: data.subscriptionExpiry,
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// 3. Save Study Note to Firestore
export interface SavedStudyNote {
  id?: string;
  userId: string;
  title: string;
  content: string;
  systemId?: string;
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function saveStudyNoteToFirestore(
  note: Omit<SavedStudyNote, 'userId' | 'createdAt'> & { id?: string }
): Promise<string> {
  if (!auth.currentUser) throw new Error('User not authenticated');
  const noteId = note.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${auth.currentUser.uid}/notes/${noteId}`;
  try {
    const noteRef = doc(db, 'users', auth.currentUser.uid, 'notes', noteId);
    await setDoc(
      noteRef,
      {
        userId: auth.currentUser.uid,
        title: note.title.slice(0, 200),
        content: note.content.slice(0, 50000),
        systemId: note.systemId || 'general',
        source: note.source || 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return noteId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchStudyNotesFromFirestore(): Promise<SavedStudyNote[]> {
  if (!auth.currentUser) return [];
  const path = `users/${auth.currentUser.uid}/notes`;
  try {
    const notesColl = collection(db, 'users', auth.currentUser.uid, 'notes');
    const q = query(notesColl, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedStudyNote, 'id'>) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// 4. Save Quiz Result to Firestore
export interface SavedQuizResult {
  id?: string;
  userId: string;
  systemName: string;
  score: number;
  total: number;
  percentage: number;
  timestamp: string;
}

export async function saveQuizResultToFirestore(result: {
  systemName: string;
  score: number;
  total: number;
  percentage: number;
}): Promise<string> {
  if (!auth.currentUser) return '';
  const quizId = `quiz_${Date.now()}`;
  const path = `users/${auth.currentUser.uid}/quizzes/${quizId}`;
  try {
    const quizRef = doc(db, 'users', auth.currentUser.uid, 'quizzes', quizId);
    await setDoc(quizRef, {
      userId: auth.currentUser.uid,
      systemName: result.systemName.slice(0, 100),
      score: result.score,
      total: result.total,
      percentage: Math.round(result.percentage),
      timestamp: new Date().toISOString(),
    });
    return quizId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchQuizResultsFromFirestore(): Promise<SavedQuizResult[]> {
  if (!auth.currentUser) return [];
  const path = `users/${auth.currentUser.uid}/quizzes`;
  try {
    const quizzesColl = collection(db, 'users', auth.currentUser.uid, 'quizzes');
    const q = query(quizzesColl, orderBy('timestamp', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedQuizResult, 'id'>) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// 5. Save STOIC Chat Box message to Firestore
export interface SavedChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  text: string;
  systemId?: string;
  timestamp: string;
}

export async function saveChatMessageToFirestore(msg: {
  role: 'user' | 'model';
  text: string;
  systemId?: string;
}): Promise<string> {
  if (!auth.currentUser) return '';
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `users/${auth.currentUser.uid}/chatHistory/${msgId}`;
  try {
    const msgRef = doc(db, 'users', auth.currentUser.uid, 'chatHistory', msgId);
    await setDoc(msgRef, {
      userId: auth.currentUser.uid,
      role: msg.role,
      text: msg.text.slice(0, 10000),
      systemId: msg.systemId || 'general',
      timestamp: new Date().toISOString(),
    });
    return msgId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchChatHistoryFromFirestore(): Promise<SavedChatMessage[]> {
  if (!auth.currentUser) return [];
  const path = `users/${auth.currentUser.uid}/chatHistory`;
  try {
    const chatColl = collection(db, 'users', auth.currentUser.uid, 'chatHistory');
    const q = query(chatColl, orderBy('timestamp', 'asc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedChatMessage, 'id'>) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}
