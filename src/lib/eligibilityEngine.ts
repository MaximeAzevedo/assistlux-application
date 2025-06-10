import { supabase } from './supabase/client';

// ═══════════════════════════════════════════════════════════
// UTILITAIRE DE LOGGING OPTIMISÉ
// ═══════════════════════════════════════════════════════════

const isDev = import.meta.env.DEV;
const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  error: (...args: any[]) => console.error(...args), // Toujours afficher les erreurs
  info: (...args: any[]) => isDev && console.info(...args)
};

// ═══════════════════════════════════════════════════════════
// TYPES POUR LE NOUVEAU MOTEUR D'ÉLIGIBILITÉ
// ═══════════════════════════════════════════════════════════

export interface Question {
  id: string;
  ordre: number;
  question: string;
  key_reponse: string;
  type_reponse: 'Oui_Non' | 'Choix_Multiple_ABC' | 'Choix_Multiple_Simple' | 'Number';
  options_json?: Record<string, string>;
  condition_affichage?: string;
}

export interface EligibilityRule {
  id: string;
  titre_aide: string;
  logic_condition: string;
  texte_conclusion: string;
  categorie: 'Eligible' | 'Ineligible' | 'Maybe';
  url_formulaire?: string;
  url_source?: string;
  action?: string;
}

export interface EligibilityResult {
  aid_id: string;
  title: string;
  message: string;
  category: 'Eligible' | 'Ineligible' | 'Maybe';
  probability: 'high' | 'medium' | 'low';
  form?: string;
  source?: string;
  action?: string;
}

export interface UserAnswers {
  [key: string]: string | number;
}

// ═══════════════════════════════════════════════════════════
// MOTEUR D'ÉVALUATION DES CONDITIONS
// ═══════════════════════════════════════════════════════════

class ConditionEvaluator {
  
  /**
   * Évalue une condition logique avec les réponses de l'utilisateur
   */
  static evaluate(condition: string, answers: UserAnswers): boolean {
    if (!condition || condition.trim() === '') return true;

    try {
      logger.log(`🔍 Évaluation condition: "${condition}"`);
      logger.log(`📋 Réponses disponibles:`, answers);

      // Nettoyer la condition
      const cleanCondition = condition.trim();

      // Handle parentheses first
      if (cleanCondition.includes('(') && cleanCondition.includes(')')) {
        return this.evaluateWithParentheses(cleanCondition, answers);
      }

      // Handle logical operators
      if (cleanCondition.includes(' AND ')) {
        return this.evaluateAND(cleanCondition, answers);
      }

      if (cleanCondition.includes(' OR ')) {
        return this.evaluateOR(cleanCondition, answers);
      }

      // Handle simple conditions
      return this.evaluateSimpleCondition(cleanCondition, answers);

    } catch (error) {
      logger.error('❌ Erreur évaluation condition:', error);
      return false;
    }
  }

  private static evaluateWithParentheses(condition: string, answers: UserAnswers): boolean {
    // Simple parentheses handling
    const regex = /\(([^()]+)\)/;
    const match = condition.match(regex);
    
    if (match) {
      const innerResult = this.evaluate(match[1], answers);
      const newCondition = condition.replace(match[0], innerResult.toString());
      return this.evaluate(newCondition, answers);
    }
    
    return this.evaluate(condition.replace(/[()]/g, ''), answers);
  }

  private static evaluateAND(condition: string, answers: UserAnswers): boolean {
    const parts = condition.split(' AND ').map(part => part.trim());
    const results = parts.map(part => this.evaluate(part, answers));
    const result = results.every(r => r);
    
    logger.log(`   🔗 AND: ${parts.join(' ET ')} = ${result}`);
    return result;
  }

  private static evaluateOR(condition: string, answers: UserAnswers): boolean {
    const parts = condition.split(' OR ').map(part => part.trim());
    const results = parts.map(part => this.evaluate(part, answers));
    const result = results.some(r => r);
    
    logger.log(`   🔀 OR: ${parts.join(' OU ')} = ${result}`);
    return result;
  }

