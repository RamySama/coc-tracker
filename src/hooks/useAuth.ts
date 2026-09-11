import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { isTauri } from '@tauri-apps/api/core';
import { signIn as googleDesktopSignIn } from '@choochmeque/tauri-plugin-google-auth-api';
import { auth, firebaseEnabled } from '../lib/firebase';

// Popups reposent sur `window.open`, non supporté par la WebView2 de l'app
// Windows (Tauri) : on retombe sur le flux par redirection dans ce cas.
const POPUP_UNSUPPORTED_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

const DESKTOP_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID as
  | string
  | undefined;
const DESKTOP_GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_SECRET as
  | string
  | undefined;

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
      // App Windows : ouvre le navigateur système (comptes Google déjà connectés)
      // au lieu de la WebView embarquée, qui n'a pas de session Google.
      if (isTauri()) {
        if (!DESKTOP_GOOGLE_CLIENT_ID || !DESKTOP_GOOGLE_CLIENT_SECRET) {
          throw new Error('Connexion Google non configurée pour l’app Windows');
        }
        const tokens = await googleDesktopSignIn({
          clientId: DESKTOP_GOOGLE_CLIENT_ID,
          clientSecret: DESKTOP_GOOGLE_CLIENT_SECRET,
          scopes: ['openid', 'email', 'profile'],
        });
        if (!tokens.idToken) throw new Error('Aucun idToken renvoyé par Google');
        await signInWithCredential(auth, GoogleAuthProvider.credential(tokens.idToken));
        return;
      }
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
