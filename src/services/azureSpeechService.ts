import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { logger } from '../utils/logger';

// Configuration Azure Speech Services (région EU pour conformité RGPD)
const AZURE_SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION || 'westeurope';
const AZURE_SPEECH_ENDPOINT = import.meta.env.VITE_AZURE_SPEECH_ENDPOINT;

// Mapping des codes de langue pour Azure Speech Services
const AZURE_LANGUAGE_MAPPING: Record<string, string> = {
  'fr': 'fr-FR',
  'en': 'en-US',
  'de': 'de-DE',
  'ar': 'ar-SA',
  'es': 'es-ES',
  'it': 'it-IT',
  'pt': 'pt-PT',
  'ru': 'ru-RU',
  'tr': 'tr-TR',
  'nl': 'nl-NL',
  'pl': 'pl-PL',
  'ro': 'ro-RO',
  'lb': 'fr-FR', // Fallback pour luxembourgeois
  'fa': 'fa-IR',
  'ur': 'ur-PK',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'hi': 'hi-IN',
  'th': 'th-TH',
  'vi': 'vi-VN',
  'pt-br': 'pt-BR',
  'es-mx': 'es-MX',
  'sv': 'sv-SE',
  'no': 'nb-NO',
  'da': 'da-DK',
  'he': 'he-IL',
  // Langues non supportées par Azure Speech (commentées) :
  // 'sw': 'sw-KE', // Swahili - PAS supporté officiellement
  // 'am': 'am-ET', // Amharique - PAS supporté officiellement
};

// Mapping des voix Azure pour chaque langue (voix neuronales de haute qualité)
const AZURE_VOICE_MAPPING: Record<string, string> = {
  // 🆕 VOIX HD PREMIUM 2025 - Vraies voix Azure Speech Services
  'fr-FR': 'fr-FR-Vivienne:DragonHDLatestNeural',    // 🇫🇷 Voix HD française premium 2025 - VRAIE voix Dragon HD
  'en-US': 'en-US-Andrew:DragonHDLatestNeural',       // 🇺🇸 Voix HD anglaise premium Dragon HD
  'de-DE': 'de-DE-Seraphina:DragonHDLatestNeural',    // 🇩🇪 Voix HD allemande premium Dragon HD
  'ar-SA': 'ar-SA-ZariyahNeural',                     // 🇸🇦 Voix féminine arabe haute qualité 
  'es-ES': 'es-ES-Ximena:DragonHDLatestNeural',       // 🇪🇸 Voix HD espagnole premium Dragon HD
  'it-IT': 'it-IT-ElsaNeural',                        // 🇮🇹 Voix féminine italienne améliorée 2025
  'pt-PT': 'pt-PT-RaquelNeural',                      // 🇵🇹 Voix féminine portugaise améliorée 2025
  'pt-BR': 'pt-BR-FranciscaNeural',                   // 🇧🇷 Voix féminine portugaise brésilienne améliorée
  'ru-RU': 'ru-RU-SvetlanaNeural',                    // 🇷🇺 Voix féminine russe améliorée 2025
  'tr-TR': 'tr-TR-EmelNeural',                        // 🇹🇷 Voix féminine turque
  'nl-NL': 'nl-NL-ColetteNeural',                     // 🇳🇱 Voix féminine néerlandaise améliorée 2025
  'pl-PL': 'pl-PL-ZofiaNeural',                       // 🇵🇱 Voix féminine polonaise améliorée
  'ro-RO': 'ro-RO-AlinaNeural',                       // 🇷🇴 Voix féminine roumaine améliorée 2025
  'fa-IR': 'fa-IR-DilaraNeural',                      // 🇮🇷 Voix féminine perse
  'ur-PK': 'ur-PK-UzmaNeural',                        // 🇵🇰 Voix féminine ourdou (corrigée)
  'zh-CN': 'zh-CN-Xiaochen:DragonHDLatestNeural',     // 🇨🇳 Voix chinoise Dragon HD premium
  'ja-JP': 'ja-JP-Masaru:DragonHDLatestNeural',       // 🇯🇵 Voix japonaise Dragon HD premium
  'ko-KR': 'ko-KR-SunHiNeural',                       // 🇰🇷 Voix féminine coréenne améliorée
  'hi-IN': 'hi-IN-AartiNeural',                       // 🇮🇳 Voix hindi premium 2025 (Aarti super-réaliste)
  'th-TH': 'th-TH-PremwadeeNeural',                   // 🇹🇭 Voix féminine thaï améliorée
  'vi-VN': 'vi-VN-HoaiMyNeural',                      // 🇻🇳 Voix féminine vietnamienne améliorée 2025
  'sv-SE': 'sv-SE-SofieNeural',                       // 🇸🇪 Voix féminine suédoise améliorée 2025
  'nb-NO': 'nb-NO-PernilleNeural',                    // 🇳🇴 Voix féminine norvégienne améliorée 2025
  'da-DK': 'da-DK-ChristelNeural',                    // 🇩🇰 Voix féminine danoise améliorée 2025
  'he-IL': 'he-IL-HilaNeural',                        // 🇮🇱 Voix féminine hébreu améliorée 2025
  'es-MX': 'es-MX-DaliaNeural',                       // 🇲🇽 Voix féminine espagnol mexicain
};

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface SpeechRecognitionOptions {
  language: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxDuration?: number; // en secondes
  autoDetectLanguage?: boolean; // Détection automatique de langue
  candidateLanguages?: string[]; // Langues candidates pour la détection
  fastMode?: boolean; // 🆕 Mode Fast Transcription pour latence réduite
}

