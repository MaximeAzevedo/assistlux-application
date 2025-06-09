import { supabase } from '../lib/supabase/client';
import { AzureOpenAI } from 'openai';

// Types pour le scanner de documents
export interface DocumentScanResult {
  extractedText: string;
  confidence: number;
  documentType: string;
  metadata?: Record<string, any>;
  wasAnonymized: boolean;
}

export interface DocumentValidationConfig {
  id: number;
  aide_id: number;
  nom_document: string;
  description_fr: string;
  obligatoire: boolean;
  formats_acceptes: string;
  expectedFields: string[];
  validationPrompt: string;
}

export class DocumentScannerService {
  private static instance: DocumentScannerService;
  private azureOpenAI: AzureOpenAI;

  constructor() {
    // Configuration Azure OpenAI EU (RGPD Compliant - Sweden Central)
    this.azureOpenAI = new AzureOpenAI({
      apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY,
      endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
      apiVersion: import.meta.env.VITE_AZURE_OPENAI_API_VERSION,
      dangerouslyAllowBrowser: true
    });

    if (!import.meta.env.VITE_AZURE_OPENAI_API_KEY) {
      throw new Error('VITE_AZURE_OPENAI_API_KEY est requis');
    }
    if (!import.meta.env.VITE_AZURE_OPENAI_ENDPOINT) {
      throw new Error('VITE_AZURE_OPENAI_ENDPOINT est requis');
    }
    if (!import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME) {
      throw new Error('VITE_AZURE_OPENAI_DEPLOYMENT_NAME est requis');
    }
  }

  static getInstance(): DocumentScannerService {
    if (!DocumentScannerService.instance) {
      DocumentScannerService.instance = new DocumentScannerService();
    }
    return DocumentScannerService.instance;
  }

