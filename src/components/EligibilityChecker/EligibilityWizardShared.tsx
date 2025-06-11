import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Globe,
  FileText,
  Loader2,
  Settings
} from 'lucide-react';
import { eligibilityService, Question, EligibilitySession, EligibilityResult } from '../../services/eligibilityService';
import { supportedLanguages, SupportedLanguage } from '../../lib/translation';

interface EligibilityCompleteResult extends EligibilityResult {
  session?: EligibilitySession;
  report?: {
    professional: string;
    user: string;
  };
}

interface EligibilityWizardSharedProps {
  onBack?: () => void;
  onComplete?: (results: EligibilityCompleteResult) => void;
}

const EligibilityWizardShared: React.FC<EligibilityWizardSharedProps> = ({ 
  onBack, 
  onComplete 
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [session, setSession] = useState<EligibilitySession>({
    sessionId: crypto.randomUUID(),
    responses: {},
    currentQuestionIndex: 0,
    language: 'fr',
    startTime: new Date(),
    estimatedRemainingTime: 300
  });
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [showEarlyExit, setShowEarlyExit] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Charger les questions depuis le service
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await eligibilityService.loadQuestions();
      setQuestions(questionsData);
      setCurrentQuestion(questionsData[0]);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
      setLoading(false);
    }
  };

  // Traduire une question avec le service
  const translateQuestion = async (question: Question, targetLang: string) => {
    if (targetLang === 'fr') return question;
    
    setTranslating(true);
    try {
      const translated = await eligibilityService.translateQuestion(question, targetLang);
      return translated;
    } finally {
      setTranslating(false);
    }
  };

  // Répondre à une question
  const handleAnswer = async (optionKey: string, optionValue: string) => {
    if (!currentQuestion) return;

    const newResponses = {
      ...session.responses,
      [currentQuestion.key_reponse]: optionKey
    };

    // Vérifier si c'est un arrêt précoce
    if (currentQuestion.branchements_json[optionKey] === 'PROF_END') {
      setShowEarlyExit(true);
      setSession(prev => ({ ...prev, responses: newResponses }));
      return;
    }

    // Passer à la question suivante
    const nextQuestionId = currentQuestion.branchements_json[optionKey];
    
    // Vérifier si on doit évaluer (fin du questionnaire)
    if (nextQuestionId === 'PROF_EVAL' || !nextQuestionId) {
      await evaluateEligibility(newResponses);
      return;
    }

    const nextQuestion = questions.find(q => q.id === nextQuestionId);
    
    if (nextQuestion) {
      const translatedQuestion = session.language !== 'fr' 
        ? await translateQuestion(nextQuestion, session.language)
        : nextQuestion;
        
      setCurrentQuestion(translatedQuestion);
      setSession(prev => ({
        ...prev,
        responses: newResponses,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        estimatedRemainingTime: Math.max(0, prev.estimatedRemainingTime - (currentQuestion.estimated_time_seconds || 30))
      }));
    }
  };

  // Évaluer l'éligibilité avec le service
  const evaluateEligibility = async (responses: Record<string, string>) => {
    try {
      setEvaluating(true);
      const updatedSession = { ...session, responses };
      const result = await eligibilityService.evaluateEligibility(responses);
      
      // Générer rapport bilingue
      const report = eligibilityService.generateBilingualReport(result, updatedSession, session.language);
      
      onComplete?.({ 
        ...result, 
        session: updatedSession,
        report 
      });
    } catch (error) {
      console.error('Erreur lors de l\'évaluation:', error);
    } finally {
      setEvaluating(false);
    }
  };

  // Changer de langue pour l'usager
  const changeUserLanguage = async (langCode: SupportedLanguage) => {
    if (!currentQuestion || translating) return;
    
    setSession(prev => ({ ...prev, language: langCode }));
    setShowLanguageSelector(false);
    
    // Toujours commencer par récupérer la question originale française
    const originalQuestion = questions.find(q => q.id === currentQuestion.id);
    if (!originalQuestion) return;
    
    if (langCode !== 'fr') {
      // Traduire depuis le français vers la nouvelle langue
      const translated = await translateQuestion(originalQuestion, langCode);
      setCurrentQuestion(translated);
    } else {
      // Utiliser directement la version française
      setCurrentQuestion(originalQuestion);
    }
  };

  const progressPercentage = questions.length > 0 
    ? Math.round((session.currentQuestionIndex / questions.length) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Traductions pour l'en-tête selon la langue de l'usager
  const getHeaderTextForUser = (langCode: SupportedLanguage) => {
    const headerTranslations: Record<SupportedLanguage, string> = {
      'ar': 'بالنسبة لك',     // Pour vous (arabe)
      'en': 'FOR YOU',       // Pour vous (anglais)
      'fr': 'POUR VOUS',     // Pour vous (français)
      'de': 'FÜR SIE',       // Pour vous (allemand)
      'lb': 'FIR IECH',      // Pour vous (luxembourgeois)
      'pt': 'PARA VOCÊ',     // Pour vous (portugais)
      'ru': 'ДЛЯ ВАС',       // Pour vous (russe)
      'tr': 'SİZİN İÇİN',    // Pour vous (turc)
      'fa': 'برای شما',       // Pour vous (persan)
      'ur': 'آپ کے لیے',      // Pour vous (ourdou)
      'it': 'PER VOI',       // Pour vous (italien)
      'es': 'PARA USTED',    // Pour vous (espagnol)
      'nl': 'VOOR U',        // Pour vous (néerlandais)
      'pl': 'DLA PAŃSTWA',   // Pour vous (polonais)
      'ro': 'PENTRU DVS.'    // Pour vous (roumain)
    };
    
    return headerTranslations[langCode] || 'POUR VOUS';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des questions...</p>
        </div>
      </div>
    );
  }

  if (evaluating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Évaluation de votre éligibilité...</p>
          <p className="text-sm text-gray-500 mt-2">Analyse des aides disponibles</p>
        </div>
      </div>
    );
  }

  if (showEarlyExit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Conditions non remplies
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Malheureusement, vous ne remplissez pas les conditions de base (résidence au Luxembourg et titre de séjour valide) 
              pour accéder aux aides nationales luxembourgeoises. Nous vous conseillons de vous renseigner auprès de votre commune 
              pour les aides locales.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.open('https://guichet.public.lu', '_blank')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Consulter Guichet.lu
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec sélecteur de langue */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AssistLux - Vérification d'Éligibilité
                </h1>
                <p className="text-gray-600">Mode Écran Partagé</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                💡 Lisez la question ensemble, cliquez la réponse
              </div>
            </div>
          </div>
        </div>

        {/* Sélecteur de langue pour l'usager - Style DocumentScanner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Langue de rendu préférée pour l'usager</span>
            </div>
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              disabled={translating}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          {showLanguageSelector ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(supportedLanguages).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => changeUserLanguage(code as SupportedLanguage)}
                  disabled={translating}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    session.language === code
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  } ${translating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {info.nativeName}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-blue-700">
              {session.language 
                ? `Langue sélectionnée: ${supportedLanguages[session.language as keyof typeof supportedLanguages]?.nativeName}`
                : `Langue par défaut: ${supportedLanguages.fr.nativeName}`
              }
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Question {session.currentQuestionIndex + 1} sur {questions.length}
            </span>
            <span className="text-sm text-gray-500">
              ⏱️ ~{formatTime(session.estimatedRemainingTime)} restant
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question principale */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8">
          {currentQuestion && (
            <>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">{currentQuestion.icon_emoji}</div>
                
                <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      🔷 POUR LE TRAVAILLEUR SOCIAL:
                    </h3>
                    <p className="text-xl text-purple-800">
                      {questions.find(q => q.id === currentQuestion.id)?.question}
                    </p>
                  </div>

                  {session.language !== 'fr' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        🔷 {getHeaderTextForUser(session.language)} ({supportedLanguages[session.language as keyof typeof supportedLanguages]?.nativeName}):
                      </h3>
                      <p className="text-xl text-blue-800">
                        {translating ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Traduction en cours...</span>
                          </div>
                        ) : (
                          currentQuestion.question
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Aide contextuelle */}
                {currentQuestion.help_text && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      💡 <strong>Aide:</strong> {currentQuestion.help_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Options de réponse */}
              <div className="flex gap-6 justify-center">
                {Object.entries(currentQuestion.options_json).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleAnswer(key, value as string)}
                    disabled={translating}
                    className="px-12 py-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {key === 'opt_oui' ? '✅' : key === 'opt_non' ? '❌' : '📋'} {value as string}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer avec navigation */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          
          <div className="text-sm text-gray-500">
            🔒 Vos réponses ne sont PAS sauvées - Respect total de la vie privée
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityWizardShared; 