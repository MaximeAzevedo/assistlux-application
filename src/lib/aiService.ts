import { azureOpenAIClient, DEPLOYMENT_NAME } from './openaiConfig';

// ═══════════════════════════════════════════════════════════
// SERVICE CENTRALISÉ AZURE OPENAI
// ═══════════════════════════════════════════════════════════

interface AIRequest {
  messages: Array<{ role: string; content: any }>;
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Appel centralisé vers Azure OpenAI avec gestion d'erreurs unifiée
   */
  async createCompletion(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await azureOpenAIClient.chat.completions.create({
        model: request.model || DEPLOYMENT_NAME,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000
      });

      const content = response.choices[0]?.message?.content || '';
      
      if (!content.trim()) {
        throw new Error('Azure OpenAI returned empty response');
      }

      return {
        content: content.trim(),
        usage: response.usage
      };

    } catch (error) {
      // Gestion d'erreurs centralisée
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          throw new Error('Limite de débit Azure OpenAI atteinte. Veuillez réessayer dans quelques secondes.');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('Quota Azure OpenAI insuffisant. Vérifiez votre facturation.');
        }
        if (error.message.includes('content_filter')) {
          throw new Error('Contenu filtré par Azure OpenAI. Veuillez modifier votre demande.');
        }
      }
      
      console.error('Azure OpenAI API Error:', error);
      throw new Error(`Erreur Azure OpenAI: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Méthodes spécialisées pour les cas d'usage courants
   */

  // Chat/Conversation
  async processChat(userMessage: string, systemPrompt: string, previousMessages: Array<{ role: string; content: string }> = []): Promise<string> {
    const response = await this.createCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        ...previousMessages,
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    return response.content;
  }

  // Traduction
  async translateText(text: string, targetLanguage: string): Promise<string> {
    const response = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: `Tu es un traducteur expert spécialisé dans les documents administratifs luxembourgeois. Traduis le texte suivant en ${targetLanguage} en conservant le sens exact et les termes techniques appropriés.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    return response.content;
  }

  // Traduction spécialisée pour entretiens sociaux
  async translateTextForInterview(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    const languageNames: Record<string, string> = {
      'fr': 'français',
      'en': 'anglais',
      'ar': 'arabe',
      'de': 'allemand',
      'es': 'espagnol',
      'it': 'italien',
      'pt': 'portugais',
      'ru': 'russe',
      'tr': 'turc',
      'nl': 'néerlandais',
      'pl': 'polonais',
      'ro': 'roumain',
      'fa': 'persan',
      'ur': 'ourdou'
    };

    const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const response = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: `Tu es un traducteur expert spécialisé dans les entretiens sociaux et administratifs. 

CONTEXTE: Tu traduis une conversation en temps réel entre un assistant social et un usager.

INSTRUCTIONS:
- Traduis fidèlement du ${sourceLangName} vers le ${targetLangName}
- Conserve le ton naturel et respectueux de la conversation
- Adapte les formules de politesse selon les normes culturelles
- Garde la même personne (je/vous/tu) que dans l'original
- Pour les termes administratifs, utilise les équivalents officiels
- Sois précis et naturel, comme dans une vraie conversation

IMPORTANT: Réponds UNIQUEMENT avec la traduction, sans commentaire ni explication.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.2, // Plus déterministe pour la cohérence
      max_tokens: 800
    });
    return response.content;
  }

  // Détection de langue
  async detectLanguage(text: string): Promise<string> {
    const response = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: "Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., 'en', 'fr', 'ar', 'lb'). Be precise and only return the code."
        },
        { role: "user", content: text }
      ],
      temperature: 0.1,
      max_tokens: 10
    });
    return response.content.toLowerCase();
  }

  // Analyse de document
  async analyzeDocument(text: string, documentType: string, targetLanguage: string): Promise<{
    summary: string;
    keyPoints: string[];
    context: any;
  }> {
    // Résumé
    const summaryResponse = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: `Create a comprehensive summary (3-4 sentences) of this ${documentType} document in ${targetLanguage}. Make it accessible and reassuring for someone who might be stressed or unfamiliar with administrative processes.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    // Points clés
    const keyPointsResponse = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: `Extract 5-8 key points from this ${documentType} document in ${targetLanguage}. Format each point as a separate line starting with "•". Focus on deadlines, required actions, contact information, and amounts.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    // Contexte
    const contextResponse = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: `Analyze this ${documentType} document and return a JSON object with: {"importance": "low|medium|high|urgent", "category": "housing|financial|legal|health|employment|education|immigration|administrative", "nextSteps": ["step1", "step2"]}`
        },
        { role: "user", content: text }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const keyPoints = keyPointsResponse.content
      .split('\n')
      .filter(line => line.trim().startsWith('•'))
      .map(point => point.replace('•', '').trim())
      .filter(point => point.length > 0);

    let context;
    try {
      context = JSON.parse(contextResponse.content);
    } catch {
      context = {
        importance: 'medium',
        category: 'administrative',
        nextSteps: ['Vérifier le contenu du document']
      };
    }

    return {
      summary: summaryResponse.content,
      keyPoints,
      context
    };
  }

  // OCR avec vision
  async extractTextFromImage(imageData: string, prompt?: string): Promise<string> {
    const response = await this.createCompletion({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || `Extrait tout le texte de cette image de document avec la plus haute précision possible. Retourne uniquement le texte extrait, sans commentaires ni explication.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
                detail: "high"
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });
    return response.content;
  }
}

// Export de l'instance singleton
export const aiService = AIService.getInstance(); 