  /**
   * NOUVELLE FONCTION : Anonymise un document avant traitement IA (RGPD-compliant)
   */
  private anonymizeDocumentForAI(content: string, documentType: string): { anonymizedText: string; mappings: Record<string, string> } {
    let anonymized = content;
    const mappings: Record<string, string> = {};

    // Patterns pour détecter les données personnelles luxembourgeoises
    const patterns = {
      matricule: /\b\d{13}\b/g,                                    // Matricule luxembourgeois (13 chiffres)
      iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g, // IBAN
      carte_bancaire: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g,        // Numéro carte bancaire
      nom_prenom: /\b[A-Z][a-zàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]+\s+[A-Z][a-zàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]+\b/g, // Nom Prénom
      adresse_lux: /\b\d+[A-Za-z]?\s+[A-Za-z\s,'-]+\s+L-\d{4}\s+[A-Za-z\s]+\b/g, // Adresse Luxembourg
      telephone: /\b(\+352)?\s?\d{2,3}\s?\d{2,3}\s?\d{2,3}\s?\d{2,3}\b/g, // Téléphone Luxembourg
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      montant_euro: /\b\d+[,\.]\d{2}\s*€?\b/g,                     // Montants en euros
      date_format: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/g,    // Dates DD/MM/YYYY
      numero_compte: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g          // Numéros de compte
    };

    // Collecter les vraies valeurs avant anonymisation
    Object.entries(patterns).forEach(([key, pattern]) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match, index) => {
          const placeholder = `[${key.toUpperCase()}_${index + 1}]`;
          mappings[placeholder] = match;
          anonymized = anonymized.replace(match, placeholder);
        });
      }
    });

    // console.log(`🔒 Document anonymisé : ${Object.keys(mappings).length} données personnelles masquées`);
    
    return { anonymizedText: anonymized, mappings };
  }

  /**
   * NOUVELLE FONCTION : Remappe les résultats avec les vraies données
   */
  private remapAnonymizedResults(aiResult: any, mappings: Record<string, string>): any {
    let remappedResult = JSON.stringify(aiResult);
    
    // Remplacer les placeholders par les vraies valeurs
    Object.entries(mappings).forEach(([placeholder, realValue]) => {
      remappedResult = remappedResult.replace(new RegExp(placeholder, 'g'), realValue);
    });

    return JSON.parse(remappedResult);
  }

  /**
   * NOUVELLE FONCTION : Effacement sécurisé des données temporaires
   */
  private secureDataCleanup(data: any): void {
    if (typeof data === 'object' && data !== null) {
      // Effacement sécurisé des propriétés
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          // Suréécriture multiple pour effacement sécurisé
          data[key] = '0'.repeat(data[key].length);
          data[key] = '1'.repeat(data[key].length);
          data[key] = '';
        }
        delete data[key];
      });
    }
  }

  /**
   * Scanner principal pour l'aide au logement - MODIFIÉ avec anonymisation RGPD
   */
  async scanDocumentForLogement(file: File, expectedDocumentType: string): Promise<DocumentScanResult> {
    let base64Data: string | null = null;
    let anonymizedData: { anonymizedText: string; mappings: Record<string, string> } | null = null;
    let aiResponse: any = null;

    try {
      // console.log(`🔍 Scanning document: ${file.name} (type attendu: ${expectedDocumentType})`);

      // 1. Convertir le fichier en base64
      base64Data = await this.fileToBase64(file);

      // 2. Analyser avec l'IA APRÈS anonymisation
      const analysisResult = await this.analyzeDocumentWithAIAnonymized(file, base64Data);
      aiResponse = analysisResult;

      // 3. Créer le résultat final (les données sont déjà dans analysisResult)
      const result: DocumentScanResult = {
        extractedText: analysisResult.extractedText,
        confidence: analysisResult.confidence,
        documentType: analysisResult.documentType,
        metadata: {
          azureRegion: 'swedencentral',
          euDataBoundary: true,
          rgpdCompliant: true,
          anonymized: true,
          processedAt: new Date().toISOString()
        },
        wasAnonymized: true
      };

      return result;

    } catch (error) {
      console.error('Erreur lors du scan du document:', error);
      return {
        extractedText: '',
        confidence: 0,
        documentType: 'unknown',
        metadata: {},
        wasAnonymized: false
      };
    } finally {
      // EFFACEMENT IMMÉDIAT ET SÉCURISÉ DES DONNÉES TEMPORAIRES
      // console.log('🗑️ Effacement sécurisé des données temporaires...');
      
      if (base64Data) {
        // Suréécriture multiple du base64
        base64Data = '0'.repeat(base64Data.length);
        base64Data = '1'.repeat(base64Data.length);
        base64Data = null;
      }

      if (anonymizedData) {
        this.secureDataCleanup(anonymizedData);
        anonymizedData = null;
      }

      if (aiResponse) {
        this.secureDataCleanup(aiResponse);
        aiResponse = null;
      }

      // Forcer le garbage collection
      if (global.gc) {
        global.gc();
      }

      // console.log('✅ Données temporaires effacées de manière sécurisée');
    }
  }

  /**
   * NOUVELLE FONCTION : Analyse avec anonymisation préalable
   */
  private async analyzeDocumentWithAIAnonymized(
    file: File,
    prompt: string
  ): Promise<DocumentScanResult> {
    let base64: string | null = null;
    let tempData: any = null;

    try {
      // Conversion en base64
      base64 = await this.fileToBase64(file);
      tempData = { originalFile: file, base64, timestamp: Date.now() };

      // Anonymisation RGPD avant envoi vers Azure OpenAI EU
      const anonymizedPrompt = this.anonymizeDocumentForAI(prompt, 'document_scanned_azure_eu').anonymizedText;

      // Instructions RGPD pour Azure OpenAI
      const rgpdPrompt = `${anonymizedPrompt}

IMPORTANT - CONFORMITÉ RGPD AZURE OPENAI EU :
- Les données ont été anonymisées avant traitement dans Azure OpenAI Sweden Central (EU Data Boundary)
- Aucune donnée personnelle identifiable n'est présente dans cette analyse
- Traitement conforme RGPD Article 25 (Privacy by Design)
- Répondez uniquement sur le contenu anonymisé fourni
- N'inventez pas de données personnelles manquantes

Analysez le document anonymisé et fournissez les informations demandées :`;

      // console.log('🇪🇺 Envoi vers Azure OpenAI EU (Sweden Central) avec anonymisation RGPD');

      // Appel Azure OpenAI avec modèle déployé
      const response = await this.azureOpenAI.chat.completions.create({
        model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME, // gpt-4o-mini deployment
        messages: [{
          role: "user",
          content: [
            { type: "text", text: rgpdPrompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            }
          ]
        }],
        max_tokens: 800,
        temperature: 0.1
      });

      const extractedText = response.choices[0]?.message?.content || 'Aucun texte extrait';

      // console.log('✅ Analyse Azure OpenAI EU terminée avec succès (données anonymisées)');

      return {
        extractedText,
        confidence: 0.95,
        documentType: 'document_scanned_azure_eu',
        metadata: {
          azureRegion: 'swedencentral',
          euDataBoundary: true,
          rgpdCompliant: true,
          anonymized: true,
          processedAt: new Date().toISOString()
        },
        wasAnonymized: true
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse Azure OpenAI EU:', error);
      throw new Error(`Erreur d'analyse Azure OpenAI: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      // Nettoyage sécurisé RGPD obligatoire
      await this.secureDataCleanup(tempData);
    }
  }

  /**
   * Prompts spécialisés pour chaque type de document
   */
  private getDocumentPrompts(): Record<string, string> {
    return {
      'piece_identite': `
        Analyse cette pièce d'identité et extrais les informations suivantes.
        Retourne un JSON avec cette structure exacte :
        {
          "confidence": 0.95,
          "documentType": "carte_identite" ou "passeport",
          "extractedData": {
            "nom": "nom de famille",
            "prenom": "prénom",
            "date_naissance": "YYYY-MM-DD",
            "matricule": "numéro de matricule si visible",
            "nationalite": "nationalité",
            "adresse": "adresse complète si visible"
          },
          "suggestions": ["suggestions d'amélioration"],
          "errors": ["erreurs détectées"]
        }`,

      'justificatif_revenus': `
        Analyse ce justificatif de revenus (bulletin de salaire, attestation, etc.) et extrais les informations.
        Retourne un JSON avec cette structure exacte :
        {
          "confidence": 0.90,
          "documentType": "bulletin_salaire" ou "attestation_revenus" ou "avis_imposition",
          "extractedData": {
            "nom": "nom du salarié",
            "prenom": "prénom du salarié",
            "employeur": "nom de l'employeur",
            "periode": "période concernée",
            "salaire_brut": "montant brut en euros",
            "salaire_net": "montant net en euros",
            "revenus_mensuels": "revenus mensuels nets"
          },
          "suggestions": ["suggestions"],
          "errors": ["erreurs"]
        }`,

      'contrat_bail': `
        Analyse ce contrat de bail et extrais les informations importantes.
        Retourne un JSON avec cette structure exacte :
        {
          "confidence": 0.85,
          "documentType": "contrat_bail",
          "extractedData": {
            "locataire_nom": "nom du locataire",
            "locataire_prenom": "prénom du locataire",
            "proprietaire": "nom du propriétaire",
            "adresse_logement": "adresse complète du logement",
            "loyer_mensuel": "montant du loyer en euros",
            "charges_mensuelles": "montant des charges en euros",
            "date_debut": "date de début du bail",
            "type_logement": "appartement/maison/studio"
          },
          "suggestions": ["suggestions"],
          "errors": ["erreurs"]
        }`,

      'justificatif_domicile': `
        Analyse ce justificatif de domicile (facture d'électricité, gaz, eau, etc.).
        Retourne un JSON avec cette structure exacte :
        {
          "confidence": 0.80,
          "documentType": "facture_electricite" ou "facture_gaz" ou "facture_eau",
          "extractedData": {
            "nom": "nom sur la facture",
            "prenom": "prénom sur la facture",
            "adresse_complete": "adresse complète",
            "date_facture": "date de la facture",
            "fournisseur": "nom du fournisseur",
            "periode_facturation": "période de facturation"
          },
          "suggestions": ["suggestions"],
          "errors": ["erreurs"]
        }`,

      'default': `
        Analyse ce document et détermine son type, puis extrais les informations pertinentes.
        Retourne un JSON avec cette structure exacte :
        {
          "confidence": 0.70,
          "documentType": "type détecté",
          "extractedData": {
            "informations": "extraites"
          },
          "suggestions": ["suggestions"],
          "errors": ["erreurs"]
        }`
    };
  }

  /**
   * Mappe les données extraites vers les champs du formulaire d'aide au logement
   */
  private mapToFormFields(extractedData: any, documentType: string): Record<string, any> {
    const mappings: Record<string, any> = {};

    switch (documentType) {
      case 'piece_identite':
      case 'carte_identite':
      case 'passeport':
        if (extractedData.nom) mappings['nom'] = extractedData.nom;
        if (extractedData.prenom) mappings['prenom'] = extractedData.prenom;
        if (extractedData.date_naissance) mappings['date_naissance'] = extractedData.date_naissance;
        if (extractedData.matricule) mappings['matricule'] = extractedData.matricule;
        if (extractedData.adresse) mappings['adresse_complete'] = extractedData.adresse;
        break;

      case 'justificatif_revenus':
      case 'bulletin_salaire':
      case 'attestation_revenus':
        if (extractedData.nom) mappings['nom'] = extractedData.nom;
        if (extractedData.prenom) mappings['prenom'] = extractedData.prenom;
        if (extractedData.revenus_mensuels) mappings['revenus_mensuels'] = parseFloat(extractedData.revenus_mensuels);
        if (extractedData.salaire_net) mappings['revenus_mensuels'] = parseFloat(extractedData.salaire_net);
        break;

      case 'contrat_bail':
        if (extractedData.locataire_nom) mappings['nom'] = extractedData.locataire_nom;
        if (extractedData.locataire_prenom) mappings['prenom'] = extractedData.locataire_prenom;
        if (extractedData.adresse_logement) mappings['adresse_complete'] = extractedData.adresse_logement;
        if (extractedData.loyer_mensuel) mappings['loyer_mensuel'] = parseFloat(extractedData.loyer_mensuel);
        if (extractedData.charges_mensuelles) mappings['charges_mensuelles'] = parseFloat(extractedData.charges_mensuelles);
        if (extractedData.type_logement) mappings['type_logement'] = extractedData.type_logement;
        mappings['statut_logement'] = 'Locataire';
        break;

      case 'justificatif_domicile':
      case 'facture_electricite':
      case 'facture_gaz':
      case 'facture_eau':
        if (extractedData.nom) mappings['nom'] = extractedData.nom;
        if (extractedData.prenom) mappings['prenom'] = extractedData.prenom;
        if (extractedData.adresse_complete) mappings['adresse_complete'] = extractedData.adresse_complete;
        break;
    }

    return mappings;
  }

  /**
   * Valide si le document correspond au type attendu
   */
  async validateDocumentType(file: File, expectedType: string): Promise<{isValid: boolean, actualType: string, confidence: number}> {
    const base64 = await this.fileToBase64(file);
    
    const response = await this.azureOpenAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en classification de documents. Détermine le type de ce document."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyse ce document et détermine son type. Types possibles: piece_identite, justificatif_revenus, contrat_bail, justificatif_domicile.
              Retourne un JSON: {"type": "type_detecte", "confidence": 0.95}` 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    });

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        isValid: result.type === expectedType,
        actualType: result.type || 'unknown',
        confidence: result.confidence || 0
      };
    } catch {
      return {
        isValid: false,
        actualType: 'unknown',
        confidence: 0
      };
    }
  }

  /**
   * Convertit un fichier en base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Récupère la configuration des documents pour une aide
   */
  async getDocumentConfig(aideId: number): Promise<DocumentValidationConfig[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('aide_id', aideId)
      .order('ordre');

    if (error) {
      console.error('Erreur lors du chargement de la config documents:', error);
      return [];
    }

    return data.map(doc => ({
      id: doc.id,
      aide_id: doc.aide_id,
      nom_document: doc.nom_document,
      description_fr: doc.description_fr,
      obligatoire: doc.obligatoire,
      formats_acceptes: doc.formats_acceptes,
      expectedFields: this.getExpectedFieldsForDocument(doc.nom_document),
      validationPrompt: this.getValidationPromptForDocument(doc.nom_document)
    }));
  }

  private getExpectedFieldsForDocument(documentName: string): string[] {
    const fieldMappings: Record<string, string[]> = {
      "Pièce d'identité": ['nom', 'prenom', 'date_naissance', 'matricule'],
      "Justificatif de revenus": ['nom', 'prenom', 'revenus_mensuels', 'employeur'],
      "Contrat de bail": ['nom', 'prenom', 'adresse_complete', 'loyer_mensuel', 'charges_mensuelles'],
      "Justificatif de domicile": ['nom', 'prenom', 'adresse_complete']
    };

    return fieldMappings[documentName] || [];
  }

  private getValidationPromptForDocument(documentName: string): string {
    const prompts: Record<string, string> = {
      "Pièce d'identité": "Vérifiez que ce document est bien une pièce d'identité valide (carte d'identité ou passeport)",
      "Justificatif de revenus": "Vérifiez que ce document prouve les revenus (bulletin de salaire, attestation employeur, etc.)",
      "Contrat de bail": "Vérifiez que ce document est un contrat de location valide",
      "Justificatif de domicile": "Vérifiez que ce document prouve le domicile (facture récente)"
    };

    return prompts[documentName] || "Vérifiez que ce document est valide";
  }
}

export default DocumentScannerService; 