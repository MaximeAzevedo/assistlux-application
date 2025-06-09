import { Document } from './FormConfigService';
import { UserResponse } from './FormLogicService';

export interface DocumentStatus {
  document: Document;
  required: boolean;
  uploaded: boolean;
  validated: boolean;
  errors: string[];
  file?: File;
  preview?: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

export class DocumentService {
  private static instance: DocumentService;
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // Augmenté à 50MB pour photos haute résolution
  private readonly ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff',
    'image/heic',
    'image/heif',
    'image/avif',
    'image/svg+xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Extensions supportées par catégorie
  private readonly IMAGE_EXTENSIONS = {
    standard: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
    modern: ['webp', 'tiff', 'svg'],
    newest: ['heic', 'heif', 'avif']
  };

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  /**
   * Évalue le statut de tous les documents pour un utilisateur
   */
  evaluateDocumentStatus(
    documents: Document[], 
    userResponses: UserResponse,
    uploadedFiles: Map<string, File> = new Map()
  ): DocumentStatus[] {
    return documents.map(document => {
      const required = this.isDocumentRequired(document, userResponses);
      const file = uploadedFiles.get(document.id);
      const uploaded = !!file;
      const validated = uploaded ? this.validateDocument(document, file).isValid : false;

      return {
        document,
        required,
        uploaded,
        validated,
        errors: uploaded ? this.validateDocument(document, file).errors : [],
        file,
        preview: file ? this.generatePreview(file) : undefined
      };
    });
  }

  /**
   * Détermine si un document est requis selon les conditions
   */
  private isDocumentRequired(document: Document, userResponses: UserResponse): boolean {
    // Si le document est marqué comme obligatoire et aucune condition spécifique
    if (document.obligatoire && !document.condition_affichage) {
      return true;
    }

    // Évaluer les conditions spécifiques
    return this.evaluateDocumentCondition(document, userResponses);
  }

  /**
   * Évalue les conditions d'affichage spécifiques aux documents
   */
  private evaluateDocumentCondition(document: Document, userResponses: UserResponse): boolean {
    const condition = document.condition_affichage;
    
    if (!condition || condition === 'TOUJOURS') {
      return document.obligatoire;
    }

    try {
      switch (condition) {
        // Documents spécifiques à l'Assistance Judiciaire
        case 'SI_SALARIE':
          return this.hasValue(userResponses, 'revenu_salaire') && 
                 parseFloat(userResponses.revenu_salaire) > 0;

        case 'SI_LOCATAIRE':
          return userResponses.statut_logement === 'locataire';

        case 'SI_PROPRIETAIRE':
          return userResponses.statut_logement === 'proprietaire';

        case 'SI_MARIE':
          return userResponses.situation_familiale === 'marie';

        case 'SI_ENFANTS':
          return this.hasValue(userResponses, 'nb_enfants') && 
                 parseInt(userResponses.nb_enfants) > 0;

        case 'SI_CHOMEUR':
          return userResponses.statut_emploi === 'chomeur';

        case 'SI_RETRAITE':
          return userResponses.statut_emploi === 'retraite';

        case 'SI_DETENU':
          return userResponses.statut_special === 'detenu';

        case 'SI_REFUGIE':
          return userResponses.statut_special === 'refugie';

        case 'SI_REVENUS_ELEVES':
          const revenu = parseFloat(userResponses.revenu_total);
          return revenu > 3000; // Seuil configurable

        case 'SI_AFFAIRE_PENALE':
          return userResponses.type_affaire === 'penale';

        case 'SI_AFFAIRE_CIVILE':
          return userResponses.type_affaire === 'civile';

        case 'SI_AFFAIRE_ADMINISTRATIVE':
          return userResponses.type_affaire === 'administrative';

        // Conditions complexes
        default:
          return this.evaluateComplexDocumentCondition(condition, userResponses);
      }
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la condition document:', condition, error);
      return false;
    }
  }

  /**
   * Évalue une condition complexe pour les documents
   */
  private evaluateComplexDocumentCondition(condition: string, userResponses: UserResponse): boolean {
    // Exemples de conditions complexes pour documents :
    // "revenu_total > 2000 AND statut_logement = 'locataire'"
    // "nb_enfants > 0 OR situation_familiale = 'marie'"

    try {
      let evaluableCondition = condition;
      
      // Remplacer les variables par leurs valeurs
      Object.keys(userResponses).forEach(key => {
        const value = userResponses[key];
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        
        if (typeof value === 'string') {
          evaluableCondition = evaluableCondition.replace(regex, `'${value}'`);
        } else {
          evaluableCondition = evaluableCondition.replace(regex, String(value));
        }
      });

      // Remplacer les opérateurs logiques
      evaluableCondition = evaluableCondition
        .replace(/\bAND\b/g, '&&')
        .replace(/\bOR\b/g, '||')
        .replace(/\bNOT\b/g, '!')
        .replace(/=/g, '===');

      // Évaluation sécurisée
      return this.safeEval(evaluableCondition);
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la condition complexe document:', condition, error);
      return false;
    }
  }

