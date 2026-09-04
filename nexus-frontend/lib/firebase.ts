import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, Auth, UserCredential } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyMockKeyForDevOnly123456789",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nexus-project-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nexus-project-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nexus-project-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

let app: FirebaseApp;
let auth: Auth;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase Auth initialized in mock/fallback mode:", error);
}

export { app, auth };

export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<UserCredential | null> {
  if (!auth) return null;
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google Sign In Error:", error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<UserCredential | null> {
  if (!auth) return null;
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string): Promise<UserCredential | null> {
  if (!auth) return null;
  return await createUserWithEmailAndPassword(auth, email, pass);
}

export async function logoutFirebase(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
}
