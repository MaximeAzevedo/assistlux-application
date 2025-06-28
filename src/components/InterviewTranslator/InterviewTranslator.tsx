import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Volume2,
  Languages,
  Users,
  Square,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConversationHistory from './ConversationHistory';
import { useInterviewTranslator } from '../../hooks/useInterviewTranslator';
import { InterviewSession, SpeakerRole } from '../../types/interviewTranslator';
import { checkAzureSpeechConfig, logAzureConfigStatus } from '../../utils/checkAzureConfig';

const InterviewTranslator: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // États principaux
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<SpeakerRole>('assistant');
  const [azureConfig, setAzureConfig] = useState(checkAzureSpeechConfig());

  // Configuration des langues - l'assistant social prend automatiquement la langue de l'app
  const assistantLanguage = i18n.language || 'fr';
  const [userLanguage, setUserLanguage] = useState('ar');

  // Vérification de la configuration Azure au montage
  useEffect(() => {
    logAzureConfigStatus();
    setAzureConfig(checkAzureSpeechConfig());
  }, []);

  // Hook personnalisé pour la logique de traduction
  const {
    isListening,
    isTranslating,
    messages,
    startListening,
    stopListening,
    switchSpeaker,
    endSession,
    exportToPDF,
    toggleAutoListenMode
  } = useInterviewTranslator({
    userLanguage,
    onSessionUpdate: setCurrentSession
  });

  // Démarrage d'une nouvelle session
  const handleStartSession = () => {
    const newSession: InterviewSession = {
      id: crypto.randomUUID(),
      startTime: new Date(),
      assistantLanguage,
      userLanguage,
      messages: [],
      status: 'active',
      participants: {
        assistant: { name: 'Assistant social', language: assistantLanguage },
        user: { name: 'Usager', language: userLanguage }
      }
    };
    
    setCurrentSession(newSession);
    setIsSessionActive(true);
  };

  // Gestion de la fin de session
  const handleEndSession = async () => {
    if (currentSession) {
      await endSession();
      setIsSessionActive(false);
      setCurrentSession(null);
    }
  };

  // Langues supportées avec support optimal Azure Speech Services (Fast Transcription + voix neuronales)
  const supportedLanguages = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }, // ar-SA - Fast Transcription ✅
    { code: 'da', name: 'Dansk', flag: '🇩🇰' }, // da-DK - Fast Transcription ✅
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }, // de-DE - Fast Transcription ✅
    { code: 'en', name: 'English', flag: '🇬🇧' }, // en-GB/en-US - Fast Transcription ✅
    { code: 'es', name: 'Español', flag: '🇪🇸' }, // es-ES - Fast Transcription ✅
    { code: 'fi', name: 'Suomi', flag: '🇫🇮' }, // fi-FI - Fast Transcription ✅
    { code: 'fr', name: 'Français', flag: '🇫🇷' }, // fr-FR - Fast Transcription ✅
    { code: 'he', name: 'עברית', flag: '🇮🇱' }, // he-IL - Fast Transcription ✅
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }, // hi-IN - Fast Transcription ✅
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }, // it-IT - Fast Transcription ✅
    { code: 'ja', name: '日本語', flag: '🇯🇵' }, // ja-JP - Fast Transcription ✅
    { code: 'ko', name: '한국어', flag: '🇰🇷' }, // ko-KR - Fast Transcription ✅
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }, // nl-NL - Fast Transcription ✅
    { code: 'pl', name: 'Polski', flag: '🇵🇱' }, // pl-PL - Fast Transcription ✅
    { code: 'pt', name: 'Português', flag: '🇵🇹' }, // pt-PT - Fast Transcription ✅
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }, // ru-RU - Fast Transcription ✅
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' }, // sv-SE - Fast Transcription ✅
    { code: 'th', name: 'ไทย', flag: '🇹🇭' }, // th-TH - Fast Transcription ✅
    { code: 'zh', name: '中文', flag: '🇨🇳' }, // zh-CN - Fast Transcription ✅
    
    // Langues avec support standard (pas de Fast Transcription mais voix neuronales)
    { code: 'bg', name: 'Български', flag: '🇧🇬' }, // bg-BG - Support standard
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' }, // cs-CZ - Support standard
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' }, // el-GR - Support standard
    { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' }, // hr-HR - Support standard
    { code: 'hu', name: 'Magyar', flag: '🇭🇺' }, // hu-HU - Support standard
    { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' }, // lt-LT - Support standard
    { code: 'lv', name: 'Latviešu', flag: '🇱🇻' }, // lv-LV - Support standard
    { code: 'nb', name: 'Norsk bokmål', flag: '🇳🇴' }, // nb-NO - Support standard
    { code: 'ro', name: 'Română', flag: '🇷🇴' }, // ro-RO - Support standard
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' }, // sk-SK - Support standard
    { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' }, // sl-SI - Support standard
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }, // tr-TR - Support standard
    { code: 'uk', name: 'Українська', flag: '🇺🇦' }, // uk-UA - Support standard
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' }, // fa-IR - Support standard
    { code: 'ur', name: 'اردو', flag: '🇵🇰' } // ur-PK - Support standard
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header simplifié */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Traducteur d'Entretiens
                </h1>
                <p className="text-sm text-gray-600">
                  {isSessionActive ? 'Session en cours' : 'Traduction temps réel'}
                </p>
              </div>
            </div>
          </div>

          {isSessionActive && (
            <div className="flex gap-3">
              <button
                onClick={exportToPDF}
                disabled={messages.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                Export bilingue
              </button>
              
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Terminer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!isSessionActive ? (
          /* Interface de configuration premium et épurée */
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
            
            {/* Alerte configuration si nécessaire */}
            {!azureConfig.isConfigured && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">
                      Configuration requise
                    </h3>
                    <p className="text-amber-800 mb-3">
                      Contactez votre support technique pour activer Azure Speech Services.
                    </p>
                    <div className="bg-amber-100 rounded-lg p-3">
                      <p className="text-sm text-amber-800 font-medium">
                        💡 Service nécessaire pour la traduction vocale temps réel
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-8 text-center">
              {/* Icône principale */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Languages className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Nouveau entretien
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {azureConfig.isConfigured 
                  ? 'Sélectionnez la langue de votre usager et commencez votre entretien avec traduction automatique.'
                  : 'La configuration Azure Speech Services est requise pour utiliser la traduction vocale.'
                }
              </p>

              {azureConfig.isConfigured && (
                <>
                  {/* Sélection langue premium */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Langue de votre usager
                    </h3>
                    
                    <div className="max-w-xs mx-auto">
                      <select
                        value={userLanguage}
                        onChange={(e) => setUserLanguage(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-base font-medium shadow-sm transition-all duration-200 hover:border-gray-300"
                      >
                        {supportedLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code} className="py-2">
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bouton de démarrage premium */}
                  <button
                    onClick={handleStartSession}
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-semibold text-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <Mic className="w-6 h-6" />
                      <span>Commencer l'entretien</span>
                    </div>
                  </button>

                  {/* Instructions simplifiées */}
                  <div className="mt-6 bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Comment ça marche :</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Cliquez sur le microphone pour parler</p>
                      <p>• Le système détecte automatiquement qui parle</p>
                      <p>• La traduction se fait en temps réel</p>
                      <p>• Coût optimisé : ~2-3€/heure</p>
                    </div>
                  </div>
                </>
              )}

              {/* Note de sécurité discrète */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                </div>
                <span>Sécurisé • Conforme RGPD</span>
              </div>
            </div>
          </div>
        ) : (
          /* Interface de conversation optimisée pour l'usage professionnel */
          <div className="space-y-6">
            {/* Contrôle principal avec gestion intelligente */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-gray-100/50 p-8 text-center">
              
              {/* Grand bouton microphone avec feedback visuel */}
              <div className="mb-6">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isTranslating}
                  className={`
                    w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 transform mx-auto shadow-lg
                    ${isListening 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 text-white scale-110 animate-pulse shadow-red-200/50' 
                      : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:shadow-purple-200/50 text-white hover:scale-105'
                    }
                    ${isTranslating ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  {isListening ? (
                    <MicOff className="w-14 h-14" />
                  ) : (
                    <Mic className="w-14 h-14" />
                  )}
                </button>
              </div>

              {/* Statut clair et actionnable */}
              <div className="mb-6">
                {isTranslating ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <p className="text-lg font-semibold text-blue-600">Traduction...</p>
                  </div>
                ) : isListening ? (
                  <div className="space-y-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mx-auto"></div>
                    <p className="text-lg font-semibold text-green-600">🎤 En écoute</p>
                    <p className="text-sm text-gray-500">Parlez maintenant</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-gray-900">Appuyez pour parler</p>
                    <p className="text-sm text-gray-600">Cliquez quand vous ou votre usager voulez parler</p>
                  </div>
                )}
              </div>

              {/* Indicateur de locuteur épuré */}
              <div className="bg-gray-50 rounded-lg p-3 max-w-sm mx-auto">
                <p className="text-xs text-gray-500 mb-1">Locuteur détecté :</p>
                <p className="font-semibold text-gray-900 flex items-center justify-center gap-2">
                  {currentSpeaker === 'assistant' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Assistant social
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Usager
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Historique épuré */}
            <ConversationHistory
              messages={messages}
              assistantLanguage={assistantLanguage}
              userLanguage={userLanguage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewTranslator; 