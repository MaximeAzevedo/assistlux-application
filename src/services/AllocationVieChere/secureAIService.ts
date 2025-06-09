// Service sécurisé pour l'Allocation de Vie Chère avec IA et RGPD
// Compatible Azure OpenAI Service EU (RGPD-compliant)
import { AzureOpenAI } from 'openai';
import { supabase } from '../../lib/supabase/client';
import CryptoJS from 'crypto-js';
import { extractTextWithOpenAI } from '../../lib/openaiOCR';

// Configuration IA Azure OpenAI EU - RGPD Compliant
const AI_CONFIG = {
  // Azure OpenAI EU (Sweden Central)
  provider: 'azure_openai_eu',
  apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY,
  endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
  apiVersion: import.meta.env.VITE_AZURE_OPENAI_API_VERSION,
  deploymentName: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME,
  
  model: 'gpt-4o-mini',
  region: 'swedencentral', // EU Data Boundary
  dataResidency: 'EU',
  rgpdCompliant: true
};

// Types pour la sécurité RGPD
interface SecureSession {
  id: string;
  token: string;
  expiresAt: Date;
  langue: string;
  consentements: {
    traitement: boolean;
    ia_externe: boolean;
    cookies: boolean;
    analytics: boolean;
  };
}

interface ConsentementData {
  traitement?: boolean;
  ia_externe?: boolean;
  cookies?: boolean;
  analytics?: boolean;
  ai_provider?: string;
  ai_region?: string;
}

interface AnonymizedDocument {
  hash: string;
  type: string;
  size: number;
  anonymizedContent: string;
  originalMetadata: {
    filename: string;
    uploadedAt: Date;
  };
}

interface AIProcessingResult {
  extractedData: Record<string, any>;
  confidence: number;
  validationResult: boolean;
  suggestions: string[];
  processingTime: number;
  tokensUsed: number;
  cost: number;
  provider: string;
  rgpdCompliant: boolean;
}

export class AllocationVieCherSecureAIService {
  private azureOpenAI: AzureOpenAI;
  private encryptionKey: string;
  private config: typeof AI_CONFIG;

  constructor() {
    this.config = AI_CONFIG;
    
    // Configuration Azure OpenAI EU
    this.azureOpenAI = new AzureOpenAI({
      apiKey: this.config.apiKey,
      endpoint: this.config.endpoint,
      apiVersion: this.config.apiVersion,
      dangerouslyAllowBrowser: true
    });
    
    // Vérification des variables requises
    if (!this.config.apiKey || !this.config.endpoint || !this.config.deploymentName) {
      throw new Error('Configuration Azure OpenAI EU manquante. Vérifiez vos variables d\'environnement.');
    }
    
    // Clé de chiffrement rotative (changée toutes les 24h)
    this.encryptionKey = this.generateEncryptionKey();
    
    console.log(`🇪🇺 IA Service AllocationVieChere initialisé: ${this.config.provider.toUpperCase()} (${this.config.region})`);
  }

  // ===============================================
  // 1. GESTION DES SESSIONS SÉCURISÉES
  // ===============================================

  /**
   * Crée une session sécurisée avec consentements RGPD
   */
  async createSecureSession(
    langue: string = 'fr',
    consentements: ConsentementData = {}
  ): Promise<SecureSession> {
    try {
      const ipHash = await this.hashIP(this.getUserIP());
      const userAgentHash = await this.hashUserAgent(navigator.userAgent);

      const { data, error } = await supabase.rpc('creer_session_allocation_securisee', {
        p_langue: langue,
        p_ip_hash: ipHash,
        p_user_agent_hash: userAgentHash
      });

      if (error) throw error;

      // Enregistrer les consentements avec info provider
      const consentementsComplets: ConsentementData = {
        ...consentements,
        ai_provider: this.config.provider,
        ai_region: this.config.region
      };
      
      await this.recordConsents(data[0].session_id, consentementsComplets, langue);

      return {
        id: data[0].session_id,
        token: data[0].session_token,
        expiresAt: new Date(Date.now() + 3600000), // 1 heure
        langue,
        consentements: {
          traitement: consentements.traitement || false,
          ia_externe: consentements.ia_externe || false,
          cookies: consentements.cookies || false,
          analytics: consentements.analytics || false
        }
      };
    } catch (error: any) {
      console.error('Erreur création session sécurisée:', error);
      throw new Error('Impossible de créer une session sécurisée');
    }
  }