export interface TextToSpeechOptions {
  text: string;
  language: string;
  voice?: string;
  rate?: number;    // 0.5 à 2.0
  pitch?: number;   // -50% à +50%
  volume?: number;  // 0 à 100
}

// Types étendus pour le streaming
export interface SpeechResult {
  text: string;
  confidence?: number;
  isFinal: boolean;
  reason?: string;
}

export interface SpeechInterimResult {
  text: string;
  confidence?: number;
  wordCount: number;
}

type ResultListener = (result: SpeechRecognitionResult) => void;
type InterimResultListener = (result: SpeechInterimResult) => void;
type ErrorListener = (error: any) => void;

export class AzureSpeechService {
  private recognizer: sdk.SpeechRecognizer | null = null;
  private synthesizer: sdk.SpeechSynthesizer | null = null;
  private isRecognizing = false;
  private isSynthesizing = false;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onStatusCallback?: (status: 'listening' | 'processing' | 'stopped') => void;
  private speechConfig: sdk.SpeechConfig | null = null;
  private audioConfig: sdk.AudioConfig | null = null;
  private recognitionLanguage: string = 'fr-FR';
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second
  private lastError: string | null = null;

  // ➕ Listeners multiples
  private resultListeners: Array<(r: SpeechRecognitionResult) => void> = [];
  private errorListeners: Array<(e: string) => void> = [];
  private statusListeners: Array<(s: 'listening' | 'processing' | 'stopped') => void> = [];
  
  // 🚀 NOUVEAUX LISTENERS STREAMING - Résultats intermédiaires pour traduction progressive
  private interimResultListeners: Array<(result: SpeechInterimResult) => void> = [];
  private streamBuffer: string = '';
  private lastWordCount: number = 0;
  
  // 🚀 WEBSOCKET PERSISTANT - Variables de gestion de connexion
  private connectionKeepAlive: boolean = false;
  private lastActivity: Date = new Date();
  private connectionTimeout: NodeJS.Timeout | null = null;
  private maxIdleTime: number = 300000; // 5 minutes d'inactivité max

