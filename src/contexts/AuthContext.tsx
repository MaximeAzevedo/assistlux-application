import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    console.log('Login temporaire:', email);
    // Simulation d'un utilisateur connecté
    setUser({
      uid: 'temp-user',
      email: email,
      displayName: 'Utilisateur Test'
    });
  };

  const signup = async (email: string, password: string) => {
    console.log('Signup temporaire:', email);
    setUser({
      uid: 'temp-user',
      email: email,
      displayName: 'Utilisateur Test'
    });
  };

  const logout = async () => {
    console.log('Logout temporaire');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout
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