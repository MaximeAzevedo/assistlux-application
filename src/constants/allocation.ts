// Constantes centralisées pour l'allocation de vie chère

import { SeuilsEligibilite, SituationFamiliale, StatutLogement } from '../types/allocation';

// ═══════════════════════════════════════════════════════════
// SEUILS ET CALCULS 2025
// ═══════════════════════════════════════════════════════════

export const SEUILS_ELIGIBILITE_2025: SeuilsEligibilite = {
  1: 3500,  // 1 personne
  2: 5250,  // 2 personnes  
  3: 6300,  // 3 personnes
  4: 7350,  // 4 personnes
  5: 8400,  // 5 personnes
  6: 9450,  // 6 personnes
  7: 10500, // 7 personnes
  8: 11550  // 8+ personnes
};

export const MONTANTS_ALLOCATION = {
  BASE_1_PERSONNE: 200,
  BASE_MENAGE: 300,
  MAJORATION_ENFANT: 100,
  PLAFOND_MAXIMUM: 800,
  TAUX_MINIMUM: 0.1
};

export const DELAIS_TRAITEMENT = {
  STANDARD: "4 à 6 semaines",
  PRIORITAIRE: "2 à 3 semaines",
  URGENCE: "1 à 2 semaines"
};

// ═══════════════════════════════════════════════════════════
// OPTIONS DE FORMULAIRE
// ═══════════════════════════════════════════════════════════

export const SITUATIONS_FAMILIALES: { value: SituationFamiliale; label: string }[] = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'union_libre', label: 'Union libre' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'separe', label: 'Séparé(e)' },
  { value: 'veuf', label: 'Veuf/Veuve' }
];

export const STATUTS_LOGEMENT: { value: StatutLogement; label: string }[] = [
  { value: 'proprietaire', label: 'Propriétaire' },
  { value: 'locataire', label: 'Locataire' },
  { value: 'heberge', label: 'Hébergé(e) gratuitement' },
  { value: 'usufruit', label: 'Usufruit' }
];

export const NATIONALITES = [
  'Luxembourgeoise',
  'Française', 
  'Allemande',
  'Belge',
  'Portugaise',
  'Italienne',
  'Autre UE',
  'Autre'
];

export const CIVILITES = [
  { value: 'M', label: 'Monsieur' },
  { value: 'Mme', label: 'Madame' }
];

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════

export const CHAMPS_REQUIS = {
  ETAPE_1: [
    'nom', 'prenom', 'matricule', 'date_naissance', 
    'adresse_rue', 'adresse_code_postal', 'adresse_commune'
  ],
  ETAPE_2: [
    'situation_familiale', 'nombre_enfants_0_17', 'nombre_enfants_18_24', 
    'autres_personnes', 'total_personnes_menage'
  ],
  ETAPE_3: [
    'statut_logement', 'total_logement_mensuel'
  ],
  ETAPE_4: [
    'total_revenus_demandeur', 'total_revenus_menage'
  ],
  ETAPE_5: [] // Optionnel
};

export const REGEX_VALIDATION = {
  MATRICULE_LU: /^\d{13}$/,
  CODE_POSTAL_LU: /^L-\d{4}$/,
  TELEPHONE_LU: /^(\+352|00352|352)?\s?[0-9]{2,3}[\s.-]?[0-9]{2,3}[\s.-]?[0-9]{2,3}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  IBAN: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/
};

// ═══════════════════════════════════════════════════════════
// MESSAGES D'ERREUR
// ═══════════════════════════════════════════════════════════

export const MESSAGES_ERREUR = {
  CHAMP_REQUIS: 'Ce champ est requis',
  MATRICULE_INVALIDE: 'Le matricule doit contenir exactement 13 chiffres',
  CODE_POSTAL_INVALIDE: 'Le code postal doit être au format L-1234',
  EMAIL_INVALIDE: 'Adresse email invalide',
  TELEPHONE_INVALIDE: 'Numéro de téléphone invalide',
  IBAN_INVALIDE: 'IBAN invalide',
  DATE_INVALIDE: 'Date invalide',
  MONTANT_INVALIDE: 'Montant invalide',
  AGE_MINIMUM: 'Vous devez être majeur pour faire une demande',
  REVENUS_NEGATIFS: 'Les revenus ne peuvent pas être négatifs'
};

// ═══════════════════════════════════════════════════════════
// CONFIGURATION SÉCURITÉ/RGPD
// ═══════════════════════════════════════════════════════════

export const DUREE_SESSION_MINUTES = 60;
export const DUREE_CONSERVATION_DONNEES_HEURES = 1;

export const NIVEAUX_CONSENTEMENT = {
  MINIMAL: {
    traitement: true,
    ia_externe: false,
    cookies: false,
    analytics: false
  },
  STANDARD: {
    traitement: true,
    ia_externe: true,
    cookies: false,
    analytics: false
  },
  COMPLET: {
    traitement: true,
    ia_externe: true,
    cookies: true,
    analytics: true
  }
};

// ═══════════════════════════════════════════════════════════
// CONFIGURATION IA
// ═══════════════════════════════════════════════════════════

export const CONFIG_IA = {
  CONFIDENCE_MINIMUM: 0.7,
  COUT_PAR_PAGE: 0.02, // euros
  TIMEOUT_SECONDES: 30,
  RETRY_ATTEMPTS: 3,
  MODELS: {
    OCR: 'gpt-4-vision-preview',
    TEXT: 'gpt-4-turbo',
    VALIDATION: 'gpt-3.5-turbo'
  }
};

// ═══════════════════════════════════════════════════════════
// URLS ET ENDPOINTS
// ═══════════════════════════════════════════════════════════

export const ENDPOINTS = {
  SUPABASE: {
    CONFIG_AIDE: 'config_aide',
    ETAPES: 'etapes', 
    CHAMPS_FORMULAIRE: 'champs_formulaire',
    ALLOCATION_SESSIONS: 'allocation_sessions',
    ALLOCATION_AI_AUDIT: 'allocation_ai_audit'
  }
};

export const URLS_EXTERNES = {
  FNS_CONTACT: 'mailto:allocation@fns.lu',
  FNS_SITE: 'https://fns.lu',
  GOUVERNEMENT_LU: 'https://gouvernement.lu'
};

// ═══════════════════════════════════════════════════════════
// WIZARD CONFIGURATION
// ═══════════════════════════════════════════════════════════

export const ETAPES_WIZARD = [
  {
    id: 1,
    key: 'demandeur',
    label: 'Demandeur principal',
    description: 'Vos informations personnelles',
    icon: '👤'
  },
  {
    id: 2,
    key: 'menage',
    label: 'Composition du ménage',
    description: 'Votre situation familiale',
    icon: '👨‍👩‍👧‍👦'
  },
  {
    id: 3,
    key: 'logement',
    label: 'Logement',
    description: 'Votre situation de logement',
    icon: '🏠'
  },
  {
    id: 4,
    key: 'revenus',
    label: 'Revenus',
    description: 'Vos ressources financières',
    icon: '💰'
  },
  {
    id: 5,
    key: 'documents',
    label: 'Documents',
    description: 'Finalisation de votre demande',
    icon: '📄'
  }
];

export const PROCESSUS_TRAITEMENT = [
  { label: 'Soumission', status: 'completed' as const },
  { label: 'Vérification', status: 'pending' as const },
  { label: 'Traitement', status: 'pending' as const },
  { label: 'Décision', status: 'pending' as const },
  { label: 'Paiement', status: 'pending' as const }
]; 