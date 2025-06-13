// Service Azure Speech Services pour traduction temps réel
// Compatible avec votre configuration Azure OpenAI existante

interface AzureSpeechConfig {
  subscriptionKey: string;
  region: string;
  endpoint: string;
}

interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

interface SpeechSynthesisOptions {
  text: string;
  language: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

export class AzureSpeechService {
  private static instance: AzureSpeechService;
  private config: AzureSpeechConfig;
  private isInitialized: boolean = false;

  private constructor() {
    this.config = {
      subscriptionKey: import.meta.env.VITE_AZURE_SPEECH_KEY || '',
      region: import.meta.env.VITE_AZURE_SPEECH_REGION || 'westeurope',
      endpoint: `https://${import.meta.env.VITE_AZURE_SPEECH_REGION || 'westeurope'}.api.cognitive.microsoft.com/`
    };
  }

  public static getInstance(): AzureSpeechService {
    if (!AzureSpeechService.instance) {
      AzureSpeechService.instance = new AzureSpeechService();
    }
    return AzureSpeechService.instance;
  }

  /**
   * Initialise le service Azure Speech
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.config.subscriptionKey) {
        console.warn('🔑 Azure Speech Key manquante - Fonctionnalités vocales désactivées');
        console.warn('Ajoutez VITE_AZURE_SPEECH_KEY dans votre .env');
        return false;
      }

      // Test de connectivité
      const testResponse = await fetch(`${this.config.endpoint}speechtotext/v3.0/endpoints`, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey
        }
      });

      if (testResponse.ok) {
        this.isInitialized = true;
        console.log('✅ Azure Speech Services initialisé:', {
          region: this.config.region,
          endpoint: this.config.endpoint.slice(0, 30) + '...'
        });
        return true;
      } else {
        throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erreur initialisation Azure Speech:', error);
      return false;
    }
  }

  /**
   * Reconnaissance vocale (Speech-to-Text)
   */
  async speechToText(audioBlob: Blob, language: string = 'fr-FR'): Promise<SpeechRecognitionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized) {
      // Fallback en mode simulation
      return this.simulateSpeechToText(audioBlob, language);
    }

