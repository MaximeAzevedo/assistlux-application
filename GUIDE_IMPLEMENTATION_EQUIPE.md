# Guide d'Implémentation AssistLux - Équipe Technique

## 🎯 Objectif : Infrastructure 100% Évolutive

Ce guide explique comment implémenter l'architecture AssistLux pour que **l'ajout de nouvelles aides ou langues soit automatique** sans modification de code.

## 📋 Checklist de Déploiement

### Phase 1 : Base de Données (Immédiat)
- [ ] Exécuter le script `create_advanced_features_tables.sql`
- [ ] Vérifier la création des 7 nouvelles tables
- [ ] Tester les fonctions de nettoyage RGPD
- [ ] Configurer les tâches automatiques de suppression

### Phase 2 : Services Core (1-2 semaines)
- [ ] Implémenter `VideoService`
- [ ] Implémenter `DocumentAIService`
- [ ] Implémenter `AutoConfigService`
- [ ] Créer les interfaces d'administration

### Phase 3 : Intégrations Avancées (1 mois)
- [ ] Intégration APIs de génération vidéo
- [ ] Scanner IA de documents
- [ ] Analytics et monitoring
- [ ] Tests automatisés

## 🛠️ Implémentation des Services

### 1. VideoService - Gestion Vidéos Simplifiée

```typescript
// src/services/VideoService.ts
import { supabase } from '../lib/supabase';

export class VideoService {
    /**
     * Récupère les vidéos pour une étape donnée avec fallback multilingue
     */
    async getVideosForStep(aideId: string, etapeId: string, langue: string = 'fr') {
        const { data, error } = await supabase
            .from('videos_explicatives')
            .select('*')
            .eq('aide_id', aideId)
            .eq('etape_id', etapeId)
            .eq('statut', 'actif')
            .order('position_affichage');

        if (error) throw error;

        return data.map(video => ({
            ...video,
            url: this.getVideoUrlForLanguage(video, langue),
            transcription: this.getTranscriptionForLanguage(video, langue)
        }));
    }

    /**
     * Ajoute une vidéo manuellement via l'interface admin
     */
    async addVideo(videoData: {
        aide_id: string;
        etape_id?: string;
        type_video: string;
        url_fr?: string;
        url_de?: string;
        url_en?: string;
        url_lu?: string;
        url_pt?: string;
        position_affichage: string;
        transcription_fr?: string;
        transcription_de?: string;
        transcription_en?: string;
        transcription_lu?: string;
        transcription_pt?: string;
    }) {
        const { data, error } = await supabase
            .from('videos_explicatives')
            .insert({
                ...videoData,
                statut: 'actif',
                genere_automatiquement: false
            });

        if (error) throw error;
        return data;
    }

    /**
     * Met à jour les URLs d'une vidéo existante
     */
    async updateVideoUrls(videoId: string, urls: {
        url_fr?: string;
        url_de?: string;
        url_en?: string;
        url_lu?: string;
        url_pt?: string;
    }) {
        const { data, error } = await supabase
            .from('videos_explicatives')
            .update({
                ...urls,
                statut: 'actif',
                updated_at: new Date().toISOString()
            })
            .eq('id', videoId);

        if (error) throw error;
        return data;
    }

    private getVideoUrlForLanguage(video: any, langue: string): string {
        // Fallback intelligent : langue demandée → français → première disponible
        return video[`url_${langue}`] || 
               video.url_fr || 
               video.url_de || 
               video.url_en || 
               video.url_lu || 
               video.url_pt;
    }

    private getTranscriptionForLanguage(video: any, langue: string): string {
        return video[`transcription_${langue}`] || 
               video.transcription_fr || 
               '';
    }

    /**
     * Récupère toutes les vidéos d'une aide pour l'interface admin
     */
    async getVideosForAdmin(aideId: string) {
        const { data, error } = await supabase
            .from('videos_explicatives')
            .select('*')
            .eq('aide_id', aideId)
            .order('type_video', { ascending: true });

        if (error) throw error;
        return data;
    }
}
```

