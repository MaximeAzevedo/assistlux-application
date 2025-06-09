import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Target, Loader2, Shield, ArrowRight, CheckCircle, AlertCircle, Trophy, Info } from 'lucide-react';
import { useEligibilityWizardRefactored } from '../../hooks/useEligibilityWizardRefactored';
import EligibilityResultsRefactored from './EligibilityResultsRefactored';

// ═══════════════════════════════════════════════════════════
// TYPES ET INTERFACES
// ═══════════════════════════════════════════════════════════

interface EligibilityWizardRefactoredProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL - WIZARD REFACTORISÉ
// ═══════════════════════════════════════════════════════════

const EligibilityWizardRefactored: React.FC<EligibilityWizardRefactoredProps> = ({ onBack }) => {
  const { t } = useTranslation();
  
  // ─────────────────────────────────────────────────────────
  // HOOK CENTRALISÉ - TOUTE LA LOGIQUE EXTERNALISÉE
  // ─────────────────────────────────────────────────────────
  
  const {
    // État
    currentQuestion,
    loading,
    error,
    completed,
    eligibilityResults,
    progress,
    canGoBack,

    // Actions
    handleAnswer,
    navigateToPrevious,
    resetWizard,

    // Utilitaires
    getCurrentAnswer,
    getProgressText
  } = useEligibilityWizardRefactored();

  // ═══════════════════════════════════════════════════════════
  // RENDU DES ÉTATS DE CHARGEMENT ET D'ERREUR
  // ═══════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg">Chargement du questionnaire...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-700 mb-2">Erreur</h3>
        <div className="text-red-600 mb-4">{error}</div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Recharger la page
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDU DES RÉSULTATS D'ÉLIGIBILITÉ
  // ═══════════════════════════════════════════════════════════

  if (completed) {
    const eligibleResults = eligibilityResults.filter(r => r.category === 'Eligible');
    const maybeResults = eligibilityResults.filter(r => r.category === 'Maybe');
    const ineligibleResults = eligibilityResults.filter(r => r.category === 'Ineligible');

    return (
      <div className="space-y-6">
        {/* Header des résultats */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {eligibleResults.length > 0 ? (
              <Trophy className="w-16 h-16 text-green-500" />
            ) : (
              <Info className="w-16 h-16 text-blue-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyse terminée !
          </h2>
          <p className="text-gray-600 mb-4">
            Voici vos résultats d'éligibilité personnalisés
          </p>
          <div className="text-sm text-gray-500">
            {eligibleResults.length > 0 && (
              <span className="text-green-600 font-medium">
                ✅ {eligibleResults.length} aide(s) éligible(s)
              </span>
            )}
            {maybeResults.length > 0 && (
              <span className="text-orange-600 font-medium ml-4">
                🤔 {maybeResults.length} à examiner
              </span>
            )}
            {ineligibleResults.length > 0 && (
              <span className="text-gray-500 font-medium ml-4">
                ℹ️ {ineligibleResults.length} info(s)
              </span>
            )}
          </div>
        </div>

        {/* Résultats éligibles */}
        {eligibleResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-700 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Aides pour lesquelles vous êtes éligible
            </h3>
            {eligibleResults.map((result, index) => (
              <div 
                key={`eligible-${index}`}
                className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-xl font-bold text-green-900">
                    {result.title}
                  </h4>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✅ Éligible
                  </span>
                </div>
                <p className="text-green-800 mb-4 leading-relaxed">
                  {result.message}
                </p>
                <div className="flex gap-3">
                  {result.form && (
                    <a
                      href={result.form}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      📄 {result.action || 'Formulaire'}
                    </a>
                  )}
                  {result.source && (
                    <a
                      href={result.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      ℹ️ Plus d'informations
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Résultats à examiner */}
        {maybeResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Aides à examiner selon votre situation
            </h3>
            {maybeResults.map((result, index) => (
              <div 
                key={`maybe-${index}`}
                className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-xl font-bold text-orange-900">
                    {result.title}
                  </h4>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    🤔 À examiner
                  </span>
                </div>
                <p className="text-orange-800 mb-4 leading-relaxed">
                  {result.message}
                </p>
                <div className="flex gap-3">
                  {result.form && (
                    <a
                      href={result.form}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      📄 {result.action || 'En savoir plus'}
                    </a>
                  )}
                  {result.source && (
                    <a
                      href={result.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      ℹ️ Informations détaillées
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informations générales */}
        {ineligibleResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Informations selon votre profil
            </h3>
            {ineligibleResults.map((result, index) => (
              <div 
                key={`info-${index}`}
                className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {result.title}
                  </h4>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    ℹ️ Information
                  </span>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {result.message}
                </p>
                {(result.form || result.source) && (
                  <div className="flex gap-3">
                    {result.form && (
                      <a
                        href={result.form}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        🔗 {result.action || 'Ressources'}
                      </a>
                    )}
                    {result.source && (
                      <a
                        href={result.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        📖 Documentation
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions finales */}
        <div className="flex justify-center gap-4 pt-6 border-t">
          <button
            onClick={resetWizard}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            🔄 Nouveau test
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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

  const currentAnswer = getCurrentAnswer();

  // Fonction pour gérer la sélection d'une réponse avec navigation automatique
  const handleAnswerAndNavigate = (value: string | number) => {
    handleAnswer(value);
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
              onClick={navigateToPrevious}
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Précédent
            </button>
          )}
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question actuelle */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h2>

        {/* Rendu des options selon le type de question */}
        <div className="space-y-3">
          {currentQuestion.type_reponse === 'Oui_Non' && (
            <>
              <AnswerButton
                selected={currentAnswer === 'opt_oui'}
                onClick={() => handleAnswerAndNavigate('opt_oui')}
                text={currentQuestion.options_json?.opt_oui || 'Oui'}
                variant="success"
              />
              
              <AnswerButton
                selected={currentAnswer === 'opt_non'}
                onClick={() => handleAnswerAndNavigate('opt_non')}
                text={currentQuestion.options_json?.opt_non || 'Non'}
                variant="neutral"
              />
            </>
          )}

          {(currentQuestion.type_reponse === 'Choix_Multiple_ABC' || 
            currentQuestion.type_reponse === 'Choix_Multiple_Simple') && 
            currentQuestion.options_json && (
            <>
              {Object.entries(currentQuestion.options_json).map(([key, value], index) => (
                <AnswerButton
                  key={key}
                  selected={currentAnswer === key}
                  onClick={() => handleAnswerAndNavigate(key)}
                  text={value as string}
                  variant={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'neutral'}
                />
              ))}
            </>
          )}

          {currentQuestion.type_reponse === 'Number' && (
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Entrez un nombre et appuyez sur Entrée"
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-lg"
                value={currentAnswer || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : '';
                  handleAnswer(value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentAnswer !== undefined && currentAnswer !== '') {
                    handleAnswerAndNavigate(currentAnswer);
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

// ═══════════════════════════════════════════════════════════
// COMPOSANT BOUTON DE RÉPONSE
// ═══════════════════════════════════════════════════════════

interface AnswerButtonProps {
  selected: boolean;
  onClick: () => void;
  text: string;
  variant: 'primary' | 'secondary' | 'success' | 'neutral';
}

const AnswerButton: React.FC<AnswerButtonProps> = ({ selected, onClick, text, variant }) => {
  const getVariantClasses = () => {
    const baseClasses = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] font-medium text-lg";
    
    if (selected) {
      switch (variant) {
        case 'primary':
          return `${baseClasses} border-purple-500 bg-purple-50 text-purple-700 shadow-md`;
        case 'secondary':
          return `${baseClasses} border-blue-500 bg-blue-50 text-blue-700 shadow-md`;
        case 'success':
          return `${baseClasses} border-green-500 bg-green-50 text-green-700 shadow-md`;
        case 'neutral':
          return `${baseClasses} border-gray-500 bg-gray-50 text-gray-700 shadow-md`;
      }
    } else {
      return `${baseClasses} border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm`;
    }
  };

  return (
    <button
      onClick={onClick}
      className={getVariantClasses()}
    >
      <div className="flex items-center">
        <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
          selected 
            ? 'border-current bg-current scale-110' 
            : 'border-gray-300'
        }`}>
          {selected && (
            <div className="w-full h-full rounded-full bg-white scale-[0.4] animate-pulse" />
          )}
        </div>
        <span>{text}</span>
      </div>
    </button>
  );
};

export default EligibilityWizardRefactored; 