// Constantes pour la fonctionnalité Préparation Logement Social

import { Question, Document, QuestionOption } from '../types/logementSocial';

// ═══════════════════════════════════════════════════════════
// OPTIONS DES QUESTIONS
// ═══════════════════════════════════════════════════════════

const NATIONALITES: QuestionOption[] = [
  { value: 'luxembourgeoise', label: 'Luxembourgeoise' },
  { value: 'ue', label: 'Union Européenne' },
  { value: 'hors_ue', label: 'Hors Union Européenne' }
];

const SITUATIONS_FAMILIALES: QuestionOption[] = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'couple', label: 'En couple (marié/partenariat/union libre)' },
  { value: 'divorce', label: 'Divorcé(e) / Séparé(e)' },
  { value: 'veuf', label: 'Veuf/Veuve' }
];

const SITUATIONS_LOGEMENT: QuestionOption[] = [
  { value: 'locataire', label: 'Locataire' },
  { value: 'proprietaire', label: 'Propriétaire' },
  { value: 'heberge', label: 'Hébergé(e) chez quelqu\'un' },
  { value: 'sdf', label: 'Sans domicile fixe' }
];

const PENSIONS_ALIMENTAIRES: QuestionOption[] = [
  { value: 'aucune', label: 'Aucune pension alimentaire' },
  { value: 'percoit', label: 'Je perçois des pensions alimentaires' },
  { value: 'verse', label: 'Je verse des pensions alimentaires' },
  { value: 'les_deux', label: 'Je perçois ET je verse des pensions' }
];

const SITUATIONS_PARTICULIERES: QuestionOption[] = [
  { value: 'normale', label: 'Situation normale' },
  { value: 'handicap', label: 'Handicap ou problème médical' },
  { value: 'regroupement_familial', label: 'Regroupement familial en cours' }
];

// ═══════════════════════════════════════════════════════════
// QUESTIONNAIRE - 7 QUESTIONS OPTIMALES
// ═══════════════════════════════════════════════════════════

export const QUESTIONS: Question[] = [
  {
    id: 'nationalite',
    titre: 'Quelle est votre nationalité ?',
    description: 'Cela détermine si vous avez besoin d\'autorisations de séjour',
    type: 'select',
    options: NATIONALITES
  },
  {
    id: 'situationFamiliale',
    titre: 'Quelle est votre situation familiale ?',
    description: 'Cela détermine les documents de votre conjoint/partenaire',
    type: 'select',
    options: SITUATIONS_FAMILIALES
  },
  {
    id: 'nationaliteConjoint',
    titre: 'Quelle est la nationalité de votre conjoint/partenaire ?',
    type: 'select',
    options: NATIONALITES,
    condition: (reponses) => reponses.situationFamiliale === 'couple'
  },
  {
    id: 'nombreEnfants',
    titre: 'Combien d\'enfants à charge avez-vous ?',
    description: 'Enfants mineurs ou majeurs de moins de 25 ans à votre charge',
    type: 'number',
    min: 0,
    max: 10
  },
  {
    id: 'autresPersonnes',
    titre: 'D\'autres personnes vivent-elles avec vous ?',
    description: 'Famille élargie, colocataires, etc.',
    type: 'boolean'
  },
  {
    id: 'situationLogement',
    titre: 'Quelle est votre situation de logement actuelle ?',
    type: 'select',
    options: SITUATIONS_LOGEMENT
  },
  {
    id: 'pensionAlimentaire',
    titre: 'Concernant les pensions alimentaires :',
    type: 'select',
    options: PENSIONS_ALIMENTAIRES
  },
  {
    id: 'situationParticuliere',
    titre: 'Avez-vous une situation particulière ?',
    type: 'select',
    options: SITUATIONS_PARTICULIERES
  }
];

// ═══════════════════════════════════════════════════════════
// DOCUMENTS - LISTE COMPLÈTE AVEC LOGIQUE CONDITIONNELLE
// ═══════════════════════════════════════════════════════════