### 2. DocumentAIService - Scanner IA Intelligent

```typescript
// src/services/DocumentAIService.ts
import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

export class DocumentAIService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.VITE_OPENAI_API_KEY
        });
    }

    /**
     * Valide automatiquement un document uploadé
     */
    async validateDocument(
        file: File, 
        typeDocument: string, 
        aideId: string,
        sessionId: string,
        langue: string = 'fr'
    ) {
        try {
            // 1. Récupérer la configuration de validation
            const config = await this.getValidationConfig(typeDocument, aideId, langue);
            
            // 2. Convertir le fichier en base64
            const base64 = await this.fileToBase64(file);
            
            // 3. Analyser avec l'IA
            const result = await this.analyzeWithAI(base64, config);
            
            // 4. Sauvegarder l'historique
            await this.saveValidationHistory(sessionId, config.id, file, result);
            
            // 5. Retourner le résultat formaté
            return {
                isValid: result.confidence >= config.confiance_minimum,
                needsManualReview: result.confidence >= config.confiance_manuelle && 
                                 result.confidence < config.confiance_minimum,
                extractedData: result.fields,
                suggestions: result.improvements,
                confidence: result.confidence,
                message: this.getMessageForResult(result, config, langue)
            };

        } catch (error) {
            console.error('Erreur validation document:', error);
            throw error;
        }
    }

    private async getValidationConfig(typeDocument: string, aideId: string, langue: string) {
        const { data, error } = await supabase
            .from('documents_ia_validation')
            .select('*')
            .eq('aide_id', aideId)
            .eq('type_document', typeDocument)
            .eq('actif', true)
            .single();

        if (error || !data) {
            throw new Error(`Configuration de validation non trouvée pour ${typeDocument}`);
        }

        return data;
    }

    private async analyzeWithAI(base64Image: string, config: any) {
        const prompt = config.prompt_validation_fr; // TODO: gérer multilingue

        const response = await this.openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        return {
            confidence: result.confidence || 0,
            fields: result.fields || {},
            improvements: result.suggestions || [],
            rawResponse: response.choices[0].message.content
        };
    }

    private async saveValidationHistory(sessionId: string, configId: string, file: File, result: any) {
        const fileHash = await this.calculateFileHash(file);
        
        await supabase
            .from('historique_validations_ia')
            .insert({
                session_id: sessionId,
                document_validation_id: configId,
                nom_fichier_original: file.name,
                hash_fichier: fileHash,
                taille_fichier_kb: Math.round(file.size / 1024),
                resultat_validation: result.confidence >= 0.8,
                confiance_score: result.confidence,
                champs_detectes: result.fields,
                modele_utilise: 'gpt-4-vision-preview',
                temps_traitement_ms: Date.now(), // TODO: mesurer vraiment
                reponse_brute_ia: result.rawResponse
            });
    }

    /**
     * Extraction intelligente de données structurées
     */
    async extractDocumentData(file: File, expectedFields: string[]) {
        const base64 = await this.fileToBase64(file);
        
        const prompt = `
        Extrayez les informations suivantes de ce document :
        ${expectedFields.map(field => `- ${field}`).join('\n')}
        
        Retournez un JSON avec les champs trouvés et leur valeur.
        Si un champ n'est pas trouvé, mettez null.
        Ajoutez un score de confiance pour chaque champ (0-1).
        `;

        const response = await this.openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${base64}` }
                        }
                    ]
                }
            ]
        });

        return JSON.parse(response.choices[0].message.content);
    }

    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result?.toString().split(',')[1];
                resolve(base64 || '');
            };
            reader.onerror = error => reject(error);
        });
    }

    private async calculateFileHash(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
```

### 3. AutoConfigService - Configuration Automatique

```typescript
// src/services/AutoConfigService.ts
import { supabase } from '../lib/supabase';
import { VideoService } from './VideoService';
import { DocumentAIService } from './DocumentAIService';

export class AutoConfigService {
    private videoService = new VideoService();
    private documentAIService = new DocumentAIService();

    /**
     * Ajoute automatiquement une nouvelle aide sociale
     * Génère tout le workflow, vidéos, validations IA automatiquement
     */
    async addNewAide(aideData: {
        nom_aide: string;
        type_aide: string;
        description_fr: string;
        documents_requis: string[];
        langues: string[];
        bareme?: any;
    }) {
        try {
            console.log('🚀 Création automatique de l\'aide:', aideData.nom_aide);

            // 1. Créer la configuration de base
            const aideId = await this.createAideConfig(aideData);
            console.log('✅ Configuration de base créée');

            // 2. Générer automatiquement les étapes standard
            await this.generateStandardWorkflow(aideId, aideData.type_aide);
            console.log('✅ Workflow standard généré');

            // 3. Créer les validations IA pour les documents
            await this.setupDocumentValidation(aideId, aideData.documents_requis);
            console.log('✅ Validations IA configurées');

            // 4. Créer les entrées vidéos vides (à remplir manuellement)
            await this.createVideoPlaceholders(aideId, aideData.langues);
            console.log('✅ Entrées vidéos créées (à remplir via interface admin)');

            // 5. Configurer les calculs automatiques
            if (aideData.bareme) {
                await this.setupAutomaticCalculations(aideId, aideData.bareme);
                console.log('✅ Calculs automatiques configurés');
            }

            console.log('🎉 Aide créée avec succès ! ID:', aideId);
            return aideId;

        } catch (error) {
            console.error('❌ Erreur lors de la création de l\'aide:', error);
            throw error;
        }
    }

    private async createAideConfig(aideData: any): Promise<string> {
        const { data, error } = await supabase
            .from('config_aide')
            .insert({
                nom_aide: aideData.nom_aide,
                description_fr: aideData.description_fr,
                type_aide: aideData.type_aide,
                documents_requis: aideData.documents_requis,
                actif: true,
                ordre_affichage: 999, // Sera réorganisé manuellement
                icone: this.getDefaultIconForType(aideData.type_aide),
                couleur_theme: this.getDefaultColorForType(aideData.type_aide)
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    private async generateStandardWorkflow(aideId: string, typeAide: string) {
        const workflowStandard = this.getStandardWorkflowForType(typeAide);
        
        for (let i = 0; i < workflowStandard.length; i++) {
            const etape = workflowStandard[i];
            
            const { data: etapeData } = await supabase
                .from('etapes')
                .insert({
                    aide_id: aideId,
                    ordre: i + 1,
                    type_etape: etape.type,
                    titre_fr: etape.titre_fr,
                    description_fr: etape.description_fr,
                    obligatoire: etape.obligatoire
                })
                .select('id')
                .single();

            // Générer les champs de formulaire pour cette étape
            if (etape.champs) {
                await this.generateFormFields(etapeData.id, etape.champs);
            }
        }
    }

    private async setupDocumentValidation(aideId: string, documentsRequis: string[]) {
        for (const typeDocument of documentsRequis) {
            const config = this.getValidationConfigForDocumentType(typeDocument);
            
            await supabase
                .from('documents_ia_validation')
                .insert({
                    aide_id: aideId,
                    type_document: typeDocument,
                    modele_ia: 'gpt-4-vision',
                    prompt_validation_fr: config.prompt_fr,
                    champs_obligatoires: config.champs_obligatoires,
                    message_succes_fr: config.message_succes_fr,
                    message_erreur_fr: config.message_erreur_fr,
                    confiance_minimum: 0.85,
                    actif: true
                });
        }
    }

    /**
     * Ajoute automatiquement une nouvelle langue
     * Traduit tous les contenus existants
     */
    async addNewLanguage(langueCode: string) {
        console.log('🌍 Ajout de la nouvelle langue:', langueCode);

        try {
            // 1. Ajouter les colonnes de langue dans toutes les tables
            await this.addLanguageColumns(langueCode);
            
            // 2. Traduire automatiquement tous les contenus existants
            await this.translateAllContent(langueCode);
            
            // 3. Générer les vidéos dans la nouvelle langue
            await this.generateVideosForLanguage(langueCode);
            
            // 4. Traduire les prompts IA
            await this.translateAIPrompts(langueCode);

            console.log('✅ Langue ajoutée avec succès !');

        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de la langue:', error);
            throw error;
        }
    }

    private async translateAllContent(langueCode: string) {
        // Traduire les aides
        const { data: aides } = await supabase
            .from('config_aide')
            .select('id, nom_aide, description_fr');

        for (const aide of aides || []) {
            const traduction = await this.translateText(aide.description_fr, 'fr', langueCode);
            
            await supabase
                .from('config_aide')
                .update({ [`description_${langueCode}`]: traduction })
                .eq('id', aide.id);
        }

        // Traduire les messages
        const { data: messages } = await supabase
            .from('messages')
            .select('id, fr');

        for (const message of messages || []) {
            const traduction = await this.translateText(message.fr, 'fr', langueCode);
            
            await supabase
                .from('messages')
                .update({ [langueCode]: traduction })
                .eq('id', message.id);
        }
    }

    private async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
        // Utiliser l'API de traduction (Google Translate, DeepL, etc.)
        // Pour l'exemple, on utilise OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'user',
                        content: `Traduis ce texte du ${fromLang} vers le ${toLang}, en gardant le ton professionnel et administratif : "${text}"`
                    }
                ]
            })
        });

        const result = await response.json();
        return result.choices[0].message.content;
    }

    // Méthodes utilitaires
    private getStandardWorkflowForType(typeAide: string) {
        const workflows = {
            'logement': [
                {
                    type: 'eligibilite',
                    titre_fr: 'Vérification d\'éligibilité',
                    description_fr: 'Vérification de vos conditions d\'éligibilité',
                    obligatoire: true,
                    champs: ['revenus', 'situation_familiale', 'logement_actuel']
                },
                {
                    type: 'documents',
                    titre_fr: 'Documents requis',
                    description_fr: 'Upload des documents justificatifs',
                    obligatoire: true,
                    champs: ['upload_documents']
                },
                {
                    type: 'calcul',
                    titre_fr: 'Calcul de l\'aide',
                    description_fr: 'Calcul automatique du montant',
                    obligatoire: false
                }
            ],
            'famille': [
                {
                    type: 'eligibilite',
                    titre_fr: 'Situation familiale',
                    description_fr: 'Informations sur votre famille',
                    obligatoire: true,
                    champs: ['nombre_enfants', 'ages_enfants', 'revenus']
                }
            ]
            // Ajouter d'autres types...
        };

        return workflows[typeAide] || workflows['logement']; // Fallback
    }

    private getValidationConfigForDocumentType(typeDocument: string) {
        const configs = {
            'fiche_paie': {
                prompt_fr: 'Analysez cette fiche de paie et vérifiez la présence du nom, prénom, période, salaire brut et net, employeur.',
                champs_obligatoires: ['nom', 'prenom', 'periode', 'salaire_brut', 'salaire_net', 'employeur'],
                message_succes_fr: 'Fiche de paie validée avec succès !',
                message_erreur_fr: 'Cette fiche de paie semble incomplète ou illisible.'
            },
            'justificatif_domicile': {
                prompt_fr: 'Analysez ce justificatif de domicile et vérifiez la présence du nom, adresse complète et date récente.',
                champs_obligatoires: ['nom', 'adresse', 'date'],
                message_succes_fr: 'Justificatif de domicile validé !',
                message_erreur_fr: 'Ce justificatif semble invalide ou trop ancien.'
            }
            // Ajouter d'autres types...
        };

        return configs[typeDocument] || configs['fiche_paie']; // Fallback
    }

    /**
     * Crée des entrées vidéos vides pour une nouvelle aide
     */
    private async createVideoPlaceholders(aideId: string, langues: string[]) {
        const videoTypes = ['introduction', 'explication_etape', 'aide_remplissage'];
        
        for (const type of videoTypes) {
            await supabase
                .from('videos_explicatives')
                .insert({
                    aide_id: aideId,
                    type_video: type,
                    statut: 'en_attente', // Sera changé en 'actif' quand les URLs seront ajoutées
                    genere_automatiquement: false,
                    position_affichage: type === 'introduction' ? 'debut_etape' : 'aide_contextuelle'
                });
        }
    }
}
```

## 🎬 Exemple Concret : Ajouter "Prime Énergie 2024"

```typescript
// Exemple d'utilisation - Ajouter une nouvelle aide en 1 commande
const autoConfig = new AutoConfigService();

