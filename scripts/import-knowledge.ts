#!/usr/bin/env tsx

// ═══════════════════════════════════════════════════════════
// SCRIPT D'IMPORT BASE DE CONNAISSANCES - AssistLux
// Usage: npm run import-knowledge
// ═══════════════════════════════════════════════════════════

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
// Utiliser le client Supabase pour scripts
import './supabase-client';
import { KnowledgeBaseService } from '../src/lib/knowledgeBase';
import { DocumentProcessor } from '../src/lib/documentProcessor';

const KNOWLEDGE_DIR = 'docs/knowledge-base';
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md'];

interface ImportStats {
  totalFiles: number;
  processedFiles: number;
  errors: string[];
  startTime: number;
}

class KnowledgeImporter {
  private knowledgeBase: KnowledgeBaseService;
  private documentProcessor: DocumentProcessor;
  private stats: ImportStats;

  constructor() {
    this.knowledgeBase = KnowledgeBaseService.getInstance();
    this.documentProcessor = DocumentProcessor.getInstance();
    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      errors: [],
      startTime: Date.now()
    };
  }

  /**
   * Lance l'import complet du dossier knowledge-base
   */
  async importAll(): Promise<void> {
    console.log('🚀 Démarrage de l\'import de la base de connaissances...\n');
    
    try {
      // Vérifier que le dossier existe
      await this.verifyDirectory();
      
      // Scanner les fichiers
      const files = await this.scanFiles();
      this.stats.totalFiles = files.length;
      
      if (files.length === 0) {
        console.log('📁 Aucun fichier trouvé dans docs/knowledge-base/');
        console.log('💡 Ajoutez vos documents (.pdf, .docx, .txt, .md) dans ce dossier');
        return;
      }
      
      console.log(`📄 ${files.length} fichier(s) trouvé(s) à traiter\n`);
      
      // Traiter chaque fichier
      for (let i = 0; i < files.length; i++) {
        await this.processFile(files[i], i + 1, files.length);
        
        // Petit délai entre les fichiers pour éviter la surcharge
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Afficher le résumé
      await this.displaySummary();
      
    } catch (error) {
      console.error('❌ Erreur durant l\'import:', error);
      process.exit(1);
    }
  }

  /**
   * Vérifie que le dossier knowledge-base existe
   */
  private async verifyDirectory(): Promise<void> {
    try {
      const dirStat = await stat(KNOWLEDGE_DIR);
      if (!dirStat.isDirectory()) {
        throw new Error(`${KNOWLEDGE_DIR} n'est pas un dossier`);
      }
    } catch (error) {
      throw new Error(`Dossier ${KNOWLEDGE_DIR} introuvable. Créez-le et ajoutez vos documents.`);
    }
  }

  /**
   * Scanne récursivement le dossier pour trouver tous les fichiers supportés
   */
  private async scanFiles(dir: string = KNOWLEDGE_DIR): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await readdir(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const itemStat = await stat(fullPath);
        
        if (itemStat.isDirectory()) {
          // Récursion dans les sous-dossiers
          const subFiles = await this.scanFiles(fullPath);
          files.push(...subFiles);
        } else if (itemStat.isFile()) {
          const ext = extname(item).toLowerCase();
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Impossible de lire le dossier ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Traite un fichier individuel
   */
  private async processFile(filePath: string, current: number, total: number): Promise<void> {
    const filename = basename(filePath);
    console.log(`📄 [${current}/${total}] Traitement: ${filename}`);
    
    try {
      // Lire le fichier
      const fileContent = await readFile(filePath);
      const fileStats = await stat(filePath);
      
      // Créer l'objet DocumentFile
      const documentFile = {
        name: filename,
        content: fileContent,
        type: this.getMimeType(filePath),
        size: fileStats.size
      };
      
      // Valider le fichier
      const validation = this.documentProcessor.validateFile(filename, fileStats.size);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Traiter le document
      console.log(`   🔄 Extraction du contenu...`);
      const processed = await this.documentProcessor.processDocument(documentFile);
      
      if (!processed.content || processed.content.length < 100) {
        throw new Error('Contenu extrait trop court (< 100 caractères)');
      }
      
      // Déterminer la catégorie depuis le chemin
      const category = this.extractCategory(filePath);
      
      // Ajouter à la base de connaissances
      console.log(`   💾 Vectorisation et stockage...`);
      const documentId = await this.knowledgeBase.addDocument(
        processed.title,
        filename,
        processed.content,
        processed.metadata.fileType,
        {
          category,
          language: 'fr', // Par défaut français
          metadata: {
            ...processed.metadata,
            importDate: new Date().toISOString(),
            filePath: filePath.replace(KNOWLEDGE_DIR + '/', '')
          }
        }
      );
      
      console.log(`   ✅ Document ajouté (ID: ${documentId.substring(0, 8)}...)`);
      console.log(`   📊 ${processed.metadata.wordCount} mots, ${processed.metadata.fileSize} octets\n`);
      
      this.stats.processedFiles++;
      
    } catch (error) {
      const errorMsg = `Erreur avec ${filename}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
      console.log(`   ❌ ${errorMsg}\n`);
      this.stats.errors.push(errorMsg);
    }
  }

  /**
   * Extrait la catégorie depuis le chemin du fichier
   */
  private extractCategory(filePath: string): string {
    const relativePath = filePath.replace(KNOWLEDGE_DIR + '/', '');
    const pathParts = relativePath.split('/');
    
    // Si le fichier est dans un sous-dossier, utiliser le nom du dossier comme catégorie
    if (pathParts.length > 1) {
      return pathParts[0];
    }
    
    // Sinon, essayer de deviner depuis le nom de fichier
    const filename = pathParts[0].toLowerCase();
    
    if (filename.includes('faq')) return 'faq';
    if (filename.includes('procedure')) return 'procedures';
    if (filename.includes('guide')) return 'guides';
    if (filename.includes('regulation') || filename.includes('loi')) return 'regulations';
    if (filename.includes('aide') || filename.includes('allocation')) return 'procedures';
    
    return 'general';
  }

  /**
   * Détermine le type MIME depuis l'extension
   */
  private getMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.pdf': return 'application/pdf';
      case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.doc': return 'application/msword';
      case '.txt': return 'text/plain';
      case '.md': return 'text/markdown';
      default: return 'application/octet-stream';
    }
  }

  /**
   * Affiche le résumé de l'import
   */
  private async displaySummary(): Promise<void> {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000);
    
    console.log('═'.repeat(60));
    console.log('📊 RÉSUMÉ DE L\'IMPORT');
    console.log('═'.repeat(60));
    console.log(`✅ Fichiers traités: ${this.stats.processedFiles}/${this.stats.totalFiles}`);
    console.log(`⏱️  Durée: ${duration}s`);
    
    if (this.stats.errors.length > 0) {
      console.log(`❌ Erreurs: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    
    if (this.stats.processedFiles > 0) {
      console.log('\n🎉 Import terminé avec succès !');
      
      // Afficher les statistiques de la base
      try {
        const dbStats = await this.knowledgeBase.getStats();
        console.log('\n📈 STATISTIQUES BASE DE CONNAISSANCES:');
        console.log(`   • Documents: ${dbStats.totalDocuments}`);
        console.log(`   • Chunks vectorisés: ${dbStats.totalChunks}`);
        console.log(`   • Catégories: ${dbStats.categories.join(', ')}`);
        console.log(`   • Langues: ${dbStats.languages.join(', ')}`);
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer les statistiques');
      }
      
      console.log('\n💡 Votre chatbot peut maintenant utiliser ces documents !');
      console.log('   Testez une recherche avec: "Comment demander une allocation familiale ?"');
    } else {
      console.log('\n⚠️  Aucun document n\'a pu être traité.');
      console.log('   Vérifiez le format et le contenu de vos fichiers.');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// EXÉCUTION DU SCRIPT
// ═══════════════════════════════════════════════════════════

async function main() {
  const importer = new KnowledgeImporter();
  await importer.importAll();
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

export { KnowledgeImporter }; 