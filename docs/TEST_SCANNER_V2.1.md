# Guide de Test - Scanner v2.1 (OpenAI Vision)

## 🎯 Objectifs de Test

Valider la migration vers **100% OpenAI Vision** tout en préservant l'expérience utilisateur originale.

## 📋 Checklist Interface Utilisateur

### ✅ Design Préservé
- [ ] **Bannière gradient** violette AssistLux intacte
- [ ] **Animations fluides** : progress bar et transitions
- [ ] **Quick Actions** Copy/Download fonctionnels
- [ ] **Pas d'affichage OCR** visible pour l'utilisateur final

### ✅ Fonctionnalités Core
- [ ] **Upload images** : tous formats supportés (HEIC, WEBP, etc.)
- [ ] **Sélection langue** : interface préservée
- [ ] **Messages d'erreur** : français et contextuels
- [ ] **Progress tracking** : 10% → 30% → 50% → 90% → 100%

## 🧪 Scénarios de Test

### 1. Documents Types Luxembourg

#### Test A: Facture Simple
```
📄 Document: Facture électricité/gaz
✅ Attendu: Extraction complète sans erreur
⏱️ Temps: < 10 secondes
💰 Coût: ~$0.00027
```

#### Test B: Formulaire Gouvernemental
```
📄 Document: Demande aide sociale
✅ Attendu: Structure préservée, champs identifiés
⏱️ Temps: < 15 secondes  
💰 Coût: ~$0.00035
```

#### Test C: Document Manuscrit
```
📄 Document: Note manuscrite
✅ Attendu: Extraction partielle avec [ILLISIBLE]
⏱️ Temps: < 12 secondes
💰 Coût: ~$0.00030
```

### 2. Tests de Robustesse

#### Test D: Image Floue/Mauvaise Qualité
```
📄 Document: Photo floue smartphone
✅ Attendu: Extraction avec qualité variable
🔄 Fallback: Message d'erreur gracieux
```

#### Test E: Document Multilingue
```
📄 Document: FR + LU + DE + EN
✅ Attendu: Toutes langues préservées
🌍 Traduction: Vers langue sélectionnée
```

#### Test F: Gros Fichier (>5MB)
```
📄 Document: Scan haute résolution
✅ Attendu: Traitement sans timeout
⚠️ Surveillance: Coût et temps processing
```

## 🛠️ Monitoring Développeur

### Console Logs à Vérifier
```javascript
// 1. Début OCR
"🤖 Starting OpenAI Vision OCR (gpt-4o-mini)..."

// 2. Succès OCR
"✅ OpenAI Vision OCR completed: {
  textLength: 1543,
  inputTokens: 1205,
  outputTokens: 287,
  cost: '$0.00035'
}"

// 3. Statistiques silencieuses
"ocrStats: {
  totalCalls: 5,
  totalCost: 0.00163,
  averageCostPerCall: 0.000326
}"
```

### DevTools Network
- [ ] **Requests OpenAI** : POST chat/completions
- [ ] **Payload images** : base64 correct
- [ ] **Response times** : < 15s typically
- [ ] **No Tesseract calls** : Plus de requêtes locales

## 🔍 Validation Coûts

### Calculs Attendus
```javascript
// Tarification gpt-4o-mini
Input:  $0.15/1M tokens = $0.00015/1K
Output: $0.60/1M tokens = $0.0006/1K

// Coût typique par document
~1200 input tokens  = $0.00018
~200 output tokens  = $0.00012
Total: ~$0.00030/document
```

### Projections Réelles
- **10 docs/jour** = $0.003/jour = $1.1/an
- **50 docs/jour** = $0.015/jour = $5.5/an  
- **200 docs/jour** = $0.06/jour = $22/an

## ⚠️ Points d'Attention

### Erreurs Possibles
1. **Rate Limit OpenAI** : Message français explicite
2. **Quota Insufficient** : Guide utilisateur facturation
3. **Network Issues** : Retry gracieux
4. **Invalid Image** : Validation format préservée

### Performance
- **Temps réponse** : 5-15s selon complexité
- **Pas de timeout** : Requêtes longues supportées
- **Memory usage** : Pas d'accumulation Tesseract

## 📊 Métriques de Succès

### KPIs Interface
- ✅ **0 régression** visuelle vs v2.0
- ✅ **Temps réponse** similaire ou meilleur
- ✅ **Taux d'erreur** < 5% (network excluded)

### KPIs Technique  
- ✅ **Qualité OCR** > 90% documents standards
- ✅ **Coûts réels** < $0.0005/document
- ✅ **Simplicité** : 1 service vs 2 précédemment

## 🚀 Déploiement

### Pre-Release Checklist
- [ ] **Tests passent** : Tous scénarios validés
- [ ] **Console clean** : Pas d'erreurs JavaScript
- [ ] **Stats monitoring** : Fonctionnel en background
- [ ] **Documentation** : Changelog à jour

### Go/No-Go
- **GO** si : Expérience utilisateur identique + coûts maîtrisés
- **NO-GO** si : Régressions interface ou explosions coûts

---

**Version finale prête pour production AssistLux ! 🎉** 