// Utilitaires de calculs centralisés

import { 
  AllocationFormData, 
  ResultatEligibilite, 
  CompositionMenage, 
  Revenus 
} from '../types/allocation';
import { 
  SEUILS_ELIGIBILITE_2025, 
  MONTANTS_ALLOCATION 
} from '../constants/allocation';

// ═══════════════════════════════════════════════════════════
// CALCULS DE BASE
// ═══════════════════════════════════════════════════════════

export const calculateTotalPersonnesMenage = (composition: CompositionMenage): number => {
  const demandeur = 1;
  const conjoint = composition.conjoint_present ? 1 : 0;
  const enfants = (composition.nombre_enfants_0_17 || 0) + (composition.nombre_enfants_18_24 || 0);
  const autres = composition.autres_personnes || 0;
  
  return demandeur + conjoint + enfants + autres;
};

export const calculateTotalEnfants = (composition: CompositionMenage): number => {
  return (composition.nombre_enfants_0_17 || 0) + (composition.nombre_enfants_18_24 || 0);
};

export const calculateTotalRevenussDemandeur = (revenus: Revenus): number => {
  return (revenus.revenus_salaire_demandeur || 0) +
         (revenus.revenus_pension_demandeur || 0) +
         (revenus.revenus_chomage_demandeur || 0) +
         (revenus.revenus_autres_demandeur || 0);
};

export const calculateTotalRevenusConjoint = (revenus: Revenus): number => {
  if (!revenus.conjoint_revenus) return 0;
  
  return (revenus.revenus_salaire_conjoint || 0) +
         (revenus.revenus_pension_conjoint || 0) +
         (revenus.revenus_chomage_conjoint || 0) +
         (revenus.revenus_autres_conjoint || 0);
};

export const calculateTotalRevenusMenage = (revenus: Revenus): number => {
  const totalDemandeur = calculateTotalRevenussDemandeur(revenus);
  const totalConjoint = calculateTotalRevenusConjoint(revenus);
  const allocations = revenus.allocations_familiales || 0;
  const autresRevenus = revenus.autres_revenus_menage || 0;
  
  return totalDemandeur + totalConjoint + allocations + autresRevenus;
};

// ═══════════════════════════════════════════════════════════
// CALCULS D'ÉLIGIBILITÉ
// ═══════════════════════════════════════════════════════════

export const getSeuilEligibilite = (nbPersonnes: number): number => {
  // Utiliser le seuil correspondant, max 8 personnes
  const seuil = SEUILS_ELIGIBILITE_2025[Math.min(nbPersonnes, 8)];
  return seuil || SEUILS_ELIGIBILITE_2025[8];
};

export const calculateEligibilite = (
  revenus: number, 
  nbPersonnes: number
): { eligible: boolean; pourcentageSeuil: number; seuil: number } => {
  const seuil = getSeuilEligibilite(nbPersonnes);
  const pourcentageSeuil = (revenus / seuil) * 100;
  const eligible = revenus <= seuil;
  
  return {
    eligible,
    pourcentageSeuil,
    seuil
  };
};

export const calculateMontantEstime = (
  revenus: number,
  nbPersonnes: number,
  nbEnfants: number
): number => {
  const { eligible, pourcentageSeuil, seuil } = calculateEligibilite(revenus, nbPersonnes);
  
  if (!eligible) return 0;
  
  // Calcul du montant de base selon la taille du ménage
  const montantBase = nbPersonnes === 1 
    ? MONTANTS_ALLOCATION.BASE_1_PERSONNE 
    : MONTANTS_ALLOCATION.BASE_MENAGE;
  
  // Majoration pour les enfants
  const majorationEnfants = nbEnfants * MONTANTS_ALLOCATION.MAJORATION_ENFANT;
  
  // Calcul du taux selon le niveau de revenus par rapport au seuil
  const tauxAllocation = Math.max(
    MONTANTS_ALLOCATION.TAUX_MINIMUM,
    1 - (revenus / seuil)
  );
  
  // Montant final calculé
  const montantCalcule = Math.round((montantBase + majorationEnfants) * tauxAllocation);
  
  // Application du plafond maximum
  return Math.min(montantCalcule, MONTANTS_ALLOCATION.PLAFOND_MAXIMUM);
};

// ═══════════════════════════════════════════════════════════
// CALCUL COMPLET D'ÉLIGIBILITÉ
// ═══════════════════════════════════════════════════════════

