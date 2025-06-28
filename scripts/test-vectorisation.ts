#!/usr/bin/env tsx

// ═══════════════════════════════════════════════════════════
// SCRIPT DE TEST VECTORISATION - AssistLux
// Usage: npx tsx scripts/test-vectorisation.ts
// ═══════════════════════════════════════════════════════════

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { DocumentProcessor } from '../src/lib/documentProcessor';

const KNOWLEDGE_DIR = 'docs/knowledge-base';

async function testVectorisation() {
  console.log('🧪 Test de vectorisation - AssistLux\n');
  
  try {
    // Scanner le dossier
    const files = await readdir(KNOWLEDGE_DIR);
    const textFiles = files.filter(f => f.endsWith('.txt') && f !== 'README.md');
    
    if (textFiles.length === 0) {
      console.log('❌ Aucun fichier .txt trouvé dans docs/knowledge-base/');
      return;
    }
    
    console.log(`📄 ${textFiles.length} fichier(s) texte trouvé(s):\n`);
    
    const processor = DocumentProcessor.getInstance();
    
    for (const filename of textFiles) {
      const filePath = join(KNOWLEDGE_DIR, filename);
      console.log(`🔍 Test: ${filename}`);
      
      // Lire le fichier
      const fileContent = await readFile(filePath, 'utf-8');
      const fileStats = await stat(filePath);
      
      console.log(`   📊 Taille: ${Math.round(fileStats.size / 1024)}KB`);
      
      // Valider
      const validation = processor.validateFile(filename, fileStats.size);
      if (!validation.valid) {
        console.log(`   ❌ Validation échouée: ${validation.error}`);
        continue;
      }
      
      // Créer l'objet DocumentFile
      const documentFile = {
        name: filename,
        content: fileContent,
        type: 'text/plain',
        size: fileStats.size
      };
      
      // Traiter
      console.log(`   🔄 Traitement du contenu...`);
      const startTime = Date.now();
      
      try {
        const processed = await processor.processDocument(documentFile);
        const processingTime = Date.now() - startTime;
        
        console.log(`   ✅ Traitement réussi en ${processingTime}ms`);
        console.log(`   📝 Titre: ${processed.title}`);
        console.log(`   📄 Contenu: ${processed.content.length} caractères`);
        console.log(`   📊 Mots: ${processed.metadata.wordCount}`);
        
        // Simulation du découpage en chunks
        const chunkSize = 1000;
        const totalChunks = Math.ceil(processed.content.length / chunkSize);
        console.log(`   📦 Chunks prévus (${chunkSize} car.): ${totalChunks}`);
        
        // Aperçu du contenu
        const preview = processed.content.substring(0, 300).replace(/\n/g, ' ').trim();
        console.log(`   👀 Aperçu: "${preview}..."`);
        
        // Simulation des étapes de vectorisation
        console.log(`\n   🧮 SIMULATION VECTORISATION:`);
        console.log(`   • Découpage en ${totalChunks} chunks ✓`);
        console.log(`   • Génération embeddings (1536 dim.) ✓`);
        console.log(`   • Stockage base vectorielle ✓`);
        console.log(`   • Index de recherche créé ✓`);
        
        // Simulation de recherche
        console.log(`\n   🔍 SIMULATION RECHERCHE:`);
        const sampleQueries = [
          "Comment demander l'allocation de vie chère ?",
          "Où trouver une banque alimentaire ?",
          "Aide alimentaire d'urgence",
          "Contact Caritas Luxembourg"
        ];
        
        sampleQueries.forEach((query, index) => {
          const hasMatch = processed.content.toLowerCase().includes(
            query.toLowerCase().split(' ').find(word => word.length > 3) || ''
          );
          console.log(`   ${index + 1}. "${query}" ${hasMatch ? '✅' : '⚠️'}`);
        });
        
      } catch (error) {
        console.log(`   ❌ Erreur de traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
      
      console.log('\n' + '─'.repeat(60) + '\n');
    }
    
    console.log('🎉 Test terminé !');
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. ✅ Extraction texte validée');
    console.log('2. 🔄 Configurer Supabase (variables .env)');
    console.log('3. 🚀 Lancer import complet: npm run import-knowledge');
    console.log('4. 🤖 Tester dans le chatbot');
    
  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  }
}

// Lancer le test
testVectorisation().catch(console.error); 