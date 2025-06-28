import { supabase } from './supabase/client';
import { AIService } from './aiService';
import EmbeddingService from './embeddingService';

// ═══════════════════════════════════════════════════════════
// SERVICE BASE DE CONNAISSANCES VECTORIELLE
// ═══════════════════════════════════════════════════════════

interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  content: string;
  file_type: string;
  file_size?: number;
  language: string;
  category?: string;
  tags?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count?: number;
  embedding?: number[];
  metadata?: any;
  created_at: string;
}

interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  chunk_content: string;
  similarity: number;
  metadata?: any;
}

interface SearchOptions {
  threshold?: number;
  limit?: number;
  category?: string;
  language?: string;
}

export class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;
  private aiService: AIService;
  private embeddingService: EmbeddingService;
  private embeddingCache = new Map<string, number[]>();

  private constructor() {
    this.aiService = AIService.getInstance();
    this.embeddingService = EmbeddingService.getInstance();
  }

  static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService();
    }
    return KnowledgeBaseService.instance;
  }

  // ═══════════════════════════════════════════════════════════
  // GÉNÉRATION D'EMBEDDINGS AVEC AZURE OPENAI
  // ═══════════════════════════════════════════════════════════

  /**
   * Génère un embedding pour un texte
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.embeddingService.generateEmbedding(text);
    
    if ('error' in result) {
      console.warn('⚠️ Utilisation fallback embedding:', result.error);
      return result.fallback;
    }
    
    return result.embedding;
  }

  // ═══════════════════════════════════════════════════════════
  // GESTION DES DOCUMENTS
  // ═══════════════════════════════════════════════════════════

  /**
   * Ajoute un nouveau document à la base de connaissances
   */
  async addDocument(
    title: string,
    filename: string,
    content: string,
    fileType: string,
    options: {
      category?: string;
      tags?: string[];
      language?: string;
      metadata?: any;
    } = {}
  ): Promise<string> {
    try {
      // Détecter la langue si non spécifiée
      const language = options.language || await this.detectLanguage(content);
      
      // Insérer le document
      const { data: document, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          title,
          filename,
          content,
          file_type: fileType,
          file_size: content.length,
          language,
          category: options.category,
          tags: options.tags || [],
          metadata: options.metadata || {}
        })
        .select()
        .single();

      if (docError) throw docError;

      // Découper en chunks et vectoriser
      await this.processDocumentChunks(document.id, content);

      console.log(`✅ Document "${title}" ajouté avec succès`);
      return document.id;

    } catch (error) {
      console.error('Erreur ajout document:', error);
      throw new Error(`Impossible d'ajouter le document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Découpe un document en chunks et génère les embeddings
   */
  private async processDocumentChunks(documentId: string, content: string): Promise<void> {
    const chunks = this.splitIntoChunks(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Générer embedding
        const embedding = await this.generateEmbedding(chunk);
        
        // Estimer le nombre de tokens (approximation)
        const tokenCount = Math.ceil(chunk.split(/\s+/).length * 1.3);
        
        // Insérer le chunk
        const { error } = await supabase
          .from('knowledge_chunks')
          .insert({
            document_id: documentId,
            chunk_index: i,
            content: chunk,
            token_count: tokenCount,
            embedding: `[${embedding.join(',')}]`, // Format PostgreSQL array
            metadata: {
              chunk_length: chunk.length,
              word_count: chunk.split(/\s+/).length
            }
          });

        if (error) throw error;
        
        console.log(`✅ Chunk ${i + 1}/${chunks.length} traité`);
        
        // Petit délai pour éviter la surcharge
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Erreur chunk ${i}:`, error);
        // Continuer avec les autres chunks même si un échoue
      }
    }
  }

  /**
   * Découpe intelligent du contenu en chunks
   */
  private splitIntoChunks(content: string, maxChunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split(/\n\s*\n/);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const cleanParagraph = paragraph.trim();
      
      if (!cleanParagraph) continue;
      
      // Si le paragraphe seul dépasse la taille max, le découper
      if (cleanParagraph.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // Découper par phrases
        const sentences = cleanParagraph.split(/[.!?]+/);
        let sentenceChunk = '';
        
        for (const sentence of sentences) {
          if ((sentenceChunk + sentence).length > maxChunkSize) {
            if (sentenceChunk) {
              chunks.push(sentenceChunk.trim());
              sentenceChunk = sentence + '.';
            } else {
              // Phrase trop longue, découper arbitrairement
              chunks.push(sentence.substring(0, maxChunkSize));
            }
          } else {
            sentenceChunk += sentence + '.';
          }
        }
        
        if (sentenceChunk) {
          currentChunk = sentenceChunk;
        }
      } else {
        // Vérifier si ajouter ce paragraphe dépasse la limite
        if ((currentChunk + '\n\n' + cleanParagraph).length > maxChunkSize) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = cleanParagraph;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + cleanParagraph;
        }
      }
    }
    
    // Ajouter le dernier chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 50); // Ignorer les chunks trop courts
  }

  /**
   * Détecte la langue d'un texte
   */
  private async detectLanguage(text: string): Promise<string> {
    try {
      const sample = text.substring(0, 1000); // Échantillon pour la détection
      return await this.aiService.detectLanguage(sample);
    } catch (error) {
      console.warn('Impossible de détecter la langue, français par défaut');
      return 'fr';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RECHERCHE SÉMANTIQUE
  // ═══════════════════════════════════════════════════════════

  /**
   * Recherche sémantique dans la base de connaissances
   */
  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Générer embedding pour la requête
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Recherche vectorielle
      const { data: results, error } = await supabase
        .rpc('search_knowledge', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: options.threshold || 0.78,
          match_count: options.limit || 10,
          filter_category: options.category || null,
          filter_language: options.language || 'fr'
        });

      if (error) throw error;

      // Enregistrer la recherche pour analytics
      const executionTime = Date.now() - startTime;
      this.logSearch(query, queryEmbedding, results?.length || 0, executionTime);

      return results || [];

    } catch (error) {
      console.error('Erreur recherche:', error);
      throw new Error(`Erreur lors de la recherche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Recherche enrichie avec contexte
   */
  async searchWithContext(query: string, options: SearchOptions = {}): Promise<{
    results: SearchResult[];
    summary: string;
    suggestions: string[];
  }> {
    const results = await this.search(query, options);
    
    if (results.length === 0) {
      return {
        results: [],
        summary: "Aucun résultat trouvé pour votre recherche.",
        suggestions: ["Essayez des mots-clés différents", "Vérifiez l'orthographe", "Utilisez des termes plus généraux"]
      };
    }

    // Générer un résumé des résultats
    const topResults = results.slice(0, 3);
    const context = topResults.map(r => r.chunk_content).join('\n\n');
    
    try {
      const summary = await this.aiService.processChat(
        `Résume les informations suivantes en réponse à la question: "${query}"\n\nInformations:\n${context}`,
        "Tu es un assistant spécialisé dans l'aide sociale au Luxembourg. Fournis un résumé clair et actionnable.",
        []
      );

      return {
        results,
        summary,
        suggestions: this.generateSuggestions(query, results)
      };
    } catch (error) {
      return {
        results,
        summary: "Informations trouvées dans la base de connaissances.",
        suggestions: []
      };
    }
  }

  /**
   * Génère des suggestions de recherche
   */
  private generateSuggestions(query: string, results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    // Suggestions basées sur les catégories trouvées
    const categories = [...new Set(results.map(r => r.metadata?.category).filter(Boolean))];
    categories.forEach(cat => {
      if (cat !== query.toLowerCase()) {
        suggestions.push(`Rechercher dans ${cat}`);
      }
    });
    
    // Suggestions basées sur les mots-clés
    const keywords = query.split(/\s+/).filter(word => word.length > 3);
    keywords.forEach(keyword => {
      suggestions.push(`Plus d'infos sur ${keyword}`);
    });
    
    return suggestions.slice(0, 3);
  }

  /**
   * Enregistre une recherche pour analytics
   */
  private async logSearch(
    query: string, 
    queryEmbedding: number[], 
    resultsCount: number, 
    executionTime: number
  ): Promise<void> {
    try {
      await supabase
        .from('knowledge_searches')
        .insert({
          query,
          query_embedding: `[${queryEmbedding.join(',')}]`,
          results_count: resultsCount,
          execution_time_ms: executionTime,
          user_session: this.generateSessionId()
        });
    } catch (error) {
      // Ne pas faire échouer la recherche si le logging échoue
      console.warn('Impossible d\'enregistrer la recherche:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ═══════════════════════════════════════════════════════════
  // GESTION DES DOCUMENTS
  // ═══════════════════════════════════════════════════════════

  /**
   * Liste tous les documents
   */
  async listDocuments(): Promise<KnowledgeDocument[]> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Supprime un document et ses chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  }

  /**
   * Met à jour un document
   */
  async updateDocument(
    documentId: string, 
    updates: Partial<KnowledgeDocument>
  ): Promise<void> {
    const { error } = await supabase
      .from('knowledge_documents')
      .update(updates)
      .eq('id', documentId);

    if (error) throw error;
  }

  /**
   * Statistiques de la base de connaissances
   */
  async getStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    categories: string[];
    languages: string[];
    lastUpdate: string;
  }> {
    const { data: documents } = await supabase
      .from('knowledge_documents')
      .select('category, language, updated_at');

    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('id');

    const categories = [...new Set((documents || []).map((d: any) => d.category).filter(Boolean))] as string[];
    const languages = [...new Set((documents || []).map((d: any) => d.language).filter(Boolean))] as string[];
    const lastUpdate = (documents || []).reduce((latest: string, doc: any) => 
      doc.updated_at > latest ? doc.updated_at : latest, 
      documents?.[0]?.updated_at || ''
    );

    return {
      totalDocuments: documents?.length || 0,
      totalChunks: chunks?.length || 0,
      categories,
      languages,
      lastUpdate
    };
  }
} 