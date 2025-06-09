# Architecture Technique AssistLux - Infrastructure Évolutive

## 🎯 Vision Globale

AssistLux est conçu comme une plateforme 100% configurable et évolutive où l'ajout de nouvelles aides sociales, langues ou fonctionnalités se fait automatiquement via la base de données, sans modification du code.

## 🏗️ Architecture Générale

### Principe Fondamental : Configuration par Base de Données
- **Zéro hardcoding** : Toute la logique métier est stockée en base
- **Évolutivité automatique** : Ajouter une aide = insérer des données
- **Multilingue natif** : Support automatique de nouvelles langues
- **Workflow intelligent** : Branchements conditionnels configurables

## 📊 Structure de Base de Données

### Tables Principales (Existantes)

#### 1. `config_aide` - Configuration des Aides
```sql
- id, nom_aide, description_fr/de/en/lu/pt
- actif, ordre_affichage, icone, couleur_theme
- conditions_eligibilite (JSON), documents_requis (JSON)
- workflow_etapes (JSON), calculs_automatiques (JSON)
```

#### 2. `etapes` - Workflow Configurable
```sql
- id, aide_id, ordre, type_etape, titre_multilingue
- conditions_affichage (JSON), validation_rules (JSON)
- etape_suivante_id, branchement_conditionnel (JSON)
```

#### 3. `champs_formulaire` - Champs Dynamiques
```sql
- id, etape_id, type_champ, nom_technique, label_multilingue
- validation_rules (JSON), options_choix (JSON)
- dependances_conditionnelles (JSON)
```

### Nouvelles Tables pour Fonctionnalités Avancées

#### 4. `videos_explicatives` - Gestion Vidéos Multilingues
```sql
CREATE TABLE videos_explicatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aide_id UUID REFERENCES config_aide(id),
    etape_id UUID REFERENCES etapes(id) NULL,
    type_video VARCHAR(50), -- 'introduction', 'explication_etape', 'aide_remplissage'
    
    -- URLs par langue (hébergement externe)
    url_fr TEXT,
    url_de TEXT,
    url_en TEXT,
    url_lu TEXT,
    url_pt TEXT,
    
    -- Métadonnées
    duree_secondes INTEGER,
    thumbnail_url TEXT,
    transcription_fr TEXT,
    transcription_de TEXT,
    transcription_en TEXT,
    transcription_lu TEXT,
    transcription_pt TEXT,
    
    -- Configuration d'affichage
    position_affichage VARCHAR(20), -- 'debut_etape', 'aide_contextuelle', 'fin_etape'
    obligatoire BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. `documents_ia_validation` - Scanner IA de Documents
```sql
CREATE TABLE documents_ia_validation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aide_id UUID REFERENCES config_aide(id),
    type_document VARCHAR(100), -- 'fiche_paie', 'justificatif_domicile', 'carte_identite'
    
    -- Configuration IA
    modele_ia VARCHAR(50), -- 'gpt-4-vision', 'claude-vision', 'custom'
    prompt_validation_fr TEXT,
    prompt_validation_de TEXT,
    prompt_validation_en TEXT,
    prompt_validation_lu TEXT,
    prompt_validation_pt TEXT,
    
    -- Critères de validation
    champs_obligatoires JSON, -- ['nom', 'prenom', 'salaire_net', 'periode']
    formats_acceptes JSON, -- ['pdf', 'jpg', 'png']
    taille_max_mb INTEGER DEFAULT 10,
    
    -- Messages de retour
    message_succes_fr TEXT,
    message_succes_de TEXT,
    message_succes_en TEXT,
    message_succes_lu TEXT,
    message_succes_pt TEXT,
    
    message_erreur_fr TEXT,
    message_erreur_de TEXT,
    message_erreur_en TEXT,
    message_erreur_lu TEXT,
    message_erreur_pt TEXT,
    
    -- Suggestions d'amélioration
    suggestions_correction JSON,
    
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. `sessions_utilisateur` - Gestion Sessions et Données
```sql
CREATE TABLE sessions_utilisateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE,
    
    -- Données utilisateur (chiffrées)
    donnees_personnelles JSONB, -- Chiffré côté client
    documents_uploades JSON,
    progression_etapes JSON,
    resultats_eligibilite JSON,
    
    -- Métadonnées
    langue_preferee VARCHAR(2) DEFAULT 'fr',
    derniere_activite TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- RGPD
    consentement_donnees BOOLEAN DEFAULT false,
    date_expiration TIMESTAMP, -- Auto-suppression après 30 jours
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. `historique_validations_ia` - Traçabilité IA
```sql
CREATE TABLE historique_validations_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions_utilisateur(id),
    document_validation_id UUID REFERENCES documents_ia_validation(id),
    
    -- Données de validation
    fichier_url TEXT, -- URL temporaire sécurisée
    resultat_validation BOOLEAN,
    confiance_score DECIMAL(3,2), -- 0.00 à 1.00
    champs_detectes JSON,
    erreurs_detectees JSON,
    
    -- Métadonnées IA
    modele_utilise VARCHAR(50),
    temps_traitement_ms INTEGER,
    cout_api DECIMAL(10,4),
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Services Techniques

