import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../lib/firebase';

// Popups reposent sur `window.open`, non supporté par la WebView2 de l'app
// Windows (Tauri) : on retombe sur le flux par redirection dans ce cas.
const POPUP_UNSUPPORTED_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

interface AuthState {
  user: User | null;
  loading: boolean;
  firebaseEnabled: boolean;
  signInGoogle: () => Promise<void>;
  signInAnon: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    getRedirectResult(auth).catch(() => {
      // Ignoré : erreurs déjà remontées à l'utilisateur via signInGoogle si
      // c'est lui qui a initié le flux ; sinon rien à faire au chargement.
    });
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return {
    user,
    loading,
    firebaseEnabled,
    async signInGoogle() {
      if (!auth) throw new Error('Firebase non configuré');
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code && POPUP_UNSUPPORTED_CODES.has(code)) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw err;
      }
    },
    async signInAnon() {
      if (!auth) throw new Error('Firebase non configuré');
      await signInAnonymously(auth);
    },
    async signOut() {
      if (auth) await fbSignOut(auth);
    },
  };
}
