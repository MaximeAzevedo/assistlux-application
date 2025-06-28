// ═══════════════════════════════════════════════════════════
// SERVICE D'EMBEDDINGS - Azure OpenAI
// Génération de vecteurs sémantiques pour la recherche
// ═══════════════════════════════════════════════════════════

import { azureOpenAIClient } from './openaiConfig';

// Configuration pour les embeddings
const EMBEDDING_MODEL = 'text-embedding-ada-002'; // Ou text-embedding-3-small si disponible
const EMBEDDING_DIMENSIONS = 1536; // Dimensions standard pour ada-002

interface EmbeddingResponse {
  embedding: number[];
  tokens: number;
}

interface EmbeddingError {
  error: string;
  fallback: number[];
}

class EmbeddingService {
  private static instance: EmbeddingService;
  private cache = new Map<string, number[]>();
  private readonly isDev = import.meta.env.DEV;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Génère un embedding pour un texte donné
   */
  async generateEmbedding(text: string): Promise<EmbeddingResponse | EmbeddingError> {
    try {
      // Nettoyer et valider le texte
      const cleanText = this.cleanText(text);
      if (!cleanText) {
        return this.getFallbackEmbedding('Texte vide');
      }

      // Vérifier le cache
      const cacheKey = this.getCacheKey(cleanText);
      if (this.cache.has(cacheKey)) {
        return {
          embedding: this.cache.get(cacheKey)!,
          tokens: Math.ceil(cleanText.length / 4) // Estimation
        };
      }

      this.log('🧮 Génération embedding pour:', cleanText.substring(0, 50) + '...');

      // Appel Azure OpenAI
      const response = await azureOpenAIClient.embeddings.create({
        model: EMBEDDING_MODEL,
        input: cleanText,
        encoding_format: 'float'
      });

      if (!response.data?.[0]?.embedding) {
        throw new Error('Réponse embedding invalide');
      }

      const embedding = response.data[0].embedding;
      const tokens = response.usage?.total_tokens || Math.ceil(cleanText.length / 4);

      // Valider les dimensions
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        this.log(`⚠️ Dimensions incorrectes: ${embedding.length} au lieu de ${EMBEDDING_DIMENSIONS}`);
      }

      // Mettre en cache
      this.cache.set(cacheKey, embedding);
      
      this.log(`✅ Embedding généré: ${embedding.length} dimensions, ${tokens} tokens`);

      return {
        embedding,
        tokens
      };

    } catch (error) {
      console.error('❌ Erreur génération embedding:', error);
      return this.getFallbackEmbedding(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }

  /**
   * Génère des embeddings pour plusieurs textes en lot
   */
  async generateBatchEmbeddings(texts: string[]): Promise<Array<EmbeddingResponse | EmbeddingError>> {
    this.log(`🔄 Génération de ${texts.length} embeddings en lot`);
    
    // Traiter par petits lots pour éviter les timeouts
    const batchSize = 10;
    const results: Array<EmbeddingResponse | EmbeddingError> = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Petite pause entre les lots
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Calcule la similarité cosinus entre deux embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Les embeddings doivent avoir la même dimension');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Nettoie le texte avant génération d'embedding
   */
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .replace(/[^\w\s\-\.,'!?éèêëàâäôöûüçîï]/g, '') // Garder caractères essentiels
      .slice(0, 8000); // Limite Azure OpenAI
  }

  /**
   * Génère une clé de cache pour le texte
   */
  private getCacheKey(text: string): string {
    // Hash simple pour le cache
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Génère un embedding de fallback en cas d'erreur
   */
  private getFallbackEmbedding(errorMessage: string): EmbeddingError {
    this.log(`⚠️ Utilisation fallback embedding: ${errorMessage}`);
    
    // Générer un embedding déterministe basé sur le hash du texte
    const fallback = new Array(EMBEDDING_DIMENSIONS).fill(0);
    let hash = 0;
    
    for (let i = 0; i < errorMessage.length; i++) {
      const char = errorMessage.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Remplir le vecteur de façon déterministe
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      const seedValue = hash + i * 12345;
      fallback[i] = (Math.sin(seedValue) * 10000) % 1;
    }
    
    // Normaliser
    const magnitude = Math.sqrt(fallback.reduce((sum, val) => sum + val * val, 0));
    const normalized = fallback.map(val => val / magnitude);
    
    return {
      error: errorMessage,
      fallback: normalized
    };
  }

  /**
   * Logging conditionnel
   */
  private log(...args: any[]) {
    if (this.isDev) {
      console.log('[EmbeddingService]', ...args);
    }
  }

  /**
   * Statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS
    };
  }

  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.clear();
    this.log('🗑️ Cache embeddings vidé');
  }
}

export default EmbeddingService; 