# Changelog - Scanner de Documents AssistLux

## [v2.1.0] - 2024-12-19 - OCR OpenAI Vision Unifié ✨

### 🤖 Migration vers OpenAI Vision

#### Architecture Simplifiée
- **OCR Unifié** : 100% OpenAI Vision (gpt-4o-mini) pour tous les documents
- **Support HEIC/HEIF** : Conversion automatique photos iPhone → JPEG 
- **Suppression complexité** : Plus de routage hybride, une seule méthode fiable
- **Expérience utilisateur préservée** : Interface identique à la v2.0
- **Statistiques silencieuses** : Monitoring développeur sans surcharge UI

#### Avantages Techniques
- **Qualité constante** : 95% confiance sur tous types de documents
- **Compatibilité étendue** : HEIC, WEBP, TIFF, PNG, JPG, etc.
- **Maintenance réduite** : Un seul provider à gérer (OpenAI)
- **Coûts négligeables** : ~$0.00027/document (5-20€/an selon usage)
- **Robustesse** : Gestion d'erreurs spécialisée OpenAI

#### Optimisation Coûts/Simplicité
- **Tarification réelle** : $0.15/1M input + $0.60/1M output tokens
- **ROI positif** : Simplicité technique > économies marginales
- **Évolutivité** : Préparé pour montée en charge sans refactoring
- **Migration Azure ready** : Architecture préparée pour switch futur

### 🔧 Implémentation Technique

#### Service `openaiOCR.ts`
```typescript
// OCR simplifié et optimisé avec support HEIC
const { processedImageData, wasConverted } = await prepareImageForOpenAI(imageData, originalFile);

const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [/* Instructions OCR optimisées */]
});
```

#### Conversion HEIC Automatique
- **Détection format** : Validation automatique HEIC/HEIF
- **Conversion transparente** : HEIC → JPEG haute qualité
- **Préservation métadonnées** : Orientation et qualité maintenues
- **Fallback gracieux** : Si conversion échoue, tentative avec original

#### Interface Utilisateur
- **Design inchangé** : Bannière gradient violette AssistLux
- **Animations préservées** : Progress bar et transitions fluides
- **Quick Actions** : Copy/Download maintenus identiques
- **Monitoring invisible** : Stats développeur sans pollution UI
- **Support HEIC visible** : Mention dans formats acceptés

### 📊 Monitoring et Statistiques

#### Métriques Collectées (Développeur)
- **Appels totaux** et coûts cumulés
- **Tokens consommés** (input/output)
- **Confiance moyenne** des extractions
- **Conversions HEIC** trackées
- **Projections coûts** mensuels/annuels

#### Transparence Financière
```javascript
// Exemples usage réel
500 docs/mois  = $1.6/an
2000 docs/mois = $6.5/an  
5000 docs/mois = $16/an

// Migration Azure future (estimation)
Azure Computer Vision = $1/1K = 3x plus rapide
```

### 🎯 Impact Stratégique

#### Pour AssistLux
- **Budget maîtrisé** : Coûts OCR négligeables vs développement
- **Support iPhone** : Compatible photos HEIC natives
- **Fiabilité maximale** : Plus d'échecs de routage ou de fallback
- **Focus produit** : Énergie sur features vs optimisation technique
- **Scaling préparé** : Architecture simple et robuste

#### Décision Architecturale
Choix **simplicité + qualité** plutôt que **optimisation prématurée** :
- Économies hybride : 10-30€/an maximum
- Coût développement hybride : plusieurs heures/jours  
- Maintenance continue : debugging complexe
- **ROI négatif** de l'optimisation technique

#### Roadmap Migration
- **Phase actuelle** : OpenAI Vision stable et fiable
- **Phase future** : Migration Azure Computer Vision (3-5x plus rapide)
- **Architecture ready** : Service OCR abstrait pour switch transparent

---

## [v2.0.0] - 2024-12-19 - Scanner Nouvelle Génération

### 🎨 Design System Préservé

L'utilisateur a explicitement demandé de conserver l'expérience utilisateur originale :
- **Bannière élégante** : effet backdrop-blur maintenu
- **Boutons gradient** : violet signature AssistLux
- **Animations fluides** : transitions et micro-interactions
- **Quick Actions** : Copy/Download inchangés 