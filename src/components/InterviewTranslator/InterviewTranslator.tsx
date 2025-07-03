import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Volume2,
  Languages,
  Download,
  Globe,
  Clock
} from 'lucide-react';
import { azureSpeechService } from '../../services/azureSpeechService';
import { checkAzureSpeechConfig } from '../../utils/checkAzureConfig';
import { translateTextForInterview } from '../../lib/translation';
import LanguageSelector, { ALL_LANGUAGES, LanguageOption } from './LanguageSelector';
import SimpleLanguageSelector from './SimpleLanguageSelector';

interface TranslationMessage {
  id: string;
  timestamp: Date;
  speaker: 'assistant' | 'user';
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  targetLanguage: string;
}

const InterviewTranslator: React.FC = () => {
  const navigate = useNavigate();
  
  // États de base
  const [userLanguage, setUserLanguage] = useState('ar'); // Arabe par défaut pour éviter les bugs
  const [assistantLanguage, setAssistantLanguage] = useState('fr'); // Maintenant configurable
  const [azureConfigured, setAzureConfigured] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // États de session
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastMessageUncertain, setLastMessageUncertain] = useState<string | null>(null); // Pour correction manuelle
  
  // ➡️ Références stables pour éviter les re-renders
  const assistantLanguageRef = useRef(assistantLanguage);
  const userLanguageRef = useRef(userLanguage);
  const isListeningRef = useRef(isListening);
  const isTranslatingRef = useRef(isTranslating);
  const isConversationModeRef = useRef(isConversationMode);

  useEffect(() => {
    assistantLanguageRef.current = assistantLanguage;
  }, [assistantLanguage]);

  useEffect(() => {
    userLanguageRef.current = userLanguage;
  }, [userLanguage]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isTranslatingRef.current = isTranslating;
  }, [isTranslating]);

  useEffect(() => {
    isConversationModeRef.current = isConversationMode;
  }, [isConversationMode]);

  // Langues autorisées pour l'assistant (limitées)
  const ASSISTANT_LANGUAGES = useMemo(() => [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'Anglais', flag: '🇬🇧' },
    { code: 'de', name: 'Allemand', flag: '🇩🇪' },
    { code: 'pt', name: 'Portugais', flag: '🇵🇹' }
  ], []);
  
  // Languages sélectionnées pour l'affichage (optimisées)
  const selectedUserLang = useMemo(() => 
    ALL_LANGUAGES.find(lang => lang.code === userLanguage), 
    [userLanguage]
  );
  
  const selectedAssistantLang = useMemo(() => 
    ASSISTANT_LANGUAGES.find(lang => lang.code === assistantLanguage), 
    [assistantLanguage, ASSISTANT_LANGUAGES]
  );

  // Fonction pour corriger manuellement un message (stable)
  const correctLastMessage = useCallback((correctSpeaker: 'assistant' | 'user') => {
    if (!lastMessageUncertain) return;
    
    setMessages(prev => {
      const updated = [...prev];
      const lastMessage = updated[updated.length - 1];
      if (lastMessage && lastMessage.id === lastMessageUncertain) {
        // Recalculer les langues selon le bon locuteur
        if (correctSpeaker === 'assistant') {
          lastMessage.speaker = 'assistant';
          lastMessage.originalLanguage = assistantLanguage;
          lastMessage.targetLanguage = userLanguage;
        } else {
          lastMessage.speaker = 'user';
          lastMessage.originalLanguage = userLanguage;
          lastMessage.targetLanguage = assistantLanguage;
        }
        
        // Retraduire si nécessaire
        if (lastMessage.originalLanguage !== lastMessage.targetLanguage) {
          // Ici on pourrait relancer la traduction, pour l'instant on garde l'existante
        }
      }
      return updated;
    });
    
    setLastMessageUncertain(null);
  }, [lastMessageUncertain, assistantLanguage, userLanguage]);

  // Vérification de la configuration Azure
  useEffect(() => {
    const checkAzureConfig = async () => {
      try {
        const config = checkAzureSpeechConfig();
        setAzureConfigured(config.isConfigured);
        console.log('🔧 Azure configuré:', config.isConfigured);
      } catch (error) {
        console.error('Erreur vérification Azure:', error);
        setAzureConfigured(false);
      }
    };
    checkAzureConfig();
  }, []);

  // Configuration des callbacks Azure Speech
  const callbacksSetupRef = useRef(false);
    
  useEffect(() => {
    if (!azureSpeechService || callbacksSetupRef.current) {
      return;
    }
    
    callbacksSetupRef.current = true;
    console.log('🔧 Configuration unique des callbacks Azure Speech');

    // Variable pour éviter les traitements multiples du même résultat
    let isProcessing = false;
    let lastProcessedText = '';

    // Fonction pour démarrer l'écoute (référence stable)
    const restartListening = async () => {
      if (isListeningRef.current || isTranslatingRef.current) {
        console.log('Déjà en cours, ignorer restart');
        return;
      }
      
      if (!azureSpeechService.isAvailable()) {
        setErrorMessage('Service Azure Speech non configuré');
        return;
      }
      
      try {
        setIsListening(true);
        setErrorMessage(null);

        // 🆕 CORRECTION : Configuration multi-langues pour Azure Speech Services
        const recognitionOptions = {
          language: assistantLanguageRef.current, // Langue principale par défaut
          continuous: isConversationModeRef.current,
          interimResults: false,
          maxDuration: isConversationModeRef.current ? 300 : 30,
          // 🆕 AJOUT : Détection automatique de langues multiples
          autoDetectLanguage: true,
          candidateLanguages: [
            assistantLanguageRef.current, // Langue de l'assistant
            userLanguageRef.current       // Langue de l'usager
          ]
        };

        console.log('🔧 Configuration Azure Speech avec détection multi-langues:', {
          languePrincipale: assistantLanguageRef.current,
          languesCandidat: [assistantLanguageRef.current, userLanguageRef.current],
          detectionAuto: true
        });

        await azureSpeechService.startRecognition(recognitionOptions);
        console.log('🎤 Reconnaissance redémarrée automatiquement');

      } catch (error) {
        console.error('Erreur redémarrage reconnaissance:', error);
        setIsListening(false);
        setErrorMessage('Impossible de redémarrer la reconnaissance vocale');
      }
    };

    const handleResult = async (result: any) => {
      console.log('🎯 Résultat reconnaissance:', result.text);
      
      if (!result.text || result.text.trim().length === 0) {
        console.log('Résultat vide, ignorer');
        return;
      }

      // Éviter les doublons
      if (isProcessing || result.text === lastProcessedText) {
        console.log('🔄 Résultat déjà en cours de traitement, ignorer');
        return;
      }

      isProcessing = true;
      lastProcessedText = result.text;
      setIsTranslating(true);

      try {
        // Détection de langue intelligente et simple
        let detectedLanguage = result.language || 'unknown'; // Langue détectée par Azure
        let speaker: 'assistant' | 'user' = 'assistant';
        let confidence: 'high' | 'medium' | 'low' = 'medium';

        // 1. Utiliser la langue détectée par Azure Speech Services si disponible
        if (detectedLanguage !== 'unknown') {
          // Mapper les codes Azure vers nos codes de langue
          const azureToOurLanguage: Record<string, string> = {
            'fr-FR': 'fr',
            'pt-PT': 'pt', 
            'pt-BR': 'pt',
            'es-ES': 'es',
            'es-MX': 'es',
            'en-US': 'en',
            'en-GB': 'en',
            'de-DE': 'de',
            'it-IT': 'it',
            'ar-SA': 'ar',
            'ar-EG': 'ar',
            'ru-RU': 'ru',
            'zh-CN': 'zh',
            'ja-JP': 'ja',
            'ko-KR': 'ko'
          };
          
          const mappedLanguage = azureToOurLanguage[detectedLanguage] || detectedLanguage.split('-')[0];
          
          // Déterminer qui parle selon la langue détectée
          if (mappedLanguage === assistantLanguageRef.current) {
            speaker = 'assistant';
            detectedLanguage = mappedLanguage;
            confidence = 'high';
          } else if (mappedLanguage === userLanguageRef.current) {
            speaker = 'user';
            detectedLanguage = mappedLanguage;
            confidence = 'high';
          } else {
            // Langue détectée différente des langues configurées
            // Probablement l'usager qui parle une langue non configurée
            speaker = 'user';
            detectedLanguage = mappedLanguage;
            confidence = 'medium';
          }
        } else {
          // 2. Fallback : utiliser Azure OpenAI pour détecter la langue intelligemment
          console.log('🔍 Azure Speech n\'a pas détecté la langue, demande à OpenAI...');
          
          try {
            // Import du service AI pour la détection intelligente
            const { aiService } = await import('../../lib/aiService');
            
            // Détecter la langue avec OpenAI
            const detectedLang = await aiService.detectLanguage(result.text);
            
            if (detectedLang && detectedLang.length === 2) {
              detectedLanguage = detectedLang;
              
              // Déterminer qui parle selon la langue détectée
              if (detectedLanguage === assistantLanguageRef.current) {
                speaker = 'assistant';
                confidence = 'medium';
              } else {
                speaker = 'user';
                confidence = 'medium';
              }
              
              console.log(`🧠 OpenAI a détecté: ${detectedLanguage}`);
            } else {
              throw new Error('Détection OpenAI échouée');
            }
            
          } catch (error) {
            console.warn('⚠️ Erreur détection OpenAI:', error);
            
            // 3. Fallback final : utiliser la configuration utilisateur
            speaker = 'user';
            detectedLanguage = userLanguageRef.current;
            confidence = 'low';
          }
        }

        const targetLanguage = speaker === 'assistant' ? userLanguageRef.current : assistantLanguageRef.current;

        console.log(`🔍 Détection: ${detectedLanguage} | Locuteur: ${speaker} | Confiance: ${confidence} | Vers: ${targetLanguage}`);

        // Traduction si nécessaire
        let translatedText = result.text;
        let needsTranslation = detectedLanguage !== targetLanguage;
        
        if (needsTranslation) {
          try {
            if (translateTextForInterview) {
            translatedText = await translateTextForInterview(result.text, detectedLanguage, targetLanguage);
              console.log('✅ Traduction:', translatedText);
            } else {
              translatedText = `[${targetLanguage.toUpperCase()}] ${result.text}`;
            }
          } catch (error) {
            console.warn('⚠️ Erreur traduction:', error);
            translatedText = `[${targetLanguage.toUpperCase()}] ${result.text}`;
          }
        }

        // Créer le message
        const newMessage: TranslationMessage = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          speaker: speaker,
          originalText: result.text,
          translatedText: translatedText,
          originalLanguage: detectedLanguage,
          targetLanguage: targetLanguage
        };
        
        // Ajouter à l'historique
        setMessages(prev => {
          const isDuplicate = prev.some(msg => 
            msg.originalText === newMessage.originalText && 
            msg.timestamp.getTime() > Date.now() - 5000
          );
          
          if (isDuplicate) {
            console.log('🔄 Message dupliqué détecté, ignorer');
            return prev;
          }
          
          return [...prev, newMessage];
        });

        // Marquer pour correction si confiance faible
        if (confidence === 'low') {
          setLastMessageUncertain(newMessage.id);
        } else {
          setLastMessageUncertain(null);
        }

        // Synthèse vocale si traduction effectuée
        if (needsTranslation && translatedText !== result.text) {
          try {
            await azureSpeechService.speakText({
              text: translatedText,
              language: targetLanguage,
              rate: 0.9,
              volume: 80
            });
          } catch (error) {
            console.warn('Erreur synthèse vocale:', error);
          }
        }

        setIsTranslating(false);
        isProcessing = false;

        // Redémarrage automatique en mode conversation
        if (isConversationModeRef.current) {
        setTimeout(() => {
            if (isConversationModeRef.current && !isListeningRef.current && !isTranslatingRef.current) {
              restartListening();
            }
          }, 2000);
        }
        
      } catch (error) {
        console.error('Erreur traitement:', error);
        setErrorMessage('Erreur lors du traitement');
        setIsTranslating(false);
        isProcessing = false;
      }
    };

    const handleError = (error: any) => {
      console.error('Erreur Azure Speech:', error);
      setIsListening(false);
      setIsTranslating(false);
      setErrorMessage('Erreur de reconnaissance vocale');
      isProcessing = false;
      
      setTimeout(() => setErrorMessage(null), 5000);
    };

    const handleStatus = (status: 'listening' | 'processing' | 'stopped') => {
      console.log('Status Azure:', status);
      
      if (status === 'listening') {
        setErrorMessage(null);
      } else if (status === 'stopped') {
        setIsListening(false);
        
        // Redémarrage automatique en mode conversation
        if (isConversationModeRef.current) {
        setTimeout(() => {
            if (isConversationModeRef.current && !isListeningRef.current && !isTranslatingRef.current) {
              restartListening();
            }
          }, 1000);
        }
      }
    };

    azureSpeechService.addResultListener(handleResult);
    azureSpeechService.addErrorListener(handleError);
    azureSpeechService.addStatusListener(handleStatus);
    
    return () => {
      azureSpeechService.removeResultListener(handleResult);
      azureSpeechService.removeErrorListener(handleError);
      azureSpeechService.removeStatusListener(handleStatus);
      callbacksSetupRef.current = false;
    };
  }, []); // Dépendance vide pour configuration unique

  // Fonction de traduction fallback simple (stable)
  const fallbackTranslation = (text: string, fromLang: string, toLang: string): string => {
    // Dictionnaire de traductions basiques pour les phrases courantes d'entretiens sociaux
    const basicPhrases: Record<string, Record<string, Record<string, string>>> = {
      // Français -> Autres langues
      'fr': {
        'en': {
          'Bonjour': 'Hello',
          'Comment allez-vous': 'How are you',
          'J\'ai besoin d\'aide': 'I need help',
          'Merci': 'Thank you',
          'Au revoir': 'Goodbye',
          'Oui': 'Yes',
          'Non': 'No',
          'Je ne comprends pas': 'I don\'t understand',
          'Pouvez-vous répéter': 'Can you repeat',
          'Votre nom': 'Your name',
          'Votre adresse': 'Your address'
        },
        'ar': {
          'Bonjour': 'مرحبا',
          'Comment allez-vous': 'كيف حالك',
          'J\'ai besoin d\'aide': 'أحتاج مساعدة',
          'Merci': 'شكرا',
          'Au revoir': 'مع السلامة',
          'Oui': 'نعم',
          'Non': 'لا',
          'Je ne comprends pas': 'لا أفهم',
          'Pouvez-vous répéter': 'هل يمكنك أن تكرر',
          'Votre nom': 'اسمك',
          'Votre adresse': 'عنوانك'
        },
        'es': {
          'Bonjour': 'Hola',
          'Comment allez-vous': 'Cómo está usted',
          'J\'ai besoin d\'aide': 'Necesito ayuda',
          'Merci': 'Gracias',
          'Au revoir': 'Adiós',
          'Oui': 'Sí',
          'Non': 'No',
          'Je ne comprends pas': 'No entiendo',
          'Pouvez-vous répéter': 'Puede repetir',
          'Votre nom': 'Su nombre',
          'Votre adresse': 'Su dirección'
        }
      }
    };

    // Recherche de traduction exacte
    const translations = basicPhrases[fromLang]?.[toLang];
    if (translations && translations[text]) {
      return translations[text];
    }

    // Recherche partielle (pour les phrases qui contiennent les mots-clés)
    if (translations) {
      for (const [frenchPhrase, translation] of Object.entries(translations)) {
        if (text.toLowerCase().includes(frenchPhrase.toLowerCase())) {
          return translation;
        }
      }
    }

    // Si aucune traduction trouvée, retourner le texte original avec un préfixe
    return `[${toLang.toUpperCase()}] ${text}`;
  };

  // Fonction pour démarrer la conversation initiale (stable)
  const startConversationMode = useCallback(async () => {
    if (!azureSpeechService.isAvailable()) {
      setErrorMessage('Service Azure Speech non configuré');
      return;
    }

    try {
      setIsConversationMode(true);
      setIsListening(true);
      setErrorMessage(null);
      
      // 🆕 CORRECTION : Configuration multi-langues pour Azure Speech Services
      const recognitionOptions = {
        language: assistantLanguageRef.current, // Langue principale par défaut
        continuous: true,
        interimResults: false,
        maxDuration: 300,
        // 🆕 AJOUT : Détection automatique de langues multiples
        autoDetectLanguage: true,
        candidateLanguages: [
          assistantLanguageRef.current, // Langue de l'assistant
          userLanguageRef.current       // Langue de l'usager
        ]
      };

      console.log('🚀 Démarrage conversation avec détection multi-langues:', {
        languePrincipale: assistantLanguageRef.current,
        languesCandidat: [assistantLanguageRef.current, userLanguageRef.current],
        detectionAuto: true
      });

      await azureSpeechService.startRecognition(recognitionOptions);
      console.log('🚀 Mode conversation démarré');

    } catch (error) {
      console.error('Erreur démarrage conversation:', error);
      setIsListening(false);
      setIsConversationMode(false);
      setErrorMessage('Impossible de démarrer la conversation');
    }
  }, []);

  // Fonction pour arrêter la conversation (stable)
  const stopConversationMode = useCallback(async () => {
    try {
      if (isListening) {
        await azureSpeechService.stopRecognition();
      }
        setIsConversationMode(false);
      setIsListening(false);
      console.log('🛑 Mode conversation arrêté');
    } catch (error) {
      console.error('Erreur arrêt conversation:', error);
      setIsConversationMode(false);
      setIsListening(false);
    }
  }, [isListening]);

  // Export simple (stable)
  const exportToJSON = useCallback(() => {
    const exportData = {
      date: new Date().toISOString(),
      languages: `${assistantLanguage} ↔ ${userLanguage}`,
      messages: messages.map(msg => ({
        timestamp: msg.timestamp.toISOString(),
        speaker: msg.speaker === 'assistant' ? 'Assistant social' : 'Usager',
        originalText: msg.originalText,
        translatedText: msg.translatedText,
        originalLanguage: msg.originalLanguage,
        targetLanguage: msg.targetLanguage
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entretien-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📄 Export terminé');
  }, [assistantLanguage, userLanguage, messages]);

  // Timer simple
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Formatage du temps
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Composant sélecteur assistant simplifié
  const AssistantLanguageSelector = useMemo(() => (
    <div className="relative">
      <select
        value={assistantLanguage}
        onChange={(e) => setAssistantLanguage(e.target.value)}
        disabled={isConversationMode}
        className={`appearance-none w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          isConversationMode ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        }`}
      >
        {ASSISTANT_LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  ), [assistantLanguage, isConversationMode, ASSISTANT_LANGUAGES]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
              <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Retour</span>
              </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{formatDuration(sessionDuration)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuration */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <Languages className="h-7 w-7 text-purple-600" />
                <span>Traducteur d'Entretiens</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Traduction vocale bidirectionnelle en temps réel
              </p>
            </div>
            
            {/* Sélecteurs de langues simplifiés */}
            <div className="flex items-center space-x-6">
              {/* Langue Assistant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue de l'assistant social
                </label>
                {AssistantLanguageSelector}
              </div>
              
              {/* Langue Usager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue de l'usager
                </label>
                <SimpleLanguageSelector
                  selectedLanguage={userLanguage}
                  onLanguageChange={(languageCode: string) => setUserLanguage(languageCode)}
                  disabled={isConversationMode}
                  placeholder="Choisir la langue"
                />
              </div>
            </div>
          </div>

          {/* Indicateurs de configuration (sans options avancées) */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-purple-900">Assistant social</div>
                <div className="text-sm text-purple-600 flex items-center space-x-1">
                  {selectedAssistantLang ? (
                    <>
                      <span>{selectedAssistantLang.flag}</span>
                      <span>{selectedAssistantLang.name}</span>
                      <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        Auto-détection
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">Choisir une langue</span>
                  )}
              </div>
            </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-pink-50 rounded-xl border border-pink-100">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Languages className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <div className="font-semibold text-pink-900">Usager</div>
                <div className="text-sm text-pink-600 flex items-center space-x-1">
                  {selectedUserLang ? (
                    <>
                      <span>{selectedUserLang.flag}</span>
                      <span>{selectedUserLang.name}</span>
                      {selectedUserLang.quality === 'hd' && (
                        <span className="bg-pink-200 text-pink-800 px-2 py-0.5 rounded-full text-xs font-medium">HD</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">Choisir une langue</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interface de conversation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* En-tête conversation */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="h-5 w-5" />
                <span className="font-medium">Conversation en cours</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className={`h-2 w-2 rounded-full ${azureConfigured ? 'bg-green-400' : 'bg-red-400'}`} />
                <span>{azureConfigured ? 'Azure OK' : 'Non configuré'}</span>
              </div>
            </div>
          </div>

          {/* Zone de conversation */}
          <div className="p-6">
            {/* Message d'erreur */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800">{errorMessage}</div>
              </div>
            )}

            {/* Contrôles principaux */}
                <div className="text-center mb-8">
              {!isConversationMode ? (
                <div className="space-y-4">
                        <button 
                    onClick={startConversationMode}
                    disabled={!azureConfigured}
                    className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                      !azureConfigured
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                    }`}
                  >
                    {!azureConfigured
                      ? '⚙️ Configuration requise'
                      : '🚀 Démarrer l\'Entretien'
                    }
                        </button>
                  
                  <div className="text-sm text-gray-600">
                    Un seul clic suffit - la conversation sera automatique après ça !
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                      <button 
                      onClick={stopConversationMode}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                      >
                      🛑 Terminer l'Entretien
                      </button>
                    
                    {messages.length > 0 && (
                  <button
                        onClick={exportToJSON}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Exporter</span>
                  </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className={`text-xl font-bold ${
                      isListening ? 'text-green-600' : 
                      isTranslating ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {isListening ? 'En écoute...' : 
                       isTranslating ? 'Traduction en cours...' : 
                       'Mode conversation actif'}
                    </h3>
                    
                        <div className="text-center">
                          <p className="text-lg text-green-600 font-medium">
                            ✅ Parlez naturellement, la conversation sera traduite automatiquement
                          </p>
                          <p className="text-sm text-gray-600">
                        Assistant social ({selectedAssistantLang?.name}) ↔ Usager ({selectedUserLang?.name})
                      </p>
                          </div>
                          
                    {/* Boutons de correction manuelle */}
                    {lastMessageUncertain && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-yellow-600">⚠️</span>
                          <span className="text-sm font-medium text-yellow-800">
                            Détection incertaine - Qui a parlé ?
                          </span>
                            </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => correctLastMessage('assistant')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            👨‍💼 Assistant social
                          </button>
                          <button
                            onClick={() => correctLastMessage('user')}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                          >
                            👤 Usager
                          </button>
                          </div>
                        </div>
                      )}
                    </div>
                        </div>
                      )}
                      
              {/* Historique des messages */}
                      {messages.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📝 Historique de la conversation
                  </h3>
                  
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div key={message.id} className={`p-4 rounded-lg border-l-4 ${
                          message.speaker === 'assistant' 
                            ? 'bg-purple-50 border-l-purple-400' 
                            : 'bg-pink-50 border-l-pink-400'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${
                                message.speaker === 'assistant' ? 'text-purple-700' : 'text-pink-700'
                              }`}>
                                {message.speaker === 'assistant' ? '👨‍💼 Assistant social' : '👤 Usager'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                message.speaker === 'assistant' 
                                  ? 'bg-purple-100 text-purple-600' 
                                  : 'bg-pink-100 text-pink-600'
                              }`}>
                                {message.originalLanguage.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {message.timestamp.toLocaleTimeString('fr-FR')}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900 mb-1">{message.originalText}</div>
                          {message.translatedText !== message.originalText && (
                            <div className={`text-sm italic mt-2 p-2 rounded ${
                              message.speaker === 'assistant' 
                                ? 'bg-pink-100 text-pink-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              <span className="font-medium">→ </span>
                              {message.translatedText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message d'accueil */}
              {messages.length === 0 && !isConversationMode && (
                  <div className="text-center py-8">
                    <div className="max-w-lg mx-auto space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">✨ Traduction Automatique</h4>
                      <div className="text-left space-y-3 text-sm text-gray-600">
                        <div className="flex items-start space-x-3">
                          <span className="text-purple-500 font-bold">1.</span>
                        <span>Cliquez sur <strong>"Démarrer"</strong> pour activer la traduction</span>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-purple-500 font-bold">2.</span>
                        <span>Parlez naturellement en français ou dans la langue de l'usager</span>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-purple-500 font-bold">3.</span>
                        <span>La traduction et la synthèse vocale se font automatiquement</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewTranslator; 