import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

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
  'ur': 'ur-PK'
};

// Mapping des voix Azure pour chaque langue (voix neuronales de haute qualité)
const AZURE_VOICE_MAPPING: Record<string, string> = {
  'fr-FR': 'fr-FR-DeniseNeural',     // Voix féminine française naturelle
  'en-US': 'en-US-AriaNeural',       // Voix féminine anglaise claire
  'de-DE': 'de-DE-KatjaNeural',      // Voix féminine allemande
  'ar-SA': 'ar-SA-ZariyahNeural',    // Voix féminine arabe
  'es-ES': 'es-ES-ElviraNeural',     // Voix féminine espagnole
  'it-IT': 'it-IT-ElsaNeural',       // Voix féminine italienne
  'pt-PT': 'pt-PT-RaquelNeural',     // Voix féminine portugaise
  'ru-RU': 'ru-RU-SvetlanaNeural',   // Voix féminine russe
  'tr-TR': 'tr-TR-EmelNeural',       // Voix féminine turque
  'nl-NL': 'nl-NL-ColetteNeural',    // Voix féminine néerlandaise
  'pl-PL': 'pl-PL-ZofiaNeural',      // Voix féminine polonaise
  'ro-RO': 'ro-RO-AlinaNeural',      // Voix féminine roumaine
  'fa-IR': 'fa-IR-DilaraNeural',     // Voix féminine perse
  'ur-PK': 'ur-PK-UzmaNeural'        // Voix féminine ourdou
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
}

export interface TextToSpeechOptions {
  text: string;
  language: string;
  voice?: string;
  rate?: number;    // 0.5 à 2.0
  pitch?: number;   // -50% à +50%
  volume?: number;  // 0 à 100
}

export class AzureSpeechService {
  private recognizer: sdk.SpeechRecognizer | null = null;
  private synthesizer: sdk.SpeechSynthesizer | null = null;
  private isRecognizing = false;
  private isSynthesizing = false;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onStatusCallback?: (status: 'listening' | 'processing' | 'stopped') => void;

  constructor() {
    if (!AZURE_SPEECH_KEY) {
      console.warn('🔑 Azure Speech Key non configurée - service indisponible');
    }
  }

  /**
   * Vérifie si le service Azure Speech est disponible
   */
  isAvailable(): boolean {
    return !!(AZURE_SPEECH_KEY && AZURE_SPEECH_REGION);
  }

