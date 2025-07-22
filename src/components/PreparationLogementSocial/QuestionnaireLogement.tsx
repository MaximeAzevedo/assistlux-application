// Composant questionnaire pour la préparation logement social - Style vérificateur d'éligibilité

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Clock, Users, Globe, Home, Loader2 } from 'lucide-react';
import { QUESTIONS, LANGUES } from '../../constants/logementSocial';
import { ReponseQuestionnaire, LangueVideo } from '../../types/logementSocial';
import { useLogementSocial } from '../../hooks/useLogementSocial';

interface QuestionnaireLogementProps extends ReturnType<typeof useLogementSocial> {}

const QuestionnaireLogement: React.FC<QuestionnaireLogementProps> = ({ 
  terminerQuestionnaire 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reponses, setReponses] = useState<Partial<ReponseQuestionnaire>>({});
  const [userLanguage, setUserLanguage] = useState<LangueVideo>('fr');
  const [translating, setTranslating] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // LOGIQUE DE NAVIGATION
  // ═══════════════════════════════════════════════════════════

  const questionsApplicables = QUESTIONS.filter(q => !q.condition || q.condition(reponses));
  const currentQuestion = questionsApplicables[currentQuestionIndex];
  const totalQuestions = questionsApplicables.length;
  const progression = Math.round((currentQuestionIndex / totalQuestions) * 100);

  const peutContinuer = (reponse: any) => {
    if (reponse === undefined || reponse === null || reponse === '') return false;
    if (currentQuestion?.type === 'number' && (isNaN(Number(reponse)) || Number(reponse) < 0)) return false;
    return true;
  };

  const handleAnswer = (questionId: keyof ReponseQuestionnaire, valeur: any) => {
    const newReponses = { ...reponses, [questionId]: valeur };
    setReponses(newReponses);

    // Si la réponse est valide, passer automatiquement à la question suivante
    if (peutContinuer(valeur)) {
      setTimeout(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // Questionnaire terminé
          terminerQuestionnaire(newReponses as ReponseQuestionnaire);
        }
      }, 300); // Petit délai pour l'animation
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // TRADUCTION (simulée pour l'instant)
  // ═══════════════════════════════════════════════════════════

  const translateText = async (text: string, targetLang: LangueVideo): Promise<string> => {
    if (targetLang === 'fr') return text;
    
    setTranslating(true);
    
    // Simulation de traduction (vous pouvez intégrer votre service de traduction ici)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setTranslating(false);
    
    // Retourne le texte original pour l'instant (remplacez par votre API de traduction)
    return text;
  };

  const [translatedQuestion, setTranslatedQuestion] = useState<string>('');

  React.useEffect(() => {
    if (currentQuestion && userLanguage !== 'fr') {
      translateText(currentQuestion.titre, userLanguage).then(setTranslatedQuestion);
    } else {
      setTranslatedQuestion('');
    }
  }, [currentQuestion, userLanguage]);

  // ═══════════════════════════════════════════════════════════
  // RENDU DES COMPOSANTS
  // ═══════════════════════════════════════════════════════════

  const renderAnswerButton = (option: any, isSelected: boolean, variant: 'primary' | 'secondary' | 'success' | 'neutral' = 'primary') => {
    const baseClasses = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] font-medium text-lg shadow-sm";
    
    let classes = baseClasses;
    if (isSelected) {
      switch (variant) {
        case 'primary':
          classes += " border-blue-500 bg-blue-50 text-blue-700 shadow-md";
          break;
        case 'success':
          classes += " border-green-500 bg-green-50 text-green-700 shadow-md";
          break;
        case 'neutral':
          classes += " border-gray-500 bg-gray-50 text-gray-700 shadow-md";
          break;
      }
    } else {
      classes += " border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md bg-white";
    }

    return (
      <button
        key={option.value}
        onClick={() => handleAnswer(currentQuestion.id, option.value)}
        className={classes}
      >
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
            isSelected 
              ? 'border-current bg-current scale-110' 
              : 'border-gray-300'
          }`}>
            {isSelected && (
              <div className="w-full h-full rounded-full bg-white scale-[0.4]" />
            )}
          </div>
          <span>{option.label}</span>
        </div>
      </button>
    );
  };

  const renderNumberInput = () => {
    const currentValue = reponses[currentQuestion.id];
    
    return (
      <div className="space-y-4 max-w-sm mx-auto">
        <div className="text-center">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Saisissez votre réponse :
          </label>
          <input
            type="number"
            min={currentQuestion.min || 0}
            max={currentQuestion.max || 100}
            value={currentValue || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setReponses(prev => ({ ...prev, [currentQuestion.id]: value }));
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value) || 0;
                if (peutContinuer(value)) {
                  handleAnswer(currentQuestion.id, value);
                }
              }
            }}
            className="w-24 px-4 py-3 text-xl font-bold text-center bg-white border-2 border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 shadow-md"
            placeholder="0"
            autoFocus
          />
        </div>
        
        {currentValue !== undefined && peutContinuer(currentValue) && (
          <div className="text-center pt-3">
            <button
              onClick={() => handleAnswer(currentQuestion.id, currentValue)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Confirmer ma réponse
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBooleanInput = () => {
    const currentValue = reponses[currentQuestion.id];
    
    return (
      <div className="space-y-3 max-w-md mx-auto">
        {renderAnswerButton(
          { value: true, label: 'Oui' }, 
          currentValue === true, 
          'success'
        )}
        {renderAnswerButton(
          { value: false, label: 'Non' }, 
          currentValue === false, 
          'neutral'
        )}
      </div>
    );
  };

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <Home className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <div className="text-blue-600 mb-4">Questionnaire terminé</div>
      </div>
    );
  }

  const currentValue = reponses[currentQuestion.id];
  const langueInfo = LANGUES.find(l => l.code === userLanguage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header avec sélecteur de langue */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-md border border-gray-100/50 mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Préparation Logement Social</h1>
                <p className="text-xs text-gray-500">Questionnaire personnalisé</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Sélecteur de langue */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-600" />
                <select
                  value={userLanguage}
                  onChange={(e) => setUserLanguage(e.target.value as LangueVideo)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LANGUES.map(langue => (
                    <option key={langue.code} value={langue.code}>
                      {langue.flag} {langue.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500">Question {currentQuestionIndex + 1}/{totalQuestions}</div>
                <div className="text-xs text-gray-600">🏠 Documents logement social</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progression */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-md border border-gray-100/50 mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  Question {currentQuestionIndex + 1} sur {totalQuestions}
                </span>
                <div className="text-xs text-gray-500">Progression du questionnaire</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-blue-900">
                {progression}% complété
              </span>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progression}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-md border border-gray-100/50 p-6 relative">
          {/* Effet de fond subtil */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none rounded-xl"></div>
          
          <div className="text-center mb-6 relative z-10">
            {/* Icône de la question */}
            <div className="text-4xl mb-4">🏠</div>
            
            <div className="space-y-4">
              {/* Section travailleur social */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-blue-900">
                    POUR LE TRAVAILLEUR SOCIAL
                  </h3>
                </div>
                <p className="text-lg text-blue-800 font-medium leading-relaxed">
                  {currentQuestion.titre}
                </p>
                {currentQuestion.description && (
                  <p className="text-sm text-blue-700 mt-2 opacity-80">
                    {currentQuestion.description}
                  </p>
                )}
              </div>

              {/* Section usager (si traduite) */}
              {userLanguage !== 'fr' && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-md flex items-center justify-center">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      POUR L'USAGER ({langueInfo?.label})
                    </h3>
                  </div>
                  <div className="text-lg text-emerald-800 font-medium leading-relaxed">
                    {translating ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Traduction en cours...</span>
                      </div>
                    ) : (
                      translatedQuestion || currentQuestion.titre
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options de réponse */}
          <div className="flex justify-center mt-8 relative z-10 px-4 pb-8">
            {currentQuestion.type === 'select' && currentQuestion.options && (
              <div className="space-y-3 w-full max-w-md">
                {currentQuestion.options.map(option => 
                  renderAnswerButton(option, currentValue === option.value)
                )}
              </div>
            )}

            {currentQuestion.type === 'number' && renderNumberInput()}

            {currentQuestion.type === 'boolean' && renderBooleanInput()}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between items-center">
          {currentQuestionIndex > 0 ? (
            <button
              onClick={handlePrevious}
              className="group flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 bg-white/60 hover:bg-white/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-200/50 hover:border-gray-300/50 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Précédent</span>
            </button>
          ) : (
            <div></div>
          )}
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-sm">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-medium text-green-900">
                Vos réponses ne sont PAS sauvées
              </span>
              <span className="text-xs text-green-700">
                Respect total de la vie privée
              </span>
            </div>
          </div>

          <div></div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireLogement; 