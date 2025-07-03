import { LanguageOption } from '../components/InterviewTranslator/LanguageSelector';

export interface VoiceConfig {
  code: string;
  name: string;
  gender: 'male' | 'female';
  style: 'neutral' | 'cheerful' | 'empathetic' | 'calm' | 'professional';
  quality: 'hd' | 'standard';
  features: string[];
}

// Configuration avancée des voix Azure par langue
export const AZURE_VOICES: Record<string, VoiceConfig[]> = {
  'fr': [
    {
      code: 'fr-FR-DeniseNeural',
      name: 'Denise (France)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Multilingual', 'Expressive', 'Clear pronunciation']
    },
    {
      code: 'fr-FR-HenriNeural',
      name: 'Henri (France)',
      gender: 'male',
      style: 'professional',
      quality: 'hd',
      features: ['Natural tone', 'Authoritative', 'Clear speech']
    },
    {
      code: 'fr-FR-EloiseNeural',
      name: 'Éloïse (France)',
      gender: 'female',
      style: 'empathetic',
      quality: 'hd',
      features: ['Warm tone', 'Expressive', 'Child-friendly']
    },
    {
      code: 'fr-CA-SylvieNeural',
      name: 'Sylvie (Canada)',
      gender: 'female',
      style: 'neutral',
      quality: 'hd',
      features: ['Canadian accent', 'Clear', 'Professional']
    }
  ],
  'en': [
    {
      code: 'en-GB-SoniaNeural',
      name: 'Sonia (UK)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['British accent', 'Clear', 'Authoritative']
    },
    {
      code: 'en-US-AriaNeural',
      name: 'Aria (US)',
      gender: 'female',
      style: 'cheerful',
      quality: 'hd',
      features: ['American accent', 'Expressive', 'Versatile']
    },
    {
      code: 'en-US-GuyNeural',
      name: 'Guy (US)',
      gender: 'male',
      style: 'professional',
      quality: 'hd',
      features: ['Professional', 'News reading', 'Clear']
    }
  ],
  'ar': [
    {
      code: 'ar-SA-ZariyahNeural',
      name: 'Zariyah (Arabie Saoudite)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Modern Standard Arabic', 'Clear', 'Professional']
    },
    {
      code: 'ar-EG-SalmaNeural',
      name: 'Salma (Égypte)',
      gender: 'female',
      style: 'neutral',
      quality: 'hd',
      features: ['Egyptian dialect', 'Warm', 'Natural']
    }
  ],
  'es': [
    {
      code: 'es-ES-ElviraNeural',
      name: 'Elvira (Espagne)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Iberian Spanish', 'Clear', 'Professional']
    },
    {
      code: 'es-MX-DaliaNeural',
      name: 'Dalia (Mexique)',
      gender: 'female',
      style: 'cheerful',
      quality: 'hd',
      features: ['Mexican Spanish', 'Warm', 'Expressive']
    }
  ],
  'de': [
    {
      code: 'de-DE-KatjaNeural',
      name: 'Katja (Allemagne)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard German', 'Clear', 'Professional']
    },
    {
      code: 'de-DE-ConradNeural',
      name: 'Conrad (Allemagne)',
      gender: 'male',
      style: 'neutral',
      quality: 'hd',
      features: ['Deep voice', 'Authoritative', 'Clear']
    }
  ],
  'it': [
    {
      code: 'it-IT-ElsaNeural',
      name: 'Elsa (Italie)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Italian', 'Clear', 'Professional']
    }
  ],
  'pt': [
    {
      code: 'pt-PT-RaquelNeural',
      name: 'Raquel (Portugal)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['European Portuguese', 'Clear', 'Professional']
    }
  ],
  'pt-br': [
    {
      code: 'pt-BR-FranciscaNeural',
      name: 'Francisca (Brésil)',
      gender: 'female',
      style: 'cheerful',
      quality: 'hd',
      features: ['Brazilian Portuguese', 'Warm', 'Expressive']
    }
  ],
  'ru': [
    {
      code: 'ru-RU-SvetlanaNeural',
      name: 'Svetlana (Russie)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Russian', 'Clear', 'Professional']
    }
  ],
  'zh': [
    {
      code: 'zh-CN-XiaoxiaoNeural',
      name: 'Xiaoxiao (Chine)',
      gender: 'female',
      style: 'cheerful',
      quality: 'hd',
      features: ['Mandarin', 'Expressive', 'Versatile']
    }
  ],
  'ja': [
    {
      code: 'ja-JP-NanamiNeural',
      name: 'Nanami (Japon)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Japanese', 'Clear', 'Professional']
    }
  ],
  'ko': [
    {
      code: 'ko-KR-SunHiNeural',
      name: 'SunHi (Corée)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Korean', 'Clear', 'Professional']
    }
  ],
  'hi': [
    {
      code: 'hi-IN-SwaraNeural',
      name: 'Swara (Inde)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Hindi', 'Clear', 'Professional']
    }
  ],
  'tr': [
    {
      code: 'tr-TR-EmelNeural',
      name: 'Emel (Turquie)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Turkish', 'Clear', 'Professional']
    }
  ],
  'nl': [
    {
      code: 'nl-NL-ColetteNeural',
      name: 'Colette (Pays-Bas)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Dutch', 'Clear', 'Professional']
    }
  ],
  'pl': [
    {
      code: 'pl-PL-ZofiaNeural',
      name: 'Zofia (Pologne)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Polish', 'Clear', 'Professional']
    }
  ],
  'ro': [
    {
      code: 'ro-RO-AlinaNeural',
      name: 'Alina (Roumanie)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Romanian', 'Clear', 'Professional']
    }
  ],
  'fa': [
    {
      code: 'fa-IR-DilaraNeural',
      name: 'Dilara (Iran)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Farsi', 'Clear', 'Professional']
    }
  ],
  'ur': [
    {
      code: 'ur-PK-UzmaNeural',
      name: 'Uzma (Pakistan)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Urdu', 'Clear', 'Professional']
    }
  ],
  'he': [
    {
      code: 'he-IL-HilaNeural',
      name: 'Hila (Israël)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Modern Hebrew', 'Clear', 'Professional']
    }
  ],
  'th': [
    {
      code: 'th-TH-AcharaNeural',
      name: 'Achara (Thaïlande)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Thai', 'Clear', 'Professional']
    }
  ],
  'vi': [
    {
      code: 'vi-VN-HoaiMyNeural',
      name: 'HoaiMy (Vietnam)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Northern Vietnamese', 'Clear', 'Professional']
    }
  ],
  'sv': [
    {
      code: 'sv-SE-SofieNeural',
      name: 'Sofie (Suède)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Swedish', 'Clear', 'Professional']
    }
  ],
  'no': [
    {
      code: 'nb-NO-PernilleNeural',
      name: 'Pernille (Norvège)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Norwegian Bokmål', 'Clear', 'Professional']
    }
  ],
  'da': [
    {
      code: 'da-DK-ChristelNeural',
      name: 'Christel (Danemark)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Danish', 'Clear', 'Professional']
    }
  ],
  'fi': [
    {
      code: 'fi-FI-SelmaNeural',
      name: 'Selma (Finlande)',
      gender: 'female',
      style: 'professional',
      quality: 'hd',
      features: ['Standard Finnish', 'Clear', 'Professional']
    }
  ],
  'sw': [
    {
      code: 'sw-KE-ZuriNeural',
      name: 'Zuri (Kenya)',
      gender: 'female',
      style: 'neutral',
      quality: 'standard',
      features: ['East African Swahili', 'Clear']
    }
  ],
  'am': [
    {
      code: 'am-ET-MekdesNeural',
      name: 'Mekdes (Éthiopie)',
      gender: 'female',
      style: 'neutral',
      quality: 'standard',
      features: ['Standard Amharic', 'Clear']
    }
  ]
};