  /**
   * Démarre la reconnaissance vocale
   */
  async startRecognition(options: SpeechRecognitionOptions): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Azure Speech Services non configuré');
    }

    if (this.isRecognizing) {
      console.warn('⚠️ Reconnaissance déjà en cours');
      return;
    }

    try {
      // Configuration Azure Speech
      const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY!, AZURE_SPEECH_REGION);
      
      // Langue de reconnaissance
      const azureLanguage = AZURE_LANGUAGE_MAPPING[options.language] || 'fr-FR';
      speechConfig.speechRecognitionLanguage = azureLanguage;
      
      // Configuration audio (microphone)
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      
      // Créer le recognizer
      this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      
      // Configuration des événements
      this.setupRecognizerEvents(options);
      
      // Démarrer la reconnaissance
      if (options.continuous) {
        this.recognizer.startContinuousRecognitionAsync(
          () => {
            console.log('🎤 Reconnaissance continue démarrée (Azure EU)');
            this.isRecognizing = true;
            this.onStatusCallback?.('listening');
          },
          (error: string) => {
            console.error('❌ Erreur démarrage reconnaissance:', error);
            this.onErrorCallback?.(`Erreur démarrage: ${error}`);
            this.cleanup();
          }
        );
      } else {
        this.recognizer.recognizeOnceAsync(
          (result: sdk.SpeechRecognitionResult) => {
            this.handleRecognitionResult(result);
            this.cleanup();
          },
          (error: string) => {
            console.error('❌ Erreur reconnaissance:', error);
            this.onErrorCallback?.(`Erreur reconnaissance: ${error}`);
            this.cleanup();
          }
        );
      }

      // Timeout de sécurité
      if (options.maxDuration) {
        setTimeout(() => {
          if (this.isRecognizing) {
            console.log('⏰ Timeout reconnaissance vocale');
            this.stopRecognition();
          }
        }, options.maxDuration * 1000);
      }

    } catch (error: unknown) {
      console.error('❌ Erreur configuration Azure Speech:', error);
      this.onErrorCallback?.(`Erreur configuration: ${error}`);
      this.cleanup();
    }
  }

  /**
   * Arrête la reconnaissance vocale
   */
  stopRecognition(): void {
    if (!this.isRecognizing || !this.recognizer) {
      return;
    }

    try {
      this.recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log('🛑 Reconnaissance arrêtée');
          this.onStatusCallback?.('stopped');
          this.cleanup();
        },
        (error: string) => {
          console.error('❌ Erreur arrêt reconnaissance:', error);
          this.cleanup();
        }
      );
    } catch (error: unknown) {
      console.error('❌ Erreur arrêt reconnaissance:', error);
      this.cleanup();
    }
  }

  /**
   * Configuration des événements du recognizer
   */
  private setupRecognizerEvents(options: SpeechRecognitionOptions): void {
    if (!this.recognizer) return;

    // Résultat intermédiaire (en cours de reconnaissance)
    this.recognizer.recognizing = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionEventArgs) => {
      if (options.interimResults && event.result.text) {
        console.log('🔄 Résultat intermédiaire:', event.result.text);
        // Optionnel: callback pour résultats intermédiaires
      }
    };

    // Résultat final
    this.recognizer.recognized = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionEventArgs) => {
      this.handleRecognitionResult(event.result);
    };

    // Erreurs
    this.recognizer.canceled = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionCanceledEventArgs) => {
      console.error('❌ Reconnaissance annulée:', event.reason);
      
      if (event.reason === sdk.CancellationReason.Error) {
        this.onErrorCallback?.(`Erreur: ${event.errorDetails}`);
      }
      
      this.cleanup();
    };

    // Session démarrée
    this.recognizer.sessionStarted = (_sender: sdk.Recognizer, _event: sdk.SessionEventArgs) => {
      console.log('🎤 Session Azure Speech démarrée');
      this.onStatusCallback?.('listening');
    };

    // Session arrêtée
    this.recognizer.sessionStopped = (_sender: sdk.Recognizer, _event: sdk.SessionEventArgs) => {
      console.log('🛑 Session Azure Speech arrêtée');
      this.onStatusCallback?.('stopped');
      this.cleanup();
    };
  }

  /**
   * Traite le résultat de reconnaissance
   */
  private handleRecognitionResult(result: sdk.SpeechRecognitionResult): void {
    if (result.reason === sdk.ResultReason.RecognizedSpeech && result.text) {
      const recognitionResult: SpeechRecognitionResult = {
        text: result.text,
        confidence: 0.9, // Azure ne fournit pas toujours le score de confiance
        language: result.language || 'unknown',
        duration: result.duration / 10000000 // Conversion en secondes
      };

      console.log('✅ Texte reconnu (Azure EU):', recognitionResult.text);
      this.onResultCallback?.(recognitionResult);
      
    } else if (result.reason === sdk.ResultReason.NoMatch) {
      console.log('🔇 Aucun texte reconnu');
      this.onErrorCallback?.('Aucun texte reconnu. Parlez plus fort ou plus clairement.');
      
    } else {
      console.log('❓ Résultat inattendu:', result.reason);
    }
  }

  /**
   * Nettoyage des ressources
   */
  private cleanup(): void {
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }
    this.isRecognizing = false;
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
   * Synthèse vocale avec Azure Text-to-Speech
   */
  async speakText(options: TextToSpeechOptions): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Azure Speech Services non configuré');
    }

    if (this.isSynthesizing) {
      console.warn('⚠️ Synthèse déjà en cours');
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
      
      // Préparer le SSML pour contrôler la voix
      const ssml = this.buildSSML(options.text, azureVoice, options);
      
      this.isSynthesizing = true;
      
      // Démarrer la synthèse
      this.synthesizer.speakSsmlAsync(
        ssml,
        (result: sdk.SpeechSynthesisResult) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log('✅ Synthèse vocale terminée (Azure EU)');
          } else if (result.reason === sdk.ResultReason.Canceled) {
            console.error('❌ Synthèse annulée:', result.reason);
          }
          this.cleanupSynthesis();
        },
        (error: string) => {
          console.error('❌ Erreur synthèse vocale:', error);
          this.onErrorCallback?.(`Erreur synthèse: ${error}`);
          this.cleanupSynthesis();
        }
      );

    } catch (error: unknown) {
      console.error('❌ Erreur configuration synthèse:', error);
      this.onErrorCallback?.(`Erreur configuration synthèse: ${error}`);
      this.cleanupSynthesis();
    }
  }

  /**
   * Construit le SSML pour contrôler la synthèse vocale
   */
  private buildSSML(text: string, voice: string, options: TextToSpeechOptions): string {
    const rate = options.rate ? `${Math.round((options.rate - 1) * 100)}%` : '0%';
    const pitch = options.pitch ? `${options.pitch}%` : '0%';
    
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.split('-').slice(0, 2).join('-')}">
        <voice name="${voice}">
          <prosody rate="${rate}" pitch="${pitch}">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;
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
}

// Instance singleton
export const azureSpeechService = new AzureSpeechService(); 