  /**
   * Valide un fichier document
   */
  validateDocument(document: Document, file: File): DocumentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validation de la taille
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`Le fichier est trop volumineux (max ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    // 2. Validation du type de fichier
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Type de fichier non autorisé. Types acceptés: ${this.getAcceptedTypesString()}`);
    }

    // 3. Validation spécifique selon le format accepté du document
    if (document.format_accepte && document.format_accepte.length > 0) {
      const documentAllowedTypes = this.convertFormatToMimeTypes(document.format_accepte);
      if (!documentAllowedTypes.includes(file.type)) {
        errors.push(`Ce document doit être au format: ${document.format_accepte.join(', ')}`);
      }
    }

    // 4. Validation du nom de fichier
    if (file.name.length > 255) {
      errors.push('Le nom du fichier est trop long (max 255 caractères)');
    }

    // 5. Validation de l'extension
    const extension = this.getFileExtension(file.name);
    if (!extension) {
      errors.push('Le fichier doit avoir une extension');
    }

    // 6. Avertissements
    if (file.size > 5 * 1024 * 1024) { // 5MB
      warnings.push('Fichier volumineux - le téléchargement peut prendre du temps');
    }

    if (file.type === 'image/jpeg' || file.type === 'image/png') {
      warnings.push('Assurez-vous que l\'image est lisible et de bonne qualité');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  }

  /**
   * Génère un aperçu du fichier
   */
  private generatePreview(file: File): string | undefined {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }

  /**
   * Convertit les formats de document en types MIME
   */
  private convertFormatToMimeTypes(formats: string[]): string[] {
    const mimeTypeMap: { [key: string]: string[] } = {
      'PDF': ['application/pdf'],
      'JPG': ['image/jpeg'],
      'JPEG': ['image/jpeg'],
      'PNG': ['image/png'],
      'DOC': ['application/msword'],
      'DOCX': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'IMAGE': ['image/jpeg', 'image/png', 'image/jpg']
    };

    const mimeTypes: string[] = [];
    formats.forEach(format => {
      const types = mimeTypeMap[format.toUpperCase()];
      if (types) {
        mimeTypes.push(...types);
      }
    });

    return mimeTypes;
  }

  /**
   * Obtient l'extension d'un fichier
   */
  private getFileExtension(filename: string): string | null {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : null;
  }

  /**
   * Retourne la liste des types acceptés en format lisible
   */
  private getAcceptedTypesString(): string {
    return 'PDF, JPG, PNG, DOC, DOCX';
  }

  /**
   * Calcule le pourcentage de documents complétés
   */
  calculateCompletionPercentage(documentStatuses: DocumentStatus[]): number {
    const requiredDocs = documentStatuses.filter(status => status.required);
    if (requiredDocs.length === 0) return 100;

    const completedDocs = requiredDocs.filter(status => status.validated);
    return Math.round((completedDocs.length / requiredDocs.length) * 100);
  }

  /**
   * Obtient la liste des documents manquants
   */
  getMissingDocuments(documentStatuses: DocumentStatus[]): Document[] {
    return documentStatuses
      .filter(status => status.required && !status.validated)
      .map(status => status.document);
  }

  /**
   * Obtient la liste des documents avec erreurs
   */
  getDocumentsWithErrors(documentStatuses: DocumentStatus[]): DocumentStatus[] {
    return documentStatuses.filter(status => status.errors.length > 0);
  }

  /**
   * Génère un résumé des documents
   */
  generateDocumentSummary(documentStatuses: DocumentStatus[]): {
    total: number;
    required: number;
    uploaded: number;
    validated: number;
    missing: number;
    withErrors: number;
    completionPercentage: number;
  } {
    const total = documentStatuses.length;
    const required = documentStatuses.filter(s => s.required).length;
    const uploaded = documentStatuses.filter(s => s.uploaded).length;
    const validated = documentStatuses.filter(s => s.validated).length;
    const missing = documentStatuses.filter(s => s.required && !s.uploaded).length;
    const withErrors = documentStatuses.filter(s => s.errors.length > 0).length;
    const completionPercentage = this.calculateCompletionPercentage(documentStatuses);

    return {
      total,
      required,
      uploaded,
      validated,
      missing,
      withErrors,
      completionPercentage
    };
  }

  /**
   * Prépare les données pour l'envoi
   */
  prepareDocumentsForSubmission(documentStatuses: DocumentStatus[]): {
    isReady: boolean;
    documents: { id: string; name: string; file: File }[];
    missingRequired: string[];
    errors: string[];
  } {
    const requiredDocs = documentStatuses.filter(s => s.required);
    const validatedDocs = requiredDocs.filter(s => s.validated);
    const missingRequired = requiredDocs
      .filter(s => !s.validated)
      .map(s => s.document.nom);

    const errors: string[] = [];
    documentStatuses.forEach(status => {
      if (status.errors.length > 0) {
        errors.push(`${status.document.nom}: ${status.errors.join(', ')}`);
      }
    });

    const documents = validatedDocs
      .filter(s => s.file)
      .map(s => ({
        id: s.document.id,
        name: s.document.nom,
        file: s.file!
      }));

    return {
      isReady: missingRequired.length === 0 && errors.length === 0,
      documents,
      missingRequired,
      errors
    };
  }

  // Utilitaires
  private hasValue(obj: any, key: string): boolean {
    return obj[key] !== undefined && obj[key] !== null && obj[key] !== '';
  }

  private safeEval(expression: string): boolean {
    const allowedPattern = /^[0-9\s+\-*/<>=!&|()'"a-zA-Z_]+$/;
    if (!allowedPattern.test(expression)) {
      throw new Error('Expression non autorisée');
    }

    try {
       
      return Boolean(eval(expression));
    } catch {
      return false;
    }
  }

  /**
   * Nettoie les aperçus générés pour éviter les fuites mémoire
   */
  cleanupPreviews(documentStatuses: DocumentStatus[]): void {
    documentStatuses.forEach(status => {
      if (status.preview && status.preview.startsWith('blob:')) {
        URL.revokeObjectURL(status.preview);
      }
    });
  }
}

// Export de l'instance singleton
export const documentService = DocumentService.getInstance(); 