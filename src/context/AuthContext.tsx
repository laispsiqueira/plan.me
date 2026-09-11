import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, testConnection, handleFirestoreError, OperationType } from '../firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsLaisSiqueira: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Test Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Sync user profile from Firestore
  const syncUserProfile = async (firebaseUser: User, customName?: string) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      const isLais = firebaseUser.email === 'laispsiqueira@gmail.com' || customName === 'Lais Siqueira';
      const resolvedName = customName || (isLais ? 'Lais Siqueira' : firebaseUser.displayName || 'Usuário');
      const resolvedEmail = firebaseUser.email || (isLais ? 'laispsiqueira@gmail.com' : '');

      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: resolvedName,
          email: resolvedEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      } else {
        const existingData = docSnap.data() as UserProfile;
        // Ensure Lais Siqueira is properly named if email matches
        if (isLais && existingData.name !== 'Lais Siqueira') {
          const updated = { ...existingData, name: 'Lais Siqueira', email: 'laispsiqueira@gmail.com', updatedAt: new Date().toISOString() };
          await setDoc(userDocRef, updated, { merge: true });
          setUserProfile(updated);
        } else {
          setUserProfile(existingData);
        }
      }
    } catch (error) {
      console.warn('Could not sync user profile to Firestore, using fallback:', error);
      // Fallback local profile if offline or rules delay
      const isLais = firebaseUser.email === 'laispsiqueira@gmail.com';
      setUserProfile({
        uid: firebaseUser.uid,
        name: isLais ? 'Lais Siqueira' : firebaseUser.displayName || customName || 'Usuário',
        email: firebaseUser.email || (isLais ? 'laispsiqueira@gmail.com' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const isLais = email.toLowerCase().trim() === 'laispsiqueira@gmail.com';
      const finalName = isLais ? 'Lais Siqueira' : name.trim();

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: finalName });
        await syncUserProfile(cred.user, finalName);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        setAuthError(
          'O provedor E-mail/Senha precisa estar habilitado no Firebase Console. Utilize o botão "Entrar com Google" ou o acesso rápido como Lais Siqueira.'
        );
      } else if (err?.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está cadastrado. Faça login ou utilize outro endereço.');
      } else if (err?.code === 'auth/weak-password') {
        setAuthError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err?.code === 'auth/invalid-email') {
        setAuthError('Formato de e-mail inválido.');
      } else {
        setAuthError(err?.message || 'Erro ao realizar cadastro.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user) {
        await syncUserProfile(cred.user);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        setAuthError(
          'O provedor E-mail/Senha não está ativado no Firebase Console. Recomendamos usar "Entrar com Google" ou o acesso rápido.'
        );
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err?.code === 'auth/invalid-email') {
        setAuthError('Formato de e-mail inválido.');
      } else {
        setAuthError(err?.message || 'Erro ao realizar login.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await syncUserProfile(cred.user);
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Não foi possível autenticar com o Google.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated one-click login for Lais Siqueira
  const loginAsLaisSiqueira = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      // First try sign in or create dedicated user
      let credUser: User | null = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, 'laispsiqueira@gmail.com', 'planme123');
        credUser = cred.user;
      } catch (e: any) {
        if (e?.code === 'auth/user-not-found' || e?.code === 'auth/invalid-credential') {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, 'laispsiqueira@gmail.com', 'planme123');
            credUser = newCred.user;
          } catch (createErr) {
            console.warn('Could not auto-create email user, falling back to anonymous session:', createErr);
          }
        }
      }

      if (!credUser) {
        const anonCred = await signInAnonymously(auth);
        credUser = anonCred.user;
      }

      if (credUser) {
        await updateProfile(credUser, { displayName: 'Lais Siqueira' });
        await syncUserProfile(credUser, 'Lais Siqueira');
      }
    } catch (err: any) {
      console.error('Error logging in as Lais Siqueira:', err);
      setAuthError('Não foi possível iniciar a sessão de Lais Siqueira.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        authError,
        setAuthError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsLaisSiqueira,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
