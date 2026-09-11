import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../lib/firebase';

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
      await signInWithPopup(auth, new GoogleAuthProvider());
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
