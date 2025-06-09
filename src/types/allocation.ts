// Types centralisés pour l'allocation de vie chère

// ═══════════════════════════════════════════════════════════
// TYPES DE BASE
// ═══════════════════════════════════════════════════════════

export type SituationFamiliale = 'celibataire' | 'marie' | 'divorce' | 'veuf' | 'union_libre' | 'separe';
export type StatutLogement = 'proprietaire' | 'locataire' | 'heberge' | 'usufruit';
export type TypeDocument = 'piece_identite' | 'rib' | 'fiche_paie' | 'justificatif_domicile' | 'acte_naissance';
export type NiveauSecurite = 'low' | 'medium' | 'high';
export type StatusProcess = 'pending' | 'completed' | 'error';

// ═══════════════════════════════════════════════════════════
// DONNÉES DU FORMULAIRE
// ═══════════════════════════════════════════════════════════

export interface DemandeurPrincipal {
  civilite?: string;
  nom: string;
  prenom: string;
  matricule: string;
  date_naissance: string;
  lieu_naissance?: string;
  nationalite?: string;
  adresse_rue: string;
  adresse_numero?: string;
  adresse_code_postal: string;
  adresse_commune: string;
  telephone?: string;
  email?: string;
}

export interface CompositionMenage {
  situation_familiale: SituationFamiliale;
  conjoint_present?: boolean;
  conjoint_nom?: string;
  conjoint_prenom?: string;
  conjoint_matricule?: string;
  conjoint_date_naissance?: string;
  nombre_enfants_0_17: number;
  nombre_enfants_18_24: number;
  autres_personnes: number;
  total_personnes_menage: number;
  personnes_charge: PersonneACharge[];
}

export interface PersonneACharge {
  nom: string;
  prenom: string;
  date_naissance: string;
  relation: string;
  handicap?: boolean;
}

export interface Logement {
  statut_logement: StatutLogement;
  loyer_mensuel?: number;
  charges_mensuelles?: number;
  total_logement_mensuel: number;
  superficie_logement?: number;
  nombre_pieces?: number;
  adresse_identique_demandeur: boolean;
  adresse_logement?: {
    rue: string;
    numero?: string;
    code_postal: string;
    commune: string;
  };
}

export interface Revenus {
  // Demandeur principal
  revenus_salaire_demandeur: number;
  revenus_pension_demandeur: number;
  revenus_chomage_demandeur: number;
  revenus_autres_demandeur: number;
  total_revenus_demandeur: number;
  
  // Conjoint
  conjoint_revenus: boolean;
  revenus_salaire_conjoint: number;
  revenus_pension_conjoint: number;
  revenus_chomage_conjoint: number;
  revenus_autres_conjoint: number;
  total_revenus_conjoint: number;
  
  // Ménage
  allocations_familiales: number;
  autres_revenus_menage: number;
  total_revenus_menage: number;
}

export interface Documents {
  iban?: string;
  titulaire_compte?: string;
  documents_fournis: TypeDocument[];
  documents_manquants: TypeDocument[];
}

// ═══════════════════════════════════════════════════════════
// STRUCTURE COMPLÈTE DU FORMULAIRE
// ═══════════════════════════════════════════════════════════

export interface AllocationFormData {
  etape1: DemandeurPrincipal;
  etape2: CompositionMenage;
  etape3: Logement;
  etape4: Revenus;
  etape5: Documents;
}

// ═══════════════════════════════════════════════════════════
// SÉCURITÉ ET RGPD
// ═══════════════════════════════════════════════════════════

export interface ConsentementsRGPD {
  traitement: boolean;
  ia_externe: boolean;
  cookies: boolean;
  analytics: boolean;
}

export interface SessionSecurisee {
  id: string;
  token: string;
  expiresAt: Date;
  langue: string;
  consentements: ConsentementsRGPD;
  createdAt: Date;
  lastActivity: Date;
}

// ═══════════════════════════════════════════════════════════
// CALCULS ET ÉLIGIBILITÉ
// ═══════════════════════════════════════════════════════════

export interface SeuilsEligibilite {
  [nbPersonnes: number]: number;
}

export interface ResultatEligibilite {
  eligible: boolean;
  revenus: number;
  seuil: number;
  pourcentageSeuil: number;
  montantEstime: number;
  nbPersonnes: number;
  details?: {
    montantBase: number;
    majorationEnfants: number;
    reduction?: number;
  };
}

// ═══════════════════════════════════════════════════════════
// VALIDATION ET ERREURS
// ═══════════════════════════════════════════════════════════

export interface ErreursValidation {
  [champ: string]: string;
}

export interface EtapeValidation {
  etape: number;
  valide: boolean;
  erreurs: ErreursValidation;
  champsRequis: string[];
  progression: number;
}

// ═══════════════════════════════════════════════════════════
// TRAITEMENT IA
// ═══════════════════════════════════════════════════════════

export interface ResultatTraitementIA {
  success: boolean;
  confidence: number;
  extractedData: Record<string, any>;
  suggestions: string[];
  cout?: number;
  duree?: number;
  error?: string;
}

export interface AuditIA {
  sessionId: string;
  timestamp: Date;
  typeDocument: TypeDocument;
  fileName: string;
  resultat: ResultatTraitementIA;
  donneesSensibles: boolean;
  anonymise: boolean;
}

// ═══════════════════════════════════════════════════════════
// CONFIRMATION ET SOUMISSION
// ═══════════════════════════════════════════════════════════

export interface ConfirmationData {
  numeroReference: string;
  dateSubmission: Date;
  estimationMontant: number;
  delaiTraitement: string;
  formData: AllocationFormData;
  eligibilite: ResultatEligibilite;
  sessionId: string;
}

export interface EtapeProcessus {
  label: string;
  status: StatusProcess;
  dateEstimee?: Date;
  description?: string;
}

// ═══════════════════════════════════════════════════════════
// PDF ET GÉNÉRATION
// ═══════════════════════════════════════════════════════════

export interface PDFFormData {
  // Mappé depuis AllocationFormData pour la génération PDF
  nom?: string;
  prenom?: string;
  matricule?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  nationalite?: string;
  adresse_rue?: string;
  adresse_numero?: string;
  adresse_code_postal?: string;
  adresse_localite?: string;
  telephone?: string;
  email?: string;
  situation_familiale?: SituationFamiliale;
  nombre_enfants?: number;
  type_logement?: StatutLogement;
  loyer_mensuel?: number;
  charges_mensuelles?: number;
  salaire_net?: number;
  allocations_familiales?: number;
  autres_revenus?: number;
  total_revenus?: number;
  iban?: string;
  titulaire_compte?: string;
}

export interface PDFFieldMapping {
  fieldName: string;
  dataKey: keyof PDFFormData;
  type: 'text' | 'checkbox' | 'radio';
  transform?: (value: any) => string;
}

// ═══════════════════════════════════════════════════════════
// PROPS DES COMPOSANTS
// ═══════════════════════════════════════════════════════════

export interface StepProps<T = any> {
  data: T;
  onChange: (data: T) => void;
  errors: ErreursValidation;
  session?: SessionSecurisee;
  onDocumentUpload?: (file: File, documentType: TypeDocument) => Promise<ResultatTraitementIA>;
  aiProcessing?: boolean;
  readonly?: boolean;
}

export interface WizardState {
  currentStep: number;
  formData: AllocationFormData;
  errors: ErreursValidation;
  loading: boolean;
  progress: number;
  session: SessionSecurisee | null;
  aiProcessing: boolean;
  aiResults: AuditIA[];
} 