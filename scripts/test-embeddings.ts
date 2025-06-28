#!/usr/bin/env tsx

// ═══════════════════════════════════════════════════════════
// TEST EMBEDDINGS AZURE OPENAI - AssistLux
// Usage: npx tsx scripts/test-embeddings.ts
// ═══════════════════════════════════════════════════════════

import { config } from 'dotenv';
import EmbeddingServiceNode from './embeddingServiceNode';

// Charger les variables d'environnement
config();

async function testEmbeddings() {
  console.log('🧪 Test des embeddings Azure OpenAI\n');
  
  const embeddingService = new EmbeddingServiceNode();
  
  // Textes de test liés aux aides sociales
  const testTexts = [
    "aide alimentaire Luxembourg épicerie sociale",
    "allocation de vie chère montant revenus",
    "restaurant social distribution alimentaire",
    "REVIS revenu d'inclusion sociale",
    "prime de vie chère 2024"
  ];
  
  console.log('📝 Textes à tester:');
  testTexts.forEach((text, i) => {
    console.log(`   ${i + 1}. "${text}"`);
  });
  console.log();
  
  try {
    console.log('🚀 Génération des embeddings...\n');
    
    // Test individuel
    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      const startTime = Date.now();
      
      console.log(`📊 Test ${i + 1}: "${text}"`);
      
      const result = await embeddingService.generateEmbedding(text);
      const duration = Date.now() - startTime;
      
      if ('error' in result) {
        console.log(`   ❌ Erreur: ${result.error}`);
        console.log(`   🔄 Fallback: ${result.fallback.length} dimensions`);
      } else {
        console.log(`   ✅ Succès: ${result.embedding.length} dimensions`);
        console.log(`   🧮 Tokens: ${result.tokens}`);
        console.log(`   ⏱️ Durée: ${duration}ms`);
        
        // Aperçu de l'embedding
        const preview = result.embedding.slice(0, 5).map(n => n.toFixed(4)).join(', ');
        console.log(`   👀 Aperçu: [${preview}...]`);
      }
      console.log();
    }
    
    // Test de similarité
    console.log('🔍 Test de similarité sémantique\n');
    
    const text1 = "aide alimentaire";
    const text2 = "épicerie sociale";
    const text3 = "allocation logement"; // Moins similaire
    
    console.log('📊 Calcul des similarités...');
    
    const [result1, result2, result3] = await Promise.all([
      embeddingService.generateEmbedding(text1),
      embeddingService.generateEmbedding(text2),
      embeddingService.generateEmbedding(text3)
    ]);
    
    if (!('error' in result1) && !('error' in result2) && !('error' in result3)) {
      const sim12 = embeddingService.calculateSimilarity(result1.embedding, result2.embedding);
      const sim13 = embeddingService.calculateSimilarity(result1.embedding, result3.embedding);
      const sim23 = embeddingService.calculateSimilarity(result2.embedding, result3.embedding);
      
      console.log(`   📈 Similarité "${text1}" ↔ "${text2}": ${(sim12 * 100).toFixed(1)}%`);
      console.log(`   📈 Similarité "${text1}" ↔ "${text3}": ${(sim13 * 100).toFixed(1)}%`);
      console.log(`   📈 Similarité "${text2}" ↔ "${text3}": ${(sim23 * 100).toFixed(1)}%`);
      
      // Vérifier que les termes similaires ont une plus grande similarité
      if (sim12 > sim13) {
        console.log('   ✅ La similarité sémantique fonctionne correctement !');
      } else {
        console.log('   ⚠️ Résultats de similarité inattendus');
      }
    }
    
    // Statistiques du cache
    console.log('\n📊 Statistiques:');
    const stats = embeddingService.getCacheStats();
    console.log(`   🗄️ Cache: ${stats.size} embeddings`);
    console.log(`   🤖 Modèle: ${stats.model}`);
    console.log(`   📐 Dimensions: ${stats.dimensions}`);
    
    console.log('\n🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur pendant le test:', error);
    process.exit(1);
  }
}

// Lancer le test
testEmbeddings().catch(console.error); 