export const DOCUMENTS: Document[] = [
  // IDENTITÉ - DEMANDEUR
  {
    id: 'carte_identite_demandeur',
    nom: 'Carte d\'identité du demandeur',
    description: 'Votre pièce d\'identité officielle',
    categorie: 'identite',
    obligatoire: true,
    conditions: [], // Toujours requis
    videoFileName: 'carte-identite',
    exempleFileName: 'exemple-carte-identite.pdf',
    conseils: ['Vérifiez que votre carte est encore valide', 'Faites une copie recto-verso']
  },
  {
    id: 'autorisation_sejour_demandeur',
    nom: 'Autorisation de séjour du demandeur',
    description: 'Si vous n\'êtes pas luxembourgeois',
    categorie: 'identite',
    obligatoire: true,
    conditions: ['nationalite_hors_ue', 'nationalite_ue'],
    videoFileName: 'autorisation-sejour',
    exempleFileName: 'exemple-autorisation-sejour.pdf'
  },

  // IDENTITÉ - CONJOINT
  {
    id: 'carte_identite_conjoint',
    nom: 'Carte d\'identité du conjoint/partenaire',
    description: 'Pièce d\'identité de votre conjoint',
    categorie: 'identite',
    obligatoire: true,
    conditions: ['situation_couple'],
    videoFileName: 'carte-identite',
    exempleFileName: 'exemple-carte-identite.pdf'
  },
  {
    id: 'autorisation_sejour_conjoint',
    nom: 'Autorisation de séjour du conjoint/partenaire',
    description: 'Si votre conjoint n\'est pas luxembourgeois',
    categorie: 'identite',
    obligatoire: true,
    conditions: ['situation_couple', 'conjoint_non_luxembourgeois'],
    videoFileName: 'autorisation-sejour',
    exempleFileName: 'exemple-autorisation-sejour.pdf'
  },

  // REGROUPEMENT FAMILIAL
  {
    id: 'certificat_regroupement_familial',
    nom: 'Certificat de regroupement familial',
    description: 'Si applicable à votre situation',
    categorie: 'famille',
    obligatoire: true,
    conditions: ['situation_regroupement_familial'],
    videoFileName: 'regroupement-familial',
    exempleFileName: 'exemple-regroupement-familial.pdf'
  },

  // ENFANTS ET AUTRES PERSONNES
  {
    id: 'cartes_identite_enfants',
    nom: 'Cartes d\'identité des enfants',
    description: 'Toutes les pièces d\'identité de vos enfants',
    categorie: 'famille',
    obligatoire: true,
    conditions: ['a_enfants'],
    videoFileName: 'carte-identite',
    exempleFileName: 'exemple-carte-identite.pdf'
  },
  {
    id: 'autorisations_sejour_enfants',
    nom: 'Autorisations de séjour des enfants',
    description: 'Si vos enfants ne sont pas luxembourgeois',
    categorie: 'famille',
    obligatoire: true,
    conditions: ['a_enfants', 'enfants_non_luxembourgeois'],
    videoFileName: 'autorisation-sejour',
    exempleFileName: 'exemple-autorisation-sejour.pdf'
  },
  {
    id: 'cartes_identite_autres',
    nom: 'Cartes d\'identité des autres membres du foyer',
    description: 'Famille élargie, colocataires, etc.',
    categorie: 'famille',
    obligatoire: true,
    conditions: ['a_autres_personnes'],
    videoFileName: 'carte-identite',
    exempleFileName: 'exemple-carte-identite.pdf'
  },

  // SÉCURITÉ SOCIALE
  {
    id: 'certificat_coassurance',
    nom: 'Certificat de coassurance',
    description: 'Si applicable selon votre situation familiale',
    categorie: 'famille',
    obligatoire: false,
    conditions: ['situation_couple_ou_enfants'],
    videoFileName: 'coassurance',
    exempleFileName: 'exemple-coassurance.pdf'
  },
  {
    id: 'certificats_affiliation_ccss',
    nom: 'Certificats d\'affiliation à la sécurité sociale (CCSS)',
    description: 'Pour tous les membres ayant des revenus',
    categorie: 'revenus',
    obligatoire: true,
    conditions: [], // Toujours requis
    videoFileName: 'ccss',
    exempleFileName: 'exemple-ccss.pdf'
  },

  // DIVORCE
  {
    id: 'jugement_divorce',
    nom: 'Jugement de divorce ou déclaration de fin de partenariat',
    description: 'Document officiel de fin d\'union',
    categorie: 'famille',
    obligatoire: true,
    conditions: ['situation_divorce'],
    videoFileName: 'jugement-divorce',
    exempleFileName: 'exemple-jugement-divorce.pdf'
  },

  // REVENUS
  {
    id: 'certificats_revenus',
    nom: 'Certificats de revenus de l\'année N-1',
    description: 'Ou revenus des 3 derniers mois en cas de changement',
    categorie: 'revenus',
    obligatoire: true,
    conditions: [], // Toujours requis
    videoFileName: 'certificats-revenus',
    exempleFileName: 'exemple-certificat-revenus.pdf'
  },
  {
    id: 'attestation_pensions_percues',
    nom: 'Attestation des pensions alimentaires perçues',
    description: 'Si vous recevez des pensions alimentaires',
    categorie: 'revenus',
    obligatoire: true,
    conditions: ['percoit_pensions'],
    videoFileName: 'pensions-alimentaires',
    exempleFileName: 'exemple-pension-alimentaire.pdf'
  },
  {
    id: 'attestation_pensions_versees',
    nom: 'Attestation des pensions alimentaires versées',
    description: 'Si vous versez des pensions alimentaires',
    categorie: 'revenus',
    obligatoire: true,
    conditions: ['verse_pensions'],
    videoFileName: 'pensions-alimentaires',
    exempleFileName: 'exemple-pension-alimentaire.pdf'
  },

  // LOGEMENT
  {
    id: 'contrat_bail',
    nom: 'Copie du contrat de bail daté et signé',
    description: 'Signé par toutes les parties',
    categorie: 'logement',
    obligatoire: true,
    conditions: ['situation_locataire'],
    videoFileName: 'contrat-bail',
    exempleFileName: 'exemple-contrat-bail.pdf'
  },
  {
    id: 'preuves_paiement_loyer',
    nom: 'Preuves de paiement du loyer hors charges',
    description: '3 derniers mois',
    categorie: 'logement',
    obligatoire: true,
    conditions: ['situation_locataire'],
    videoFileName: 'preuves-loyer',
    exempleFileName: 'exemple-preuve-loyer.pdf'
  },
  {
    id: 'lettre_resiliation_bail',
    nom: 'Lettre de résiliation du bail',
    description: 'Si applicable à votre situation',
    categorie: 'logement',
    obligatoire: false,
    conditions: ['situation_resiliation'],
    videoFileName: 'resiliation-bail',
    exempleFileName: 'exemple-resiliation.pdf'
  },

  // MÉDICAL
  {
    id: 'certificat_medical',
    nom: 'Certificat médical spécialisé',
    description: 'Si applicable selon votre situation',
    categorie: 'medical',
    obligatoire: true,
    conditions: ['situation_handicap'],
    videoFileName: 'certificat-medical',
    exempleFileName: 'exemple-certificat-medical.pdf'
  },

  // SITUATIONS SPÉCIFIQUES
  {
    id: 'jugement_expulsion',
    nom: 'Jugement d\'expulsion',
    description: 'Si applicable à votre situation',
    categorie: 'logement',
    obligatoire: false,
    conditions: ['situation_expulsion'],
    videoFileName: 'jugement-expulsion',
    exempleFileName: 'exemple-jugement-expulsion.pdf'
  },
  {
    id: 'attestation_aptitude_logement',
    nom: 'Attestation d\'aptitude au logement autonome',
    description: 'Pour les personnes sans domicile fixe',
    categorie: 'autre',
    obligatoire: true,
    conditions: ['situation_sdf'],
    videoFileName: 'aptitude-logement',
    exempleFileName: 'exemple-aptitude-logement.pdf'
  },
  {
    id: 'avis_ministere_sante',
    nom: 'Avis du ministère de la Santé ou arrêté de fermeture',
    description: 'Si applicable à votre situation',
    categorie: 'autre',
    obligatoire: false,
    conditions: ['situation_fermeture_logement'],
    videoFileName: 'avis-ministere',
    exempleFileName: 'exemple-avis-ministere.pdf'
  },
  {
    id: 'autres_justificatifs',
    nom: 'Autres justificatifs spécifiques',
    description: 'Rapports médicaux, attestations de handicap, etc.',
    categorie: 'autre',
    obligatoire: false,
    conditions: ['situation_handicap'],
    videoFileName: 'autres-justificatifs',
    exempleFileName: 'exemple-autres-justificatifs.pdf'
  }
];

// ═══════════════════════════════════════════════════════════
// LANGUES DISPONIBLES
// ═══════════════════════════════════════════════════════════

export const LANGUES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' }
];

// ═══════════════════════════════════════════════════════════
// CATÉGORIES DE DOCUMENTS
// ═══════════════════════════════════════════════════════════

export const CATEGORIES = [
  { id: 'identite', label: 'Identité', icon: '🆔', color: 'blue' },
  { id: 'famille', label: 'Famille', icon: '👨‍👩‍👧‍👦', color: 'green' },
  { id: 'revenus', label: 'Revenus', icon: '💰', color: 'yellow' },
  { id: 'logement', label: 'Logement', icon: '🏠', color: 'purple' },
  { id: 'medical', label: 'Médical', icon: '🏥', color: 'red' },
  { id: 'autre', label: 'Autre', icon: '📄', color: 'gray' }
]; 