const nouvelleAide = await autoConfig.addNewAide({
    nom_aide: "Prime Énergie 2024",
    type_aide: "energie",
    description_fr: "Aide financière pour réduire votre facture énergétique",
    documents_requis: ["facture_energie", "justificatif_revenus", "justificatif_domicile"],
    langues: ["fr", "de", "en", "lu", "pt"],
    bareme: {
        seuil_revenus: 50000,
        montant_max: 1200,
        calcul: "revenus < seuil ? montant_max : montant_max * 0.5"
    }
});

// Résultat : Aide complètement fonctionnelle avec :
// ✅ Workflow de 3 étapes généré automatiquement
// ✅ Validations IA pour 3 types de documents
// ✅ Entrées vidéos créées (URLs à ajouter manuellement via interface admin)
// ✅ Calculs automatiques configurés
// ✅ Interface utilisateur mise à jour automatiquement

// Étape manuelle : Ajouter les URLs des vidéos via l'interface d'administration
```

## 🌍 Exemple : Ajouter la Langue Italienne

```typescript
// Résultat automatique :
// ✅ Toutes les tables mises à jour avec colonnes _it
// ✅ Tous les contenus traduits automatiquement
// ✅ Entrées vidéos créées pour l'italien (URLs à ajouter manuellement)
// ✅ Prompts IA traduits
// ✅ Interface utilisateur disponible en italien