export const calculateResultatEligibilite = (
  formData: AllocationFormData
): ResultatEligibilite => {
  // Calculer les données nécessaires
  const nbPersonnes = calculateTotalPersonnesMenage(formData.etape2);
  const nbEnfants = calculateTotalEnfants(formData.etape2);
  const revenus = calculateTotalRevenusMenage(formData.etape4);
  const seuil = getSeuilEligibilite(nbPersonnes);
  
  // Calculer l'éligibilité
  const { eligible, pourcentageSeuil } = calculateEligibilite(revenus, nbPersonnes);
  
  // Calculer le montant estimé
  const montantEstime = calculateMontantEstime(revenus, nbPersonnes, nbEnfants);
  
  // Détails du calcul
  const montantBase = nbPersonnes === 1 
    ? MONTANTS_ALLOCATION.BASE_1_PERSONNE 
    : MONTANTS_ALLOCATION.BASE_MENAGE;
  const majorationEnfants = nbEnfants * MONTANTS_ALLOCATION.MAJORATION_ENFANT;
  
  return {
    eligible,
    revenus,
    seuil,
    pourcentageSeuil,
    montantEstime,
    nbPersonnes,
    details: {
      montantBase,
      majorationEnfants,
      reduction: eligible ? seuil - revenus : undefined
    }
  };
};

// ═══════════════════════════════════════════════════════════
// UTILITAIRES DE FORMATAGE
// ═══════════════════════════════════════════════════════════

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-LU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('fr-LU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-LU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// ═══════════════════════════════════════════════════════════
// HELPERS DE PROGRESSION
// ═══════════════════════════════════════════════════════════

export const calculateProgression = (formData: AllocationFormData): number => {
  const etapes = ['etape1', 'etape2', 'etape3', 'etape4', 'etape5'] as const;
  let etapesCompletes = 0;
  
  etapes.forEach(etape => {
    const data = formData[etape];
    if (data && Object.keys(data).length > 0) {
      // Vérifier si au moins les champs principaux sont remplis
      const hasRequiredFields = hasBasicRequiredFields(etape, data);
      if (hasRequiredFields) {
        etapesCompletes++;
      }
    }
  });
  
  return (etapesCompletes / etapes.length) * 100;
};

const hasBasicRequiredFields = (etape: string, data: any): boolean => {
  switch (etape) {
    case 'etape1':
      return !!(data.nom && data.prenom && data.matricule);
    case 'etape2':
      return !!(data.situation_familiale);
    case 'etape3':
      return !!(data.statut_logement);
    case 'etape4':
      return !!(data.total_revenus_menage !== undefined);
    case 'etape5':
      return true; // Étape optionnelle
    default:
      return false;
  }
};

// ═══════════════════════════════════════════════════════════
// GÉNÉRATEURS DE RÉFÉRENCES
// ═══════════════════════════════════════════════════════════

export const generateNumeroReference = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `AVC-${timestamp}-${random}`;
};

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

// ═══════════════════════════════════════════════════════════
// VALIDATIONS DE COHÉRENCE
// ═══════════════════════════════════════════════════════════

export const validateCoherence = (formData: AllocationFormData): string[] => {
  const warnings: string[] = [];
  
  // Vérifier la cohérence revenus/logement
  const revenus = calculateTotalRevenusMenage(formData.etape4);
  const loyer = formData.etape3?.loyer_mensuel || 0;
  const charges = formData.etape3?.charges_mensuelles || 0;
  const totalLogement = loyer + charges;
  
  if (totalLogement > revenus * 0.5) {
    warnings.push('Vos frais de logement représentent plus de 50% de vos revenus');
  }
  
  // Vérifier la cohérence nombre de personnes/revenus
  const nbPersonnes = calculateTotalPersonnesMenage(formData.etape2);
  const revenuParPersonne = revenus / nbPersonnes;
  
  if (revenuParPersonne < 500) {
    warnings.push('Le revenu par personne semble très faible (moins de 500€)');
  }
  
  // Vérifier si conjoint déclaré mais pas de revenus conjoint
  if (formData.etape2?.conjoint_present && !formData.etape4?.conjoint_revenus) {
    warnings.push('Vous avez déclaré un conjoint mais aucun revenu conjoint');
  }
  
  return warnings;
}; 