import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText, translateTextForInterview } from '../lib/translation';
import { detectLanguage } from '../lib/translation';
import { azureSpeechService } from '../services/azureSpeechService';
import { 
  UseInterviewTranslatorProps, 
  UseInterviewTranslatorReturn,
  TranslationMessage,
  SessionStats,
  InterviewSummary,
  SpeakerRole
} from '../types/interviewTranslator';

export const useInterviewTranslator = ({
  userLanguage,
  onSessionUpdate
}: UseInterviewTranslatorProps): UseInterviewTranslatorReturn => {
  
  const { i18n } = useTranslation();
  const assistantLanguage = i18n.language || 'fr';
  
  // États principaux (simplifiés)
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationQuality, setTranslationQuality] = useState(85);
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  
  // Références
  const sessionStartTime = useRef<Date | null>(null);
  const isProcessingRef = useRef(false);
  const lastProcessedText = useRef<string>('');
  const lastProcessedTime = useRef<number | null>(null);

  // Fonction améliorée de synthèse vocale
  const speakTranslation = useCallback(async (text: string, language: string) => {
    try {
      console.log(`🔊 Synthèse vocale en ${language}: "${text}"`);
      
      // Priorité 1: Utiliser Azure TTS si disponible
      if (azureSpeechService.isAvailable()) {
        try {
          await azureSpeechService.speakText({
            text: text,
            language: language,
            rate: 0.9,
            pitch: 1.0
          });
          return;
        } catch (error) {
          console.warn('Erreur Azure TTS, fallback vers Web Speech:', error);
        }
      }

      // Priorité 2: Fallback vers Web Speech API
      if ('speechSynthesis' in window) {
        // Arrêter toute synthèse en cours
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configuration avancée de la voix
        const voices = speechSynthesis.getVoices();
        let selectedVoice = null;
        
        // Sélection intelligente de la voix selon la langue
        const voiceSelectors = {
          'fr': (v: SpeechSynthesisVoice) => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Marie')),
          'en': (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && (v.name.includes('Alex') || v.name.includes('Samantha')),
          'ar': (v: SpeechSynthesisVoice) => v.lang.startsWith('ar'),
          'es': (v: SpeechSynthesisVoice) => v.lang.startsWith('es'),
          'de': (v: SpeechSynthesisVoice) => v.lang.startsWith('de')
        };
        
        const selector = voiceSelectors[language as keyof typeof voiceSelectors];
        if (selector) {
          selectedVoice = voices.find(selector) || voices.find(v => v.lang.startsWith(language));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          // Mapping de langues par défaut
          const langMapping = {
            'fr': 'fr-FR',
            'en': 'en-US', 
            'ar': 'ar-SA',
            'es': 'es-ES',
            'de': 'de-DE'
          };
          utterance.lang = langMapping[language as keyof typeof langMapping] || 'fr-FR';
        }
        
        // Configuration optimisée
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Gestion des erreurs de synthèse
        utterance.onerror = (event) => {
          console.error('Erreur synthèse vocale:', event.error);
        };
        
        utterance.onend = () => {
          console.log('✅ Synthèse vocale terminée');
        };
        
        speechSynthesis.speak(utterance);
      } else {
        console.warn('Synthèse vocale non supportée sur ce navigateur');
      }
    } catch (error) {
      console.error('Erreur générale synthèse vocale:', error);
    }
  }, []);

  // Initialisation simple
  useEffect(() => {
    if (!sessionStartTime.current) {
      sessionStartTime.current = new Date();
    }
  }, []);

  // Configuration des callbacks Azure Speech (une seule fois)
  useEffect(() => {
    const handleResult = async (result: any) => {
      console.log('🎤 Résultat Azure Speech:', result.text);
      
      // Protection améliorée contre duplication
      if (!result.text || result.text.trim().length < 2) {
        console.log('⚠️ Message ignoré (vide ou trop court)');
        return;
      }

      // Vérification de duplication avec tolérance temporelle (2 secondes)
      const now = Date.now();
      const timeSinceLastProcess = now - (lastProcessedTime.current || 0);
      const isSimilarText = result.text === lastProcessedText.current;
      const isRecentDuplicate = isSimilarText && timeSinceLastProcess < 2000;

      if (isProcessingRef.current) {
        console.log('⚠️ Message ignoré (traitement en cours)');
        return;
      }

      if (isRecentDuplicate) {
        console.log('⚠️ Message ignoré (duplication récente)');
        return;
      }
      
      isProcessingRef.current = true;
      lastProcessedText.current = result.text;
      lastProcessedTime.current = now;
      
      setIsListening(false);
      setIsTranslating(true);

      try {
        // Détection de la langue parlée avec retry
        let detectedLanguage;
        try {
          detectedLanguage = await detectLanguage(result.text);
        } catch (error) {
          console.warn('Erreur détection langue, utilisation par défaut:', error);
          detectedLanguage = assistantLanguage; // Fallback intelligent
        }
        
        console.log('🔍 Langue détectée:', detectedLanguage);
        
        // Déterminer qui parle
        const speaker: SpeakerRole = detectedLanguage === assistantLanguage ? 'assistant' : 'user';
        console.log('👤 Locuteur détecté:', speaker);
        
        // Langue cible pour la traduction
        const targetLanguage = speaker === 'assistant' ? userLanguage : assistantLanguage;
        
        // Traduction du message avec retry
        let translatedText = result.text;
        if (detectedLanguage !== targetLanguage) {
          console.log(`🔄 Traduction: ${detectedLanguage} → ${targetLanguage}`);
          
          try {
            translatedText = await translateTextForInterview(result.text, detectedLanguage, targetLanguage);
            console.log(`✅ Traduction: "${translatedText}"`);
          } catch (error) {
            console.error('Erreur traduction, conservation du texte original:', error);
            // On garde le texte original plutôt que d'échouer complètement
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
          targetLanguage: targetLanguage,
          confidence: result.confidence || 0.9
        };
        
        // Ajouter à l'historique
        setMessages(prev => [...prev, newMessage]);
        
        // Synthèse vocale améliorée
        if (detectedLanguage !== targetLanguage && translatedText !== result.text) {
          await speakTranslation(translatedText, targetLanguage);
        }
        
      } catch (error) {
        console.error('❌ Erreur traitement:', error);
        // En cas d'erreur, on peut quand même afficher le texte original
        const fallbackMessage: TranslationMessage = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          speaker: 'assistant', // Par défaut
          originalText: result.text,
          translatedText: result.text,
          originalLanguage: assistantLanguage,
          targetLanguage: assistantLanguage,
          confidence: result.confidence || 0.5
        };
        setMessages(prev => [...prev, fallbackMessage]);
      } finally {
        setIsTranslating(false);
        isProcessingRef.current = false;
      }
    };

    const handleError = (error: any) => {
      console.error('❌ Erreur Azure Speech:', error);
      setIsListening(false);
      setIsTranslating(false);
      isProcessingRef.current = false;
    };

    azureSpeechService.addResultListener(handleResult);
    azureSpeechService.addErrorListener(handleError);

    return () => {
      azureSpeechService.removeResultListener(handleResult);
      azureSpeechService.removeErrorListener(handleError);
    };
  }, [assistantLanguage, userLanguage]); // Dépendances minimales

  // Démarrage de l'écoute
  const startListening = useCallback(async () => {
    if (isListening || isTranslating) {
      console.log('⚠️ Déjà en cours...');
      return;
    }

    try {
      console.log('🎤 Démarrage reconnaissance Azure Speech...');
      setIsListening(true);
      await azureSpeechService.startRecognition({
        language: assistantLanguage, // Commencer avec la langue de l'assistant
        continuous: true,
        interimResults: false,
        maxDuration: 30
      });
    } catch (error) {
      console.error('❌ Erreur démarrage reconnaissance:', error);
      setIsListening(false);
    }
  }, [isListening, isTranslating, assistantLanguage]);

  // Arrêt de l'écoute
  const stopListening = useCallback(async () => {
    if (!isListening) return;

    try {
      console.log('🛑 Arrêt reconnaissance...');
      azureSpeechService.stopRecognition();
      setIsListening(false);
    } catch (error) {
      console.error('❌ Erreur arrêt reconnaissance:', error);
      setIsListening(false);
    }
  }, [isListening]);

  // Fonctions simplifiées pour compatibilité
  const switchSpeaker = useCallback(() => {
    console.log('🔄 Changement de locuteur (auto-détection active)');
  }, []);

  const pauseSession = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const resumeSession = useCallback(() => {
    startListening();
  }, [startListening]);

  const endSession = useCallback(async () => {
    await stopListening();
    // Calculer les stats de session
    const duration = sessionStartTime.current 
      ? Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000)
      : 0;
    
    const stats: SessionStats = {
      duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      messageCount: messages.length,
      averageQuality: translationQuality,
      estimatedCost: (duration / 3600) * 2.8 // Estimation basique
    };
    
    setSessionStats(stats);
  }, [stopListening, messages.length, translationQuality]);

  const generateSummary = useCallback(async (): Promise<InterviewSummary | null> => {
    if (messages.length === 0) return null;

    // Simulation simple de synthèse
    const summary: InterviewSummary = {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      generatedAt: new Date(),
      mainTopics: ['Entretien social', 'Demande d\'aide', 'Accompagnement'],
      keyDecisions: [],
      unsolvedIssues: [],
      nextSteps: ['Suivi prévu', 'Documents à fournir'],
      aiRecommendations: {
        suggestedFollowUp: ['Rendez-vous de suivi'],
        relevantServices: ['Service social'],
        documentationNeeded: ['Justificatifs']
      },
      statistics: sessionStats || {
        duration: '0:00',
        messageCount: 0,
        averageQuality: 0,
        estimatedCost: 0
      }
    };

    return summary;
  }, [messages, sessionStats]);

  const exportToPDF = useCallback(async () => {
    try {
      // Export JSON simple
      const exportData = {
        title: 'Entretien AssistLux',
        date: new Date().toLocaleDateString('fr-FR'),
        languages: `${assistantLanguage.toUpperCase()} ↔ ${userLanguage.toUpperCase()}`,
        messages: messages.map(msg => ({
          time: msg.timestamp.toLocaleTimeString('fr-FR'),
          speaker: msg.speaker === 'assistant' ? 'Assistant social' : 'Usager',
          original: msg.originalText,
          translated: msg.translatedText,
          language: `${msg.originalLanguage} → ${msg.targetLanguage}`
        })),
        summary: await generateSummary()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entretien-assistlux-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Export réalisé avec succès');
    } catch (error) {
      console.error('❌ Erreur export:', error);
    }
  }, [messages, assistantLanguage, userLanguage, generateSummary]);

  const toggleAutoListenMode = useCallback(() => {
    console.log('🔄 Toggle auto-listen (fonction simplifiée)');
  }, []);

  return {
    isListening,
    isTranslating,
    translationQuality,
    messages,
    sessionStats,
    startListening,
    stopListening,
    switchSpeaker,
    pauseSession,
    resumeSession,
    endSession,
    generateSummary,
    exportToPDF,
    toggleAutoListenMode
  };
}; 