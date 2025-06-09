import { supabase } from './client';

export interface UserProfile {
  id: string;
  email: string;
  profile_data: any;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseDatabaseService {
  private static instance: SupabaseDatabaseService;

  static getInstance(): SupabaseDatabaseService {
    if (!SupabaseDatabaseService.instance) {
      SupabaseDatabaseService.instance = new SupabaseDatabaseService();
    }
    return SupabaseDatabaseService.instance;
  }

  // Sauvegarder le profil utilisateur
  async saveUserProfile(userId: string, profileData: any): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        profile_data: profileData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  }

  // Récupérer le profil utilisateur
  async getUserProfile(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('profile_data')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun profil trouvé
        return null;
      }
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }

    return data?.profile_data || null;
  }

  // Sauvegarder une conversation de chat
  async saveConversation(userId: string, userMessage: string, botResponse: string): Promise<void> {
    const { error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        user_message: userMessage,
        bot_response: botResponse,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Erreur lors de la sauvegarde de la conversation: ${error.message}`);
    }
  }

  // Récupérer l'historique des conversations
  async getConversationHistory(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('user_message, bot_response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erreur lors de la récupération de l'historique: ${error.message}`);
    }

    return data || [];
  }

  // Récupérer les préférences utilisateur
  async getUserPreferences(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('profile_data')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erreur lors de la récupération des préférences: ${error.message}`);
    }

    return data?.profile_data?.languages || null;
  }
}

export const databaseService = SupabaseDatabaseService.getInstance(); 