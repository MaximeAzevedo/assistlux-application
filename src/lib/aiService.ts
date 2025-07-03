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
      'ur': 'ourdou',
      'pt-br': 'portugais brésilien',
      'es-mx': 'espagnol mexicain',
      'sv': 'suédois',
      'no': 'norvégien',
      'da': 'danois',
      'he': 'hébreu',
      'zh': 'chinois mandarin',
      'ja': 'japonais',
      'ko': 'coréen',
      'hi': 'hindi',
      'th': 'thaï',
      'vi': 'vietnamien',
      'lb': 'luxembourgeois'
    };

    const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    // 🆕 AMÉLIORATION : Prompts spécialisés par famille de langues
    const getOptimizedPrompt = (sourceLang: string, targetLang: string): string => {
      // Langues à script arabe/persan (RTL)
      if (['ar', 'fa', 'ur', 'he'].includes(sourceLang) || ['ar', 'fa', 'ur', 'he'].includes(targetLang)) {
        return `Tu es un expert en traduction spécialisé dans les langues sémitiques et persanes pour les services sociaux.

CONTEXTE: Traduction d'entretien social entre assistant et usager.
LANGUES: ${sourceLangName} → ${targetLangName}

SPÉCIFICITÉS CULTURELLES:
- Respecte les formules de politesse traditionnelles
- Adapte le registre formel/informel selon la culture
- Préserve le respect hiérarchique dans les salutations
- Pour l'arabe : utilise l'arabe standard moderne (pas dialectal)
- Pour le persan/ourdou : privilégie les formes respectueuses

IMPORTANT: Réponds UNIQUEMENT avec la traduction naturelle et respectueuse.`;
      }

      // Langues asiatiques (idéographiques)
      if (['zh', 'ja', 'ko'].includes(sourceLang) || ['zh', 'ja', 'ko'].includes(targetLang)) {
        return `Tu es un expert en traduction spécialisé dans les langues d'Asie de l'Est pour les services sociaux.

CONTEXTE: Traduction d'entretien social entre assistant et usager.
LANGUES: ${sourceLangName} → ${targetLangName}

SPÉCIFICITÉS CULTURELLES:
- Respecte les niveaux de politesse (keigo en japonais, honorifiques en coréen)
- Adapte les formes de respect selon l'âge et le statut
- Pour le chinois : utilise le mandarin simplifié standard
- Pour le japonais : niveau poli mais accessible (masu/desu)
- Pour le coréen : forme 존댓말 (jondaetmal) respectueuse

IMPORTANT: Réponds UNIQUEMENT avec la traduction culturellement appropriée.`;
      }

      // Langues slaves/cyrilliques
      if (['ru', 'pl', 'ro'].includes(sourceLang) || ['ru', 'pl', 'ro'].includes(targetLang)) {
        return `Tu es un expert en traduction spécialisé dans les langues d'Europe de l'Est pour les services sociaux.

CONTEXTE: Traduction d'entretien social entre assistant et usager.
LANGUES: ${sourceLangName} → ${targetLangName}

SPÉCIFICITÉS LINGUISTIQUES:
- Respecte les déclinaisons et aspects verbaux
- Adapte les formules de politesse slaves
- Privilégie la forme polie "vous" (вы en russe, Pan/Pani en polonais)
- Utilise un vocabulaire administratif précis et accessible

IMPORTANT: Réponds UNIQUEMENT avec la traduction grammaticalement correcte.`;
      }

      // Langues germaniques/nordiques
      if (['de', 'nl', 'sv', 'no', 'da'].includes(sourceLang) || ['de', 'nl', 'sv', 'no', 'da'].includes(targetLang)) {
        return `Tu es un expert en traduction spécialisé dans les langues germaniques pour les services sociaux.

CONTEXTE: Traduction d'entretien social entre assistant et usager.
LANGUES: ${sourceLangName} → ${targetLangName}

SPÉCIFICITÉS LINGUISTIQUES:
- Respecte la structure syntaxique spécifique (V2 en allemand, etc.)
- Utilise la forme polie "Sie/U/De" appropriée
- Privilégie la clarté administrative typique de ces cultures
- Adapte les termes techniques selon les systèmes sociaux locaux

IMPORTANT: Réponds UNIQUEMENT avec la traduction précise et formelle.`;
      }

      // Prompt général pour les autres langues (français, anglais, langues romanes)
      return `Tu es un traducteur expert spécialisé dans les entretiens sociaux et administratifs. 

CONTEXTE: Tu traduis une conversation en temps réel entre un assistant social et un usager.

INSTRUCTIONS:
- Traduis fidèlement du ${sourceLangName} vers le ${targetLangName}
- Conserve le ton naturel et respectueux de la conversation
- Adapte les formules de politesse selon les normes culturelles
- Garde la même personne (je/vous/tu) que dans l'original
- Pour les termes administratifs, utilise les équivalents officiels
- Sois précis et naturel, comme dans une vraie conversation

IMPORTANT: Réponds UNIQUEMENT avec la traduction, sans commentaire ni explication.`;
    };

    // 🆕 Température adaptative selon la complexité linguistique
    const getOptimizedTemperature = (sourceLang: string, targetLang: string): number => {
      // Langues complexes nécessitent plus de créativité
      if (['ar', 'fa', 'ur', 'zh', 'ja', 'ko', 'he', 'th', 'vi'].includes(sourceLang) || 
          ['ar', 'fa', 'ur', 'zh', 'ja', 'ko', 'he', 'th', 'vi'].includes(targetLang)) {
        return 0.3; // Un peu plus de flexibilité
      }
      
      // Langues européennes : déterminisme élevé
      return 0.2;
    };

    const optimizedPrompt = getOptimizedPrompt(sourceLanguage, targetLanguage);
    const optimizedTemperature = getOptimizedTemperature(sourceLanguage, targetLanguage);

    const response = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: optimizedPrompt
        },
        { role: "user", content: text }
      ],
      temperature: optimizedTemperature,
      max_tokens: 800
    });
    return response.content;
  }

  // Détection de langue
  async detectLanguage(text: string): Promise<string> {
    // 🆕 AMÉLIORATION : Prompt de détection multilingue enrichi
    const response = await this.createCompletion({
      messages: [
        {
          role: "system",
          content: `Tu es un expert linguiste spécialisé dans la détection de langues pour les services sociaux. 

TÂCHE: Détecter la langue du texte suivant avec une précision maximale.

LANGUES SUPPORTÉES ET LEURS CODES:
- Français: fr
- Anglais: en  
- Arabe: ar (standard moderne)
- Allemand: de
- Espagnol: es
- Italien: it
- Portugais: pt
- Russe: ru
- Turc: tr
- Néerlandais: nl
- Polonais: pl
- Roumain: ro
- Persan/Farsi: fa
- Ourdou: ur
- Chinois: zh
- Japonais: ja
- Coréen: ko
- Hindi: hi
- Thaï: th
- Vietnamien: vi
- Hébreu: he
- Luxembourgeois: lb

SPÉCIFICITÉS IMPORTANTES:
- Pour l'arabe: identifier l'arabe standard moderne (pas les dialectes)
- Pour le chinois: privilégier "zh" (mandarin simplifié)
- Pour les langues à scripts spéciaux: se baser sur les caractères Unicode
- Pour les langues européennes: analyser la morphologie et la syntaxe
- Contexte: phrases typiques d'entretiens sociaux/administratifs

INSTRUCTIONS:
1. Analyse le script d'écriture (latin, arabe, cyrillique, etc.)
2. Identifie les mots-clés et la structure grammaticale
3. Prends en compte le contexte social/administratif
4. Réponds UNIQUEMENT avec le code ISO 639-1 à deux lettres
5. Si incertain entre plusieurs langues proches, privilégie la plus commune

IMPORTANT: Réponds SEULEMENT le code de langue à 2 lettres, rien d'autre.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.1, // Très déterministe pour la détection
      max_tokens: 10
    });
    return response.content.toLowerCase().trim();
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