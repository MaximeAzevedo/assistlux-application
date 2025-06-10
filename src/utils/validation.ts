// Utilitaires de validation centralisés

import { 
  ErreursValidation, 
  AllocationFormData, 
  DemandeurPrincipal,
  CompositionMenage,
  Logement,
  Revenus,
  Documents
} from '../types/allocation';
import { 
  REGEX_VALIDATION, 
  MESSAGES_ERREUR, 
  CHAMPS_REQUIS 
} from '../constants/allocation';
// Import des validations centralisées
import {
  isRequired as isRequiredUtil,
  isValidEmail,
  isValidPhone,
  isValidIBAN,
  isValidMatricule,
  isValidPostalCodeLU,
  isValidDate,
  isValidAge,
  isPositiveNumber
} from './validationUtils';

// ═══════════════════════════════════════════════════════════
// VALIDATEURS DE BASE - UTILISE VALIDATIONUTILS
// ═══════════════════════════════════════════════════════════

export const isRequired = isRequiredUtil;

export const isValidCodePostal = isValidPostalCodeLU;

export const isValidTelephone = (telephone: string): boolean => {
  return isValidPhone(telephone, 'LU');
};

export const isAdulte = (dateNaissance: string): boolean => {
  return isValidAge(dateNaissance, 18);
};

// Réexport des autres validations
export { isValidEmail, isValidMatricule, isValidIBAN, isValidDate, isPositiveNumber };

// ═══════════════════════════════════════════════════════════
// VALIDATEURS PAR ÉTAPE
// ═══════════════════════════════════════════════════════════

export const validateEtape1 = (data: Partial<DemandeurPrincipal>): ErreursValidation => {
  const erreurs: ErreursValidation = {};

  // Champs requis
  if (!isRequired(data.nom)) {
    erreurs.nom = MESSAGES_ERREUR.CHAMP_REQUIS;
  }
  
  if (!isRequired(data.prenom)) {
    erreurs.prenom = MESSAGES_ERREUR.CHAMP_REQUIS;
  }
  
  if (!isRequired(data.matricule)) {
    erreurs.matricule = MESSAGES_ERREUR.CHAMP_REQUIS;
  } else if (!isValidMatricule(data.matricule!)) {
    erreurs.matricule = MESSAGES_ERREUR.MATRICULE_INVALIDE;
  }
  
  if (!isRequired(data.date_naissance)) {
    erreurs.date_naissance = MESSAGES_ERREUR.CHAMP_REQUIS;
  } else if (!isValidDate(data.date_naissance!)) {
    erreurs.date_naissance = MESSAGES_ERREUR.DATE_INVALIDE;
  } else if (!isAdulte(data.date_naissance!)) {
    erreurs.date_naissance = MESSAGES_ERREUR.AGE_MINIMUM;
  }
  
  if (!isRequired(data.adresse_rue)) {
    erreurs.adresse_rue = MESSAGES_ERREUR.CHAMP_REQUIS;
  }
  
  if (!isRequired(data.adresse_code_postal)) {
    erreurs.adresse_code_postal = MESSAGES_ERREUR.CHAMP_REQUIS;
  } else if (!isValidCodePostal(data.adresse_code_postal!)) {
    erreurs.adresse_code_postal = MESSAGES_ERREUR.CODE_POSTAL_INVALIDE;
  }
  
  if (!isRequired(data.adresse_commune)) {
    erreurs.adresse_commune = MESSAGES_ERREUR.CHAMP_REQUIS;
  }

  // Champs optionnels mais validés si remplis
  if (data.email && !isValidEmail(data.email)) {
    erreurs.email = MESSAGES_ERREUR.EMAIL_INVALIDE;
  }
  
  if (data.telephone && !isValidTelephone(data.telephone)) {
    erreurs.telephone = MESSAGES_ERREUR.TELEPHONE_INVALIDE;
  }

  return erreurs;
};