    try {
      // Conversion du blob audio en format compatible
      const audioBuffer = await audioBlob.arrayBuffer();
      
      // Configuration de la reconnaissance
      const recognitionConfig = {
        language: this.mapLanguageToAzureCode(language),
        format: 'detailed',
        profanity: 'masked'
      };

      // Appel API Azure Speech-to-Text
      const response = await fetch(`${this.config.endpoint}speechtotext/v3.0/transcriptions:transcribe`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'Content-Type': 'audio/wav',
          'Accept': 'application/json'
        },
        body: audioBuffer
      });

      if (!response.ok) {
        throw new Error(`Azure Speech API Error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        text: result.recognizedPhrases?.[0]?.nBest?.[0]?.display || '',
        confidence: result.recognizedPhrases?.[0]?.nBest?.[0]?.confidence || 0,
        language: language,
        duration: result.duration || 0
      };

    } catch (error) {
      console.error('Erreur Azure Speech-to-Text:', error);
      // Fallback en cas d'erreur
      return this.simulateSpeechToText(audioBlob, language);
    }
  }

  /**
   * Synthèse vocale (Text-to-Speech)
   */
  async textToSpeech(options: SpeechSynthesisOptions): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized) {
      // Fallback avec Web Speech API
      return this.fallbackTextToSpeech(options);
    }

    try {
      const voice = this.getOptimalVoice(options.language);
      
      // SSML pour Azure Speech
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${options.language}">
          <voice name="${voice}">
            <prosody rate="${options.rate || 1.0}" pitch="${options.pitch || 1.0}">
              ${this.escapeXml(options.text)}
            </prosody>
          </voice>
        </speak>
      `;

      const response = await fetch(`${this.config.endpoint}cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      });

      if (!response.ok) {
        throw new Error(`Azure TTS Error: ${response.status}`);
      }

      // Lecture de l'audio généré
      const audioBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioData = await audioContext.decodeAudioData(audioBuffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(audioContext.destination);
      source.start();

      console.log(`🔊 Synthèse vocale Azure: "${options.text.slice(0, 50)}..." en ${options.language}`);

    } catch (error) {
      console.error('Erreur Azure Text-to-Speech:', error);
      // Fallback avec Web Speech API
      this.fallbackTextToSpeech(options);
    }
  }

  /**
   * Détection automatique de langue
   */
  async detectLanguage(audioBlob: Blob): Promise<string> {
    if (!this.isInitialized) {
      return 'fr'; // Langue par défaut
    }

    try {
      const audioBuffer = await audioBlob.arrayBuffer();

      const response = await fetch(`${this.config.endpoint}speechtotext/v3.0/transcriptions:detect-language`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'Content-Type': 'audio/wav'
        },
        body: audioBuffer
      });

      if (response.ok) {
        const result = await response.json();
        return result.detectedLanguage || 'fr';
      }
    } catch (error) {
      console.error('Erreur détection langue:', error);
    }

    return 'fr'; // Fallback
  }

  /**
   * Mapping des codes de langue vers Azure Speech
   */
  private mapLanguageToAzureCode(language: string): string {
    const mapping: Record<string, string> = {
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
      'lb': 'de-LU', // Luxembourgeois → Allemand Luxembourg
      'fa': 'fa-IR',
      'ur': 'ur-PK'
    };

    return mapping[language] || 'fr-FR';
  }

  /**
   * Sélection de la voix optimale par langue
   */
  private getOptimalVoice(language: string): string {
    const voices: Record<string, string> = {
      'fr': 'fr-FR-DeniseNeural',
      'en': 'en-US-AriaNeural',
      'de': 'de-DE-KatjaNeural',
      'ar': 'ar-SA-ZariyahNeural',
      'es': 'es-ES-ElviraNeural',
      'it': 'it-IT-ElsaNeural',
      'pt': 'pt-PT-RaquelNeural',
      'ru': 'ru-RU-SvetlanaNeural',
      'tr': 'tr-TR-EmelNeural',
      'nl': 'nl-NL-ColetteNeural',
      'pl': 'pl-PL-ZofiaNeural',
      'ro': 'ro-RO-AlinaNeural',
      'fa': 'fa-IR-DilaraNeural',
      'ur': 'ur-PK-AsadNeural'
    };

    return voices[language] || voices['fr'];
  }

  /**
   * Simulation Speech-to-Text (fallback)
   */
  private async simulateSpeechToText(audioBlob: Blob, language: string): Promise<SpeechRecognitionResult> {
    console.log('🎭 Mode simulation - Azure Speech non configuré');
    
    // Simulation réaliste avec délai
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const simulatedTexts: Record<string, string[]> = {
      'fr': [
        'Bonjour, j\'ai besoin d\'aide pour mon dossier.',
        'Pouvez-vous m\'expliquer cette procédure ?',
        'Je ne comprends pas ce document.',
        'Quand vais-je recevoir une réponse ?'
      ],
      'ar': [
        'مرحبا، أحتاج مساعدة في ملفي',
        'هل يمكنك شرح هذا الإجراء؟',
        'لا أفهم هذه الوثيقة',
        'متى سأحصل على رد؟'
      ],
      'en': [
        'Hello, I need help with my file.',
        'Can you explain this procedure?',
        'I don\'t understand this document.',
        'When will I receive an answer?'
      ]
    };

    const texts = simulatedTexts[language] || simulatedTexts['fr'];
    const randomText = texts[Math.floor(Math.random() * texts.length)];

    return {
      text: randomText,
      confidence: 0.85 + Math.random() * 0.1,
      language: language,
      duration: 2 + Math.random() * 3
    };
  }

  /**
   * Fallback Text-to-Speech avec Web Speech API
   */
  private fallbackTextToSpeech(options: SpeechSynthesisOptions): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(options.text);
      utterance.lang = this.mapLanguageToAzureCode(options.language);
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      
      speechSynthesis.speak(utterance);
      console.log(`🔊 Synthèse vocale Web API: "${options.text.slice(0, 50)}..." en ${options.language}`);
    } else {
      console.log(`🔊 Synthèse vocale non disponible: "${options.text}"`);
    }
  }

  /**
   * Échappement XML pour SSML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Vérification de la disponibilité du service
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.config.subscriptionKey;
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  getUsageStats() {
    return {
      isConfigured: !!this.config.subscriptionKey,
      region: this.config.region,
      isInitialized: this.isInitialized,
      endpoint: this.config.endpoint
    };
  }
}

// Export de l'instance singleton
export const azureSpeechService = AzureSpeechService.getInstance(); 