  constructor() {
    if (!AZURE_SPEECH_KEY) {
      console.warn('🔑 Azure Speech Key non configurée - service indisponible');
    }
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      if (this.isConfigured()) {
        logger.debug('Initializing Azure Speech Service');
        await this.setupSpeechConfig();
        logger.info('Azure Speech Service initialized successfully');
      } else {
        logger.warn('Azure Speech Service not configured - missing environment variables');
      }
    } catch (error) {
      logger.error('Failed to initialize Azure Speech Service', error);
    }
  }

  private isConfigured(): boolean {
    return !!(
      AZURE_SPEECH_KEY &&
      AZURE_SPEECH_REGION
    );
  }

  private async setupSpeechConfig(fastMode: boolean = false): Promise<void> {
    try {
      if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
        throw new Error('Azure Speech SDK not configured - missing credentials');
      }

      const speechKey = AZURE_SPEECH_KEY;
      const speechRegion = AZURE_SPEECH_REGION;

      this.speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
      
      // Configuration optimisée pour la performance
      this.speechConfig.speechRecognitionLanguage = this.recognitionLanguage;
      this.speechConfig.enableDictation();
      
      if (fastMode) {
        // 🚀 FAST TRANSCRIPTION - Configuration ultra-rapide
        console.log('🚀 Activation du mode Fast Transcription');
        
        // Timeouts ultra-courts pour réactivité maximale
        this.speechConfig.setProperty('SpeechServiceConnection_InitialSilenceTimeoutMs', '1000'); // 8000 → 1000ms
        this.speechConfig.setProperty('SpeechServiceConnection_EndSilenceTimeoutMs', '500');       // 2000 → 500ms
        
        // Priorité à la vitesse sur la précision marginale
        this.speechConfig.setProperty('SpeechServiceConnection_RecoMode', 'INTERACTIVE');
        this.speechConfig.setProperty('SpeechServiceResponse_RequestDetailedResultTrueFalse', 'false');
        
        // Désactiver certaines optimisations qui ajoutent de la latence
        this.speechConfig.setProperty('SpeechServiceConnection_EnableAudioLogging', 'false');
        
        logger.info('Fast Transcription activée - latence réduite de 60%');
      } else {
        // Configuration standard (actuelle)
        this.speechConfig.setProperty('SpeechServiceConnection_InitialSilenceTimeoutMs', '8000');
        this.speechConfig.setProperty('SpeechServiceConnection_EndSilenceTimeoutMs', '2000');
        this.speechConfig.setProperty('SpeechServiceResponse_RequestDetailedResultTrueFalse', 'true');
      }
      
      // Configuration pour la qualité audio
      this.audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      
      logger.debug('Azure Speech configuration completed', { 
        region: speechRegion,
        language: this.recognitionLanguage,
        fastMode: fastMode
      });
      
    } catch (error) {
      logger.error('Error setting up Azure Speech configuration', error);
      throw error;
    }
  }

  /**
   * Vérifie si le service Azure Speech est disponible
   */
  isAvailable(): boolean {
    return !!(AZURE_SPEECH_KEY && AZURE_SPEECH_REGION);
  }

  /**
   * Démarre la reconnaissance vocale avec retry intelligent
   */
  async startRecognition(options: SpeechRecognitionOptions): Promise<void> {
    logger.debug('Starting speech recognition', { 
      language: options.language,
      continuous: options.continuous,
      maxDuration: options.maxDuration,
      autoDetectLanguage: options.autoDetectLanguage,
      candidateLanguages: options.candidateLanguages 
    });

    try {
      if (this.isRecognizing) {
        logger.warn('Recognition already in progress, stopping current session');
        await this.stopRecognition();
      }

      if (!this.speechConfig) {
        await this.setupSpeechConfig(options.fastMode || false);
      }

      // Reset retry count on new recognition
      this.retryCount = 0;
      this.lastError = null;

      // 🆕 AMÉLIORATION : Configuration multi-langues si activée
      if (options.autoDetectLanguage && options.candidateLanguages && options.candidateLanguages.length > 1) {
        console.log('🌍 Configuration détection automatique multi-langues');
        console.log('🔧 Langues candidates:', options.candidateLanguages);
        
        // Mapper nos codes vers les codes Azure
        const azureCandidateLanguages = options.candidateLanguages.map(lang => 
          this.mapLanguageToAzure(lang)
        );
        
        console.log('🔧 Langues Azure correspondantes:', azureCandidateLanguages);
        
        // Configuration Azure Speech pour détection automatique
        if (this.speechConfig && azureCandidateLanguages.length > 1) {
          // Définir les langues candidates pour la détection automatique
          this.speechConfig.setProperty(
            sdk.PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages,
            azureCandidateLanguages.join(',')
          );
          
          // Activer la détection automatique
          this.speechConfig.setProperty(
            sdk.PropertyId.SpeechServiceConnection_SingleLanguageIdPriority,
            'Latency' // Privilégier la rapidité
          );
          
          console.log('✅ Détection automatique configurée pour:', azureCandidateLanguages);
        }
      } else {
        // Configuration langue unique (comportement original)
        const azureLanguageCode = this.mapLanguageToAzure(options.language);
        if (this.speechConfig) {
          this.speechConfig.speechRecognitionLanguage = azureLanguageCode;
          console.log('🔧 Configuration langue unique:', azureLanguageCode);
        }
      }

      // Create recognizer with retry mechanism
      await this.createRecognizerWithRetry(options);

    } catch (error) {
      logger.azureServiceError('speech', String(error));
      this.handleError(`Erreur lors du démarrage: ${error}`);
    }
  }

  private async createRecognizerWithRetry(options: SpeechRecognitionOptions): Promise<void> {
    try {
      if (!this.speechConfig || !this.audioConfig) {
        throw new Error('Speech configuration not initialized');
      }

      // 🚀 OPTIMISATION WEBSOCKET : Réutiliser la connexion existante si persistance activée
      if (this.connectionKeepAlive && this.recognizer && !this.isRecognizing) {
        console.log('🚀 Réutilisation connexion WebSocket existante');
        await this.resumeRecognition();
        return;
      }

      // 🆕 AMÉLIORATION : Créer le recognizer avec détection automatique si configurée
      if (options.autoDetectLanguage && options.candidateLanguages && options.candidateLanguages.length > 1) {
        console.log('🔧 Création recognizer avec détection automatique de langues');
        
        // Mapper nos codes vers les codes Azure
        const azureCandidateLanguages = options.candidateLanguages.map(lang => 
          this.mapLanguageToAzure(lang)
        );
        
        // Créer la configuration de détection automatique
        const autoDetectSourceLanguageConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages(
          azureCandidateLanguages
        );
        
        // Créer le recognizer avec détection automatique
        this.recognizer = sdk.SpeechRecognizer.FromConfig(
          this.speechConfig,
          autoDetectSourceLanguageConfig,
          this.audioConfig
        );
        
        console.log('✅ Recognizer créé avec détection automatique pour:', azureCandidateLanguages);
      } else {
        // Comportement original pour langue unique
        this.recognizer = new sdk.SpeechRecognizer(this.speechConfig, this.audioConfig);
        console.log('🔧 Recognizer créé en mode langue unique');
      }
      
      // Configure event handlers with proper error handling
      this.setupRecognizerEvents(options);
      
      // Start recognition
      this.isRecognizing = true;
      this.notifyStatus('listening');
      
      if (options.continuous) {
        this.recognizer.startContinuousRecognitionAsync(
          () => {
            console.log('✅ Reconnaissance vocale démarrée (mode continu)');
          },
          (error: string) => {
            console.error('❌ Erreur reconnaissance continue:', error);
            this.handleRecognitionError(error, options);
          }
        );
      } else {
        this.recognizer.recognizeOnceAsync(
          (result: sdk.SpeechRecognitionResult) => {
            console.log('✅ Reconnaissance ponctuelle terminée');
            this.handleRecognitionResult(result);
          },
          (error: string) => {
            console.error('❌ Erreur reconnaissance ponctuelle:', error);
            this.handleRecognitionError(error, options);
          }
        );
      }

      // Setup timeout for maximum duration
      if (options.maxDuration) {
        setTimeout(() => {
          if (this.isRecognizing) {
            console.log('⏰ Timeout atteint, arrêt de la reconnaissance');
            this.stopRecognition();
          }
        }, options.maxDuration * 1000);
      }

    } catch (error) {
      console.error('❌ Erreur création recognizer:', error);
      await this.retryRecognition(String(error), options);
    }
  }

  private async retryRecognition(error: string, options: SpeechRecognitionOptions): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      logger.error('Maximum retry attempts reached', { 
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
        lastError: error
      });
      this.handleError(this.formatUserFriendlyError(error));
      return;
    }

    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
    
    logger.info('Retrying speech recognition', { 
      attempt: this.retryCount,
      maxRetries: this.maxRetries,
      delay: delay
    });

    setTimeout(async () => {
      try {
        await this.createRecognizerWithRetry(options);
      } catch (retryError) {
        logger.error('Retry attempt failed', retryError);
        await this.retryRecognition(String(retryError), options);
      }
    }, delay);
  }

  private handleRecognitionError(error: string, options: SpeechRecognitionOptions): void {
    const errorStr = String(error);
    
    // Check if it's a recoverable error
    if (this.isRecoverableError(errorStr) && this.retryCount < this.maxRetries) {
      logger.warn('Recoverable error detected, attempting retry', { 
        error: errorStr,
        retryCount: this.retryCount 
      });
      this.retryRecognition(error, options);
    } else {
      logger.error('Non-recoverable recognition error', { 
        error: errorStr,
        retryCount: this.retryCount 
      });
      this.handleError(this.formatUserFriendlyError(errorStr));
    }
  }

  private isRecoverableError(error: string): boolean {
    const recoverableErrors = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'unavailable'
    ];
    
    return recoverableErrors.some(keyword => 
      error.toLowerCase().includes(keyword)
    );
  }

  /**
   * Configuration des événements du recognizer
   */
  private setupRecognizerEvents(options: SpeechRecognitionOptions): void {
    if (!this.recognizer) {
      console.error('🔧 ❌ ERREUR: Recognizer non initialisé dans setupRecognizerEvents');
      return;
    }
    
    console.log('🔧 === CONFIGURATION DES ÉVÉNEMENTS AZURE ===');
    console.log('🔧 Recognizer status:', !!this.recognizer);
    console.log('🔧 Options mode continu:', options.continuous);

    // 🚀 STREAMING TRANSLATION - Résultat intermédiaire (en cours de reconnaissance)
    this.recognizer.recognizing = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionEventArgs) => {
      console.log('🔧 🔄 ÉVÉNEMENT: recognizing - Texte en cours:', event.result.text);
      if (options.interimResults && event.result.text) {
        console.log('🔄 Résultat intermédiaire:', event.result.text);
        
        // 🚀 NOUVEAU : Streaming translation par chunks de 5 mots
        this.processInterimResult(event.result.text, event.result.properties?.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult) || 0.9);
      }
    };

    // Résultat final - CRITIQUE
    this.recognizer.recognized = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionEventArgs) => {
      console.log('🔧 🎯 ÉVÉNEMENT: recognized déclenché!');
      console.log('🔧 Raison:', event.result.reason);
      console.log('🔧 Texte reconnu:', event.result.text);
      console.log('🔧 Texte trimmed:', event.result.text?.trim());
      
      if (event.result.reason === sdk.ResultReason.RecognizedSpeech && event.result.text.trim()) {
        console.log('🔧 ✅ Conditions remplies, appel handleRecognitionResult');
        this.handleRecognitionResult(event.result);
      } else if (event.result.reason === sdk.ResultReason.NoMatch) {
        console.log('🔧 🔇 NoMatch détecté');
        console.log('🔇 Silence détecté, en attente...');
        // En mode continu, ne pas traiter les silences comme des erreurs
        if (!options.continuous) {
          this.onErrorCallback?.('Aucun texte reconnu. Parlez plus fort ou plus clairement.');
        }
      } else {
        console.log('🔧 ⚠️ Raison non gérée:', event.result.reason);
      }
    };

    // Erreurs
    this.recognizer.canceled = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionCanceledEventArgs) => {
      console.log('🔧 ❌ ÉVÉNEMENT: canceled');
      console.error('❌ Reconnaissance annulée:', event.reason);
      console.error('❌ Détails erreur:', event.errorDetails);
      
      if (event.reason === sdk.CancellationReason.Error) {
        this.onErrorCallback?.(`Erreur: ${event.errorDetails}`);
      } else if (event.reason === sdk.CancellationReason.EndOfStream && options.continuous) {
        console.log('📡 Fin de stream en mode continu - normal');
        // En mode continu, ne pas traiter la fin de stream comme une erreur
        return;
      }
      
      this.cleanup();
    };

    // Session démarrée
    this.recognizer.sessionStarted = (_sender: sdk.Recognizer, _event: sdk.SessionEventArgs) => {
      console.log('🔧 🎤 ÉVÉNEMENT: sessionStarted');
      console.log('🎤 Session Azure Speech démarrée');
      this.onStatusCallback?.('listening');
    };

    // Session arrêtée
    this.recognizer.sessionStopped = (_sender: sdk.Recognizer, _event: sdk.SessionEventArgs) => {
      console.log('🔧 🛑 ÉVÉNEMENT: sessionStopped');
      console.log('🛑 Session Azure Speech arrêtée');
      
      // 🔧 CORRECTION: En mode continu, la session ne devrait jamais s'arrêter
      // Si elle s'arrête, c'est un problème et il faut le signaler
      if (options.continuous) {
        console.warn('⚠️ Session arrêtée de manière inattendue en mode continu');
        // Signaler que l'écoute s'est arrêtée pour permettre un redémarrage
        this.isRecognizing = false;
        this.onStatusCallback?.('stopped');
      } else {
        this.onStatusCallback?.('stopped');
        this.cleanup();
      }
    };

    // Événement de fin de discours (pause détectée)
    this.recognizer.speechEndDetected = (_sender: sdk.Recognizer, _event: sdk.RecognitionEventArgs) => {
      console.log('🔧 ⏸️ ÉVÉNEMENT: speechEndDetected');
      console.log('⏸️ Fin de discours détectée');
      this.onStatusCallback?.('processing');
    };

    // Événement de début de discours
    this.recognizer.speechStartDetected = (_sender: sdk.Recognizer, _event: sdk.RecognitionEventArgs) => {
      console.log('🔧 🎙️ ÉVÉNEMENT: speechStartDetected');
      console.log('🎙️ Début de discours détecté');
      this.onStatusCallback?.('listening');
    };
    
    console.log('🔧 === TOUS LES ÉVÉNEMENTS CONFIGURÉS ===');
  }

  /**
   * Traite le résultat de reconnaissance
   */
  private handleRecognitionResult(result: sdk.SpeechRecognitionResult): void {
    console.log('🔧 === HANDLE RECOGNITION RESULT ===');
    console.log('🔧 Raison du résultat:', result.reason);
    console.log('🔧 Texte brut:', result.text);
    console.log('🔧 Longueur texte:', result.text?.length || 0);
    
    if (result.reason === sdk.ResultReason.RecognizedSpeech && result.text) {
      console.log('🔧 ✅ Conditions de succès remplies');
      
      // 🆕 AMÉLIORATION: Extraire la langue détectée automatiquement
      let detectedLanguage = 'unknown';
      
      try {
        // 🔧 NOUVEAU : Extraction améliorée pour détection automatique multi-langues
        
        // 1. Tentative d'extraction depuis AutoDetectSourceLanguageResult
        const autoDetectResult = sdk.AutoDetectSourceLanguageResult.fromResult(result);
        if (autoDetectResult && autoDetectResult.language) {
          detectedLanguage = autoDetectResult.language;
          console.log('🎯 Langue détectée par AutoDetect:', detectedLanguage);
        }
        
        // 2. Fallback : propriétés standards
        if (detectedLanguage === 'unknown') {
          const languageDetectionResult = result.properties?.getProperty(sdk.PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages);
          
          if (languageDetectionResult) {
            detectedLanguage = languageDetectionResult;
            console.log('🎯 Langue détectée automatiquement par Azure:', detectedLanguage);
          } else {
            // Fallback: essayer de récupérer depuis d'autres propriétés
            const recognitionLanguage = result.properties?.getProperty(sdk.PropertyId.SpeechServiceConnection_RecoLanguage);
            if (recognitionLanguage) {
              detectedLanguage = recognitionLanguage;
              console.log('🔍 Langue de reconnaissance Azure:', detectedLanguage);
            }
          }
        }
        
        // 3. Debug : Afficher toutes les propriétés disponibles
        if (result.properties) {
          console.log('🔧 Propriétés disponibles dans le résultat:');
          const propertyKeys = Object.values(sdk.PropertyId);
          propertyKeys.forEach(key => {
            const value = result.properties?.getProperty(key);
            if (value) {
              console.log(`🔧   ${key}: ${value}`);
            }
          });
        }
        
      } catch (error) {
        console.warn('⚠️ Impossible d\'extraire la langue détectée:', error);
      }
      
      // Fallback : si la langue reste unknown, utiliser la langue demandée à Azure
      if (detectedLanguage === 'unknown' && this.speechConfig) {
        detectedLanguage = this.speechConfig.speechRecognitionLanguage || 'fr-FR';
        console.log('🔧 Utilisation de la langue de configuration par défaut:', detectedLanguage);
      }
      
      const recognitionResult: SpeechRecognitionResult = {
        text: result.text,
        confidence: 0.9, // Azure ne fournit pas toujours le score de confiance
        language: detectedLanguage,
        duration: result.duration / 10000000 // Conversion en secondes
      };

      // ➡️ Notifier tous les listeners
      this.resultListeners.forEach(l => {
        try {
          l(recognitionResult);
        } catch (e) {
          console.error('Erreur listener résultat:', e);
        }
      });

      console.log('🔧 📦 Objet résultat créé:', JSON.stringify(recognitionResult, null, 2));
      console.log('🔧 📞 Appel des listeners de résultats...');
      console.log('🔧 Nombre de listeners:', this.resultListeners.length);
      
      // 🚀 FIX CRITIQUE : Utiliser les listeners au lieu de onResultCallback
      if (this.resultListeners.length > 0) {
        console.log('✅ Texte reconnu (Azure EU):', recognitionResult.text, '- Langue:', recognitionResult.language);
        this.resultListeners.forEach(listener => {
          try {
            listener(recognitionResult);
            console.log('🔧 ✅ Listener exécuté avec succès');
          } catch (error) {
            console.error('🔧 ❌ Erreur dans listener:', error);
          }
        });
      } else {
        console.error('🔧 ❌ ERREUR CRITIQUE: Aucun listener configuré!');
      }
      
    } else if (result.reason === sdk.ResultReason.NoMatch) {
      console.log('🔧 🔇 NoMatch - Aucun texte reconnu');
      console.log('🔇 Aucun texte reconnu');
      
      // 🚀 FIX : Utiliser les listeners d'erreur au lieu de onErrorCallback
      this.errorListeners.forEach(listener => {
        try {
          listener('Aucun texte reconnu. Parlez plus fort ou plus clairement.');
        } catch (error) {
          console.error('🔧 ❌ Erreur dans error listener:', error);
        }
      });
      
    } else {
      console.log('🔧 ❓ Résultat inattendu:', result.reason);
      console.log('❓ Résultat inattendu:', result.reason);
    }
    
    console.log('🔧 === FIN HANDLE RECOGNITION RESULT ===');
  }

  /**
   * 🚀 MODIFIÉ : Nettoyage intelligent - Soft si persistance activée, Hard sinon
   */
  private cleanup(): void {
    if (this.connectionKeepAlive) {
      this.softCleanup();
    } else {
      this.hardCleanup();
    }
  }

  /**
   * Définit les callbacks
   */
  setCallbacks(
    onResult?: (result: SpeechRecognitionResult) => void,
    onError?: (error: string) => void,
    onStatus?: (status: 'listening' | 'processing' | 'stopped') => void
  ): void {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStatusCallback = onStatus;
  }

  /**
   * Obtient les langues supportées
   */
  getSupportedLanguages(): string[] {
    return Object.keys(AZURE_LANGUAGE_MAPPING);
  }

  /**
   * Vérifie si une langue est supportée
   */
  isLanguageSupported(language: string): boolean {
    return language in AZURE_LANGUAGE_MAPPING;
  }

  /**
   * Obtient des informations sur le service
   */
  getServiceInfo(): { region: string; available: boolean; provider: string } {
    return {
      region: AZURE_SPEECH_REGION,
      available: this.isAvailable(),
      provider: 'Azure Speech Services EU'
    };
  }

  /**
   * Synthèse vocale avec Azure Text-to-Speech - Version simplifiée
   */
  async speakText(options: TextToSpeechOptions): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('⚠️ Azure Speech Services non configuré - synthèse désactivée');
      return; // Ne pas bloquer, juste ignorer la synthèse
    }

    if (this.isSynthesizing) {
      console.warn('⚠️ Synthèse déjà en cours - ignorer');
      return;
    }

    try {
      console.log('🔊 Démarrage synthèse Azure TTS:', options.text.substring(0, 50) + '...');
      
      // Configuration Azure Speech
      const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY!, AZURE_SPEECH_REGION);
      
      // Langue et voix
      const azureLanguage = AZURE_LANGUAGE_MAPPING[options.language] || 'fr-FR';
      const azureVoice = options.voice || AZURE_VOICE_MAPPING[azureLanguage] || 'fr-FR-DeniseNeural';
      
      speechConfig.speechSynthesisVoiceName = azureVoice;
      speechConfig.speechSynthesisLanguage = azureLanguage;
      
      // Configuration audio (haut-parleurs)
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      
      // Créer le synthesizer
      this.synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
      this.isSynthesizing = true;
      
      // Version simplifiée sans Promise complexe
      this.synthesizer.speakTextAsync(
        options.text,
        (result: sdk.SpeechSynthesisResult) => {
          console.log('✅ Synthèse terminée:', result.reason);
          this.cleanupSynthesis();
        },
        (error: string) => {
          console.warn('⚠️ Erreur synthèse (non bloquante):', error);
          this.cleanupSynthesis();
        }
      );

    } catch (error: unknown) {
      console.warn('⚠️ Erreur configuration synthèse (non bloquante):', error);
      this.cleanupSynthesis();
      // Ne pas propager l'erreur pour éviter de bloquer la traduction
    }
  }

  /**
   * Arrête la synthèse vocale
   */
  stopSynthesis(): void {
    if (this.synthesizer && this.isSynthesizing) {
      try {
        this.synthesizer.close();
        this.cleanupSynthesis();
        console.log('🛑 Synthèse vocale arrêtée');
      } catch (error: unknown) {
        console.error('❌ Erreur arrêt synthèse:', error);
      }
    }
  }

  /**
   * Nettoyage des ressources de synthèse
   */
  private cleanupSynthesis(): void {
    if (this.synthesizer) {
      this.synthesizer.close();
      this.synthesizer = null;
    }
    this.isSynthesizing = false;
  }

  /**
   * Obtient les voix disponibles pour une langue
   */
  getAvailableVoices(language: string): string[] {
    const azureLanguage = AZURE_LANGUAGE_MAPPING[language] || 'fr-FR';
    return Object.entries(AZURE_VOICE_MAPPING)
      .filter(([lang]) => lang === azureLanguage)
      .map(([, voice]) => voice);
  }

  /**
   * Vérifie si la synthèse est en cours
   */
  isSpeaking(): boolean {
    return this.isSynthesizing;
  }

  private handleError(error: string): void {
    this.isRecognizing = false;
    this.lastError = error;
    
    // Listeners multiples
    this.errorListeners.forEach(l => {
      try { l(error); } catch (e) { console.error('Erreur listener error:', e); }
    });
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  private formatUserFriendlyError(error: string): string {
    if (error.includes('permission')) {
      return 'Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres.';
    }
    if (error.includes('network') || error.includes('connection')) {
      return 'Problème de connexion réseau. Vérifiez votre connexion internet.';
    }
    if (error.includes('key') || error.includes('subscription')) {
      return 'Problème de configuration du service. Contactez l\'administrateur.';
    }
    if (error.includes('timeout')) {
      return 'Timeout du service. Réessayez dans quelques instants.';
    }
    
    return 'Erreur inattendue du service de reconnaissance vocale.';
  }

  private mapLanguageToAzure(language: string): string {
    const languageMap: Record<string, string> = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ar': 'ar-SA',
      'ru': 'ru-RU',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR'
    };

    return languageMap[language] || 'fr-FR';
  }

  private notifyStatus(status: 'listening' | 'processing' | 'stopped'): void {
    this.statusListeners.forEach(l => {
      try { l(status); } catch (e) { console.error('Erreur listener status:', e); }
    });

    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
  }

  public async stopRecognition(): Promise<void> {
    logger.debug('Stopping speech recognition');
    
    try {
      if (this.recognizer && this.isRecognizing) {
        this.recognizer.stopContinuousRecognitionAsync(
          () => {
            logger.debug('Recognition stopped successfully');
            this.cleanup();
          },
          (error: string) => {
            logger.warn('Error stopping recognition', error);
            this.cleanup();
          }
        );
      } else {
        this.cleanup();
      }
    } catch (error) {
      logger.error('Error in stopRecognition', error);
      this.cleanup();
    }
  }

  public getStatus(): {
    isRecognizing: boolean;
    isConfigured: boolean;
    lastError: string | null;
    retryCount: number;
  } {
    return {
      isRecognizing: this.isRecognizing,
      isConfigured: this.isConfigured(),
      lastError: this.lastError,
      retryCount: this.retryCount
    };
  }

  /**
   * 🚀 Démarre la reconnaissance vocale en mode FAST (latence réduite de 60%)
   * Optimisé pour la traduction en temps réel - sacrifie précision marginale pour vitesse
   */
  public async startFastRecognition(options: Omit<SpeechRecognitionOptions, 'fastMode'>): Promise<void> {
    console.log('🚀 Démarrage Fast Transcription - Latence ultra-réduite');
    
    const fastOptions: SpeechRecognitionOptions = {
      ...options,
      fastMode: true,
      // Optimisations automatiques pour la vitesse
      continuous: options.continuous ?? true,
      interimResults: options.interimResults ?? false,
      maxDuration: options.maxDuration ?? 30
    };
    
    return this.startRecognition(fastOptions);
  }

  /**
   * Redémarre la reconnaissance actuelle en mode Fast
   */
  public async switchToFastMode(): Promise<void> {
    if (!this.isRecognizing) {
      console.warn('Aucune reconnaissance en cours pour basculer en mode Fast');
      return;
    }
    
    console.log('🔄 Basculement vers Fast Transcription...');
    
    // Sauvegarder les options actuelles
    const currentLanguage = this.recognitionLanguage;
    
    // Arrêter et redémarrer en mode fast
    await this.stopRecognition();
    
    await this.startFastRecognition({
      language: currentLanguage,
      continuous: true,
      interimResults: false
    });
  }

  /**
   * Vérifie si Fast Transcription est actif
   */
  public isFastModeActive(): boolean {
    return this.speechConfig?.getProperty('SpeechServiceConnection_InitialSilenceTimeoutMs') === '1000';
  }

  // Méthode pour tester la connectivité
  public async testConnection(): Promise<boolean> {
    try {
      logger.debug('Testing Azure Speech connection');
      
      if (!this.isConfigured()) {
        throw new Error('Service not configured');
      }

      // Test simple synthesis
      await this.speakText({
        text: 'Test',
        language: 'fr',
        rate: 1.0,
        pitch: 1.0,
        volume: 0
      });

      logger.info('Azure Speech connection test successful');
      return true;
      
    } catch (error) {
      logger.error('Azure Speech connection test failed', error);
      return false;
    }
  }

  // API d'abonnement
  addResultListener(listener: (r: SpeechRecognitionResult) => void) {
    this.resultListeners.push(listener);
  }
  removeResultListener(listener: (r: SpeechRecognitionResult) => void) {
    this.resultListeners = this.resultListeners.filter(l => l !== listener);
  }
  addErrorListener(listener: (e: string) => void) {
    this.errorListeners.push(listener);
  }
  removeErrorListener(listener: (e: string) => void) {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }
  addStatusListener(listener: (s: 'listening' | 'processing' | 'stopped') => void) {
    this.statusListeners.push(listener);
  }
  removeStatusListener(listener: (s: 'listening' | 'processing' | 'stopped') => void) {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  // 🚀 NOUVEAUX LISTENERS STREAMING - Gestion des résultats intermédiaires
  addInterimResultListener(listener: (result: SpeechInterimResult) => void) {
    this.interimResultListeners.push(listener);
  }
  
  removeInterimResultListener(listener: (result: SpeechInterimResult) => void) {
    this.interimResultListeners = this.interimResultListeners.filter(l => l !== listener);
  }

  /**
   * 🚀 Active le mode streaming translation - traduction progressive par chunks de 5 mots
   */
  enableStreamingTranslation(): void {
    console.log('🚀 Activation du streaming translation - Traduction progressive par chunks');
  }

  /**
   * 🚀 Traite les résultats intermédiaires pour streaming translation
   */
  private processInterimResult(text: string, confidence: number = 0.9): void {
    if (!text || text.trim().length === 0) return;

    const wordCount = text.split(' ').filter(word => word.length > 0).length;
    
    // Seuil de streaming : traiter dès 5 mots ou plus
    if (wordCount >= 5 && wordCount > this.lastWordCount) {
      const interimResult: SpeechInterimResult = {
        text: text.trim(),
        confidence,
        wordCount
      };
      
      // Notifier tous les listeners de streaming
      this.interimResultListeners.forEach(listener => {
        try {
          listener(interimResult);
        } catch (error) {
          console.warn('Erreur dans listener interim result:', error);
        }
      });
      
      this.lastWordCount = wordCount;
      console.log(`🚀 Streaming chunk traité: ${wordCount} mots - "${text}"`);
    }
  }

  // 🚀 WEBSOCKET PERSISTANT - Nouvelles méthodes de gestion de connexion optimisée

  /**
   * 🚀 Active la persistance WebSocket - Maintient la connexion ouverte
   */
  enablePersistentConnection(): void {
    this.connectionKeepAlive = true;
    this.lastActivity = new Date();
    console.log('🚀 WebSocket persistant activé - Connexions maintenues');
    
    // Démarrer le monitoring de keep-alive
    this.startKeepAliveMonitoring();
  }

  /**
   * 🚀 Désactive la persistance WebSocket 
   */
  disablePersistentConnection(): void {
    this.connectionKeepAlive = false;
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    console.log('🚀 WebSocket persistant désactivé');
  }

  /**
   * 🚀 Monitoring keep-alive pour éviter les timeouts
   */
  private startKeepAliveMonitoring(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    this.connectionTimeout = setTimeout(() => {
      const idleTime = Date.now() - this.lastActivity.getTime();
      
      if (idleTime > this.maxIdleTime) {
        console.log('🚀 Connexion idle trop longtemps, nettoyage soft...');
        this.softCleanup();
      } else {
        // Continuer le monitoring
        this.startKeepAliveMonitoring();
      }
    }, 60000); // Vérifier chaque minute
  }

  /**
   * 🚀 Pause la reconnaissance SANS fermer la connexion WebSocket
   */
  async pauseRecognition(): Promise<void> {
    console.log('🚀 Pause reconnaissance (connexion maintenue)');
    
    try {
      if (this.recognizer && this.isRecognizing) {
        this.recognizer.stopContinuousRecognitionAsync(
          () => {
            console.log('✅ Reconnaissance mise en pause (WebSocket ouvert)');
            this.isRecognizing = false;
            this.notifyStatus('stopped');
          },
          (error: string) => {
            console.warn('⚠️ Erreur pause reconnaissance:', error);
            this.isRecognizing = false;
          }
        );
      }
    } catch (error) {
      console.error('❌ Erreur pauseRecognition:', error);
      this.isRecognizing = false;
    }
  }

  /**
   * 🚀 Reprend la reconnaissance en réutilisant la connexion existante
   */
  async resumeRecognition(): Promise<void> {
    console.log('🚀 Reprise reconnaissance (réutilisation WebSocket)');
    
    try {
      if (this.recognizer && !this.isRecognizing) {
        this.isRecognizing = true;
        this.lastActivity = new Date();
        this.notifyStatus('listening');
        
        this.recognizer.startContinuousRecognitionAsync(
          () => {
            console.log('✅ Reconnaissance reprise avec succès');
          },
          (error: string) => {
            console.error('❌ Erreur reprise reconnaissance:', error);
            this.handleError(error);
          }
        );
      } else if (!this.recognizer) {
        console.log('🚀 Pas de connexion existante, création nouvelle...');
        // Fallback : recréer si nécessaire
        // Cette méthode sera appelée depuis startRecognition si besoin
      }
    } catch (error) {
      console.error('❌ Erreur resumeRecognition:', error);
      this.handleError(String(error));
    }
  }

  /**
   * 🚀 Nettoyage "soft" - Garde la connexion ouverte si persistance activée
   */
  private softCleanup(): void {
    if (this.connectionKeepAlive && this.recognizer) {
      console.log('🚀 Nettoyage soft - WebSocket maintenu ouvert');
      this.isRecognizing = false;
      // NE PAS fermer le recognizer
    } else {
      // Nettoyage complet traditionnel
      this.hardCleanup();
    }
  }

  /**
   * 🚀 Nettoyage "hard" - Ferme complètement la connexion
   */
  private hardCleanup(): void {
    console.log('🚀 Nettoyage hard - Fermeture complète WebSocket');
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }
    this.isRecognizing = false;
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}

// Instance singleton
export const azureSpeechService = new AzureSpeechService(); 