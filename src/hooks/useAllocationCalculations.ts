import { useState, useEffect, useCallback, useMemo } from 'react';
import { AllocationFormData, ResultatEligibilite } from '../types/allocation';
import { SEUILS_ELIGIBILITE_2025, MONTANTS_ALLOCATION } from '../constants/allocation';
import { calculateResultatEligibilite, getSeuilEligibilite } from '../utils/calculations';

export const useAllocationCalculations = (formData: AllocationFormData) => {
  const [calculationResults, setCalculationResults] = useState<ResultatEligibilite | null>(null);
  const [loading, setLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // CALCULS TEMPS RÉEL
  // ═══════════════════════════════════════════════════════════

  const calculateEligibilityRealTime = useCallback(() => {
    if (!formData.etape2?.total_personnes_menage || formData.etape4?.total_revenus_menage === undefined) {
      return null;
    }

    setLoading(true);
    
    try {
      // Utiliser la fonction centralisée de calcul
      const result = calculateResultatEligibilite(formData);
      setCalculationResults(result);
      return result;

    } catch (error) {
      console.error('❌ Erreur calcul éligibilité:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // ═══════════════════════════════════════════════════════════
  // HELPERS DE CALCUL
  // ═══════════════════════════════════════════════════════════

  const getSeuilPourTaille = useCallback((nbPersonnes: number): number => {
    return getSeuilEligibilite(nbPersonnes);
  }, []);

  const calculateMarginToEligibility = useCallback((revenus: number, nbPersonnes: number): number => {
    const seuil = getSeuilPourTaille(nbPersonnes);
    return seuil - revenus;
  }, [getSeuilPourTaille]);

  const getEligibilityStatus = useCallback((): 'eligible' | 'non_eligible' | 'proche' | 'unknown' => {
    if (!calculationResults) return 'unknown';
    
    if (calculationResults.eligible) return 'eligible';
    
    // Si très proche du seuil (dans les 5%)
    if (calculationResults.pourcentageSeuil <= 105) return 'proche';
    
    return 'non_eligible';
  }, [calculationResults]);

  const getRecommendations = useCallback((): string[] => {
    if (!calculationResults) return [];
    
    const recommendations: string[] = [];

    if (calculationResults.eligible) {
      recommendations.push('✅ Vous êtes éligible à l\'allocation de vie chère');
      if (calculationResults.montantEstime > 0) {
        recommendations.push(`💰 Montant estimé : ${calculationResults.montantEstime}€/mois`);
      }
    } else {
      const margin = calculateMarginToEligibility(
        calculationResults.revenus, 
        calculationResults.nbPersonnes
      );
      
      if (margin < 0 && Math.abs(margin) <= 100) {
        recommendations.push('⚠️ Vous dépassez le seuil de peu. Une réévaluation individuelle est possible.');
      } else {
        recommendations.push('❌ Vos revenus dépassent le seuil d\'éligibilité');
        recommendations.push(`📊 Il vous faudrait ${Math.abs(margin).toFixed(2)}€ de moins pour être éligible`);
      }
    }

    // Conseils spécifiques
    if (formData.etape2?.nombre_enfants_0_17 && formData.etape2.nombre_enfants_0_17 > 0) {
      recommendations.push('👶 Les enfants à charge augmentent vos chances d\'éligibilité');
    }

    return recommendations;
  }, [calculationResults, formData, calculateMarginToEligibility]);

  // ═══════════════════════════════════════════════════════════
  // MÉMOISATION DES VALEURS DÉRIVÉES
  // ═══════════════════════════════════════════════════════════

  const memoizedValues = useMemo(() => ({
    hasValidData: !!(formData.etape2?.total_personnes_menage && 
                     formData.etape4?.total_revenus_menage !== undefined),
    
    totalRevenusMenage: formData.etape4?.total_revenus_menage || 0,
    nombrePersonnes: formData.etape2?.total_personnes_menage || 0,
    nombreEnfants: (formData.etape2?.nombre_enfants_0_17 || 0) + 
                   (formData.etape2?.nombre_enfants_18_24 || 0),
    
    seuilApplicable: formData.etape2?.total_personnes_menage ? 
      getSeuilPourTaille(formData.etape2.total_personnes_menage) : 0
  }), [formData, getSeuilPourTaille]);

  // ═══════════════════════════════════════════════════════════
  // RECALCUL AUTOMATIQUE
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (memoizedValues.hasValidData) {
      calculateEligibilityRealTime();
    } else {
      setCalculationResults(null);
    }
  }, [memoizedValues.hasValidData, calculateEligibilityRealTime]);

  // ═══════════════════════════════════════════════════════════
  // INTERFACE PUBLIQUE
  // ═══════════════════════════════════════════════════════════

  return {
    // Résultats des calculs
    results: calculationResults,
    loading,
    
    // Données dérivées
    ...memoizedValues,
    
    // Actions
    recalculate: calculateEligibilityRealTime,
    
    // Helpers
    getSeuilPourTaille,
    calculateMarginToEligibility,
    getEligibilityStatus,
    getRecommendations,
    
    // États booléens utiles
    isEligible: calculationResults?.eligible || false,
    hasResults: !!calculationResults,
    isProcessing: loading,
    isCloseToEligible: getEligibilityStatus() === 'proche'
  };
};

export default useAllocationCalculations; 