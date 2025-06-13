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

export class AzureSpeechService {
  private recognizer: sdk.SpeechRecognizer | null = null;
  private isRecognizing = false;
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
}

// Instance singleton
export const azureSpeechService = new AzureSpeechService(); 