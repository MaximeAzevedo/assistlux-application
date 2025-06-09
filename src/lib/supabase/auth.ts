import { supabase } from './client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class SupabaseAuthService {
  private static instance: SupabaseAuthService;

  static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  // Convertir un utilisateur Supabase en format compatible
  private formatUser(user: User | null): AuthUser | null {
    if (!user) return null;
    
    return {
      uid: user.id,
      email: user.email || null,
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || null
    };
  }

  // Connexion avec email/mot de passe
  async signInWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = this.formatUser(data.user);
    if (!user) {
      throw new Error('Échec de la connexion');
    }

    return user;
  }

  // Inscription avec email/mot de passe
  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = this.formatUser(data.user);
    if (!user) {
      throw new Error('Échec de l\'inscription');
    }

    return user;
  }

  // Déconnexion
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  // Obtenir l'utilisateur actuel
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return this.formatUser(user);
  }

  // Écouter les changements d'état d'authentification
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = this.formatUser(session?.user || null);
        callback(user);
      }
    );

    return () => subscription.unsubscribe();
  }

  // Obtenir la session actuelle
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}

export const authService = SupabaseAuthService.getInstance(); 