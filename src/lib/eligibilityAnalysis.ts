import { supabase } from './supabase/client';

// ═══════════════════════════════════════════════════════════
// TYPES BASÉS SUR LA VRAIE STRUCTURE DES TABLES
// ═══════════════════════════════════════════════════════════

interface Question {
  id: string;                    // PROF_S01, PROF_S02, etc.
  ordre: number;                 // 1, 2, 3, etc.
  question: string;              // Le texte de la question
  key_reponse: string;          // q_residence_lux, q_sejour_legal_rnpp, etc.
  type_reponse: string;         // Oui_Non, Choix_Multiple_ABC, etc.
  options_json: any;            // {opt_oui: "Oui", opt_non: "Non"} ou {opt_A: "...", opt_B: "...", opt_C: "..."}
  branchements_json: any;       // {opt_oui: "PROF_S02", opt_non: "PROF_END"}
  condition_affichage?: string; // q_age_25plus=opt_non (pour PROF_S05)
}

interface Conclusion {
  id: string;
  titre_aide: string;           // "Allocation de vie chère", "REVIS", etc.
  logic_condition: string;      // La condition complète d'éligibilité
  texte_conclusion: string;     // Le message à afficher
  categorie: string;            // "Eligible" ou "Ineligible"
  action?: string;
  url_formulaire?: string;
  url_source?: string;
}

// ═══════════════════════════════════════════════════════════
// MOTEUR D'ÉVALUATION DES CONDITIONS (VERSION SIMPLIFIÉE ET ROBUSTE)
// ═══════════════════════════════════════════════════════════

