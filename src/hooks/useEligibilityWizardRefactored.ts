import { useState, useCallback, useEffect } from 'react';
import { EligibilityEngine, Question, UserAnswers, EligibilityResult } from '../lib/eligibilityEngine';

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
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════

export const useEligibilityWizardRefactored = () => {
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

  const engine = EligibilityEngine.getInstance();

  // ═══════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════

  const initializeWizard = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔄 Initialisation du wizard refactorisé...');
      
      // Initialiser le moteur d'éligibilité
      await engine.initialize();
      
      // Obtenir toutes les questions
      const allQuestions = engine.getQuestions();
      
      if (allQuestions.length === 0) {
        throw new Error('Aucune question trouvée');
      }

      // Obtenir la première question à afficher
      const firstQuestion = engine.getFirstQuestion();
      
      if (!firstQuestion) {
        throw new Error('Aucune question initiale trouvée');
      }

      console.log(`✅ ${allQuestions.length} questions chargées`);
      console.log(`🎯 Première question: ${firstQuestion.question}`);

      setState(prev => ({
        ...prev,
        allQuestions,
        currentQuestion: firstQuestion,
        totalQuestions: allQuestions.length,
        currentIndex: 1,
        progress: calculateProgress(1, allQuestions.length),
        loading: false,
        canGoBack: false,
        canGoNext: false
      }));

    } catch (error) {
      console.error('❌ Erreur initialisation wizard:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  }, [engine]);

  // Initialisation automatique
  useEffect(() => {
    initializeWizard();
  }, [initializeWizard]);

  // ═══════════════════════════════════════════════════════════
  // GESTION DES RÉPONSES
  // ═══════════════════════════════════════════════════════════

  const handleAnswer = useCallback((value: string | number) => {
    if (!state.currentQuestion) return;

    const newAnswers = {
      ...state.userAnswers,
      [state.currentQuestion.key_reponse]: value
    };

    console.log(`📝 Réponse: ${state.currentQuestion.key_reponse} = ${value}`);

    setState(prev => ({
      ...prev,
      userAnswers: newAnswers,
      canGoNext: true
    }));

    // Navigation automatique après un court délai pour l'animation
    setTimeout(() => {
      navigateToNext(newAnswers);
    }, 300);

  }, [state.currentQuestion, state.userAnswers]);

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════

  const navigateToNext = useCallback(async (answers?: UserAnswers) => {
    const currentAnswers = answers || state.userAnswers;
    
    if (!state.currentQuestion) return;

    try {
      console.log('🚀 Navigation vers la question suivante...');

      // Vérifier si on peut terminer le questionnaire
      if (engine.canCompleteQuestionnaire(currentAnswers)) {
        console.log('🏁 Questionnaire terminé, analyse des résultats...');
        await completeQuestionnaire(currentAnswers);
        return;
      }

      // Obtenir la prochaine question
      const nextQuestion = engine.getNextQuestion(state.currentQuestion, currentAnswers);

      if (!nextQuestion) {
        console.log('🏁 Fin des questions, analyse des résultats...');
        await completeQuestionnaire(currentAnswers);
        return;
      }

      const newIndex = state.currentIndex + 1;

      setState(prev => ({
        ...prev,
        currentQuestion: nextQuestion,
        currentIndex: newIndex,
        progress: calculateProgress(newIndex, prev.totalQuestions),
        canGoBack: newIndex > 1,
        canGoNext: false // Reset jusqu'à la prochaine réponse
      }));

      console.log(`➡️ Question suivante: ${nextQuestion.question}`);

    } catch (error) {
      console.error('❌ Erreur navigation:', error);
      setState(prev => ({
        ...prev,
        error: 'Erreur lors de la navigation'
      }));
    }
  }, [state.currentQuestion, state.userAnswers, state.currentIndex, state.totalQuestions, engine]);

  const navigateToPrevious = useCallback(() => {
    if (state.currentIndex <= 1 || state.allQuestions.length === 0) return;

    // Logique simplifiée : revenir à la question précédente dans l'ordre
    const previousIndex = state.currentIndex - 1;
    const previousQuestion = state.allQuestions[previousIndex - 1];

    if (previousQuestion) {
      setState(prev => ({
        ...prev,
        currentQuestion: previousQuestion,
        currentIndex: previousIndex,
        progress: calculateProgress(previousIndex, prev.totalQuestions),
        canGoBack: previousIndex > 1,
        canGoNext: prev.userAnswers[previousQuestion.key_reponse] !== undefined
      }));

      console.log(`⬅️ Question précédente: ${previousQuestion.question}`);
    }
  }, [state.currentIndex, state.allQuestions, state.userAnswers]);

  // ═══════════════════════════════════════════════════════════
  // COMPLETION DU QUESTIONNAIRE
  // ═══════════════════════════════════════════════════════════

  const completeQuestionnaire = useCallback(async (answers: UserAnswers) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      console.log('🎯 Analyse d\'éligibilité en cours...');
      
      const results = await engine.analyzeEligibility(answers);

      setState(prev => ({
        ...prev,
        eligibilityResults: results,
        completed: true,
        loading: false,
        progress: 100
      }));

      console.log(`✅ Analyse terminée: ${results.length} résultats`);

    } catch (error) {
      console.error('❌ Erreur analyse d\'éligibilité:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors de l\'analyse d\'éligibilité'
      }));
    }
  }, [engine]);

  // ═══════════════════════════════════════════════════════════
  // ACTIONS DE CONTRÔLE
  // ═══════════════════════════════════════════════════════════

  const resetWizard = useCallback(async () => {
    setState(prev => ({
      ...prev,
      currentQuestion: null,
      currentIndex: 0,
      progress: 0,
      userAnswers: {},
      eligibilityResults: [],
      completed: false,
      loading: true,
      error: null,
      canGoBack: false,
      canGoNext: false
    }));

    // Redémarrer le wizard
    await initializeWizard();
  }, [initializeWizard]);

  // ═══════════════════════════════════════════════════════════
  // FONCTIONS UTILITAIRES
  // ═══════════════════════════════════════════════════════════

  const calculateProgress = (current: number, total: number): number => {
    return Math.round((current / total) * 100);
  };

  const getCurrentAnswer = useCallback((): string | number | undefined => {
    if (!state.currentQuestion) return undefined;
    return state.userAnswers[state.currentQuestion.key_reponse];
  }, [state.currentQuestion, state.userAnswers]);

  const getProgressText = useCallback((): string => {
    if (state.completed) return 'Terminé';
    return `Question ${state.currentIndex} sur ${state.totalQuestions}`;
  }, [state.currentIndex, state.totalQuestions, state.completed]);

  // ═══════════════════════════════════════════════════════════
  // RETOUR DU HOOK
  // ═══════════════════════════════════════════════════════════

  return {
    // État
    currentQuestion: state.currentQuestion,
    allQuestions: state.allQuestions,
    currentIndex: state.currentIndex,
    totalQuestions: state.totalQuestions,
    progress: state.progress,
    userAnswers: state.userAnswers,
    eligibilityResults: state.eligibilityResults,
    loading: state.loading,
    error: state.error,
    completed: state.completed,
    canGoBack: state.canGoBack,
    canGoNext: state.canGoNext,

    // Actions
    handleAnswer,
    navigateToNext,
    navigateToPrevious,
    resetWizard,

    // Utilitaires
    getCurrentAnswer,
    getProgressText
  };
}; 