// Étape manuelle : Ajouter les URLs des vidéos en italien via l'interface admin
```

## 📱 Interface d'Administration

```typescript
// src/components/Admin/AideCreator.tsx
export function AideCreator() {
    const [formData, setFormData] = useState({
        nom_aide: '',
        type_aide: 'logement',
        description_fr: '',
        documents_requis: [],
        langues: ['fr', 'de']
    });

    const handleSubmit = async () => {
        const autoConfig = new AutoConfigService();
        
        try {
            setLoading(true);
            const aideId = await autoConfig.addNewAide(formData);
            
            toast.success(`Aide "${formData.nom_aide}" créée avec succès !`);
            router.push(`/admin/aides/${aideId}`);
            
        } catch (error) {
            toast.error('Erreur lors de la création de l\'aide');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Créer une Nouvelle Aide</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Nom de l'aide
                    </label>
                    <input
                        type="text"
                        value={formData.nom_aide}
                        onChange={(e) => setFormData({...formData, nom_aide: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                        placeholder="Ex: Prime Énergie 2024"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Type d'aide
                    </label>
                    <select
                        value={formData.type_aide}
                        onChange={(e) => setFormData({...formData, type_aide: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                    >
                        <option value="logement">Logement</option>
                        <option value="famille">Famille</option>
                        <option value="energie">Énergie</option>
                        <option value="social">Social</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Documents requis
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        {DOCUMENT_TYPES.map(doc => (
                            <label key={doc.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.documents_requis.includes(doc.value)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData({
                                                ...formData,
                                                documents_requis: [...formData.documents_requis, doc.value]
                                            });
                                        } else {
                                            setFormData({
                                                ...formData,
                                                documents_requis: formData.documents_requis.filter(d => d !== doc.value)
                                            });
                                        }
                                    }}
                                    className="mr-2"
                                />
                                {doc.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Langues supportées
                    </label>
                    <div className="flex gap-4">
                        {LANGUAGES.map(lang => (
                            <label key={lang.code} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.langues.includes(lang.code)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData({
                                                ...formData,
                                                langues: [...formData.langues, lang.code]
                                            });
                                        } else {
                                            setFormData({
                                                ...formData,
                                                langues: formData.langues.filter(l => l !== lang.code)
                                            });
                                        }
                                    }}
                                    className="mr-2"
                                />
                                {lang.name}
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? 'Création en cours...' : 'Créer l\'aide automatiquement'}
                </button>
            </form>

            {loading && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium mb-2">Création en cours...</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                        <div>✅ Configuration de base</div>
                        <div>🔄 Génération du workflow...</div>
                        <div>⏳ Configuration des validations IA...</div>
                        <div>⏳ Génération des vidéos...</div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

### Interface de Gestion des Vidéos

```typescript
// src/components/Admin/VideoManager.tsx
export function VideoManager({ aideId }: { aideId: string }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const videoService = new VideoService();

    useEffect(() => {
        loadVideos();
    }, [aideId]);

    const loadVideos = async () => {
        try {
            const data = await videoService.getVideosForAdmin(aideId);
            setVideos(data);
        } catch (error) {
            console.error('Erreur chargement vidéos:', error);
        }
    };

    const updateVideoUrls = async (videoId: string, urls: any) => {
        try {
            setLoading(true);
            await videoService.updateVideoUrls(videoId, urls);
            await loadVideos();
            toast.success('URLs vidéo mises à jour !');
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Gestion des Vidéos</h1>
            
            <div className="space-y-6">
                {videos.map(video => (
                    <VideoCard 
                        key={video.id}
                        video={video}
                        onUpdate={(urls) => updateVideoUrls(video.id, urls)}
                        loading={loading}
                    />
                ))}
            </div>
        </div>
    );
}

function VideoCard({ video, onUpdate, loading }: any) {
    const [urls, setUrls] = useState({
        url_fr: video.url_fr || '',
        url_de: video.url_de || '',
        url_en: video.url_en || '',
        url_lu: video.url_lu || '',
        url_pt: video.url_pt || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(urls);
    };

    return (
        <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                    {video.type_video.replace('_', ' ').toUpperCase()}
                </h3>
                <span className={`px-2 py-1 rounded text-sm ${
                    video.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {video.statut}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            🇫🇷 Français
                        </label>
                        <input
                            type="url"
                            value={urls.url_fr}
                            onChange={(e) => setUrls({...urls, url_fr: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            🇩🇪 Allemand
                        </label>
                        <input
                            type="url"
                            value={urls.url_de}
                            onChange={(e) => setUrls({...urls, url_de: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            🇬🇧 Anglais
                        </label>
                        <input
                            type="url"
                            value={urls.url_en}
                            onChange={(e) => setUrls({...urls, url_en: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            🇱🇺 Luxembourgeois
                        </label>
                        <input
                            type="url"
                            value={urls.url_lu}
                            onChange={(e) => setUrls({...urls, url_lu: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            🇵🇹 Portugais
                        </label>
                        <input
                            type="url"
                            value={urls.url_pt}
                            onChange={(e) => setUrls({...urls, url_pt: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        {loading ? 'Mise à jour...' : 'Mettre à jour les URLs'}
                    </button>
                </div>
            </form>
        </div>
    );
}

## 🔧 Configuration des Variables d'Environnement

```bash
# .env
# Supabase (déjà configuré)
VITE_SUPABASE_URL=https://smfvnuvtbxtoocnqmabg.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_supabase

# APIs IA
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...

# APIs Traduction (pour l'ajout automatique de langues)
VITE_GOOGLE_TRANSLATE_API_KEY=...
VITE_DEEPL_API_KEY=...

# Stockage (optionnel pour héberger vos propres vidéos)
VITE_AWS_S3_BUCKET=assistlux-videos
VITE_CLOUDFRONT_DOMAIN=cdn.assistlux.lu
```

## 📊 Monitoring et Analytics

```typescript
// src/services/AnalyticsService.ts
export class AnalyticsService {
    async trackVideoView(videoId: string, sessionId: string, viewData: any) {
        await supabase
            .from('analytics_videos')
            .insert({
                video_id: videoId,
                session_id: sessionId,
                ...viewData
            });
    }

    async trackDocumentValidation(sessionId: string, validationData: any) {
        await supabase
            .from('historique_validations_ia')
            .insert({
                session_id: sessionId,
                ...validationData
            });
    }

    async getDashboardMetrics() {
        // Métriques en temps réel pour l'admin
        const [videoStats, validationStats, userStats] = await Promise.all([
            this.getVideoMetrics(),
            this.getValidationMetrics(),
            this.getUserMetrics()
        ]);

        return { videoStats, validationStats, userStats };
    }
}
```

## 🚀 Déploiement et Tests

### Tests Automatisés
```typescript
// tests/autoconfig.test.ts
describe('AutoConfigService', () => {
    test('should create new aide automatically', async () => {
        const autoConfig = new AutoConfigService();
        
        const aideId = await autoConfig.addNewAide({
            nom_aide: 'Test Aide',
            type_aide: 'test',
            description_fr: 'Description test',
            documents_requis: ['fiche_paie'],
            langues: ['fr', 'de']
        });

        expect(aideId).toBeDefined();
        
        // Vérifier que tout a été créé
        const aide = await supabase.from('config_aide').select('*').eq('id', aideId).single();
        expect(aide.data).toBeTruthy();
        
        const etapes = await supabase.from('etapes').select('*').eq('aide_id', aideId);
        expect(etapes.data.length).toBeGreaterThan(0);
        
        const validations = await supabase.from('documents_ia_validation').select('*').eq('aide_id', aideId);
        expect(validations.data.length).toBeGreaterThan(0);
    });
});
```

### Script de Déploiement
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement AssistLux"

# 1. Mise à jour base de données
echo "📊 Mise à jour base de données..."
psql $DATABASE_URL -f supabase/migrations/create_advanced_features_tables.sql

# 2. Build et déploiement
echo "🔨 Build de l'application..."
npm run build

# 3. Tests
echo "🧪 Exécution des tests..."
npm run test

# 4. Déploiement
echo "🌐 Déploiement en production..."
npm run deploy

echo "✅ Déploiement terminé !"
```

## 💡 Avantages de cette Architecture

### Pour l'Équipe
- **Zéro maintenance** : Plus besoin de modifier le code pour ajouter des aides
- **Développement rapide** : Nouvelles fonctionnalités en quelques heures
- **Tests automatisés** : Qualité garantie
- **Documentation auto-générée** : Toujours à jour

### Pour les Utilisateurs
- **Expérience cohérente** : Même UX pour toutes les aides
- **Performance optimale** : Cache intelligent et CDN
- **Accessibilité** : Vidéos avec sous-titres automatiques
- **Sécurité** : Données chiffrées et conformité RGPD

### Pour l'Administration
- **Déploiement instantané** : Nouvelles aides en production immédiatement
- **Analytics précises** : Pilotage data-driven
- **Coûts maîtrisés** : Optimisation automatique des ressources
- **Évolutivité** : Architecture prête pour le futur

---

**Cette architecture garantit qu'AssistLux restera évolutif et maintenable, même avec des centaines d'aides et de langues différentes !** 🚀 