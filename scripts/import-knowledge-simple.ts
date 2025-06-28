#!/usr/bin/env tsx

// ═══════════════════════════════════════════════════════════
// SCRIPT D'IMPORT SIMPLIFIÉ - Base de connaissances
// Usage: npx tsx scripts/import-knowledge-simple.ts
// ═══════════════════════════════════════════════════════════

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { DocumentProcessor } from '../src/lib/documentProcessor';

const KNOWLEDGE_DIR = 'docs/knowledge-base';
const PROJECT_ID = 'smfvnuvtbxtoocnqmabg'; // ID AssistLux

// Fonction pour générer des embeddings temporaires (déterministes)
function generateMockEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);
  let hash = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Générer un embedding basé sur le hash du texte
  for (let i = 0; i < 1536; i++) {
    const seedValue = hash + i * 12345;
    embedding[i] = (Math.sin(seedValue) * 10000) % 1;
  }
  
  // Normaliser le vecteur
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

// Fonction pour découper le texte en chunks
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = start + chunkSize;
    let chunk = text.slice(start, end);
    
    // Si ce n'est pas le dernier chunk, essayer de couper à la fin d'une phrase
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const cutPoint = Math.max(lastPeriod, lastNewline);
      
      if (cutPoint > start + 500) { // Assurer un minimum de contenu
        chunk = text.slice(start, start + cutPoint + 1);
        start = start + cutPoint + 1 - overlap;
      } else {
        start = end - overlap;
      }
    } else {
      start = text.length;
    }
    
    chunks.push(chunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 50);
}

async function importKnowledgeSimple() {
  console.log('🚀 Import simplifié base de connaissances AssistLux\n');
  
  try {
    // Scanner les fichiers texte
    const files = await readdir(KNOWLEDGE_DIR);
    const textFiles = files.filter(f => f.endsWith('.txt') && f !== 'README.md');
    
    if (textFiles.length === 0) {
      console.log('❌ Aucun fichier .txt trouvé');
      return;
    }
    
    console.log(`📄 ${textFiles.length} fichier(s) à traiter:\n`);
    
    const processor = DocumentProcessor.getInstance();
    const importedDocuments: any[] = [];
    
    for (const filename of textFiles) {
      const filePath = join(KNOWLEDGE_DIR, filename);
      console.log(`📄 Traitement: ${filename}`);
      
      // Lire et traiter le fichier
      const fileContent = await readFile(filePath, 'utf-8');
      const fileStats = await stat(filePath);
      
      const documentFile = {
        name: filename,
        content: fileContent,
        type: 'text/plain',
        size: fileStats.size
      };
      
      const processed = await processor.processDocument(documentFile);
      console.log(`   ✅ Traité: ${processed.metadata.wordCount} mots`);
      
      // Découper en chunks
      const chunks = chunkText(processed.content, 1000, 200);
      console.log(`   ✂️ ${chunks.length} chunks créés`);
      
      // Préparer les données pour l'insert
      const documentData = {
        title: processed.title,
        filename: filename,
        content: processed.content,
        file_type: 'txt',
        category: 'aide-alimentaire',
        language: 'fr',
        metadata: {
          wordCount: processed.metadata.wordCount,
          fileSize: processed.metadata.fileSize,
          chunkCount: chunks.length,
          importDate: new Date().toISOString()
        }
      };
      
      importedDocuments.push({
        ...documentData,
        chunks: chunks.map((chunk, index) => ({
          chunk_index: index,
          content: chunk,
          embedding: generateMockEmbedding(chunk)
        }))
      });
      
      console.log(`   📦 Document préparé pour l'import\n`);
    }
    
    console.log('═'.repeat(60));
    console.log('📊 RÉSUMÉ:');
    console.log(`✅ Documents traités: ${importedDocuments.length}`);
    console.log(`📦 Total chunks: ${importedDocuments.reduce((sum, doc) => sum + doc.chunks.length, 0)}`);
    console.log(`📝 Total mots: ${importedDocuments.reduce((sum, doc) => sum + doc.metadata.wordCount, 0)}`);
    
    // Afficher les requêtes SQL à exécuter
    console.log('\n🔧 REQUÊTES SQL À EXÉCUTER:');
    console.log('(Copiez-collez dans votre interface Supabase)\n');
    
    for (let i = 0; i < importedDocuments.length; i++) {
      const doc = importedDocuments[i];
      const docId = `doc_${i + 1}_${Date.now()}`;
      
      console.log(`-- Document ${i + 1}: ${doc.filename}`);
      console.log(`INSERT INTO knowledge_documents (id, title, filename, content, file_type, category, language, metadata) VALUES (
  '${docId}',
  '${doc.title.replace(/'/g, "''")}',
  '${doc.filename}',
  $content$${doc.content}$content$,
  '${doc.file_type}',
  '${doc.category}',
  '${doc.language}',
  '${JSON.stringify(doc.metadata)}'::jsonb
);\n`);
      
      // Quelques chunks d'exemple
      for (let j = 0; j < Math.min(3, doc.chunks.length); j++) {
        const chunk = doc.chunks[j];
        const embeddingStr = '[' + chunk.embedding.map(n => n.toFixed(6)).join(',') + ']';
        console.log(`INSERT INTO knowledge_chunks (document_id, chunk_index, content, embedding) VALUES (
  '${docId}',
  ${chunk.chunk_index},
  $chunk$${chunk.content.substring(0, 100)}...$chunk$,
  '${embeddingStr}'::vector
);\n`);
      }
      
      if (doc.chunks.length > 3) {
        console.log(`-- ... et ${doc.chunks.length - 3} autres chunks\n`);
      }
    }
    
    console.log('🎉 Import préparé ! Exécutez les requêtes SQL dans Supabase.');
    console.log('💡 Ensuite testez avec: npm run test-search');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

importKnowledgeSimple(); 