export const validateEtape2 = (data: Partial<CompositionMenage>): ErreursValidation => {
  const erreurs: ErreursValidation = {};

  if (!isRequired(data.situation_familiale)) {
    erreurs.situation_familiale = MESSAGES_ERREUR.CHAMP_REQUIS;
  }

  // Validation des nombres d'enfants
  if (data.nombre_enfants_0_17 !== undefined && !isPositiveNumber(data.nombre_enfants_0_17)) {
    erreurs.nombre_enfants_0_17 = MESSAGES_ERREUR.MONTANT_INVALIDE;
  }
  
  if (data.nombre_enfants_18_24 !== undefined && !isPositiveNumber(data.nombre_enfants_18_24)) {
    erreurs.nombre_enfants_18_24 = MESSAGES_ERREUR.MONTANT_INVALIDE;
  }
  
  if (data.autres_personnes !== undefined && !isPositiveNumber(data.autres_personnes)) {
    erreurs.autres_personnes = MESSAGES_ERREUR.MONTANT_INVALIDE;
  }

  // Validation du conjoint si présent
  if (data.conjoint_present) {
    if (!isRequired(data.conjoint_nom)) {
      erreurs.conjoint_nom = MESSAGES_ERREUR.CHAMP_REQUIS;
    }
    if (!isRequired(data.conjoint_prenom)) {
      erreurs.conjoint_prenom = MESSAGES_ERREUR.CHAMP_REQUIS;
    }
    if (data.conjoint_matricule && !isValidMatricule(data.conjoint_matricule)) {
      erreurs.conjoint_matricule = MESSAGES_ERREUR.MATRICULE_INVALIDE;
    }
  }

  return erreurs;
};

export const validateEtape3 = (data: Partial<Logement>): ErreursValidation => {
  const erreurs: ErreursValidation = {};

  if (!isRequired(data.statut_logement)) {
    erreurs.statut_logement = MESSAGES_ERREUR.CHAMP_REQUIS;
  }

  // Validation du loyer pour les locataires
  if (data.statut_logement === 'locataire') {
    if (!data.loyer_mensuel || !isPositiveNumber(data.loyer_mensuel)) {
      erreurs.loyer_mensuel = 'Le loyer mensuel est requis pour les locataires';
    }
  }

  // Validation des montants
  if (data.loyer_mensuel !== undefined && !isPositiveNumber(data.loyer_mensuel)) {
    erreurs.loyer_mensuel = MESSAGES_ERREUR.MONTANT_INVALIDE;
  }
  
  if (data.charges_mensuelles !== undefined && !isPositiveNumber(data.charges_mensuelles)) {
    erreurs.charges_mensuelles = MESSAGES_ERREUR.MONTANT_INVALIDE;
  }

  return erreurs;
};

export const validateEtape4 = (data: Partial<Revenus>): ErreursValidation => {
  const erreurs: ErreursValidation = {};

  // Validation des revenus du demandeur
  if (data.revenus_salaire_demandeur !== undefined && !isPositiveNumber(data.revenus_salaire_demandeur)) {
    erreurs.revenus_salaire_demandeur = MESSAGES_ERREUR.REVENUS_NEGATIFS;
  }
  
  if (data.revenus_pension_demandeur !== undefined && !isPositiveNumber(data.revenus_pension_demandeur)) {
    erreurs.revenus_pension_demandeur = MESSAGES_ERREUR.REVENUS_NEGATIFS;
  }
  
  if (data.revenus_chomage_demandeur !== undefined && !isPositiveNumber(data.revenus_chomage_demandeur)) {
    erreurs.revenus_chomage_demandeur = MESSAGES_ERREUR.REVENUS_NEGATIFS;
  }

  // Validation des revenus du conjoint si applicable
  if (data.conjoint_revenus) {
    if (data.revenus_salaire_conjoint !== undefined && !isPositiveNumber(data.revenus_salaire_conjoint)) {
      erreurs.revenus_salaire_conjoint = MESSAGES_ERREUR.REVENUS_NEGATIFS;
    }
    
    if (data.revenus_pension_conjoint !== undefined && !isPositiveNumber(data.revenus_pension_conjoint)) {
      erreurs.revenus_pension_conjoint = MESSAGES_ERREUR.REVENUS_NEGATIFS;
    }
  }

  // Vérifier qu'au moins un revenu est renseigné
  const totalDemandeur = (data.revenus_salaire_demandeur || 0) + 
                        (data.revenus_pension_demandeur || 0) + 
                        (data.revenus_chomage_demandeur || 0) + 
                        (data.revenus_autres_demandeur || 0);
  
  const totalConjoint = data.conjoint_revenus ? 
    (data.revenus_salaire_conjoint || 0) + (data.revenus_pension_conjoint || 0) : 0;

  if (totalDemandeur === 0 && totalConjoint === 0) {
    erreurs.revenus_general = 'Au moins un revenu doit être renseigné';
  }

  return erreurs;
};

