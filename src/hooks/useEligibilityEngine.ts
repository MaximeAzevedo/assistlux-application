import { useMemo, useCallback } from 'react';
import { analyzeEligibility } from '../lib/eligibilityAnalysis';

// ═══════════════════════════════════════════════════════════
// TYPES ET INTERFACES
// ═══════════════════════════════════════════════════════════

export interface EligibilityResult {
  aid_id: string;
  message: string;
  category: 'Eligible' | 'Maybe' | 'Not_Eligible';
  form?: string;
  source?: string;
  action?: string;
  confidence: number; // 0-1 score de confiance
  priority: number; // Priorité d'affichage
  prob?: string; // Pour compatibilité avec l'ancien format
}

export interface CategorizedResults {
  eligible: EligibilityResult[];
  maybe: EligibilityResult[];
  notEligible: EligibilityResult[];
  totalCount: number;
  highPriority: EligibilityResult[];
}

export interface Recommendation {
  type: 'action' | 'document' | 'contact' | 'info';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

// ═══════════════════════════════════════════════════════════
// HOOK PRINCIPAL - MOTEUR D'ÉLIGIBILITÉ
// ═══════════════════════════════════════════════════════════

export const useEligibilityEngine = () => {
  
  // ─────────────────────────────────────────────────────────
  // ÉVALUATION DES CONDITIONS (LOGIQUE ORIGINALE RESTAURÉE)
  // ─────────────────────────────────────────────────────────
  
  const evaluateCondition = useCallback((condition: string, answers: Record<string, any>): boolean => {
    // UTILISE LA MÊME LOGIQUE QUE L'ORIGINAL eligibilityAnalysis.ts
    if (!condition) return true;

    // Handle IN conditions (e.g., "q_niv_revenus_qual IN {opt_A,opt_B}")
    if (condition.includes(' IN ')) {
      const [key, valuesStr] = condition.split(' IN ');
      const values = valuesStr
        .replace(/[{}]/g, '')
        .split(',')
        .map(v => v.trim());
      return values.includes(answers[key.trim()]);
    }

    // Handle basic equality (e.g., "q_situation = opt_A")
    if (condition.includes(' = ')) {
      const [key, value] = condition.split(' = ').map(s => s.trim());
      return answers[key] === value;
    }

    // Handle numeric comparisons (e.g., "q_composition_menage>1")
    const matchNum = condition.match(/^(.+?)([><]=?)(.+)$/);
    if (matchNum) {
      const [, key, operator, valueStr] = matchNum;
      const value = parseFloat(valueStr.trim());
      const userValue = parseFloat(answers[key.trim()]);
      if (isNaN(value) || isNaN(userValue)) return false;
      switch (operator) {
        case '>': return userValue > value;
        case '>=': return userValue >= value;
        case '<': return userValue < value;
        case '<=': return userValue <= value;
        default: return false;
      }
    }

    // Handle logical AND
    if (condition.includes(' AND ')) {
      return condition
        .split(' AND ')
        .every(subCond => evaluateCondition(subCond.trim(), answers));
    }

    // Handle logical OR
    if (condition.includes(' OR ')) {
      return condition
        .split(' OR ')
        .some(subCond => evaluateCondition(subCond.trim(), answers));
    }

    // Handle NOT
    if (condition.startsWith('NOT ') || condition.startsWith('!')) {
      const subCond = condition.startsWith('NOT ') ? condition.slice(4) : condition.slice(1);
      return !evaluateCondition(subCond.trim(), answers);
    }

    return false;
  }, []);

  // ─────────────────────────────────────────────────────────
  // CALCUL DES RÉSULTATS (UTILISE LA LOGIQUE ORIGINALE)
  // ─────────────────────────────────────────────────────────
  
  const calculateResults = useCallback(async (answers: Record<string, any>): Promise<EligibilityResult[]> => {
    try {
      console.log('[EligibilityEngine] Calcul éligibilité avec logique originale pour:', answers);

      // UTILISE LA FONCTION ORIGINALE analyzeEligibility
      const originalResults = await analyzeEligibility(answers);
      
      console.log('[EligibilityEngine] Résultats originaux:', originalResults);

      // Convertit au format attendu par la nouvelle interface
      const convertedResults: EligibilityResult[] = originalResults
        .filter((result): result is NonNullable<typeof result> => result !== null)
        .map((result, index) => ({
          aid_id: result.aid_id,
          message: result.message,
          category: result.category as 'Eligible' | 'Maybe' | 'Not_Eligible',
          form: result.form,
          source: result.source,
          action: result.action,
          prob: result.prob, // Garde la compatibilité
          confidence: result.prob === 'high' ? 0.9 : result.prob === 'medium' ? 0.7 : 0.5,
          priority: index
        }));

      console.log(`[EligibilityEngine] ${convertedResults.length} résultats convertis`);
      return convertedResults;

    } catch (error) {
      console.error('[EligibilityEngine] Erreur calcul résultats:', error);
      throw new Error(`Échec du calcul d'éligibilité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // CATÉGORISATION INTELLIGENTE DES RÉSULTATS
  // ─────────────────────────────────────────────────────────
  
  const categorizeResults = useMemo(() => 
    (results: EligibilityResult[]): CategorizedResults => {
      const eligible = results.filter(r => r.category === 'Eligible');
      const maybe = results.filter(r => r.category === 'Maybe');
      const notEligible = results.filter(r => r.category === 'Not_Eligible');
      
      // Identification des aides prioritaires (confidence > 0.8)
      const highPriority = results.filter(r => 
        r.confidence > 0.8 && ['Eligible', 'Maybe'].includes(r.category)
      );

      return {
        eligible,
        maybe,
        notEligible,
        totalCount: results.length,
        highPriority
      };
    }, []
  );

  // ─────────────────────────────────────────────────────────
  // GÉNÉRATION DE RECOMMANDATIONS PERSONNALISÉES
  // ─────────────────────────────────────────────────────────
  
  const generateRecommendations = useCallback((results: EligibilityResult[], answers: Record<string, any>): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    const categorized = categorizeResults(results);

    // Recommandations basées sur les résultats
    if (categorized.eligible.length > 0) {
      recommendations.push({
        type: 'action',
        title: 'Démarches à effectuer',
        description: `Vous êtes éligible à ${categorized.eligible.length} aide${categorized.eligible.length > 1 ? 's' : ''}. Nous recommandons de commencer par les plus importantes.`,
        urgency: 'high'
      });
    }

    if (categorized.maybe.length > 0) {
      recommendations.push({
        type: 'document',
        title: 'Documents à vérifier',
        description: `${categorized.maybe.length} aide${categorized.maybe.length > 1 ? 's' : ''} nécessite${categorized.maybe.length === 1 ? '' : 'nt'} une vérification de vos documents.`,
        urgency: 'medium'
      });
    }

    if (categorized.totalCount === 0) {
      recommendations.push({
        type: 'contact',
        title: 'Consultation personnalisée',
        description: 'Aucune aide automatiquement détectée. Contactez un assistant social pour un conseil personnalisé.',
        urgency: 'medium'
      });
    }

    // Recommandations contextuelles basées sur les réponses
    if (answers.q_revenus && parseFloat(answers.q_revenus) < 2000) {
      recommendations.push({
        type: 'info',
        title: 'Aides locales',
        description: 'Avec vos revenus, vérifiez les aides communales et CPAS de votre région.',
        urgency: 'medium'
      });
    }

    return recommendations.slice(0, 4); // Limiter à 4 recommandations max
  }, [categorizeResults]);

  // ─────────────────────────────────────────────────────────
  // ANALYSE RAPIDE POUR PREVIEW
  // ─────────────────────────────────────────────────────────
  
  const quickAnalysis = useCallback((answers: Record<string, any>) => {
    const answeredCount = Object.keys(answers).length;
    const estimatedTotal = answeredCount + 3; // Estimation basée sur progression
    
    return {
      progress: Math.min(95, (answeredCount / estimatedTotal) * 100),
      completeness: answeredCount > 5 ? 'good' : answeredCount > 2 ? 'partial' : 'minimal',
      estimatedResults: answeredCount > 3 ? Math.floor(answeredCount / 2) : 0
    };
  }, []);

  // ─────────────────────────────────────────────────────────
  // API PUBLIQUE DU HOOK
  // ─────────────────────────────────────────────────────────
  
  return {
    // Fonctions principales
    evaluateCondition,
    calculateResults,
    categorizeResults,
    generateRecommendations,
    
    // Utilitaires
    quickAnalysis,
    
    // Helpers booléens
    isConditionValid: (condition: string) => {
      try {
        // Test de parsing basique
        return condition?.trim().length > 0 && !condition.includes('undefined');
      } catch {
        return false;
      }
    }
  };
};

export default useEligibilityEngine; 