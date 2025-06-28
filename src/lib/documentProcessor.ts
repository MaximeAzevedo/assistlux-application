// ═══════════════════════════════════════════════════════════
// PROCESSEUR DE DOCUMENTS - AssistLux
// Support: PDF, Word (.docx), Texte (.txt, .md)
// ═══════════════════════════════════════════════════════════

interface ProcessedDocument {
  title: string;
  content: string;
  metadata: {
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount: number;
    language?: string;
  };
}

interface DocumentFile {
  name: string;
  content: string | ArrayBuffer;
  type: string;
  size: number;
}

export class DocumentProcessor {
  private static instance: DocumentProcessor;

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  /**
   * Traite un document selon son type
   */
  async processDocument(file: DocumentFile): Promise<ProcessedDocument> {
    const fileType = this.getFileType(file.name, file.type);
    
    try {
      let content: string;
      let metadata: any = {
        fileType,
        fileSize: file.size,
        wordCount: 0
      };

      switch (fileType) {
        case 'pdf':
          content = await this.processPDF(file);
          break;
        case 'docx':
          content = await this.processWord(file);
          break;
        case 'txt':
        case 'md':
          content = await this.processText(file);
          break;
        default:
          throw new Error(`Format de fichier non supporté: ${fileType}`);
      }

      // Nettoyer et analyser le contenu
      content = this.cleanContent(content);
      metadata.wordCount = this.countWords(content);

      // Générer un titre depuis le nom de fichier
      const title = this.generateTitle(file.name, content);

      return {
        title,
        content,
        metadata
      };

    } catch (error) {
      console.error('Erreur traitement document:', error);
      throw new Error(`Impossible de traiter le document: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite multiple documents en lot
   */
  async processBatch(files: DocumentFile[]): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`📄 Traitement ${i + 1}/${files.length}: ${file.name}`);
        const processed = await this.processDocument(file);
        results.push(processed);
        
        // Petit délai entre les fichiers
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (error) {
        console.error(`❌ Erreur avec ${file.name}:`, error);
        // Continuer avec les autres fichiers
      }
    }
    
    return results;
  }

  // ═══════════════════════════════════════════════════════════
  // TRAITEMENT PAR TYPE DE FICHIER
  // ═══════════════════════════════════════════════════════════

  /**
   * Traite un fichier PDF
   */
  private async processPDF(file: DocumentFile): Promise<string> {
    throw new Error('Extraction PDF non implémentée. Utilisez un fichier texte (.txt) ou copiez le contenu ici.');
  }

  /**
   * Traite un fichier Word (.docx)
   */
  private async processWord(file: DocumentFile): Promise<string> {
    try {
      // Pour l'instant, on simule l'extraction Word
      // Dans une implémentation complète, utiliser mammoth.js
      if (typeof file.content === 'string') {
        return file.content;
      }
      
      // Si c'est un ArrayBuffer, on ne peut pas facilement extraire le texte côté client
      throw new Error('Extraction Word non implémentée côté client. Utilisez un service backend.');
      
    } catch (error) {
      throw new Error(`Erreur lecture Word: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite un fichier texte
   */
  private async processText(file: DocumentFile): Promise<string> {
    try {
      if (typeof file.content === 'string') {
        return file.content;
      }
      
      // Convertir ArrayBuffer en string
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(file.content as ArrayBuffer);
      
    } catch (error) {
      throw new Error(`Erreur lecture texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════

  /**
   * Détermine le type de fichier
   */
  private getFileType(filename: string, mimeType: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'docx':
      case 'doc':
        return 'docx';
      case 'txt':
        return 'txt';
      case 'md':
      case 'markdown':
        return 'md';
      default:
        // Fallback sur le MIME type
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('word') || mimeType.includes('msword')) return 'docx';
        if (mimeType.includes('text')) return 'txt';
        
        throw new Error(`Extension non reconnue: ${extension}`);
    }
  }

  /**
   * Nettoie le contenu extrait
   */
  private cleanContent(content: string): string {
    return content
      // Supprimer les caractères de contrôle
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normaliser les espaces
      .replace(/[ \t]+/g, ' ')
      // Normaliser les sauts de ligne
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Supprimer les lignes vides multiples
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Compte les mots dans le contenu
   */
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Génère un titre depuis le nom de fichier ou le contenu
   */
  private generateTitle(filename: string, content: string): string {
    // Nettoyer le nom de fichier
    let title = filename
      .replace(/\.[^/.]+$/, '') // Supprimer l'extension
      .replace(/[-_]/g, ' ') // Remplacer tirets et underscores par espaces
      .replace(/\b\w/g, char => char.toUpperCase()); // Capitaliser
    
    // Si le titre semble peu informatif, essayer d'extraire du contenu
    if (title.length < 5 || /^(document|file|text)/i.test(title)) {
      const firstLine = content.split('\n')[0];
      if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
        title = firstLine.trim();
      }
    }
    
    // Limiter la longueur
    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }
    
    return title || 'Document sans titre';
  }

  /**
   * Valide qu'un fichier peut être traité
   */
  validateFile(filename: string, size: number, maxSize: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    // Vérifier l'extension
    const extension = filename.split('.').pop()?.toLowerCase();
    const supportedExtensions = ['pdf', 'docx', 'doc', 'txt', 'md'];
    
    if (!extension || !supportedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Format non supporté: ${extension}. Formats acceptés: ${supportedExtensions.join(', ')}`
      };
    }
    
    // Vérifier la taille
    if (size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `Fichier trop volumineux: ${Math.round(size / (1024 * 1024))}MB. Maximum: ${maxSizeMB}MB`
      };
    }
    
    return { valid: true };
  }

  /**
   * Crée un DocumentFile depuis un File browser
   */
  static async createFromFile(file: File): Promise<DocumentFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve({
          name: file.name,
          content: reader.result as ArrayBuffer,
          type: file.type,
          size: file.size
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lecture fichier'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Crée un DocumentFile depuis du texte
   */
  static createFromText(filename: string, content: string): DocumentFile {
    return {
      name: filename,
      content: content,
      type: 'text/plain',
      size: content.length
    };
  }

  /**
   * Lit tous les fichiers d'un dossier (pour Node.js/scripts)
   */
  static async readDirectoryFiles(directoryPath: string): Promise<DocumentFile[]> {
    // Cette fonction serait implémentée côté Node.js
    // Pour l'instant, on retourne un tableau vide
    console.warn('readDirectoryFiles nécessite un environnement Node.js');
    return [];
  }
} 