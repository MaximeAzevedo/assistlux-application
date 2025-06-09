import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  SessionSecurisee, 
  ConsentementsRGPD, 
  TypeDocument, 
  ResultatTraitementIA,
  AllocationFormData 
} from '../types/allocation';
import { AllocationVieCherSecureAIService } from '../services/AllocationVieChere/secureAIService';
import { DUREE_SESSION_MINUTES, NIVEAUX_CONSENTEMENT } from '../constants/allocation';
import useAllocationForm from './useAllocationForm';
import useSupabaseIntegration from './useSupabaseIntegration';
import useAllocationCalculations from './useAllocationCalculations';

export const useAllocationWizard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // État local pour la session
  const [session, setSession] = useState<SessionSecurisee | null>(null);
  
  // ═══════════════════════════════════════════════════════════
  // HOOKS COMPOSÉS
  // ═══════════════════════════════════════════════════════════
  
  const formHook = useAllocationForm();
  const supabaseHook = useSupabaseIntegration();
  const calculationsHook = useAllocationCalculations(formHook.formData);

  // Service IA réutilisé
  const aiService = new AllocationVieCherSecureAIService();

  // ═══════════════════════════════════════════════════════════
  // GESTION DES SESSIONS SÉCURISÉES
  // ═══════════════════════════════════════════════════════════

  const createSecureSession = useCallback((consentements: ConsentementsRGPD): SessionSecurisee => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DUREE_SESSION_MINUTES * 60 * 1000);
    
    const newSession: SessionSecurisee = {
      id: `AVC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      token: `tk_${Math.random().toString(36).substr(2, 20)}`,
      expiresAt,
      langue: 'fr',
      consentements,
      createdAt: now,
      lastActivity: now
    };

    return newSession;
  }, []);

  const initializeSession = useCallback(async (niveauConsentement: keyof typeof NIVEAUX_CONSENTEMENT) => {
    formHook.setLoading(true);
    
    try {
      const consentements = NIVEAUX_CONSENTEMENT[niveauConsentement];
      const newSession = createSecureSession(consentements);
      
      // Sauvegarder la session
      await supabaseHook.saveSecureSession(newSession);
      
      // Mettre à jour l'état local
      setSession(newSession);
      
      console.log('✅ Session sécurisée créée:', newSession.id);
      return newSession;
      
    } catch (error) {
      console.error('❌ Erreur création session:', error);
      formHook.setErrors({ session: 'Impossible de créer une session sécurisée' });
      return null;
    } finally {
      formHook.setLoading(false);
    }
  }, [createSecureSession, formHook, supabaseHook]);

  // ═══════════════════════════════════════════════════════════
  // GESTION DE L'IA POUR DOCUMENTS
  // ═══════════════════════════════════════════════════════════

  const handleDocumentUpload = useCallback(async (
    file: File, 
    documentType: TypeDocument
  ): Promise<ResultatTraitementIA> => {
    if (!session?.consentements.ia_externe) {
      throw new Error('IA non autorisée par les consentements');
    }

    formHook.setLoading(true);
    
    try {
      // Déterminer les champs attendus selon le type de document
      const expectedFields = getExpectedFieldsForDocumentType(documentType);
      
      // Traitement IA du document avec la méthode existante
      const result = await aiService.processDocumentWithAI(
        file, 
        documentType, 
        session.id, 
        expectedFields
      );
      
      // Enregistrer l'audit trail
      await supabaseHook.saveAIAuditTrail({
        sessionId: session.id,
        timestamp: new Date(),
        typeDocument: documentType,
        fileName: file.name,
        resultat: result,
        donneesSensibles: true,
        anonymise: true
      });

      // Convertir le résultat au format attendu
      const convertedResult: ResultatTraitementIA = {
        success: true,
        confidence: result.confidence || 0.8,
        extractedData: result.extractedData || {},
        suggestions: result.suggestions || [],
        cout: result.cost,
        duree: result.processingTime
      };

      // Pré-remplir le formulaire avec les données extraites
      if (convertedResult.success && convertedResult.extractedData) {
        formHook.updateCurrentStepData(convertedResult.extractedData);
      }

      return convertedResult;
      
    } catch (error) {
      console.error('❌ Erreur traitement IA:', error);
      return {
        success: false,
        confidence: 0,
        extractedData: {},
        suggestions: [],
        error: error instanceof Error ? error.message : 'Erreur IA inconnue'
      };
    } finally {
      formHook.setLoading(false);
    }
  }, [session, formHook, supabaseHook, aiService]);

  // Helper pour déterminer les champs attendus par type de document
  const getExpectedFieldsForDocumentType = (documentType: TypeDocument): string[] => {
    switch (documentType) {
      case 'piece_identite':
        return ['nom', 'prenom', 'matricule', 'date_naissance', 'adresse'];
      case 'rib':
        return ['iban', 'titulaire', 'banque'];
      case 'fiche_paie':
        return ['nom', 'prenom', 'salaire_net', 'periode', 'employeur'];
      case 'justificatif_domicile':
        return ['nom', 'adresse', 'date_document'];
      case 'acte_naissance':
        return ['nom', 'prenom', 'date_naissance', 'lieu_naissance'];
      default:
        return [];
    }
  };

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION INTELLIGENTE
  // ═══════════════════════════════════════════════════════════

  const handleNext = useCallback(() => {
    // Validation automatique avant passage à l'étape suivante
    const validation = formHook.validateCurrentStep();
    
    if (validation.valide) {
      formHook.nextStep();
      
      // Auto-calcul si on arrive aux étapes revenus/eligibilité
      if (formHook.currentStep >= 4) {
        calculationsHook.recalculate();
      }
    } else {
      console.log('⚠️ Validation échouée:', validation.erreurs);
      formHook.setErrors(validation.erreurs);
    }
  }, [formHook, calculationsHook]);

  const handleBack = useCallback(() => {
    formHook.previousStep();
    formHook.clearErrors();
  }, [formHook]);

  // ═══════════════════════════════════════════════════════════
  // SOUMISSION FINALE
  // ═══════════════════════════════════════════════════════════

  const handleSubmit = useCallback(async () => {
    if (!session) {
      formHook.setErrors({ session: 'Session expirée, veuillez recommencer' });
      return;
    }

    formHook.setLoading(true);
    
    try {
      // Validation finale complète
      if (!formHook.isFormValid()) {
        const errors = formHook.validateAllSteps();
        const allErrors = errors.reduce((acc, step) => ({ ...acc, ...step.erreurs }), {});
        formHook.setErrors(allErrors);
        return;
      }

      // Calculer les résultats finaux
      const eligibilityResults = calculationsHook.results || calculationsHook.recalculate();
      
      // Soumission vers Supabase
      const submissionResult = await supabaseHook.submitToSupabase(
        formHook.formData, 
        session
      );

      if (submissionResult.success) {
        // Naviguer vers la confirmation avec toutes les données
        navigate('/allocation-vie-chere/confirmation', {
          state: {
            confirmationData: {
              numeroReference: submissionResult.reference,
              dateSubmission: submissionResult.submittedAt,
              estimationMontant: eligibilityResults?.montantEstime || 0,
              delaiTraitement: submissionResult.estimatedProcessingTime,
              formData: formHook.formData,
              eligibilite: eligibilityResults
            }
          }
        });
      } else {
        formHook.setErrors({ 
          submission: 'Erreur lors de la soumission: ' + submissionResult.error 
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      formHook.setErrors({ 
        submission: 'Erreur inattendue lors de la soumission' 
      });
    } finally {
      formHook.setLoading(false);
    }
  }, [session, formHook, calculationsHook, supabaseHook, navigate]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS DE RENDU
  // ═══════════════════════════════════════════════════════════

  const getStepProps = useCallback(() => {
    const stepKey = `etape${formHook.currentStep}` as keyof AllocationFormData;
    
    return {
      data: formHook.getStepData(stepKey),
      onChange: (data: any) => formHook.updateStepData(stepKey, data),
      errors: formHook.errors,
      session: session,
      onDocumentUpload: handleDocumentUpload,
      aiProcessing: formHook.aiProcessing,
      readonly: formHook.loading
    };
  }, [formHook, session, handleDocumentUpload]);

  const getNavigationProps = useCallback(() => {
    return {
      currentStep: formHook.currentStep,
      totalSteps: formHook.totalSteps,
      canGoNext: formHook.canGoNext(),
      canGoPrevious: formHook.canGoPrevious(),
      isLastStep: formHook.isLastStep(),
      isFirstStep: formHook.isFirstStep(),
      onNext: handleNext,
      onBack: handleBack,
      onSubmit: handleSubmit,
      loading: formHook.loading
    };
  }, [formHook, handleNext, handleBack, handleSubmit]);

  // ═══════════════════════════════════════════════════════════
  // INTERFACE PUBLIQUE COMPLÈTE
  // ═══════════════════════════════════════════════════════════

  return {
    // État du formulaire
    formState: {
      currentStep: formHook.currentStep,
      formData: formHook.formData,
      errors: formHook.errors,
      loading: formHook.loading,
      progress: formHook.progress,
      session: session
    },

    // État Supabase
    supabaseState: {
      connected: supabaseHook.connected,
      loading: supabaseHook.loading,
      error: supabaseHook.error,
      isReady: supabaseHook.isReady
    },

    // Résultats des calculs
    calculationState: {
      results: calculationsHook.results,
      isEligible: calculationsHook.isEligible,
      hasResults: calculationsHook.hasResults,
      recommendations: calculationsHook.getRecommendations()
    },

    // Actions principales
    actions: {
      initializeSession,
      handleDocumentUpload,
      resetForm: formHook.resetForm
    },

    // Props pour les composants
    stepProps: getStepProps(),
    navigationProps: getNavigationProps(),

    // Informations calculées
    stepInfo: formHook.currentStepInfo,
    isReady: supabaseHook.isReady && !formHook.loading && !!session,
    hasErrors: Object.keys(formHook.errors).length > 0,
    
    // Helpers utiles
    helpers: {
      validateStep: formHook.validateCurrentStep,
      clearErrors: formHook.clearErrors,
      recalculate: calculationsHook.recalculate,
      updateStepData: formHook.updateStepData
    }
  };
};

export default useAllocationWizard; 