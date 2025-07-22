// Types pour la fonctionnalité Préparation Logement Social

// ═══════════════════════════════════════════════════════════
// TYPES DE BASE
// ═══════════════════════════════════════════════════════════

export type Nationalite = 'luxembourgeoise' | 'ue' | 'hors_ue';
export type SituationFamiliale = 'celibataire' | 'couple' | 'divorce' | 'veuf';
export type SituationLogement = 'locataire' | 'proprietaire' | 'heberge' | 'sdf';
export type PensionAlimentaire = 'percoit' | 'verse' | 'les_deux' | 'aucune';
export type SituationParticuliere = 'handicap' | 'regroupement_familial' | 'normale';
export type LangueVideo = 'fr' | 'en' | 'pt' | 'uk' | 'fa' | 'ar' | 'tr';

// ═══════════════════════════════════════════════════════════
// QUESTIONNAIRE INITIAL
// ═══════════════════════════════════════════════════════════

export interface ReponseQuestionnaire {
  nationalite: Nationalite;
  nationaliteConjoint?: Nationalite; // Si en couple
  situationFamiliale: SituationFamiliale;
  nombreEnfants: number;
  autresPersonnes: boolean;
  nombreAutresPersonnes?: number;
  situationLogement: SituationLogement;
  pensionAlimentaire: PensionAlimentaire;
  situationParticuliere: SituationParticuliere;
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: keyof ReponseQuestionnaire;
  titre: string;
  description?: string;
  type: 'select' | 'number' | 'boolean';
  options?: QuestionOption[];
  condition?: (reponses: Partial<ReponseQuestionnaire>) => boolean;
  min?: number;
  max?: number;
}

// ═══════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════

export interface Document {
  id: string;
  nom: string;
  description: string;
  categorie: 'identite' | 'revenus' | 'logement' | 'famille' | 'medical' | 'autre';
  obligatoire: boolean;
  conditions: string[]; // Conditions pour que ce document soit requis
  videoFileName?: string; // Nom du fichier vidéo (sans extension/langue)
  exempleFileName?: string; // Nom du fichier exemple
  conseils?: string[];
}

export interface DocumentAvecStatut extends Document {
  possede: boolean;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════
// ÉTAT DE L'APPLICATION
// ═══════════════════════════════════════════════════════════

export interface LogementSocialState {
  etape: 'questionnaire' | 'checklist' | 'export';
  reponses: ReponseQuestionnaire | null;
  documentsRequis: DocumentAvecStatut[];
  progression: number;
  langueVideo: LangueVideo;
  errors: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════
// EXPORT ET SAUVEGARDE
// ═══════════════════════════════════════════════════════════

export interface ExportData {
  reponses: ReponseQuestionnaire;
  documentsRequis: DocumentAvecStatut[];
  dateGeneration: string;
  progression: number;
  documentsManquants: string[];
  documentsPresents: string[];
}

// ═══════════════════════════════════════════════════════════
// POPUP VIDÉO/EXEMPLE
// ═══════════════════════════════════════════════════════════

export interface PopupContent {
  type: 'video' | 'exemple';
  documentId: string;
  langue?: LangueVideo;
  isOpen: boolean;
} 