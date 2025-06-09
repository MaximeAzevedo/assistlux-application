import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, type AuthUser } from '../lib/supabase/auth';

interface AuthContextType {
  user: AuthUser | null;
  currentUser: AuthUser | null; // Alias pour compatibilité
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Écouter les changements d'état d'authentification
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Vérifier l'utilisateur actuel au démarrage
    const checkCurrentUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCurrentUser();

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authService.signInWithEmailAndPassword(email, password);
      setUser(user);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authService.createUserWithEmailAndPassword(email, password);
      setUser(user);
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    currentUser: user, // Alias pour compatibilité avec l'ancien code
    loading,
    login,
    signup,
    logout,
    // Aliases pour compatibilité Firebase
    signInWithEmailAndPassword: login,
    createUserWithEmailAndPassword: signup,
    signOut: logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}