function evaluateCondition(condition: string, userAnswers: Record<string, any>): boolean {
  if (!condition || condition.trim() === '') return true;

  try {
    // Nettoyer la condition
    let cleanCondition = condition.trim();

    // Handle NOT conditions
    if (cleanCondition.startsWith('NOT ')) {
      const subCondition = cleanCondition.slice(4).trim();
      return !evaluateCondition(subCondition, userAnswers);
    }

    // Handle parentheses - extraire le contenu des parenthèses et l'évaluer
    if (cleanCondition.includes('(') && cleanCondition.includes(')')) {
      const parenRegex = /\(([^()]+)\)/;
      const match = cleanCondition.match(parenRegex);
      if (match) {
        const innerCondition = match[1];
        const innerResult = evaluateCondition(innerCondition, userAnswers);
        // Remplacer les parenthèses par le résultat
        cleanCondition = cleanCondition.replace(match[0], innerResult.toString());
        return evaluateCondition(cleanCondition, userAnswers);
      }
    }

    // Handle logical AND
    if (cleanCondition.includes(' AND ')) {
      const parts = cleanCondition.split(' AND ').map(s => s.trim());
      return parts.every(part => {
        if (part === 'true') return true;
        if (part === 'false') return false;
        return evaluateCondition(part, userAnswers);
      });
    }

    // Handle logical OR
    if (cleanCondition.includes(' OR ')) {
      const parts = cleanCondition.split(' OR ').map(s => s.trim());
      return parts.some(part => {
        if (part === 'true') return true;
        if (part === 'false') return false;
        return evaluateCondition(part, userAnswers);
      });
    }

    // Handle boolean literals
    if (cleanCondition === 'true') return true;
    if (cleanCondition === 'false') return false;

    // Handle IN conditions
    if (cleanCondition.includes(' IN ')) {
      const [key, valuesStr] = cleanCondition.split(' IN ').map(s => s.trim());
      const values = valuesStr.replace(/[{}]/g, '').split(',').map(v => v.trim());
      const userValue = userAnswers[key];
      return values.includes(userValue);
    }

    // Handle numeric comparisons (pour q_composition_menage>1)
    const numericMatch = cleanCondition.match(/^(.+?)([><]=?)(.+)$/);
    if (numericMatch) {
      const [, key, operator, valueStr] = numericMatch;
      const expectedValue = parseFloat(valueStr.trim());
      
      // Convertir la réponse utilisateur en nombre
      let userValue: number;
      const rawAnswer = userAnswers[key.trim()];
      
      if (typeof rawAnswer === 'number') {
        userValue = rawAnswer;
      } else if (typeof rawAnswer === 'string') {
        // Mapper les options vers des nombres
        const optionToNumber: Record<string, number> = {
          'opt_1_pers': 1,
          'opt_2_pers': 2, 
          'opt_3_plus_pers': 3
        };
        userValue = optionToNumber[rawAnswer] || parseFloat(rawAnswer) || 0;
      } else {
        return false;
      }

      switch (operator) {
        case '>': return userValue > expectedValue;
        case '>=': return userValue >= expectedValue;
        case '<': return userValue < expectedValue;
        case '<=': return userValue <= expectedValue;
        default: return false;
      }
    }

    // Handle equality
    if (cleanCondition.includes('=')) {
      const [key, value] = cleanCondition.split('=').map(s => s.trim());
      return userAnswers[key] === value;
    }

    return false;

  } catch (error) {
    console.error(`❌ Erreur évaluation condition "${condition}":`, error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// CHARGEMENT DES DONNÉES
// ═══════════════════════════════════════════════════════════

export async function loadQuestionsFromDB(): Promise<Question[]> {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .order('ordre');

    if (error) throw error;
    if (!questions || questions.length === 0) {
      throw new Error('Aucune question trouvée');
    }

    // Parser les champs JSON
    const parsedQuestions = questions.map(q => ({
      ...q,
      options_json: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json,
      branchements_json: typeof q.branchements_json === 'string' ? JSON.parse(q.branchements_json) : q.branchements_json
    }));

    return parsedQuestions;
  } catch (error) {
    console.error('❌ Erreur loadQuestionsFromDB:', error);
    throw error;
  }
}

export async function loadConclusionsFromDB(): Promise<Conclusion[]> {
  try {
    const { data: conclusions, error } = await supabase
      .from('conclusions')
      .select('*')
      .order('titre_aide');

    if (error) throw error;
    if (!conclusions || conclusions.length === 0) {
      throw new Error('Aucune conclusion trouvée');
    }

    return conclusions;
  } catch (error) {
    console.error('❌ Erreur loadConclusionsFromDB:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION BASÉE UNIQUEMENT SUR LES BRANCHEMENTS_JSON
// ═══════════════════════════════════════════════════════════

export function getNextQuestionId(
  currentQuestionId: string,
  userAnswer: string,
  questions: Question[]
): string | null {
  try {
    // Trouver la question actuelle
    const currentQuestion = questions.find(q => q.id === currentQuestionId);
    if (!currentQuestion) {
      console.error(`❌ Question ${currentQuestionId} non trouvée`);
      return null;
    }

    // Utiliser UNIQUEMENT les branchements_json de la table questions
    const branchements = currentQuestion.branchements_json;
    if (!branchements) {
      console.error(`❌ Pas de branchements pour ${currentQuestionId}`);
      return null;
    }

    const nextId = branchements[userAnswer];
    
    // Si c'est une fin (PROF_END ou PROF_EVAL), retourner null
    if (nextId === 'PROF_END' || nextId === 'PROF_EVAL') {
      // console.log(`🏁 Fin du questionnaire: ${nextId}`);
      return null;
    }

    // console.log(`🧭 Navigation: ${currentQuestionId} + ${userAnswer} → ${nextId}`);
    return nextId;

  } catch (error) {
    console.error('❌ Erreur navigation:', error);
    return null;
  }
}

export function shouldShowQuestion(
  question: Question,
  userAnswers: Record<string, any>
): boolean {
  // Si pas de condition, toujours afficher
  if (!question.condition_affichage) {
    return true;
  }

  try {
    return evaluateCondition(question.condition_affichage, userAnswers);
  } catch (error) {
    console.error(`❌ Erreur évaluation condition affichage ${question.id}:`, error);
    return true; // En cas d'erreur, afficher la question
  }
}

export function canCompleteQuestionnaire(
  userAnswers: Record<string, any>
): boolean {
  // Fins anticipées basées sur les branchements des tables
  
  // Si résidence = non → PROF_END
  if (userAnswers.q_residence_lux === 'opt_non') {
    return true;
  }
  
  // Si séjour irrégulier → PROF_END
  if (userAnswers.q_sejour_legal_rnpp === 'opt_non') {
    return true;
  }

  // Sinon, il faut répondre à toutes les questions jusqu'à PROF_EVAL
  return false;
}

// ═══════════════════════════════════════════════════════════
// ANALYSE D'ÉLIGIBILITÉ BASÉE SUR LA TABLE CONCLUSIONS
// ═══════════════════════════════════════════════════════════

export async function analyzeEligibility(userAnswers: Record<string, any>) {
  try {
    // console.log('🚀 Analyse d\'éligibilité basée sur la table conclusions');
    // console.log('📝 Réponses utilisateur:', userAnswers);

    // Charger les conclusions
    const conclusions = await loadConclusionsFromDB();

    // Évaluer chaque conclusion ELIGIBLE uniquement
    const results = [];
    
    const eligibleConclusions = conclusions.filter(c => c.categorie === 'Eligible');
    
    for (const conclusion of eligibleConclusions) {
      // console.log(`\n🔍 Évaluation: ${conclusion.titre_aide}`);
      // console.log(`📐 Condition: ${conclusion.logic_condition}`);
      
      const isEligible = evaluateCondition(conclusion.logic_condition, userAnswers);
      
      if (isEligible) {
        // console.log(`✅ ÉLIGIBLE: ${conclusion.titre_aide}`);
        
        results.push({
          aid_id: conclusion.id,
          title: conclusion.titre_aide,
          message: conclusion.texte_conclusion,
          category: 'Eligible',
          prob: 'high',
          form: conclusion.url_formulaire,
          source: conclusion.url_source,
          action: 'Télécharger le formulaire'
        });
      } else {
        // console.log(`❌ NON ÉLIGIBLE: ${conclusion.titre_aide}`);
      }
    }

    // console.log(`\n🎉 Analyse terminée: ${results.length} aides éligibles trouvées`);
    return results;

  } catch (error) {
    console.error('❌ Erreur analyse d\'éligibilité:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════

export function formatQuestionForUI(question: Question) {
  return {
    id: question.id,
    question: question.question,
    type_reponse: question.type_reponse,
    key_reponse: question.key_reponse,
    ordre: question.ordre,
    options_json: question.options_json || {},
    condition_affichage: question.condition_affichage
  };
}

export function validateUserAnswers(userAnswers: Record<string, any>): boolean {
  // Validation simple : vérifier que les clés essentielles sont présentes
  const requiredKeys = ['q_residence_lux'];
  
  for (const key of requiredKeys) {
    if (!userAnswers[key]) {
      console.warn(`⚠️ Réponse manquante pour: ${key}`);
      return false;
    }
  }

  return true;
}