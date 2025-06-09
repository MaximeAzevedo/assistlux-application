import React from 'react';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useEligibilityForm } from '../../hooks/useEligibilityForm';

interface EligibilityWizardSimpleProps {
  onBack: () => void;
}

const EligibilityWizardSimple: React.FC<EligibilityWizardSimpleProps> = ({ onBack }) => {
  const {
    // État actuel
    currentQuestion,
    loading,
    error,
    completed,
    eligibilityResults,
    progress,
    canGoBack,
    canGoNext,
    
    // Actions
    handleAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    resetQuestionnaire,
    
    // Helpers
    getCurrentQuestionAnswer,
    getProgressText
  } = useEligibilityForm();

  // ═══════════════════════════════════════════════════════════
  // RENDU DES ÉTATS DE CHARGEMENT ET D'ERREUR
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2">Chargement des questions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-600 mb-4">Erreur : {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Recharger
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDU DES RÉSULTATS D'ÉLIGIBILITÉ
  // ═══════════════════════════════════════════════════════════

  if (completed) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyse terminée !
          </h2>
          <p className="text-gray-600">
            Voici les résultats de votre évaluation d'éligibilité
          </p>
        </div>

        {eligibilityResults.length > 0 ? (
          <div className="space-y-4">
            {eligibilityResults.map((result, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-6 ${
                  result.category === 'Eligible' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      result.category === 'Eligible' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.title || result.aid_id}
                    </h3>
                    <p className={`mb-3 ${
                      result.category === 'Eligible' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                  <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                    result.category === 'Eligible' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.category === 'Eligible' ? '✅ Éligible' : '❌ Non éligible'}
                  </div>
                </div>
                
                {result.category === 'Eligible' && (
                  <div className="flex gap-3 mt-4">
                    {result.form && (
                      <a
                        href={result.form}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        📄 {result.action || 'Télécharger le formulaire'}
                      </a>
                    )}
                    {result.source && (
                      <a
                        href={result.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        ℹ️ Plus d'informations
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-gray-50 rounded-lg p-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Analyse en cours...
            </h3>
            <p className="text-gray-600">
              Aucun résultat trouvé pour le moment. Vérifiez votre connexion ou réessayez.
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={resetQuestionnaire}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🔄 Recommencer
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Retour au menu
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDU DU QUESTIONNAIRE
  // ═══════════════════════════════════════════════════════════

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <div className="text-amber-600 mb-4">Aucune question disponible</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Retour
        </button>
      </div>
    );
  }

  const currentAnswer = getCurrentQuestionAnswer();

  const handleAnswerSelection = (value: any) => {
    handleAnswer(value);
    // Navigation immédiate sans délai pour une expérience ultra-fluide
    goToNextQuestion();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header avec progression */}
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </button>
          <div className="text-sm text-gray-600 font-medium">
            {getProgressText()}
          </div>
          {canGoBack && (
            <button
              onClick={goToPreviousQuestion}
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Précédent
            </button>
          )}
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question actuelle */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {currentQuestion.question}
        </h2>

        {/* Rendu des options selon le type de question */}
        <div className="space-y-3">
          {currentQuestion.type_reponse === 'Oui_Non' && (
            <>
              <button
                onClick={() => handleAnswerSelection('opt_oui')}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                  currentAnswer === 'opt_oui'
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
                    currentAnswer === 'opt_oui' 
                      ? 'border-purple-500 bg-purple-500 scale-110' 
                      : 'border-gray-300'
                  }`}>
                    {currentAnswer === 'opt_oui' && (
                      <div className="w-full h-full rounded-full bg-white scale-[0.4] animate-pulse" />
                    )}
                  </div>
                  <span className="font-medium text-lg">
                    {currentQuestion.options_json?.opt_oui || 'Oui'}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleAnswerSelection('opt_non')}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                  currentAnswer === 'opt_non'
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
                    currentAnswer === 'opt_non' 
                      ? 'border-purple-500 bg-purple-500 scale-110' 
                      : 'border-gray-300'
                  }`}>
                    {currentAnswer === 'opt_non' && (
                      <div className="w-full h-full rounded-full bg-white scale-[0.4] animate-pulse" />
                    )}
                  </div>
                  <span className="font-medium text-lg">
                    {currentQuestion.options_json?.opt_non || 'Non'}
                  </span>
                </div>
              </button>
            </>
          )}

          {(currentQuestion.type_reponse === 'Choix_Multiple_ABC' || 
            currentQuestion.type_reponse === 'Choix_Multiple_Simple') && 
            currentQuestion.options_json && (
            <>
              {Object.entries(currentQuestion.options_json).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelection(key)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                    currentAnswer === key
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
                      currentAnswer === key 
                        ? 'border-purple-500 bg-purple-500 scale-110' 
                        : 'border-gray-300'
                    }`}>
                      {currentAnswer === key && (
                        <div className="w-full h-full rounded-full bg-white scale-[0.4] animate-pulse" />
                      )}
                    </div>
                    <span className="font-medium text-lg">{value as string}</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {currentQuestion.type_reponse === 'Number' && (
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Entrez un nombre et appuyez sur Entrée"
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(e.target.value ? parseFloat(e.target.value) : '')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentAnswer) {
                    goToNextQuestion();
                  }
                }}
                autoFocus
              />
              <p className="text-sm text-gray-500 text-center">
                ⏎ Appuyez sur Entrée pour continuer
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EligibilityWizardSimple; 