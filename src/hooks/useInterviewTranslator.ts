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
  
  // États principaux
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationQuality, setTranslationQuality] = useState(0);
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<SpeakerRole>('assistant');
  const [autoListenMode, setAutoListenMode] = useState(false); // Désactiver par défaut pour corriger
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0); // Niveau d'activité vocale
  const [isInSilentPeriod, setIsInSilentPeriod] = useState(false); // Période de silence
  const [environmentNoise, setEnvironmentNoise] = useState(0); // Niveau de bruit ambiant
  const [vadEnabled, setVadEnabled] = useState(false); // État VAD
  const [azureSpeechBusy, setAzureSpeechBusy] = useState(false); // Protection Azure Speech
  
  // Références
  const sessionStartTime = useRef<Date | null>(null);
  const costAccumulator = useRef(0);
  const voicesLoaded = useRef(false);
  const isProcessingRef = useRef(false); // Protection contre duplication
  const lastProcessedText = useRef<string>(''); // Protection contre duplication
  const silenceTimer = useRef<NodeJS.Timeout | null>(null); // Timer pour les silences
  const voiceActivityTimer = useRef<NodeJS.Timeout | null>(null); // Timer pour l'activité vocale
  const audioContext = useRef<AudioContext | null>(null); // Contexte audio pour VAD
  const analyser = useRef<AnalyserNode | null>(null); // Analyseur audio
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null); // Source micro

  // Initialisation des voix de synthèse
  const loadVoices = useCallback(() => {
    if ('speechSynthesis' in window && !voicesLoaded.current) {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoaded.current = true;
        console.log('🔊 Voix chargées:', voices.length, 'voix disponibles');
        console.log('📋 Langues supportées:', [...new Set(voices.map(v => v.lang))].sort());
      } else {
        // Les voix ne sont pas encore chargées, réessayer
        setTimeout(loadVoices, 100);
      }
    }
  }, []);

  // Détection d'activité vocale (VAD) intelligente
  const initializeVoiceActivityDetection = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ getUserMedia non supporté, VAD désactivé');
        return false;
      }

      // Obtenir l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });

      // Créer le contexte audio
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      microphone.current = audioContext.current.createMediaStreamSource(stream);

      // Configuration de l'analyseur
      analyser.current.fftSize = 256;
      analyser.current.smoothingTimeConstant = 0.8;
      microphone.current.connect(analyser.current);

      console.log('✅ VAD initialisé avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur initialisation VAD:', error);
      return false;
    }
  }, []);

  // Analyse de l'activité vocale en temps réel
  const analyzeVoiceActivity = useCallback(() => {
    if (!analyser.current) return 0;

    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.current.getByteFrequencyData(dataArray);

    // Calcul du niveau audio moyen
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Analyse des fréquences vocales (300Hz - 3400Hz environ)
    const voiceFreqStart = Math.floor((300 / (audioContext.current?.sampleRate || 44100)) * bufferLength * 2);
    const voiceFreqEnd = Math.floor((3400 / (audioContext.current?.sampleRate || 44100)) * bufferLength * 2);
    
    let voiceSum = 0;
    for (let i = voiceFreqStart; i < Math.min(voiceFreqEnd, bufferLength); i++) {
      voiceSum += dataArray[i];
    }
    const voiceAverage = voiceSum / (voiceFreqEnd - voiceFreqStart);

    return voiceAverage;
  }, []);

  // Démarrage du monitoring d'activité vocale
  const startVoiceActivityMonitoring = useCallback(() => {
    if (!autoListenMode || !analyser.current || !vadEnabled) return;

    const monitor = () => {
      // Protection : ne pas continuer si Azure Speech est occupé
      if (azureSpeechBusy || isListening || isTranslating) {
        if (autoListenMode && vadEnabled) {
          voiceActivityTimer.current = setTimeout(monitor, 500); // Check moins fréquent si occupé
        }
        return;
      }

      const currentLevel = analyzeVoiceActivity();
      setVoiceActivityLevel(currentLevel);

      // Calibrage automatique du bruit ambiant (plus lent)
      if (environmentNoise === 0 || currentLevel < environmentNoise * 0.8) {
        setEnvironmentNoise(prev => prev === 0 ? currentLevel : prev * 0.98 + currentLevel * 0.02);
      }

      // Seuil adaptatif plus conservateur
      const dynamicThreshold = Math.max(environmentNoise * 2.0, 30);
      const isVoiceDetected = currentLevel > dynamicThreshold;

      if (isVoiceDetected && !azureSpeechBusy && !isListening && !isTranslating) {
        console.log('🎤 Voix détectée (niveau:', Math.round(currentLevel), 'seuil:', Math.round(dynamicThreshold), ')');
        setAzureSpeechBusy(true); // Bloquer les autres tentatives
        
        // Délai avant démarrage pour éviter les faux positifs
        setTimeout(() => {
          if (!isListening && !isTranslating) {
            startListening();
          }
          setAzureSpeechBusy(false);
        }, 300); // 300ms de délai
      }

      // Continuer le monitoring si en mode auto et pas occupé
      if (autoListenMode && vadEnabled && !azureSpeechBusy) {
        voiceActivityTimer.current = setTimeout(monitor, 200); // Check toutes les 200ms
      }
    };

    monitor();
  }, [autoListenMode, vadEnabled, analyzeVoiceActivity, environmentNoise, azureSpeechBusy, isListening, isTranslating]);

  // Gestion intelligente des silences (simplifiée)
  const handleSilencePeriod = useCallback(() => {
    if (!autoListenMode || !vadEnabled) return;

    // Arrêter le monitoring VAD temporairement
    setVadEnabled(false);
    
    // Démarrer le timer de silence
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
    }

    silenceTimer.current = setTimeout(() => {
      console.log('🔇 Période de silence, pause VAD');
      setIsInSilentPeriod(true);
      
      // Reprendre le monitoring après un délai plus long
      setTimeout(() => {
        setIsInSilentPeriod(false);
        if (autoListenMode) {
          setVadEnabled(true); // Réactiver VAD
        }
      }, 5000); // 5 secondes de pause

    }, 2000); // 2 secondes de silence = pause
  }, [autoListenMode, vadEnabled]);

  // Initialisation de la session et des voix
  useEffect(() => {
    if (!sessionStartTime.current) {
      sessionStartTime.current = new Date();
    }
    
    // Charger les voix
    loadVoices();
    
    // Écouter l'événement de chargement des voix
    if ('speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, [loadVoices]);

  // Initialisation du mode auto-écoute
  useEffect(() => {
    if (autoListenMode && !vadEnabled) {
      console.log('🔧 Initialisation mode auto-écoute...');
      initializeVoiceActivityDetection().then(success => {
        if (success) {
          setVadEnabled(true);
          console.log('✅ VAD activé, démarrage monitoring');
        } else {
          console.error('❌ Échec initialisation VAD');
          setAutoListenMode(false);
        }
      });
    } else if (!autoListenMode && vadEnabled) {
      console.log('🛑 Arrêt mode auto-écoute...');
      // Nettoyer les timers et ressources
      setVadEnabled(false);
      if (voiceActivityTimer.current) {
        clearTimeout(voiceActivityTimer.current);
        voiceActivityTimer.current = null;
      }
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    }

    return () => {
      if (voiceActivityTimer.current) {
        clearTimeout(voiceActivityTimer.current);
      }
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
    };
  }, [autoListenMode, vadEnabled]);

  // Démarrer le monitoring VAD quand il est activé
  useEffect(() => {
    if (vadEnabled && autoListenMode && !isInSilentPeriod) {
      console.log('🎯 Démarrage monitoring VAD');
      startVoiceActivityMonitoring();
    }
    
    return () => {
      if (voiceActivityTimer.current) {
        clearTimeout(voiceActivityTimer.current);
      }
    };
  }, [vadEnabled, autoListenMode, isInSilentPeriod, startVoiceActivityMonitoring]);

  // Configuration des callbacks Azure Speech
  useEffect(() => {
    azureSpeechService.setCallbacks(
      // Callback résultat
      async (result) => {
        console.log('🎤 Reconnaissance terminée:', result);
        
        // Protection contre duplication
        if (isProcessingRef.current || result.text === lastProcessedText.current) {
          console.log('⚠️ Message déjà traité, ignoré');
          return;
        }
        
        isProcessingRef.current = true;
        lastProcessedText.current = result.text;
        
        setIsListening(false);
        setIsTranslating(true);
        setAzureSpeechBusy(false); // Libérer Azure Speech

        try {
          // Détection automatique du locuteur basée sur la langue parlée
          const detectedLanguage = await detectLanguage(result.text);
          console.log('🔍 Langue détectée:', detectedLanguage);
          
          // Déterminer le locuteur automatiquement
          let detectedSpeaker: SpeakerRole;
          if (detectedLanguage === assistantLanguage) {
            detectedSpeaker = 'assistant';
          } else if (detectedLanguage === userLanguage) {
            detectedSpeaker = 'user';
          } else {
            // Si incertain, garder le locuteur actuel
            detectedSpeaker = currentSpeaker;
          }
          
          // Mettre à jour le locuteur si différent
          if (detectedSpeaker !== currentSpeaker) {
            console.log(`🔄 Changement de locuteur: ${currentSpeaker} → ${detectedSpeaker}`);
            setCurrentSpeaker(detectedSpeaker);
          }
          
          // Traduction pour l'historique unifié (toujours en langue assistant)
          let historyText = result.text;
          const sourceLanguage = detectedLanguage;
          
          if (sourceLanguage !== assistantLanguage) {
            console.log(`🔄 Traduction pour historique: ${sourceLanguage} → ${assistantLanguage}`);
            historyText = await translateTextForInterview(result.text, sourceLanguage, assistantLanguage);
            console.log(`✅ Texte pour historique: "${historyText}"`);
          }
          
          // Création du message pour l'historique (toujours en langue assistant)
          const newMessage: TranslationMessage = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            speaker: detectedSpeaker,
            originalText: result.text,
            translatedText: historyText, // Toujours en langue assistant pour l'historique
            originalLanguage: sourceLanguage,
            targetLanguage: assistantLanguage,
            confidence: result.confidence,
            duration: result.duration
          };

          // Mise à jour des messages
          setMessages(prev => [...prev, newMessage]);
          
          // Mise à jour de la qualité
          setTranslationQuality(result.confidence * 100);
          
          // Calcul du coût
          const segmentCost = calculateCost(result.duration, result.text.length);
          costAccumulator.current += segmentCost;

          // Synthèse vocale pour la traduction en temps réel (TOUJOURS nécessaire)
          // L'autre personne doit toujours entendre dans sa langue
          const targetSpeechLanguage = detectedSpeaker === 'assistant' ? userLanguage : assistantLanguage;
          let speechText = result.text;
          
          // Si le texte n'est pas déjà dans la langue cible, le traduire pour la synthèse
          if (detectedLanguage !== targetSpeechLanguage) {
            console.log(`🔄 Traduction pour synthèse: ${detectedLanguage} → ${targetSpeechLanguage}`);
            speechText = await translateTextForInterview(result.text, detectedLanguage, targetSpeechLanguage);
            console.log(`🔊 Texte pour synthèse: "${speechText}"`);
          } else {
            console.log('ℹ️ Texte déjà dans la langue cible pour synthèse');
          }
          
          try {
            console.log('🔊 Synthèse Azure TTS:', speechText.substring(0, 50) + '...');
            
            await azureSpeechService.speakText({
              text: speechText,
              language: targetSpeechLanguage,
              rate: 0.9,  // Vitesse légèrement ralentie pour clarté
              pitch: 0,   // Ton normal
              volume: 80  // Volume modéré
            });
            
          } catch (speechError) {
            console.error('❌ Erreur synthèse Azure TTS:', speechError);
            
            // Fallback vers Web Speech API si Azure TTS échoue
            if ('speechSynthesis' in window) {
              console.log('🔄 Fallback vers Web Speech API...');
              
              const utterance = new SpeechSynthesisUtterance(speechText);
              
              // Configuration de la langue
              const targetLangCode = targetSpeechLanguage === 'fr' ? 'fr-FR' : 
                                    targetSpeechLanguage === 'ar' ? 'ar-SA' :
                                    targetSpeechLanguage === 'en' ? 'en-US' :
                                    targetSpeechLanguage === 'de' ? 'de-DE' :
                                    targetSpeechLanguage === 'es' ? 'es-ES' :
                                    targetSpeechLanguage === 'it' ? 'it-IT' :
                                    targetSpeechLanguage === 'pt' ? 'pt-PT' :
                                    targetSpeechLanguage === 'ru' ? 'ru-RU' :
                                    targetSpeechLanguage === 'tr' ? 'tr-TR' :
                                    targetSpeechLanguage === 'nl' ? 'nl-NL' :
                                    targetSpeechLanguage === 'pl' ? 'pl-PL' :
                                    targetSpeechLanguage === 'ro' ? 'ro-RO' :
                                    targetSpeechLanguage === 'fa' ? 'fa-IR' :
                                    targetSpeechLanguage === 'ur' ? 'ur-PK' : 'fr-FR';
              
              utterance.lang = targetLangCode;
              
              // Recherche de la meilleure voix pour la langue
              const voices = speechSynthesis.getVoices();
              const exactMatch = voices.find(voice => voice.lang === targetLangCode);
              const langMatch = voices.find(voice => voice.lang.startsWith(targetSpeechLanguage));
              const selectedVoice = exactMatch || langMatch;
              
              if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log('🎯 Voix Web Speech sélectionnée:', selectedVoice.name, selectedVoice.lang);
              }
              
              utterance.rate = 0.9;
              utterance.pitch = 1.0;
              utterance.volume = 0.8;
              
              speechSynthesis.speak(utterance);
            }
          }

          // Déclencher la gestion des silences en mode auto
          if (autoListenMode && vadEnabled) {
            handleSilencePeriod();
          }

        } catch (error) {
          console.error('❌ Erreur traitement:', error);
        } finally {
          setIsTranslating(false);
          isProcessingRef.current = false; // Libérer le verrou
        }
      },
      // Callback erreur
      (error) => {
        console.error('❌ Erreur Azure Speech:', error);
        setIsListening(false);
        setIsTranslating(false);
        setAzureSpeechBusy(false); // Libérer Azure Speech
      },
      // Callback statut
      (status) => {
        console.log('🔄 Statut Azure Speech:', status);
        setIsListening(status === 'listening');
        setIsTranslating(status === 'processing');
        
        if (status === 'stopped') {
          setAzureSpeechBusy(false); // Libérer Azure Speech
        }
      }
    );
  }, [currentSpeaker, assistantLanguage, userLanguage, autoListenMode, vadEnabled, handleSilencePeriod]);

  // Mise à jour des statistiques
  useEffect(() => {
    if (sessionStartTime.current) {
      const duration = Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000);
      const averageQuality = messages.length > 0 
        ? messages.reduce((sum, msg) => sum + msg.confidence, 0) / messages.length * 100
        : 0;

      setSessionStats({
        duration: formatDuration(duration),
        messageCount: messages.length,
        averageQuality: Math.round(averageQuality),
        estimatedCost: Math.round(costAccumulator.current * 100) / 100
      });
    }
  }, [messages]);

  // Formatage de la durée
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcul du coût estimé
  const calculateCost = (duration: number, textLength: number): number => {
    // Coût Azure Speech: ~0.045€ par minute
    const speechCost = (duration / 60) * 0.045;
    
    // Coût Azure OpenAI: ~0.0015€ per 1K tokens (estimation 4 tokens par mot)
    const translationCost = (textLength / 250) * 0.0015;
    
    return speechCost + translationCost;
  };

  // Démarrage de l'écoute avec Azure Speech
  const startListening = useCallback(async () => {
    try {
      // Vérifier la disponibilité d'Azure Speech
      if (!azureSpeechService.isAvailable()) {
        console.error('❌ Azure Speech Services non configuré');
        alert('Azure Speech Services non configuré. Vérifiez vos clés API.');
        return;
      }

      console.log('🎤 Démarrage reconnaissance Azure Speech...');
      setIsListening(true);
      
      // Configuration de la reconnaissance
      const recognitionLanguage = currentSpeaker === 'assistant' ? assistantLanguage : userLanguage;
      
      await azureSpeechService.startRecognition({
        language: recognitionLanguage,
        continuous: autoListenMode, // Mode continu si auto-écoute activée
        interimResults: false,
        maxDuration: autoListenMode ? 30 : 10 // Plus long en mode auto
      });

    } catch (error) {
      console.error('❌ Erreur démarrage reconnaissance:', error);
      setIsListening(false);
      alert('Erreur lors du démarrage de la reconnaissance vocale');
    }
  }, [currentSpeaker, assistantLanguage, userLanguage, autoListenMode]);

  // Arrêt de l'écoute
  const stopListening = useCallback(async () => {
    try {
      console.log('🛑 Arrêt reconnaissance Azure Speech...');
      azureSpeechService.stopRecognition();
      setIsListening(false);
      // Reset du verrou de protection
      isProcessingRef.current = false;
      lastProcessedText.current = '';
    } catch (error) {
      console.error('❌ Erreur arrêt reconnaissance:', error);
    }
  }, []);

  // Changement de locuteur
  const switchSpeaker = useCallback(() => {
    setCurrentSpeaker(prev => prev === 'assistant' ? 'user' : 'assistant');
    if (isListening) {
      stopListening();
    }
  }, [isListening, stopListening]);

  // Pause de session
  const pauseSession = useCallback(() => {
    if (isListening) {
      stopListening();
    }
  }, [isListening, stopListening]);

  // Reprise de session
  const resumeSession = useCallback(() => {
    // La session reprend automatiquement quand on clique sur le micro
  }, []);

  // Fin de session
  const endSession = useCallback(async () => {
    if (isListening) {
      await stopListening();
    }
  }, [isListening, stopListening]);

  // Génération de synthèse IA (simulation)
  const generateSummary = useCallback(async (): Promise<InterviewSummary | null> => {
    if (messages.length === 0) return null;

    try {
      // Simulation de génération IA
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const summary: InterviewSummary = {
        id: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        generatedAt: new Date(),
        mainTopics: [
          'Demande d\'aide sociale',
          'Situation personnelle',
          'Démarches administratives',
          'Accompagnement'
        ],
        keyDecisions: [
          {
            decision: 'Constitution du dossier de demande',
            responsible: 'both',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            followUp: 'Rendez-vous de suivi prévu'
          }
        ],
        unsolvedIssues: [
          'Clarification de certains documents',
          'Vérification des critères d\'éligibilité'
        ],
        nextSteps: [
          'Rassembler les justificatifs',
          'Compléter le formulaire',
          'Programmer un suivi',
          'Contacter les services concernés'
        ],
        aiRecommendations: {
          suggestedFollowUp: [
            'Accompagnement personnalisé',
            'Aide à la constitution du dossier'
          ],
          relevantServices: [
            'Service social municipal',
            'CAF',
            'Associations locales'
          ],
          documentationNeeded: [
            'Justificatifs de revenus',
            'Pièce d\'identité',
            'Justificatif de domicile'
          ]
        },
        statistics: sessionStats || {
          duration: '0:00',
          messageCount: 0,
          averageQuality: 0,
          estimatedCost: 0
        }
      };

      return summary;

    } catch (error) {
      console.error('Erreur génération synthèse:', error);
      return null;
    }
  }, [messages, sessionStats]);

  // Export PDF bilingue (amélioré)
  const exportToPDF = useCallback(async () => {
    try {
      // Génération de la synthèse si pas encore fait
      const summary = await generateSummary();
      
      if (!summary) {
        throw new Error('Impossible de générer la synthèse');
      }

      // Traduction de tout l'historique vers la langue de l'usager
      console.log('🔄 Génération de l\'export bilingue...');
      const bilingualMessages = await Promise.all(
        messages.map(async (msg) => {
          let userLanguageText = msg.originalText;
          
          // Si le message original n'est pas dans la langue de l'usager, le traduire
          if (msg.originalLanguage !== userLanguage) {
            userLanguageText = await translateTextForInterview(
              msg.originalText, 
              msg.originalLanguage, 
              userLanguage
            );
          }
          
          return {
            ...msg,
            assistantLanguageText: msg.translatedText, // Toujours en langue assistant
            userLanguageText: userLanguageText // Traduit en langue usager
          };
        })
      );

      // Préparation du contenu bilingue
      const content = {
        title: 'Synthèse d\'Entretien Social - AssistLux',
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR'),
        languages: `${assistantLanguage.toUpperCase()} ↔ ${userLanguage.toUpperCase()}`,
        duration: sessionStats?.duration || '0:00',
        messageCount: messages.length,
        
        // Historique bilingue
        conversation: bilingualMessages.map(msg => ({
          time: msg.timestamp.toLocaleTimeString('fr-FR'),
          speaker: msg.speaker === 'assistant' ? 'Assistant social' : 'Usager',
          assistantLanguage: {
            code: assistantLanguage.toUpperCase(),
            text: msg.assistantLanguageText
          },
          userLanguage: {
            code: userLanguage.toUpperCase(),
            text: msg.userLanguageText
          },
          confidence: `${Math.round(msg.confidence * 100)}%`
        })),
        
        summary: summary,
        
        // Note de conformité
        rgpdNote: 'Ce document a été généré localement avec Azure EU. Traitement conforme RGPD.',
        
        // Instructions pour l'usager
        userInstructions: {
          [assistantLanguage]: 'Ce document contient la transcription complète de notre entretien dans les deux langues.',
          [userLanguage]: await translateTextForInterview(
            'Ce document contient la transcription complète de notre entretien dans les deux langues.',
            assistantLanguage,
            userLanguage
          )
        }
      };

      // Création du blob et téléchargement
      const jsonContent = JSON.stringify(content, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entretien-bilingue-assistlux-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Export bilingue réalisé avec succès');

    } catch (error) {
      console.error('Erreur export bilingue:', error);
    }
  }, [messages, sessionStats, assistantLanguage, userLanguage, generateSummary]);

  // Basculer le mode auto-écoute
  const toggleAutoListenMode = useCallback(() => {
    setAutoListenMode(prev => {
      const newMode = !prev;
      console.log(`🔄 Mode auto-écoute: ${newMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
      
      // Si on désactive le mode auto et qu'on écoute, arrêter
      if (!newMode && isListening) {
        stopListening();
      }
      
      return newMode;
    });
  }, [isListening, stopListening]);

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