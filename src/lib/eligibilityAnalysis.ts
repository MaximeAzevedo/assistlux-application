import { supabase } from './supabase/client';

// Helper function to evaluate a condition string against user answers
function evaluateCondition(condition: string, userAnswers: Record<string, any>): boolean {
  if (!condition) return true;

  // Handle IN conditions (e.g., "q_niv_revenus_qual IN {opt_A,opt_B}")
  if (condition.includes(' IN ')) {
    const [key, valuesStr] = condition.split(' IN ');
    const values = valuesStr
      .replace(/[{}]/g, '')
      .split(',')
      .map(v => v.trim());
    return values.includes(userAnswers[key.trim()]);
  }

  // Handle basic equality (e.g., "q_situation = opt_A")
  if (condition.includes(' = ')) {
    const [key, value] = condition.split(' = ').map(s => s.trim());
    return userAnswers[key] === value;
  }

  // Handle numeric comparisons (e.g., "q_composition_menage>1")
  const matchNum = condition.match(/^(.+?)([><]=?)(.+)$/);
  if (matchNum) {
    const [, key, operator, valueStr] = matchNum;
    const value = parseFloat(valueStr.trim());
    const userValue = parseFloat(userAnswers[key.trim()]);
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
      .every(subCond => evaluateCondition(subCond.trim(), userAnswers));
  }

  // Handle logical OR
  if (condition.includes(' OR ')) {
    return condition
      .split(' OR ')
      .some(subCond => evaluateCondition(subCond.trim(), userAnswers));
  }

  // Handle NOT
  if (condition.startsWith('NOT ') || condition.startsWith('!')) {
    const subCond = condition.startsWith('NOT ') ? condition.slice(4) : condition.slice(1);
    return !evaluateCondition(subCond.trim(), userAnswers);
  }

  return false;
}

export async function analyzeEligibility(userAnswers: Record<string, any>) {
  try {
    // Fetch all conclusions
    const { data: conclusions, error } = await supabase
      .from('conclusions')
      .select('*')
      .order('titre_aide');

    if (error) throw error;
    if (!conclusions) return [];

    // Evaluate each conclusion
    return conclusions
      .map(conclusion => {
        const isEligible = evaluateCondition(conclusion.logic_condition, userAnswers);
        
        if (!isEligible) return null;

        return {
          aid_id: conclusion.titre_aide,
          prob: conclusion.categorie === 'Eligible' ? 'high' : 
                conclusion.categorie === 'Maybe' ? 'medium' : 'low',
          message: conclusion.texte_conclusion,
          category: conclusion.categorie,
          form: conclusion.url_formulaire,
          source: conclusion.url_source,
          action: conclusion.action
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Error analyzing eligibility:', error);
    throw error;
  }
}

export async function getNextQuestion(currentQuestionId: string | null, answer: any) {
  try {
    if (!currentQuestionId) {
      // Get first question
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('ordre')
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    }

    // Get current question to check branching
    const { data: currentQuestion, error: currentError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', currentQuestionId)
      .single();

    if (currentError) throw currentError;
    if (!currentQuestion) return null;

    // Get next question based on branching logic
    const branchingLogic = currentQuestion.branchements_json;
    const nextQuestionId = branchingLogic?.[answer] || null;

    if (nextQuestionId) {
      const { data: nextQuestion, error: nextError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', nextQuestionId)
        .single();

      if (nextError) throw nextError;
      return nextQuestion;
    }

    // If no branching logic, get next question by order
    const { data: nextQuestion, error: nextError } = await supabase
      .from('questions')
      .select('*')
      .gt('ordre', currentQuestion.ordre)
      .order('ordre')
      .limit(1);

    if (nextError) throw nextError;
    return nextQuestion?.[0] || null;
  } catch (error) {
    console.error('Error getting next question:', error);
    throw error;
  }
}