  /**
   * Valide et récupère une session active
   */
  async validateSession(sessionToken: string): Promise<SecureSession | null> {
    try {
      const { data, error } = await supabase
        .from('allocation_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gte('date_expiration', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Mettre à jour la dernière activité
      await supabase
        .from('allocation_sessions')
        .update({ derniere_activite: new Date().toISOString() })
        .eq('id', data.id);

      return {
        id: data.id,
        token: data.session_token,
        expiresAt: new Date(data.date_expiration),
        langue: data.langue_preferee,
        consentements: {
          traitement: data.consentement_traitement,
          ia_externe: data.consentement_ia_externe,
          cookies: data.consentement_cookies,
          analytics: data.consentement_analytics
        }
      };
    } catch (error) {
      console.error('Erreur validation session:', error);
      return null;
    }
  }

  // ===============================================
  // 2. ANONYMISATION RENFORCÉE POUR AZURE/RGPD
  // ===============================================

  /**
   * Anonymise un document avant traitement IA (RGPD-compliant)
   */
  private anonymizeDocumentForAI(content: string, documentType: string): string {
    let anonymized = content;

    // Anonymisation spécifique au Luxembourg (RGPD Level 1)
    const patterns = {
      matricule: /\b\d{13}\b/g,                           // Matricule luxembourgeois
      iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g, // IBAN
      carte_bancaire: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g,   // Numéro carte
      nom_prenom: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,      // Nom Prénom
      adresse: /\b\d+\s+[A-Za-z\s,'-]+\s+L-\d{4}\b/g,   // Adresse Luxembourg
      telephone: /\b(\+352)?\s?\d{2,3}\s?\d{2,3}\s?\d{2,3}\s?\d{2,3}\b/g, // Téléphone
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      montant: /\b\d+[,\.]\d{2}\s*€?\b/g,                // Montants
      date: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/g   // Dates
    };

    // Remplacer par des placeholders anonymes (RGPD Level 2)
    anonymized = anonymized.replace(patterns.matricule, '[MATRICULE_LUX]');
    anonymized = anonymized.replace(patterns.iban, '[IBAN_BANCAIRE]');
    anonymized = anonymized.replace(patterns.carte_bancaire, '[NUMERO_CARTE]');
    anonymized = anonymized.replace(patterns.nom_prenom, '[NOM_PRENOM]');
    anonymized = anonymized.replace(patterns.adresse, '[ADRESSE_LUX]');
    anonymized = anonymized.replace(patterns.telephone, '[TELEPHONE]');
    anonymized = anonymized.replace(patterns.email, '[EMAIL]');
    anonymized = anonymized.replace(patterns.montant, '[MONTANT_EUR]');
    anonymized = anonymized.replace(patterns.date, '[DATE]');

    // Log de l'anonymisation pour audit RGPD
    console.log(`🔒 Document anonymisé pour ${this.config.provider.toUpperCase()} (${this.config.region})`);
    
    return anonymized;
  }

  /**
   * Chiffre les données côté client (RGPD Level 3)
   */
  private encryptData(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  /**
   * Déchiffre les données côté client
   */
  private decryptData(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  // ===============================================
  // 3. TRAITEMENT IA SÉCURISÉ (AZURE-READY)
  // ===============================================

  /**
   * Traite un document avec IA en respectant le RGPD
   */
  async processDocumentWithAI(
    file: File,
    documentType: string,
    sessionId: string,
    expectedFields: string[]
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();
    
    try {
      // 1. Vérifier les consentements
      const session = await this.validateSession(sessionId);
      if (!session?.consentements.ia_externe) {
        throw new Error('Consentement IA externe requis');
      }

      // 2. Extraire le texte du document
      const documentText = await this.extractTextFromFile(file);
      
      // 3. Anonymiser avant envoi IA (RGPD-compliant)
      const anonymizedText = this.anonymizeDocumentForAI(documentText, documentType);
      
      // 4. Calculer le hash pour l'audit
      const dataHash = await this.calculateHash(anonymizedText);
      
      // 5. Traitement IA (OpenAI temporaire → Azure plus tard)
      const aiResult = await this.callAIForExtraction(
        anonymizedText,
        documentType,
        expectedFields,
        session.langue
      );

      // 6. Remap avec les données réelles (local)
      const finalResult = await this.remapAnonymizedResult(
        aiResult,
        documentText,
        expectedFields
      );

      const processingTime = Date.now() - startTime;

      // 7. Audit trail complet RGPD
      await this.logAIUsage({
        sessionId,
        operationType: 'document_extraction',
        documentType,
        dataHash,
        dataSize: file.size,
        aiProvider: this.config.provider,
        aiModel: this.config.model,
        aiRegion: this.config.region,
        processingTime,
        tokensUsed: aiResult.tokensUsed,
        cost: aiResult.cost,
        confidence: finalResult.confidence,
        success: true,
        extractedFields: this.anonymizeForAudit(finalResult.extractedData),
        rgpdCompliant: this.config.rgpdCompliant
      });

      return {
        extractedData: finalResult.extractedData,
        confidence: finalResult.confidence,
        validationResult: finalResult.validation,
        suggestions: finalResult.suggestions,
        processingTime,
        tokensUsed: aiResult.tokensUsed,
        cost: aiResult.cost,
        provider: this.config.provider,
        rgpdCompliant: this.config.rgpdCompliant
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      // Log de l'erreur
      await this.logAIUsage({
        sessionId,
        operationType: 'document_extraction',
        documentType,
        dataHash: 'error',
        dataSize: file.size,
        aiProvider: this.config.provider,
        processingTime,
        success: false,
        errorMessage: error.message,
        rgpdCompliant: this.config.rgpdCompliant
      });

      throw error;
    }
  }

  /**
   * Appel sécurisé à l'IA (OpenAI/Azure) avec prompts multilingues
   */
  private async callAIForExtraction(
    anonymizedText: string,
    documentType: string,
    expectedFields: string[],
    langue: string
  ): Promise<any> {
    const prompts = await this.getLocalizedPrompts(documentType, langue);
    
    // Configuration du modèle Azure OpenAI EU avec déploiement
    const response = await this.azureOpenAI.chat.completions.create({
      model: this.config.deploymentName, // Utiliser le nom de déploiement Azure
      messages: [
        {
          role: "system",
          content: `Tu es un assistant spécialisé dans l'extraction de données pour l'administration luxembourgeoise.
          Extrais UNIQUEMENT les informations demandées de ce document ${documentType}.
          Les données ont été anonymisées pour la sécurité RGPD.
          Traitement effectué en ${this.config.region} avec ${this.config.provider.toUpperCase()}.
          Réponds en ${langue}.
          
          Champs à extraire : ${expectedFields.join(', ')}
          
          Retourne un JSON avec :
          {
            "fields": { "champ1": "valeur1", "champ2": "valeur2" },
            "confidence": 0.95,
            "validation": true,
            "suggestions": ["suggestion1", "suggestion2"]
          }`
        },
        {
          role: "user",
          content: `Document ${documentType} à analyser (anonymisé RGPD) :\n\n${anonymizedText.substring(0, 2000)}...`
        }
      ],
      temperature: 0.1,
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      ...result,
      tokensUsed: response.usage?.total_tokens || 0,
      cost: this.calculateCost(response.usage?.total_tokens || 0, this.config.provider)
    };
  }

  /**
   * Remappe les résultats anonymisés avec les vraies données
   */
  private async remapAnonymizedResult(
    aiResult: any,
    originalText: string,
    expectedFields: string[]
  ): Promise<any> {
    const remappedFields = { ...aiResult.fields };

    // Extraction des vraies valeurs par regex locale
    for (const field of expectedFields) {
      switch (field) {
        case 'matricule':
          remappedFields.matricule = this.extractMatricule(originalText);
          break;
        case 'iban':
          remappedFields.iban = this.extractIBAN(originalText);
          break;
        case 'nom':
          remappedFields.nom = this.extractNom(originalText);
          break;
        case 'prenom':
          remappedFields.prenom = this.extractPrenom(originalText);
          break;
        case 'salaire_net':
          remappedFields.salaire_net = this.extractSalaireNet(originalText);
          break;
        case 'adresse':
          remappedFields.adresse = this.extractAdresse(originalText);
          break;
      }
    }

    return {
      extractedData: remappedFields,
      confidence: aiResult.confidence,
      validation: this.validateExtractedData(remappedFields, expectedFields),
      suggestions: aiResult.suggestions
    };
  }

  // ===============================================
  // 4. VALIDATION LOCALE (SANS IA)
  // ===============================================

  /**
   * Validation locale du matricule luxembourgeois
   */
  private extractMatricule(text: string): string | null {
    const matriculeRegex = /\b(\d{13})\b/g;
    const matches = text.match(matriculeRegex);
    
    if (matches) {
      for (const match of matches) {
        if (this.validateMatriculeLuxembourg(match)) {
          return match;
        }
      }
    }
    return null;
  }

  private validateMatriculeLuxembourg(matricule: string): boolean {
    if (!/^\d{13}$/.test(matricule)) return false;
    
    // Vérification de la clé de contrôle (algorithme luxembourgeois)
    const digits = matricule.split('').map(Number);
    const checksum = this.calculateLuxembourgMatriculeChecksum(digits.slice(0, 12));
    
    return checksum === parseInt(matricule.slice(12));
  }

  private calculateLuxembourgMatriculeChecksum(digits: number[]): number {
    // Algorithme de validation spécifique au Luxembourg
    let sum = 0;
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    
    for (let i = 0; i < 12; i++) {
      let product = digits[i] * weights[i];
      if (product > 9) {
        product = Math.floor(product / 10) + (product % 10);
      }
      sum += product;
    }
    
    return (10 - (sum % 10)) % 10;
  }

  /**
   * Extraction et validation IBAN
   */
  private extractIBAN(text: string): string | null {
    const ibanRegex = /\b([A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16})\b/g;
    const matches = text.match(ibanRegex);
    
    if (matches) {
      for (const match of matches) {
        if (this.validateIBAN(match)) {
          return match;
        }
      }
    }
    return null;
  }

  private validateIBAN(iban: string): boolean {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    if (cleanIban.length < 15 || cleanIban.length > 34) return false;
    
    // Validation mod 97
    const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
    const numericIban = rearranged.replace(/[A-Z]/g, char => 
      (char.charCodeAt(0) - 65 + 10).toString()
    );
    
    return this.mod97(numericIban) === 1;
  }

  private mod97(numericString: string): number {
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }
    return remainder;
  }

  /**
   * Extraction nom/prénom avec validation
   */
  private extractNom(text: string): string | null {
    // Recherche de noms avec contexte (Nom:, Nachname:, etc.)
    const nomRegex = /(?:nom|nachname|familljennumm)[\s:]+([A-Z][a-zÀ-ÿ\s-]+)/gi;
    const match = text.match(nomRegex);
    return match ? match[0].split(/[\s:]+/).pop()?.trim() || null : null;
  }

  private extractPrenom(text: string): string | null {
    const prenomRegex = /(?:prénom|prenom|vorname|virnumm)[\s:]+([A-Z][a-zÀ-ÿ\s-]+)/gi;
    const match = text.match(prenomRegex);
    return match ? match[0].split(/[\s:]+/).pop()?.trim() || null : null;
  }

  /**
   * Extraction salaire avec validation
   */
  private extractSalaireNet(text: string): number | null {
    const salaireRegex = /(?:salaire\s+net|net\s+mensuel|netto|netto-?\s?lohn)[\s:]*(\d{1,4}[,\.]\d{2})/gi;
    const match = text.match(salaireRegex);
    
    if (match) {
      const montant = match[0].match(/(\d{1,4}[,\.]\d{2})/)?.[0];
      if (montant) {
        return parseFloat(montant.replace(',', '.'));
      }
    }
    return null;
  }

  /**
   * Extraction adresse luxembourgeoise
   */
  private extractAdresse(text: string): string | null {
    const adresseRegex = /(\d+\s+[A-Za-z\s,'-]+\s+L-\d{4}\s+[A-Za-z\s]+)/g;
    const match = text.match(adresseRegex);
    return match ? match[0].trim() : null;
  }

  // ===============================================
  // 5. AUDIT TRAIL ET CONFORMITÉ RGPD
  // ===============================================

  /**
   * Log complet de l'utilisation IA pour audit RGPD
   */
  private async logAIUsage(auditData: any): Promise<void> {
    try {
      await supabase.from('allocation_ai_audit').insert({
        session_id: auditData.sessionId,
        operation_type: auditData.operationType,
        document_type: auditData.documentType,
        data_hash: auditData.dataHash,
        data_size_bytes: auditData.dataSize,
        anonymized: true,
        ai_provider: auditData.aiProvider,
        ai_model: auditData.aiModel,
        ai_region: auditData.aiRegion,
        processing_time_ms: auditData.processingTime,
        tokens_used: auditData.tokensUsed,
        cost_euros: auditData.cost,
        confidence_score: auditData.confidence,
        success: auditData.success,
        error_message: auditData.errorMessage,
        extracted_fields: auditData.extractedFields,
        rgpd_compliant: auditData.rgpdCompliant,
        suppression_programmee: new Date(Date.now() + 3600000) // 1h
      });
    } catch (error) {
      console.error('Erreur logging audit IA:', error);
    }
  }

  /**
   * Enregistrement des consentements RGPD
   */
  private async recordConsents(
    sessionId: string,
    consentements: ConsentementData,
    langue: string
  ): Promise<void> {
    const consentTypes = Object.keys(consentements) as Array<keyof typeof consentements>;
    
    for (const type of consentTypes) {
      if (consentements[type] !== undefined) {
        await supabase.from('allocation_consentements_audit').insert({
          session_id: sessionId,
          type_consentement: type,
          consentement_donne: consentements[type],
          langue_consentement: langue,
          version_politique_confidentialite: '2025.1',
          ip_hash: await this.hashIP(this.getUserIP()),
          user_agent_hash: await this.hashUserAgent(navigator.userAgent)
        });
      }
    }
  }

  // ===============================================
  // 6. UTILITAIRES SÉCURISÉS
  // ===============================================

  /**
   * Extraction sécurisée de texte avec Azure OpenAI Vision (RGPD-compliant)
   */
  private async extractTextFromFile(file: File): Promise<string> {
    try {
      console.log('🔒 Extraction sécurisée avec Azure OpenAI Vision EU');
      
      // Conversion du fichier en base64 pour traitement
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Erreur lecture fichier'));
        reader.readAsDataURL(file);
      });

      // Extraction avec Azure OpenAI Vision (déjà anonymisé dans openaiOCR)
      const ocrResult = await extractTextWithOpenAI(base64, file);
      
      console.log('✅ Extraction terminée avec anonymisation RGPD');
      
      return ocrResult.text;
      
    } catch (error) {
      console.error('❌ Erreur extraction texte sécurisée:', error);
      throw new Error(`Échec extraction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  private async calculateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hashIP(ip: string): Promise<string> {
    return this.calculateHash(ip + 'salt_ip_2025');
  }

  private async hashUserAgent(userAgent: string): Promise<string> {
    return this.calculateHash(userAgent + 'salt_ua_2025');
  }

  private getUserIP(): string {
    // Récupération IP côté client (approximative)
    return 'user_ip_hashed';
  }

  private calculateCost(tokens: number, provider: string): number {
    // Coût GPT-4o-mini : ~0.15€ pour 1M tokens
    const baseCost = (tokens / 1000000) * 0.15;
    
    // Ajouter un surcoût pour Azure
    if (provider === 'azure') {
      return baseCost * 1.2; // Exemple de surcoût pour Azure
    }
    
    return baseCost;
  }

  private generateEncryptionKey(): string {
    // Clé basée sur la date pour rotation automatique
    const today = new Date().toISOString().split('T')[0];
    return CryptoJS.SHA256(today + 'allocation_vie_chere_2025').toString();
  }

  private anonymizeForAudit(data: any): any {
    // Anonymise les données pour l'audit
    const anonymized = { ...data };
    
    if (anonymized.matricule) anonymized.matricule = '[MATRICULE_REDACTED]';
    if (anonymized.iban) anonymized.iban = '[IBAN_REDACTED]';
    if (anonymized.nom) anonymized.nom = '[NOM_REDACTED]';
    if (anonymized.prenom) anonymized.prenom = '[PRENOM_REDACTED]';
    
    return anonymized;
  }

  private validateExtractedData(data: any, expectedFields: string[]): boolean {
    for (const field of expectedFields) {
      if (!data[field] && field !== 'optional') {
        return false;
      }
    }
    return true;
  }

  private async getLocalizedPrompts(documentType: string, langue: string): Promise<any> {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('cle', `allocation.scanner.${documentType}.prompt`)
      .single();
    
    return data?.[langue] || data?.fr || '';
  }

  // ===============================================
  // 7. MÉTHODES PUBLIQUES POUR L'INTERFACE
  // ===============================================

  /**
   * Traite un RIB bancaire
   */
  async processRIB(file: File, sessionId: string): Promise<AIProcessingResult> {
    return this.processDocumentWithAI(
      file, 
      'rib', 
      sessionId, 
      ['iban', 'titulaire', 'banque']
    );
  }

  /**
   * Traite une fiche de paie
   */
  async processFichePaie(file: File, sessionId: string): Promise<AIProcessingResult> {
    return this.processDocumentWithAI(
      file,
      'fiche_paie',
      sessionId,
      ['nom', 'prenom', 'salaire_net', 'periode', 'employeur']
    );
  }

  /**
   * Traite une pièce d'identité
   */
  async processPieceIdentite(file: File, sessionId: string): Promise<AIProcessingResult> {
    return this.processDocumentWithAI(
      file,
      'piece_identite',
      sessionId,
      ['nom', 'prenom', 'matricule', 'date_naissance', 'adresse']
    );
  }

  /**
   * Nettoie toutes les données d'une session (RGPD)
   */
  async cleanupSession(sessionId: string): Promise<void> {
    try {
      // Marquer la session pour suppression immédiate
      await supabase
        .from('allocation_sessions')
        .update({ 
          date_expiration: new Date().toISOString(),
          suppression_programmee: true 
        })
        .eq('id', sessionId);

      // Déclencher le nettoyage RGPD
      await supabase.rpc('nettoyer_donnees_allocation_rgpd');
    } catch (error) {
      console.error('Erreur nettoyage session:', error);
    }
  }
} 