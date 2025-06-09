import { useState, useCallback, useMemo, useEffect } from 'react';
import { useEligibilityForm } from './useEligibilityForm';
import { useEligibilityEngine, type EligibilityResult, type CategorizedResults, type Recommendation } from './useEligibilityEngine';
import { EligibilityEngine, Question, UserAnswers } from '../lib/eligibilityEngine';

// ═══════════════════════════════════════════════════════════
// TYPES ET INTERFACES
// ═══════════════════════════════════════════════════════════

export interface EligibilityWizardState {
  phase: 'questionnaire' | 'calculating' | 'results';
  results: EligibilityResult[];
  categorizedResults: CategorizedResults | null;
  recommendations: Recommendation[];
  exportLoading: boolean;
  sessionId: string | null;
}

export interface ExportOptions {
  format: 'txt' | 'pdf' | 'json';
  includeRecommendations: boolean;
  includeAnswers: boolean;
  language: 'fr' | 'de' | 'en' | 'lu';
}

// ═══════════════════════════════════════════════════════════
// TYPES POUR LE HOOK
// ═══════════════════════════════════════════════════════════

interface WizardState {
  // État du questionnaire
  currentQuestion: Question | null;
  allQuestions: Question[];
  currentIndex: number;
  totalQuestions: number;
  progress: number;
  
  // Réponses et résultats
  userAnswers: UserAnswers;
  eligibilityResults: EligibilityResult[];
  
  // États de contrôle
  loading: boolean;
  error: string | null;
  completed: boolean;
  
  // Navigation
  canGoBack: boolean;
  canGoNext: boolean;
}

// ═══════════════════════════════════════════════════════════
// HOOK PRINCIPAL - ORCHESTRATEUR ÉLIGIBILITÉ WIZARD
// ═══════════════════════════════════════════════════════════

