import { useState, useCallback, useEffect } from 'react';
import { 
  loadQuestionsFromDB,
  analyzeEligibility,
  getNextQuestionId,
  shouldShowQuestion,
  canCompleteQuestionnaire,
  formatQuestionForUI
} from '../lib/eligibilityAnalysis';

// Types pour l'interface utilisateur
interface UIQuestion {
  id: string;
  question: string;
  type_reponse: string;
  key_reponse: string;
  ordre: number;
  options_json?: any;
  condition_affichage?: string;
}

interface EligibilityState {
  allQuestions: any[];
  currentQuestion: UIQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  progress: number;
  userAnswers: Record<string, any>;
  eligibilityResults: any[];
  loading: boolean;
  error: string | null;
  completed: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
}

export const useEligibilityForm = () => {
  const [state, setState] = useState<EligibilityState>({
    allQuestions: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
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

  // ═══════════════════════════════════════════════════════════
  // CHARGEMENT INITIAL DES QUESTIONS
  // ═══════════════════════════════════════════════════════════
  
  const loadAllData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔄 Chargement des questions...');
      
      // Charger uniquement les questions (plus besoin de eligibility)
      const questionsFromDB = await loadQuestionsFromDB();
      
      if (!questionsFromDB?.length) {
        throw new Error('Aucune question trouvée');
      }

      // Trier par ordre et prendre la première question
      const sortedQuestions = questionsFromDB.sort((a, b) => a.ordre - b.ordre);
      const firstQuestion = sortedQuestions[0];

      console.log(`✅ ${sortedQuestions.length} questions chargées`);
      console.log(`🚀 Début avec: ${firstQuestion.id}`);

      setState(prev => ({
        ...prev,
        allQuestions: sortedQuestions,
        currentQuestion: formatQuestionForUI(firstQuestion),
        totalQuestions: sortedQuestions.length,
        currentQuestionIndex: 0,
        progress: 0,
        loading: false,
        canGoBack: false,
        canGoNext: false
      }));

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`
      }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION BASÉE SUR LES BRANCHEMENTS_JSON
  // ═══════════════════════════════════════════════════════════

  const goToNextQuestion = useCallback(async () => {
    if (!state.currentQuestion) return;

    const currentAnswer = state.userAnswers[state.currentQuestion.key_reponse];
    console.log(`🧭 Navigation depuis ${state.currentQuestion.id} avec réponse: ${currentAnswer}`);

    // Vérifier si on peut terminer selon les fins anticipées
    const updatedAnswers = {
      ...state.userAnswers,
      [state.currentQuestion.key_reponse]: currentAnswer
    };

    if (canCompleteQuestionnaire(updatedAnswers)) {
      console.log('🏁 Fin anticipée du questionnaire');
      await completeQuestionnaire(updatedAnswers);
      return;
    }

    // Utiliser la logique de branchement de la table questions
    const nextQuestionId = getNextQuestionId(
      state.currentQuestion.id,
      currentAnswer,
      state.allQuestions
    );

    if (!nextQuestionId) {
      console.log('🏁 Fin du questionnaire selon les branchements');
      await completeQuestionnaire(updatedAnswers);
      return;
    }

    // Chercher la question suivante
    const nextQuestion = state.allQuestions.find(q => q.id === nextQuestionId);
    
    if (!nextQuestion) {
      console.error(`❌ Question ${nextQuestionId} non trouvée`);
      await completeQuestionnaire(updatedAnswers);
      return;
    }

    // Vérifier si la question doit être affichée selon sa condition
    if (!shouldShowQuestion(nextQuestion, updatedAnswers)) {
      console.log(`⏭️ Question ${nextQuestion.id} ignorée (condition non remplie)`);
      
      // Passer à la question suivante en mettant à jour temporairement les réponses
      setState(prev => ({
        ...prev,
        userAnswers: updatedAnswers,
        currentQuestion: formatQuestionForUI(nextQuestion)
      }));
      
      // Relancer la navigation
      setTimeout(() => goToNextQuestion(), 100);
      return;
    }

    // Naviguer vers la question suivante
    const newIndex = state.currentQuestionIndex + 1;
    setState(prev => ({
      ...prev,
      userAnswers: updatedAnswers,
      currentQuestion: formatQuestionForUI(nextQuestion),
      currentQuestionIndex: newIndex,
      progress: Math.min((newIndex / prev.totalQuestions) * 100, 90), // Max 90% avant analyse
      canGoBack: newIndex > 0,
      canGoNext: false // Reset jusqu'à la prochaine réponse
    }));

  }, [state.currentQuestion, state.userAnswers, state.allQuestions, state.currentQuestionIndex]);

  const goToPreviousQuestion = useCallback(() => {
    if (state.currentQuestionIndex <= 0 || !state.currentQuestion) return;

    // Pour la navigation en arrière, on utilise l'ordre plutôt que les branchements
    const currentOrder = state.currentQuestion.ordre;
    let previousQuestion = null;
    
    // Chercher la question précédente dans l'ordre inverse
    for (let i = state.allQuestions.length - 1; i >= 0; i--) {
      const candidate = state.allQuestions[i];
      if (candidate.ordre < currentOrder && shouldShowQuestion(candidate, state.userAnswers)) {
        previousQuestion = candidate;
        break;
      }
    }

    if (previousQuestion) {
      const newIndex = state.currentQuestionIndex - 1;
      setState(prev => ({
        ...prev,
        currentQuestion: formatQuestionForUI(previousQuestion),
        currentQuestionIndex: newIndex,
        progress: (newIndex / prev.totalQuestions) * 100,
        canGoBack: newIndex > 0,
        canGoNext: true // On peut avancer car on a déjà une réponse
      }));
    }
  }, [state.currentQuestion, state.allQuestions, state.currentQuestionIndex, state.userAnswers]);

  // ═══════════════════════════════════════════════════════════
  // GESTION DES RÉPONSES
  // ═══════════════════════════════════════════════════════════

  const handleAnswer = useCallback((value: any) => {
    if (!state.currentQuestion) return;

    console.log(`📝 Réponse: ${state.currentQuestion.key_reponse} = ${value}`);
    
    setState(prev => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [state.currentQuestion!.key_reponse]: value
      },
      canGoNext: value !== null && value !== undefined && value !== ''
    }));
  }, [state.currentQuestion]);

  // ═══════════════════════════════════════════════════════════
  // FINALISATION AVEC ANALYSE D'ÉLIGIBILITÉ
  // ═══════════════════════════════════════════════════════════

  const completeQuestionnaire = useCallback(async (finalAnswers?: Record<string, any>) => {
    try {
      console.log('🎯 Analyse d\'éligibilité...');
      setState(prev => ({ ...prev, loading: true }));

      const answersToAnalyze = finalAnswers || state.userAnswers;
      const results = await analyzeEligibility(answersToAnalyze);
      
      console.log(`✅ Analyse terminée: ${results.length} aides éligibles`);

      setState(prev => ({
        ...prev,
        userAnswers: answersToAnalyze,
        eligibilityResults: results,
        completed: true,
        loading: false,
        progress: 100
      }));

    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      setState(prev => ({
        ...prev,
        error: `Erreur d'analyse: ${error instanceof Error ? error.message : 'Inconnue'}`,
        loading: false
      }));
    }
  }, [state.userAnswers]);

  // ═══════════════════════════════════════════════════════════
  // RESET DU QUESTIONNAIRE
  // ═══════════════════════════════════════════════════════════

  const resetQuestionnaire = useCallback(() => {
    setState(prev => {
      const firstQuestion = prev.allQuestions[0];
      return {
        ...prev,
        currentQuestion: firstQuestion ? formatQuestionForUI(firstQuestion) : null,
        currentQuestionIndex: 0,
        progress: 0,
        userAnswers: {},
        eligibilityResults: [],
        completed: false,
        canGoBack: false,
        canGoNext: false,
        error: null
      };
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // FONCTIONS UTILITAIRES
  // ═══════════════════════════════════════════════════════════

  const getCurrentQuestionAnswer = useCallback(() => {
    if (!state.currentQuestion) return null;
    return state.userAnswers[state.currentQuestion.key_reponse];
  }, [state.currentQuestion, state.userAnswers]);

  const getProgressText = useCallback(() => {
    return `Question ${state.currentQuestionIndex + 1} sur ${state.totalQuestions}`;
  }, [state.currentQuestionIndex, state.totalQuestions]);

  // Chargement initial au montage du composant
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Interface publique du hook
  return {
    // État actuel
    currentQuestion: state.currentQuestion,
    loading: state.loading,
    error: state.error,
    completed: state.completed,
    eligibilityResults: state.eligibilityResults,
    progress: state.progress,
    canGoBack: state.canGoBack,
    canGoNext: state.canGoNext,
    
    // Actions
    handleAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    resetQuestionnaire,
    
    // Helpers
    getCurrentQuestionAnswer,
    getProgressText
  };
}; 