### 1. VideoService - Gestion Vidéos Simplifiée

```typescript
class VideoService {
    // Récupération automatique des vidéos par contexte avec fallback
    async getVideosForStep(aideId: string, etapeId: string, langue: string) {
        const { data } = await supabase
            .from('videos_explicatives')
            .select('*')
            .eq('aide_id', aideId)
            .eq('etape_id', etapeId)
            .eq('statut', 'actif');

        return data.map(video => ({
            ...video,
            url: this.getVideoUrlForLanguage(video, langue),
            transcription: this.getTranscriptionForLanguage(video, langue)
        }));
    }
    
    // Ajout simple d'une vidéo (via interface admin)
    async addVideo(videoData: {
        aide_id: string;
        type_video: string;
        url_fr?: string;
        url_de?: string;
        url_en?: string;
        url_lu?: string;
        url_pt?: string;
        position_affichage: string;
    }) {
        return await supabase
            .from('videos_explicatives')
            .insert(videoData);
    }
    
    // Fallback intelligent pour les langues
    private getVideoUrlForLanguage(video: any, langue: string): string {
        // Priorité : langue demandée → français → première disponible
        return video[`url_${langue}`] || 
               video.url_fr || 
               video.url_de || 
               video.url_en || 
               video.url_lu || 
               video.url_pt;
    }
}
```

### 2. DocumentAIService - Scanner IA Intelligent

```typescript
class DocumentAIService {
    // Validation automatique de documents
    async validateDocument(file: File, typeDocument: string, langue: string) {
        const config = await this.getValidationConfig(typeDocument, langue);
        const result = await this.analyzeWithAI(file, config);
        
        return {
            isValid: result.confidence > 0.8,
            extractedData: result.fields,
            suggestions: result.improvements,
            confidence: result.confidence
        };
    }
    
    // Extraction intelligente de données
    async extractDocumentData(file: File, expectedFields: string[]) {
        // OCR + IA pour extraction structurée
    }
    
    // Apprentissage automatique sur les validations
    async improveModelFromFeedback(validationId: string, userFeedback: any) {
        // Amélioration continue du modèle
    }
}
```

### 3. AutoConfigService - Configuration Automatique

```typescript
class AutoConfigService {
    // Ajout automatique d'une nouvelle aide
    async addNewAide(aideData: any) {
        // 1. Créer la configuration de base
        const aideId = await this.createAideConfig(aideData);
        
        // 2. Générer automatiquement les étapes standard
        await this.generateStandardWorkflow(aideId, aideData.type);
        
        // 3. Créer les validations IA pour les documents
        await this.setupDocumentValidation(aideId, aideData.documentsRequis);
        
        // 4. Créer les entrées vidéos vides (à remplir manuellement)
        await this.createVideoPlaceholders(aideId, aideData.langues);
        
        // 5. Configurer les calculs automatiques
        await this.setupAutomaticCalculations(aideId, aideData.baremes);
        
        return aideId;
    }
    
    // Ajout automatique d'une nouvelle langue
    async addNewLanguage(langueCode: string) {
        // 1. Ajouter les colonnes de langue dans toutes les tables
        await this.addLanguageColumns(langueCode);
        
        // 2. Traduire automatiquement tous les contenus existants
        await this.translateAllContent(langueCode);
        
        // 3. Créer les entrées vidéos vides pour la nouvelle langue
        await this.createVideoPlaceholdersForLanguage(langueCode);
        
        // 4. Traduire les prompts IA
        await this.translateAIPrompts(langueCode);
    }
    
    // Créer des entrées vidéos vides pour une aide
    private async createVideoPlaceholders(aideId: string, langues: string[]) {
        const videoTypes = ['introduction', 'explication_etape', 'aide_remplissage'];
        
        for (const type of videoTypes) {
            await supabase
                .from('videos_explicatives')
                .insert({
                    aide_id: aideId,
                    type_video: type,
                    statut: 'en_attente', // Sera changé en 'actif' quand les URLs seront ajoutées
                    genere_automatiquement: false
                });
        }
    }
}
```