export const useEligibilityWizard = () => {
  
  // ─────────────────────────────────────────────────────────
  // COMPOSITION DES HOOKS SPÉCIALISÉS
  // ─────────────────────────────────────────────────────────
  
  const form = useEligibilityForm();
  const engine = useEligibilityEngine();

  // ─────────────────────────────────────────────────────────
  // ÉTAT LOCAL DU WIZARD
  // ─────────────────────────────────────────────────────────
  
  const [wizardState, setWizardState] = useState<EligibilityWizardState>({
    phase: 'questionnaire',
    results: [],
    categorizedResults: null,
    recommendations: [],
    exportLoading: false,
    sessionId: null
  });

  const [state, setState] = useState<WizardState>({
    currentQuestion: null,
    allQuestions: [],
    currentIndex: 0,
    totalQuestions: 0,
    progress: 0,
    userAnswers: {},
    eligibilityResults: [],
    loading: true,
    error: null,
    completed: false,
    canGoBack: false,
    canGoNext: false
  });

  // ─────────────────────────────────────────────────────────
  // GÉNÉRATION ID SESSION
  // ─────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (!wizardState.sessionId) {
      const sessionId = `eligibility_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setWizardState(prev => ({ ...prev, sessionId }));
      console.log(`[EligibilityWizard] Session créée: ${sessionId}`);
    }
  }, [wizardState.sessionId]);

  // ─────────────────────────────────────────────────────────
  // CALCUL AUTOMATIQUE DES RÉSULTATS
  // ─────────────────────────────────────────────────────────
  
  useEffect(() => {
    const calculateResultsWhenComplete = async () => {
      if (!form.isComplete || wizardState.phase !== 'questionnaire') return;

      try {
        console.log('[EligibilityWizard] Démarrage calcul des résultats...');
        setWizardState(prev => ({ ...prev, phase: 'calculating' }));

        // Calcul des résultats d'éligibilité
        const results = await engine.calculateResults(form.state.answers);
        
        // Catégorisation des résultats
        const categorizedResults = engine.categorizeResults(results);
        
        // Génération des recommandations
        const recommendations = engine.generateRecommendations(results, form.state.answers);

        // Mise à jour de l'état avec les résultats
        setWizardState(prev => ({
          ...prev,
          phase: 'results',
          results,
          categorizedResults,
          recommendations
        }));

        console.log(`[EligibilityWizard] Calcul terminé: ${results.length} résultats trouvés`);

      } catch (error) {
        console.error('[EligibilityWizard] Erreur calcul résultats:', error);
        // En cas d'erreur, on reste en mode questionnaire mais on log l'erreur
        setWizardState(prev => ({ ...prev, phase: 'questionnaire' }));
      }
    };

    calculateResultsWhenComplete();
  }, [form.isComplete, form.state.answers, engine, wizardState.phase]);

  // ─────────────────────────────────────────────────────────
  // ACTIONS DE NAVIGATION PRINCIPALES
  // ─────────────────────────────────────────────────────────
  
  const actions = useMemo(() => ({
    
    // Redémarrer le questionnaire
    restartQuestionnaire: () => {
      form.helpers.resetForm();
      setWizardState(prev => ({
        ...prev,
        phase: 'questionnaire',
        results: [],
        categorizedResults: null,
        recommendations: []
      }));
      console.log('[EligibilityWizard] Questionnaire redémarré');
    },

    // Retourner au questionnaire depuis les résultats
    backToQuestionnaire: () => {
      setWizardState(prev => ({ ...prev, phase: 'questionnaire' }));
      console.log('[EligibilityWizard] Retour au questionnaire');
    },

    // Forcer le recalcul des résultats
    recalculateResults: async () => {
      if (Object.keys(form.state.answers).length === 0) return;
      
      try {
        setWizardState(prev => ({ ...prev, phase: 'calculating' }));
        
        const results = await engine.calculateResults(form.state.answers);
        const categorizedResults = engine.categorizeResults(results);
        const recommendations = engine.generateRecommendations(results, form.state.answers);

        setWizardState(prev => ({
          ...prev,
          phase: 'results',
          results,
          categorizedResults,
          recommendations
        }));

      } catch (error) {
        console.error('[EligibilityWizard] Erreur recalcul:', error);
        setWizardState(prev => ({ ...prev, phase: 'questionnaire' }));
      }
    }

  }), [form.helpers, form.state.answers, engine]);

  // ─────────────────────────────────────────────────────────
  // FONCTIONNALITÉS D'EXPORT
  // ─────────────────────────────────────────────────────────
  
  const exportResults = useCallback(async (options: ExportOptions = {
    format: 'txt',
    includeRecommendations: true,
    includeAnswers: true,
    language: 'fr'
  }) => {
    if (wizardState.results.length === 0) return;

    try {
      setWizardState(prev => ({ ...prev, exportLoading: true }));

      const date = new Date().toLocaleDateString('fr-FR');
      const sessionInfo = wizardState.sessionId?.split('_')[1] || 'unknown';
      
      let content = '';

      if (options.format === 'txt') {
        content = generateTextExport(
          wizardState.results,
          wizardState.recommendations,
          form.state.answers,
          options,
          date,
          sessionInfo
        );
      } else if (options.format === 'json') {
        content = JSON.stringify({
          session: wizardState.sessionId,
          date,
          answers: options.includeAnswers ? form.state.answers : null,
          results: wizardState.results,
          categorized: wizardState.categorizedResults,
          recommendations: options.includeRecommendations ? wizardState.recommendations : null
        }, null, 2);
      }

      // Téléchargement du fichier
      const blob = new Blob([content], { 
        type: options.format === 'json' ? 'application/json' : 'text/plain; charset=utf-8' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eligibilite-results-${date.replace(/\//g, '-')}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`[EligibilityWizard] Export ${options.format} terminé`);

    } catch (error) {
      console.error('[EligibilityWizard] Erreur export:', error);
    } finally {
      setWizardState(prev => ({ ...prev, exportLoading: false }));
    }
  }, [wizardState.results, wizardState.recommendations, wizardState.sessionId, form.state.answers, wizardState.categorizedResults]);

  // ─────────────────────────────────────────────────────────
  // INFORMATIONS ET STATISTIQUES
  // ─────────────────────────────────────────────────────────
  
  const analytics = useMemo(() => {
    const progressInfo = form.helpers.getProgressInfo();
    const quickAnalysis = engine.quickAnalysis(form.state.answers);

    return {
      // Informations de progression
      ...progressInfo,
      
      // Analyse rapide
      ...quickAnalysis,
      
      // Statistiques des résultats
      resultsCount: wizardState.results.length,
      eligibleCount: wizardState.categorizedResults?.eligible.length || 0,
      maybeCount: wizardState.categorizedResults?.maybe.length || 0,
      highPriorityCount: wizardState.categorizedResults?.highPriority.length || 0,
      
      // Méta informations
      sessionId: wizardState.sessionId,
      phase: wizardState.phase,
      hasRecommendations: wizardState.recommendations.length > 0
    };
  }, [form.helpers, engine, form.state.answers, wizardState]);

  // ─────────────────────────────────────────────────────────
  // PROPS POUR LES COMPOSANTS UI
  // ─────────────────────────────────────────────────────────
  
  const questionnaireProps = useMemo(() => ({
    currentQuestion: form.state.currentQuestion,
    selectedAnswer: form.state.selectedAnswer,
    progress: form.state.progress,
    questionNumber: form.navigation.questionNumber,
    loading: form.state.loading,
    error: form.state.error,
    onAnswer: form.handleAnswer,
    onSelectAnswer: form.helpers.selectAnswer,
    onRetry: form.retry
  }), [form]);

  const resultsProps = useMemo(() => ({
    results: wizardState.results,
    categorized: wizardState.categorizedResults,
    recommendations: wizardState.recommendations,
    loading: wizardState.phase === 'calculating',
    onBack: actions.backToQuestionnaire,
    onRestart: actions.restartQuestionnaire,
    onExport: exportResults,
    exportLoading: wizardState.exportLoading
  }), [wizardState, actions, exportResults]);

  // ─────────────────────────────────────────────────────────
  // API PUBLIQUE DU HOOK
  // ─────────────────────────────────────────────────────────
  
  return {
    // État composé
    isReady: form.isReady,
    hasError: form.hasError,
    isComplete: form.isComplete,
    phase: wizardState.phase,
    
    // Props pour composants
    questionnaireProps,
    resultsProps,
    
    // Actions principales
    actions,
    
    // Fonctionnalités
    exportResults,
    
    // Analytics et informations
    analytics,
    
    // Accès direct aux hooks (pour debug)
    form,
    engine
  };
};

// ─────────────────────────────────────────────────────────
// FONCTION UTILITAIRE D'EXPORT TEXTE
// ─────────────────────────────────────────────────────────

function generateTextExport(
  results: EligibilityResult[],
  recommendations: Recommendation[],
  answers: Record<string, any>,
  options: ExportOptions,
  date: string,
  sessionInfo: string
): string {
  let content = `RÉSULTATS D'ÉLIGIBILITÉ AUX AIDES SOCIALES - ASSISTLUX\n`;
  content += `═══════════════════════════════════════════════════════════\n\n`;
  content += `Date: ${date}\n`;
  content += `Session: ${sessionInfo}\n`;
  content += `Langue: ${options.language.toUpperCase()}\n\n`;

  if (options.includeAnswers) {
    content += `VOS RÉPONSES:\n`;
    content += `─────────────────────────────────────────\n`;
    Object.entries(answers).forEach(([key, value]) => {
      content += `• ${key}: ${value}\n`;
    });
    content += `\n`;
  }

  content += `RÉSULTATS D'ÉLIGIBILITÉ:\n`;
  content += `─────────────────────────────────────────\n`;

  const eligible = results.filter(r => r.category === 'Eligible');
  const maybe = results.filter(r => r.category === 'Maybe');

  if (eligible.length > 0) {
    content += `\n✅ AIDES AUXQUELLES VOUS ÊTES ÉLIGIBLE (${eligible.length}):\n\n`;
    eligible.forEach((aid, index) => {
      content += `${index + 1}. ${aid.aid_id}\n`;
      if (aid.message) content += `   Description: ${aid.message}\n`;
      if (aid.form) content += `   📋 Formulaire: ${aid.form}\n`;
      if (aid.source) content += `   ℹ️  Plus d'infos: ${aid.source}\n`;
      content += `   🎯 Confiance: ${Math.round(aid.confidence * 100)}%\n\n`;
    });
  }

  if (maybe.length > 0) {
    content += `\n⚠️  AIDES POTENTIELLES - VÉRIFICATION REQUISE (${maybe.length}):\n\n`;
    maybe.forEach((aid, index) => {
      content += `${index + 1}. ${aid.aid_id}\n`;
      if (aid.message) content += `   Description: ${aid.message}\n`;
      if (aid.form) content += `   📋 Formulaire: ${aid.form}\n`;
      if (aid.source) content += `   ℹ️  Plus d'infos: ${aid.source}\n`;
      content += `   🎯 Confiance: ${Math.round(aid.confidence * 100)}%\n\n`;
    });
  }

  if (results.length === 0) {
    content += `\nℹ️  Aucune aide automatiquement détectée pour votre profil.\n`;
    content += `Nous recommandons de contacter un assistant social pour un conseil personnalisé.\n\n`;
  }

  if (options.includeRecommendations && recommendations.length > 0) {
    content += `RECOMMANDATIONS PERSONNALISÉES:\n`;
    content += `─────────────────────────────────────────\n\n`;
    recommendations.forEach((rec, index) => {
      const urgencyIcon = rec.urgency === 'high' ? '🔴' : rec.urgency === 'medium' ? '🟡' : '🟢';
      content += `${index + 1}. ${urgencyIcon} ${rec.title}\n`;
      content += `   ${rec.description}\n`;
      if (rec.actionUrl) content += `   🔗 ${rec.actionUrl}\n`;
      content += `\n`;
    });
  }

  content += `\n───────────────────────────────────────────────────────────\n`;
  content += `Document généré automatiquement par AssistLux\n`;
  content += `Ce document est fourni à titre indicatif.\n`;
  content += `Contactez un assistant social pour confirmer votre éligibilité.\n`;

  return content;
}

export default useEligibilityWizard; 