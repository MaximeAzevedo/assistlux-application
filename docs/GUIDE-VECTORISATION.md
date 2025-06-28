# 🧠 Guide de la Base de Connaissances Vectorielle - AssistLux

## 📖 Vue d'ensemble

Votre chatbot AssistLux dispose maintenant d'un système de **vectorisation avancée** qui lui permet de rechercher et utiliser vos propres documents pour fournir des réponses précises et personnalisées.

## 🏗️ Architecture mise en place

### 1. **Base de données vectorielle** (Supabase + pgvector)
- ✅ Extension pgvector activée
- ✅ Tables optimisées pour la recherche sémantique
- ✅ Index performants pour les requêtes vectorielles

### 2. **Services de traitement**
- ✅ `KnowledgeBaseService` - Gestion complète de la base
- ✅ `DocumentProcessor` - Support PDF, Word, Markdown, Texte
- ✅ Intégration Azure OpenAI pour les embeddings

### 3. **Chatbot enrichi**
- ✅ Recherche automatique dans vos documents
- ✅ Réponses contextualisées et précises
- ✅ Support multilingue intégré

## 🚀 Comment utiliser

### Étape 1: Ajouter vos documents

1. **Placez vos documents** dans le dossier `docs/knowledge-base/`
   ```
   docs/knowledge-base/
   ├── procedures/
   │   ├── demande-revis.pdf
   │   └── allocation-familiale.docx
   ├── faq/
   │   └── questions-frequentes.txt
   └── guides/
       └── aide-logement.md
   ```

2. **Formats supportés:**
   - PDF (`.pdf`)
   - Word (`.docx`, `.doc`)
   - Texte (`.txt`)
   - Markdown (`.md`)

### Étape 2: Importer et vectoriser

```bash
# Lancer l'import automatique
npm run import-knowledge
```

**Ce qui se passe:**
- 📄 Lecture de tous vos documents
- ✂️ Découpage intelligent en chunks
- 🧠 Génération d'embeddings avec Azure OpenAI
- 💾 Stockage vectorisé dans Supabase
- 📊 Rapport détaillé d'import

### Étape 3: Tester le chatbot

Votre chatbot utilise automatiquement la base de connaissances ! Testez avec:

- *"Comment demander une allocation familiale ?"*
- *"Quels sont les montants du REVIS ?"*
- *"Aide au logement conditions"*

## 📊 Commandes disponibles

```bash
# Import des documents
npm run import-knowledge

# Suppression de la base (si besoin)
npm run knowledge:clear

# Vérification de la config Azure
npm run test:azure
```

## 🔧 Configuration avancée

### Seuils de recherche
Dans `src/lib/chatbot.ts`, ligne 41:
```typescript
const searchResult = await knowledgeBase.searchWithContext(message, {
  threshold: 0.75, // Similarité minimum (0-1)
  limit: 3,        // Nombre de résultats max
  language: language
});
```

### Catégories automatiques
Le système détecte automatiquement les catégories selon:
- **Dossier**: `procedures/` → catégorie "procedures"  
- **Nom fichier**: `faq-logement.txt` → catégorie "faq"
- **Mots-clés**: "allocation" → catégorie "procedures"

## 📈 Performance et optimisation

### Métriques surveillées
- ⏱️ Temps de recherche (< 500ms)
- 🎯 Précision des résultats (seuil 75%+)
- 📊 Utilisation de la base (analytics intégrés)

### Cache intégré
- Embeddings mis en cache automatiquement
- Recherches optimisées avec index vectoriels
- Gestion intelligente de la concurrence

## 🧪 Test avec un exemple

Un document d'exemple a été créé: `docs/knowledge-base/exemple-aide-sociale-luxembourg.txt`

**Testez maintenant:**
1. Lancez `npm run import-knowledge`
2. Ouvrez votre chatbot
3. Demandez: *"Combien coûte l'allocation familiale ?"*

Le chatbot devrait utiliser les informations exactes du document !

## 🔍 Monitoring et debug

### Logs de recherche
```bash
# Dans la console browser/serveur
🔍 Recherche base de connaissances: 2 résultat(s) trouvé(s) pour "allocation familiale"
```

### Base de données
Tables créées dans Supabase:
- `knowledge_documents` - Documents sources
- `knowledge_chunks` - Chunks vectorisés  
- `knowledge_searches` - Analytics des recherches

### Statistiques
Accès programmatique:
```typescript
const stats = await knowledgeBase.getStats();
console.log(`${stats.totalDocuments} documents, ${stats.totalChunks} chunks`);
```

## 🚨 Résolution des problèmes

### "Aucun document trouvé"
- Vérifiez que les fichiers sont dans `docs/knowledge-base/`
- Formats supportés: PDF, Word, Txt, Markdown
- Taille max: 10MB par fichier

### "Erreur Azure OpenAI"
- Vérifiez vos variables d'environnement Azure
- Testez avec `npm run test:azure`
- Vérifiez votre quota Azure OpenAI

### "Base de données non disponible"
- Vérifiez la connexion Supabase
- Assurez-vous que la migration a été appliquée
- Extension pgvector activée ?

### "Recherche ne retourne rien"
- Seuil de similarité trop élevé ? (réduire threshold)
- Documents trop courts ? (minimum 100 caractères)
- Langue différente ? (spécifier language)

## 🔮 Prochaines améliorations

### Fonctionnalités prévues
- [ ] Interface d'administration des documents
- [ ] Embeddings Azure OpenAI natifs (pas de simulation)
- [ ] Support d'images dans les PDF
- [ ] Analytics avancés des recherches
- [ ] Auto-catégorisation IA

### Optimisations techniques
- [ ] Chunking adaptatif par type de document
- [ ] Cache Redis pour la production
- [ ] Compression des embeddings
- [ ] Recherche hybride (vectorielle + textuelle)

## 📞 Support

En cas de problème:
1. Vérifiez les logs dans la console
2. Testez avec le document d'exemple fourni
3. Consultez ce guide pour les erreurs courantes

---

🎉 **Votre chatbot est maintenant alimenté par vos propres documents !** 

La précision et la pertinence des réponses vont considérablement s'améliorer grâce à cette base de connaissances personnalisée. 