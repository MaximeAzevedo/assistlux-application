import { useState, useEffect, useCallback } from 'react';
import { SessionSecurisee, AllocationFormData } from '../types/allocation';
import { ENDPOINTS } from '../constants/allocation';

// Note: Import du service existant pour la compatibilité
// import { FormConfigService } from '../services/FormConfigService';

interface SupabaseIntegrationState {
  connected: boolean;
  loading: boolean;
  error: string | null;
  configLoaded: boolean;
}

export const useSupabaseIntegration = () => {
  const [state, setState] = useState<SupabaseIntegrationState>({
    connected: false,
    loading: false,
    error: null,
    configLoaded: false
  });

  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION DYNAMIQUE DEPUIS SUPABASE
  // ═══════════════════════════════════════════════════════════

  const loadConfigurationFromSupabase = useCallback(async (aideId: number = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // TODO: Intégrer avec FormConfigService quand la DB sera alimentée
      // const config = await FormConfigService.getConfigurationAide(aideId);
      
      // Pour l'instant, utiliser la configuration statique comme fallback
      console.log('🔄 Tentative de chargement depuis Supabase pour aide ID:', aideId);
      console.log('📊 Fallback sur configuration statique en attendant');
      
      setState(prev => ({ 
        ...prev, 
        connected: true, 
        loading: false, 
        configLoaded: true 
      }));
      
      return {
        success: true,
        source: 'static_fallback', // 'supabase' quand la DB sera prête
        message: 'Configuration chargée depuis le fallback statique'
      };
      
    } catch (error) {
      console.error('❌ Erreur chargement Supabase:', error);
      setState(prev => ({ 
        ...prev, 
        connected: false, 
        loading: false, 
        error: 'Impossible de charger la configuration depuis Supabase',
        configLoaded: false
      }));
      
      return {
        success: false,
        source: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // SAUVEGARDE SÉCURISÉE DES SESSIONS
  // ═══════════════════════════════════════════════════════════

  const saveSecureSession = useCallback(async (session: SessionSecurisee) => {
    try {
      // TODO: Sauvegarder en base via Supabase
      console.log('💾 Sauvegarde session sécurisée:', session.id);
      
      // Pour l'instant stockage local temporaire (RGPD compliant avec TTL)
      const sessionData = {
        ...session,
        savedAt: new Date().toISOString()
      };
      
      sessionStorage.setItem(`secure_session_${session.id}`, JSON.stringify(sessionData));
      
      // Auto-destruction après 1h (conformité RGPD)
      setTimeout(() => {
        sessionStorage.removeItem(`secure_session_${session.id}`);
      }, 60 * 60 * 1000); // 1 heure
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde session:', error);
      return { success: false, error };
    }
  }, []);

  const loadSecureSession = useCallback(async (sessionId: string): Promise<SessionSecurisee | null> => {
    try {
      // TODO: Charger depuis Supabase
      const stored = sessionStorage.getItem(`secure_session_${sessionId}`);
      if (!stored) return null;
      
      const sessionData = JSON.parse(stored);
      
      // Vérifier expiration
      const savedAt = new Date(sessionData.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 1) {
        sessionStorage.removeItem(`secure_session_${sessionId}`);
        return null;
      }
      
      return sessionData;
      
    } catch (error) {
      console.error('❌ Erreur chargement session:', error);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // AUDIT IA ET CONFORMITÉ
  // ═══════════════════════════════════════════════════════════

  const saveAIAuditTrail = useCallback(async (auditData: any) => {
    try {
      console.log('📝 Audit IA:', auditData);
      
      // TODO: Sauvegarder en base via table allocation_ai_audit
      // await supabase.from(ENDPOINTS.SUPABASE.ALLOCATION_AI_AUDIT).insert(auditData);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur audit IA:', error);
      return { success: false, error };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // SOUMISSION FINALE
  // ═══════════════════════════════════════════════════════════

  const submitToSupabase = useCallback(async (
    formData: AllocationFormData, 
    session: SessionSecurisee
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Générer un numéro de référence unique
      const reference = `AVC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // TODO: Insérer dans Supabase
      console.log('🚀 Soumission vers Supabase:', { reference, formData, session });
      
      // Simulation pour l'instant
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setState(prev => ({ ...prev, loading: false }));
      
      return {
        success: true,
        reference,
        submittedAt: new Date(),
        estimatedProcessingTime: "4 à 6 semaines"
      };
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Erreur lors de la soumission' 
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // AUTO-INITIALISATION
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    // Charger automatiquement la configuration au montage
    loadConfigurationFromSupabase();
  }, [loadConfigurationFromSupabase]);

  // ═══════════════════════════════════════════════════════════
  // INTERFACE PUBLIQUE
  // ═══════════════════════════════════════════════════════════

  return {
    // État de connexion
    ...state,
    
    // Configuration dynamique
    loadConfigurationFromSupabase,
    
    // Gestion des sessions sécurisées
    saveSecureSession,
    loadSecureSession,
    
    // Audit et conformité
    saveAIAuditTrail,
    
    // Soumission finale
    submitToSupabase,
    
    // Helpers
    isReady: state.connected && state.configLoaded && !state.loading,
    hasError: !!state.error
  };
};

export default useSupabaseIntegration; 