## 🚀 Workflow d'Ajout Automatique

### Scénario : Ajouter une Nouvelle Aide "Allocation Familiale"

1. **Configuration Initiale** (1 clic)
```sql
INSERT INTO config_aide (nom_aide, type_aide, documents_requis) VALUES 
('Allocation Familiale', 'famille', ['acte_naissance', 'justificatif_revenus']);
```

2. **Génération Automatique**
- ✅ Workflow standard créé (étapes eligibilité → documents → calcul → validation)
- ✅ Champs formulaire générés selon le type d'aide
- ✅ Validations IA configurées pour les documents requis
- ✅ Entrées vidéos créées (à remplir manuellement via l'interface admin)
- ✅ Messages et textes traduits automatiquement
- ✅ Calculs de barèmes intégrés

3. **Étape Manuelle** : Ajout des vidéos via l'interface d'administration
4. **Résultat** : Aide complètement fonctionnelle

### Scénario : Ajouter une Nouvelle Langue "Italien"

1. **Commande Simple**
```typescript
await AutoConfigService.addNewLanguage('it');
```

2. **Traitement Automatique**
- ✅ Toutes les tables mises à jour avec colonnes `_it`
- ✅ Traduction automatique de tous les contenus existants
- ✅ Entrées vidéos créées pour l'italien (URLs à ajouter manuellement)
- ✅ Prompts IA traduits pour validation documents
- ✅ Interface utilisateur automatiquement disponible en italien

3. **Étape Manuelle** : Ajout des URLs vidéos en italien via l'interface admin

## 🎥 Intégration Vidéo Simplifiée

### Principe : Stockage et Affichage de Vidéos Créées Manuellement
- **Création externe** : Vidéos créées par votre équipe dédiée
- **Stockage simple** : URLs des vidéos hébergées (YouTube, Vimeo, CDN)
- **Affichage intelligent** : Fallback multilingue automatique
- **Gestion facile** : Interface d'administration pour ajouter/modifier les liens

### Hébergement et Diffusion
- **Hébergement externe** : YouTube, Vimeo, ou votre CDN
- **URLs par langue** : Stockage des liens pour chaque langue
- **Fallback intelligent** : Si vidéo manquante dans une langue → français → première disponible
- **Analytics simples** : Suivi des vues via l'interface

### Workflow Simplifié pour les Vidéos
```typescript
// Exemple d'ajout de vidéo via interface admin
const nouvelleVideo = {
    aide_id: "uuid-aide",
    type_video: "introduction",
    url_fr: "https://youtube.com/watch?v=abc123",
    url_de: "https://youtube.com/watch?v=def456", 
    url_en: "https://youtube.com/watch?v=ghi789",
    // url_lu et url_pt optionnels
    position_affichage: "debut_etape"
};

// Ajout automatique via l'interface d'administration
await VideoService.addVideo(nouvelleVideo);
```

## 🤖 Intelligence Artificielle Intégrée

### Scanner de Documents Intelligent

#### Validation Automatique
```typescript
// Exemple : Validation fiche de paie
const fichePayeValidator = {
    prompt: `Analyse cette fiche de paie et vérifie :
    1. Présence nom/prénom employé
    2. Période de paie (mois/année)
    3. Salaire brut et net
    4. Nom employeur
    5. Signature ou tampon officiel
    
    Retourne JSON avec champs détectés et score de confiance.`,
    
    expectedFields: ['nom', 'prenom', 'periode', 'salaire_brut', 'salaire_net', 'employeur'],
    minimumConfidence: 0.85
};
```

#### Extraction de Données Structurées
- **OCR Avancé** : Reconnaissance texte + mise en forme
- **Validation Croisée** : Vérification cohérence des données
- **Suggestions Intelligentes** : Aide à la correction d'erreurs
- **Apprentissage Continu** : Amélioration basée sur les retours utilisateurs

### Assistant IA Contextuel
```typescript
class AIAssistant {
    async getContextualHelp(etapeId: string, userData: any, langue: string) {
        const context = await this.buildContext(etapeId, userData);
        const prompt = await this.getLocalizedPrompt(langue);
        
        return await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: context }
            ]
        });
    }
    
    async suggestMissingDocuments(aideId: string, currentDocuments: string[]) {
        // Analyse intelligente des documents manquants
        // Suggestions personnalisées selon le profil utilisateur
    }
}
```

## 🔒 Sécurité et RGPD

### Chiffrement des Données
- **Chiffrement côté client** : Données sensibles jamais en clair
- **Clés de session** : Rotation automatique toutes les 24h
- **Anonymisation** : Suppression automatique après 30 jours

### Conformité RGPD
- **Consentement granulaire** : Par type de traitement
- **Droit à l'oubli** : Suppression automatique programmée
- **Portabilité** : Export des données en format standard
- **Audit Trail** : Traçabilité complète des accès

## 📈 Monitoring et Analytics

### Métriques Automatiques
- **Performance IA** : Temps de traitement, précision, coûts
- **Engagement Vidéo** : Taux de visionnage, points d'abandon
- **Conversion** : Taux de complétion par étape
- **Satisfaction** : Feedback utilisateur automatisé

### Optimisation Continue
- **A/B Testing** : Test automatique de variantes
- **Machine Learning** : Amélioration des modèles IA
- **Prédiction** : Anticipation des besoins utilisateurs

## 🛠️ Outils de Gestion

### Interface d'Administration
- **Configurateur Visuel** : Création d'aides par drag & drop
- **Éditeur de Workflow** : Modification graphique des étapes
- **Gestionnaire de Contenu** : Traduction et validation multilingue
- **Analytics Dashboard** : Métriques en temps réel

### API de Configuration
```typescript
// Exemple d'utilisation
const nouvelleAide = await AssistLuxAPI.createAide({
    nom: "Prime Énergie 2024",
    type: "energie",
    langues: ["fr", "de", "en", "lu", "pt"],
    documents: ["facture_energie", "justificatif_revenus"],
    bareme: {
        seuil_revenus: 50000,
        montant_max: 1200,
        calcul: "revenus < seuil ? montant_max : montant_max * 0.5"
    },
    videos: {
        auto_generate: true,
        style: "professionnel",
        duree_max: 180
    }
});

// Résultat : Aide complètement fonctionnelle en 5 langues avec vidéos
```

## 🎯 Roadmap Technique

### Phase 1 (Immédiate)
- ✅ Base de données configurée
- ✅ Services de base opérationnels
- 🔄 Intégration scanner IA documents
- 🔄 Système de vidéos multilingues

### Phase 2 (3 mois)
- 🔄 Génération automatique de vidéos
- 🔄 Assistant IA contextuel avancé
- 🔄 Interface d'administration complète
- 🔄 API publique pour partenaires

### Phase 3 (6 mois)
- 🔄 Machine Learning prédictif
- 🔄 Intégration systèmes gouvernementaux
- 🔄 Application mobile native
- 🔄 Blockchain pour certification documents

## 💡 Avantages de cette Architecture

### Pour l'Équipe Technique
- **Zéro maintenance** : Pas de code à modifier pour nouvelles aides
- **Évolutivité infinie** : Architecture modulaire et extensible
- **Qualité garantie** : Tests automatisés et validation IA
- **Performance optimale** : Cache intelligent et CDN global

### Pour les Utilisateurs
- **Expérience fluide** : Guidage intelligent et personnalisé
- **Gain de temps** : Validation automatique des documents
- **Accessibilité** : Vidéos explicatives dans leur langue
- **Confiance** : Transparence et sécurité des données

### Pour l'Administration
- **Déploiement rapide** : Nouvelles aides en quelques clics
- **Coût maîtrisé** : Automatisation des processus manuels
- **Conformité garantie** : RGPD et sécurité by design
- **Analytics précises** : Pilotage data-driven des politiques sociales

---

*Cette architecture garantit qu'AssistLux reste à la pointe de l'innovation tout en simplifiant la gestion et en améliorant continuellement l'expérience utilisateur.* 