  private static evaluateSimpleCondition(condition: string, answers: UserAnswers): boolean {
    // Handle inequality (!=)
    if (condition.includes(' != ')) {
      const [key, value] = condition.split(' != ').map(s => s.trim());
      const userValue = answers[key];
      const result = userValue !== value;
      logger.log(`   ❌ NE: ${key}=${userValue} != ${value} = ${result}`);
      return result;
    }

    // Handle equality (=)
    if (condition.includes(' = ')) {
      const [key, value] = condition.split(' = ').map(s => s.trim());
      const userValue = answers[key];
      const result = userValue === value;
      logger.log(`   ✅ EQ: ${key}=${userValue} == ${value} = ${result}`);
      return result;
    }

    // Handle numeric comparisons (>=, <=, >, <)
    const numericMatch = condition.match(/^(.+?)\s*([><]=?)\s*(.+)$/);
    if (numericMatch) {
      const [, key, operator, valueStr] = numericMatch;
      const keyTrimmed = key.trim();
      const valueTrimmed = valueStr.trim();
      
      const numValue = parseFloat(valueTrimmed);
      const userValue = parseFloat(answers[keyTrimmed] as string);
      
      if (isNaN(numValue) || isNaN(userValue)) {
        logger.warn(`   ⚠️ Comparaison numérique impossible: ${keyTrimmed}=${answers[keyTrimmed]} ${operator} ${valueTrimmed}`);
        return false;
      }
      
      let result = false;
      switch (operator) {
        case '>=': result = userValue >= numValue; break;
        case '<=': result = userValue <= numValue; break;
        case '>': result = userValue > numValue; break;
        case '<': result = userValue < numValue; break;
      }
      
      logger.log(`   🔢 NUM: ${keyTrimmed}=${userValue} ${operator} ${numValue} = ${result}`);
      return result;
    }

    logger.warn(`   ⚠️ Condition non reconnue: "${condition}"`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// MOTEUR PRINCIPAL D'ÉLIGIBILITÉ
// ═══════════════════════════════════════════════════════════

export class EligibilityEngine {
  
  private static instance: EligibilityEngine;
  private questions: Question[] = [];
  private rules: EligibilityRule[] = [];
  private initialized = false;

  static getInstance(): EligibilityEngine {
    if (!this.instance) {
      this.instance = new EligibilityEngine();
    }
    return this.instance;
  }

  /**
   * Initialise le moteur en chargeant les données
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.log('🔄 Initialisation du moteur d\'éligibilité...');
      
      await Promise.all([
        this.loadQuestions(),
        this.loadRules()
      ]);
      
      this.initialized = true;
      logger.log('✅ Moteur d\'éligibilité initialisé');
      
    } catch (error) {
      logger.error('❌ Erreur initialisation moteur:', error);
      throw error;
    }
  }

  /**
   * Charge les questions depuis la base de données
   */
  private async loadQuestions(): Promise<void> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('ordre');

    if (error) {
      throw new Error(`Erreur chargement questions: ${error.message}`);
    }

    this.questions = (data || []).map(q => ({
      id: q.id,
      ordre: q.ordre,
      question: q.question,
      key_reponse: q.key_reponse,
      type_reponse: q.type_reponse,
      options_json: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json,
      condition_affichage: q.condition_affichage
    }));

    logger.log(`📋 ${this.questions.length} questions chargées`);
  }

  /**
   * Charge les règles d'éligibilité depuis la base de données
   */
  private async loadRules(): Promise<void> {
    const { data, error } = await supabase
      .from('conclusions')
      .select('*')
      .order('titre_aide');

    if (error) {
      throw new Error(`Erreur chargement règles: ${error.message}`);
    }

    this.rules = (data || []).map(r => ({
      id: r.id,
      titre_aide: r.titre_aide,
      logic_condition: r.logic_condition,
      texte_conclusion: r.texte_conclusion,
      categorie: r.categorie,
      url_formulaire: r.url_formulaire,
      url_source: r.url_source,
      action: r.action
    }));

    logger.log(`🎯 ${this.rules.length} règles d'éligibilité chargées`);
  }

  /**
   * Obtient toutes les questions dans l'ordre
   */
  getQuestions(): Question[] {
    return [...this.questions];
  }

  /**
   * Obtient la première question à afficher
   */
  getFirstQuestion(): Question | null {
    return this.questions.find(q => this.shouldShowQuestion(q, {})) || null;
  }

  /**
   * Obtient la prochaine question à afficher
   */
  getNextQuestion(currentQuestion: Question, answers: UserAnswers): Question | null {
    const currentIndex = this.questions.findIndex(q => q.id === currentQuestion.id);
    
    for (let i = currentIndex + 1; i < this.questions.length; i++) {
      const question = this.questions[i];
      if (this.shouldShowQuestion(question, answers)) {
        return question;
      }
    }
    
    return null; // Fin du questionnaire
  }

  /**
   * Détermine si une question doit être affichée
   */
  shouldShowQuestion(question: Question, answers: UserAnswers): boolean {
    if (!question.condition_affichage) return true;
    
    return ConditionEvaluator.evaluate(question.condition_affichage, answers);
  }

  /**
   * Détermine si le questionnaire peut se terminer avec les réponses actuelles
   */
  canCompleteQuestionnaire(answers: UserAnswers): boolean {
    // Cas spéciaux de fin anticipée
    if (answers.q_residence_lux === 'opt_non') {
      return true; // Non-résidence = fin immédiate
    }
    
    if (answers.q_age && typeof answers.q_age === 'number' && answers.q_age < 18) {
      return true; // Mineur = fin anticipée
    }
    
    if (answers.q_institution === 'opt_oui') {
      return true; // En institution = fin anticipée  
    }
    
    // Sinon, vérifier que toutes les questions obligatoires ont été répondues
    return this.questions.every(question => {
      if (!this.shouldShowQuestion(question, answers)) {
        return true; // Question non affichée = OK
      }
      
      const answer = answers[question.key_reponse];
      return answer !== undefined && answer !== null && answer !== '';
    });
  }

  /**
   * Analyse l'éligibilité avec les réponses fournies
   */
  async analyzeEligibility(answers: UserAnswers): Promise<EligibilityResult[]> {
    logger.log('🚀 Analyse d\'éligibilité avec moteur refait');
    logger.log('📝 Réponses:', answers);
    
    const results: EligibilityResult[] = [];
    
    for (const rule of this.rules) {
      logger.log(`\n🔍 Évaluation: ${rule.titre_aide}`);
      logger.log(`📐 Condition: ${rule.logic_condition}`);
      
      const isEligible = ConditionEvaluator.evaluate(rule.logic_condition, answers);
      
      if (isEligible) {
        logger.log(`✅ RÉSULTAT: ${rule.titre_aide} - ${rule.categorie}`);
        
        results.push({
          aid_id: rule.id,
          title: rule.titre_aide,
          message: rule.texte_conclusion,
          category: rule.categorie,
          probability: rule.categorie === 'Eligible' ? 'high' : 
                      rule.categorie === 'Maybe' ? 'medium' : 'low',
          form: rule.url_formulaire,
          source: rule.url_source,
          action: rule.action || (rule.categorie === 'Eligible' ? 'Télécharger' : 'Plus d\'infos')
        });
      } else {
        logger.log(`❌ NON ÉLIGIBLE: ${rule.titre_aide}`);
      }
    }
    
    logger.log(`\n🎉 Analyse terminée: ${results.length} résultats`);
    return results.sort((a, b) => {
      // Trier par priorité : Eligible > Maybe > Ineligible
      const priority = { 'Eligible': 3, 'Maybe': 2, 'Ineligible': 1 };
      return priority[b.category] - priority[a.category];
    });
  }

  /**
   * Validation des réponses
   */
  validateAnswers(answers: UserAnswers): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    for (const question of this.questions) {
      if (this.shouldShowQuestion(question, answers)) {
        const answer = answers[question.key_reponse];
        if (answer === undefined || answer === null || answer === '') {
          missing.push(question.key_reponse);
        }
      }
    }
    
    return {
      valid: missing.length === 0,
      missing
    };
  }
}

// ═══════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES POUR RÉTROCOMPATIBILITÉ
// ═══════════════════════════════════════════════════════════

/**
 * @deprecated Utiliser EligibilityEngine.getInstance().analyzeEligibility()
 */
export async function analyzeEligibility(userAnswers: UserAnswers): Promise<EligibilityResult[]> {
  const engine = EligibilityEngine.getInstance();
  await engine.initialize();
  return engine.analyzeEligibility(userAnswers);
}

/**
 * @deprecated Utiliser EligibilityEngine.getInstance().getQuestions()
 */
export async function loadQuestionsFromDB(): Promise<Question[]> {
  const engine = EligibilityEngine.getInstance();
  await engine.initialize();
  return engine.getQuestions();
} 