export const validateEtape5 = (data: Partial<Documents>): ErreursValidation => {
  const erreurs: ErreursValidation = {};

  // IBAN optionnel mais validé si rempli
  if (data.iban && !isValidIBAN(data.iban)) {
    erreurs.iban = MESSAGES_ERREUR.IBAN_INVALIDE;
  }

  return erreurs;
};

// ═══════════════════════════════════════════════════════════
// VALIDATEUR PRINCIPAL
// ═══════════════════════════════════════════════════════════

export const validateStep = (etape: number, data: any): ErreursValidation => {
  switch (etape) {
    case 1:
      return validateEtape1(data);
    case 2:
      return validateEtape2(data);
    case 3:
      return validateEtape3(data);
    case 4:
      return validateEtape4(data);
    case 5:
      return validateEtape5(data);
    default:
      return {};
  }
};

export const validateAllForm = (formData: AllocationFormData): ErreursValidation => {
  const allErrors: ErreursValidation = {};

  // Valider chaque étape
  const errors1 = validateEtape1(formData.etape1);
  const errors2 = validateEtape2(formData.etape2);
  const errors3 = validateEtape3(formData.etape3);
  const errors4 = validateEtape4(formData.etape4);
  const errors5 = validateEtape5(formData.etape5);

  // Combiner toutes les erreurs avec préfixe d'étape
  Object.keys(errors1).forEach(key => {
    allErrors[`etape1.${key}`] = errors1[key];
  });
  Object.keys(errors2).forEach(key => {
    allErrors[`etape2.${key}`] = errors2[key];
  });
  Object.keys(errors3).forEach(key => {
    allErrors[`etape3.${key}`] = errors3[key];
  });
  Object.keys(errors4).forEach(key => {
    allErrors[`etape4.${key}`] = errors4[key];
  });
  Object.keys(errors5).forEach(key => {
    allErrors[`etape5.${key}`] = errors5[key];
  });

  return allErrors;
};

// ═══════════════════════════════════════════════════════════
// FONCTIONS POUR HOOKS
// ═══════════════════════════════════════════════════════════

export const validateEtape = (etape: number, formData: AllocationFormData) => {
  const etapeKey = `etape${etape}` as keyof AllocationFormData;
  const data = formData[etapeKey];
  const erreurs = validateStep(etape, data);
  
  return {
    etape,
    valide: Object.keys(erreurs).length === 0,
    erreurs,
    champsRequis: CHAMPS_REQUIS[`ETAPE_${etape}` as keyof typeof CHAMPS_REQUIS] || [],
    progression: Object.keys(erreurs).length === 0 ? 100 : 0
  };
};

export const calculateProgress = (formData: AllocationFormData): number => {
  let totalFields = 0;
  let completedFields = 0;

  // Étape 1 - Champs obligatoires
  const requis1 = CHAMPS_REQUIS.ETAPE_1;
  totalFields += requis1.length;
  completedFields += requis1.filter(field => isRequired((formData.etape1 as any)?.[field])).length;

  // Étape 2 - Champs obligatoires
  const requis2 = CHAMPS_REQUIS.ETAPE_2;
  totalFields += requis2.length;
  completedFields += requis2.filter(field => isRequired((formData.etape2 as any)?.[field])).length;

  // Étape 3 - Champs obligatoires
  const requis3 = CHAMPS_REQUIS.ETAPE_3;
  totalFields += requis3.length;
  completedFields += requis3.filter(field => isRequired((formData.etape3 as any)?.[field])).length;

  // Étape 4 - Champs obligatoires
  const requis4 = CHAMPS_REQUIS.ETAPE_4;
  totalFields += requis4.length;
  completedFields += requis4.filter(field => isRequired((formData.etape4 as any)?.[field])).length;

  // Étape 5 est optionnelle, on ne la compte pas dans la progression

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}; 