export interface SpeechOptions {
  text: string;
  language: string;
  voiceCode?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  style?: string;
  prosody?: 'default' | 'gentle' | 'lyrical' | 'newscast' | 'customerservice';
}

export interface CostEstimate {
  characters: number;
  cost: number;
  currency: 'EUR';
  service: 'Neural TTS HD' | 'Neural TTS Standard';
}

class AzureVoiceService {
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
  }

  /**
   * Obtient la meilleure voix pour une langue donnée
   */
  getBestVoiceForLanguage(languageCode: string, context: 'interview' | 'sample' = 'interview'): VoiceConfig | null {
    const voices = AZURE_VOICES[languageCode];
    if (!voices || voices.length === 0) return null;

    // Pour les entretiens, privilégier les voix professionnelles et empathiques
    if (context === 'interview') {
      const professionalVoices = voices.filter(v => 
        v.style === 'professional' || v.style === 'empathetic'
      );
      if (professionalVoices.length > 0) {
        return professionalVoices[0];
      }
    }

    // Retourner la première voix HD disponible, sinon la première voix
    const hdVoices = voices.filter(v => v.quality === 'hd');
    return hdVoices.length > 0 ? hdVoices[0] : voices[0];
  }

  /**
   * Obtient toutes les voix disponibles pour une langue
   */
  getVoicesForLanguage(languageCode: string): VoiceConfig[] {
    return AZURE_VOICES[languageCode] || [];
  }

  /**
   * Calcule le coût estimé pour un texte donné
   */
  calculateCost(text: string, voiceConfig: VoiceConfig): CostEstimate {
    const characters = text.length;
    
    // Tarification Azure Neural TTS (janvier 2025)
    const pricePerMillionChars = voiceConfig.quality === 'hd' ? 0.024 : 0.016; // EUR
    const cost = (characters / 1000000) * pricePerMillionChars;

    return {
      characters,
      cost: Math.round(cost * 100000) / 100000, // Arrondi à 5 décimales
      currency: 'EUR',
      service: voiceConfig.quality === 'hd' ? 'Neural TTS HD' : 'Neural TTS Standard'
    };
  }

  /**
   * Génère le SSML pour Azure Speech Services
   */
  generateSSML(options: SpeechOptions): string {
    const voiceConfig = this.getBestVoiceForLanguage(options.language);
    const voiceCode = options.voiceCode || voiceConfig?.code || 'en-US-AriaNeural';

    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${options.language}">`;
    ssml += `<voice name="${voiceCode}">`;

    // Ajout de prosody si spécifié
    if (options.rate || options.pitch || options.volume) {
      let prosodyAttrs = [];
      if (options.rate) prosodyAttrs.push(`rate="${options.rate}%"`);
      if (options.pitch) prosodyAttrs.push(`pitch="${options.pitch}%"`);
      if (options.volume) prosodyAttrs.push(`volume="${options.volume}%"`);
      
      ssml += `<prosody ${prosodyAttrs.join(' ')}>`;
      ssml += options.text;
      ssml += `</prosody>`;
    } else {
      ssml += options.text;
    }

    ssml += `</voice></speak>`;
    return ssml;
  }

  /**
   * Joue un échantillon audio pour une langue donnée
   */
  async playSample(language: LanguageOption): Promise<void> {
    try {
      // Arrêter l'audio en cours s'il y en a un
      this.stopCurrentAudio();

      const voiceConfig = this.getBestVoiceForLanguage(language.code, 'sample');
      if (!voiceConfig) {
        throw new Error(`Aucune voix trouvée pour ${language.name}`);
      }

      const options: SpeechOptions = {
        text: language.sampleText,
        language: language.code,
        voiceCode: voiceConfig.code,
        rate: 90, // Légèrement plus lent pour la démonstration
        volume: 85
      };

      // Pour la démo, on utilise Web Speech API (navigateur)
      // En production, ça passerait par Azure Speech Services
      await this.speakWithWebAPI(options);

      console.log(`🔊 Échantillon joué: ${language.name} (${voiceConfig.name})`);
      
    } catch (error) {
      console.error('Erreur lecture échantillon:', error);
      throw new Error(`Impossible de lire l'échantillon pour ${language.name}`);
    }
  }

  /**
   * Synthèse vocale avec Web Speech API (fallback pour démo)
   */
  private async speakWithWebAPI(options: SpeechOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech Synthesis non supporté'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(options.text);
      
      // Trouver une voix locale compatible
      const voices = this.speechSynthesis.getVoices();
      const compatibleVoice = voices.find(voice => 
        voice.lang.startsWith(options.language) || 
        voice.lang.startsWith(options.language.split('-')[0])
      );

      if (compatibleVoice) {
        utterance.voice = compatibleVoice;
      }

      if (options.rate) utterance.rate = options.rate / 100;
      if (options.pitch) utterance.pitch = options.pitch / 100;
      if (options.volume) utterance.volume = options.volume / 100;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Erreur synthèse: ${event.error}`));

      this.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Synthèse vocale avancée avec Azure (production)
   */
  async speak(options: SpeechOptions): Promise<void> {
    try {
      const ssml = this.generateSSML(options);
      const voiceConfig = this.getBestVoiceForLanguage(options.language);
      
      if (voiceConfig) {
        const cost = this.calculateCost(options.text, voiceConfig);
        console.log(`💰 Coût estimé: ${cost.cost.toFixed(5)}€ (${cost.characters} caractères, ${cost.service})`);
      }

      // En production, ceci ferait appel à Azure Speech Services
      // Pour l'instant, on utilise le fallback Web API
      await this.speakWithWebAPI(options);

    } catch (error) {
      console.error('Erreur synthèse vocale:', error);
      throw error;
    }
  }

  /**
   * Arrête l'audio en cours de lecture
   */
  stopCurrentAudio(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Vérifie si la lecture audio est en cours
   */
  isSpeaking(): boolean {
    return this.speechSynthesis?.speaking || false;
  }

  /**
   * Obtient des statistiques sur les voix disponibles
   */
  getVoiceStats(): { total: number; hd: number; languages: number } {
    const allVoices = Object.values(AZURE_VOICES).flat();
    const hdVoices = allVoices.filter(v => v.quality === 'hd');
    const languages = Object.keys(AZURE_VOICES).length;

    return {
      total: allVoices.length,
      hd: hdVoices.length,
      languages
    };
  }

  /**
   * Obtient des recommandations de voix basées sur le contexte
   */
  getVoiceRecommendations(languageCode: string, context: string): VoiceConfig[] {
    const voices = this.getVoicesForLanguage(languageCode);
    
    if (context === 'social_interview') {
      // Pour les entretiens sociaux, privilégier empathie et professionnalisme
      return voices
        .filter(v => v.style === 'empathetic' || v.style === 'professional')
        .sort((a, b) => {
          if (a.style === 'empathetic' && b.style !== 'empathetic') return -1;
          if (b.style === 'empathetic' && a.style !== 'empathetic') return 1;
          if (a.quality === 'hd' && b.quality !== 'hd') return -1;
          if (b.quality === 'hd' && a.quality !== 'hd') return 1;
          return 0;
        });
    }

    return voices.sort((a, b) => {
      if (a.quality === 'hd' && b.quality !== 'hd') return -1;
      if (b.quality === 'hd' && a.quality !== 'hd') return 1;
      return 0;
    });
  }
}

// Instance singleton
export const azureVoiceService = new AzureVoiceService();
export default azureVoiceService; 