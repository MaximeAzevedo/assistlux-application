import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import EligibilityResults from './EligibilityResults';

interface EligibilityWizardProps {
  onBack: () => void;
}

const EligibilityWizard: React.FC<EligibilityWizardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);

  useEffect(() => {
    const loadFirstQuestion = async () => {
      try {
        // Get all questions
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .order('ordre', { ascending: true });

        if (questionsError) {
          console.error('Supabase error:', questionsError);
          throw questionsError;
        }
        
        if (!questions || questions.length === 0) {
          throw new Error('No questions found');
        }

        console.log('Raw questions from database:', questions);

        // Parse JSON fields for all questions
        const parsedQuestions = questions.map(q => {
          let parsedQuestion = { ...q };
          
          // Parse options_json
          if (q.options_json) {
            try {
              if (typeof q.options_json === 'string') {
                parsedQuestion.options_json = JSON.parse(q.options_json);
              } else {
                parsedQuestion.options_json = q.options_json;
              }
            } catch (e) {
              console.error('Error parsing options_json for question', q.id, e);
              parsedQuestion.options_json = null;
            }
          }
          
          // Parse branchements_json
          if (q.branchements_json) {
            try {
              if (typeof q.branchements_json === 'string') {
                parsedQuestion.branchements_json = JSON.parse(q.branchements_json);
              } else {
                parsedQuestion.branchements_json = q.branchements_json;
              }
            } catch (e) {
              console.error('Error parsing branchements_json for question', q.id, e);
              parsedQuestion.branchements_json = null;
            }
          }
          
          return parsedQuestion;
        });

        console.log('Parsed questions:', parsedQuestions);
        console.log('First question:', parsedQuestions[0]);

        setAllQuestions(parsedQuestions);
        setTotalQuestions(parsedQuestions.length);
        setCurrentQuestion(parsedQuestions[0]);
        setCurrentQuestionIndex(1);
        setProgress((1 / parsedQuestions.length) * 100);
      } catch (err) {
        console.error('Error loading first question:', err);
        setError(t('errors.loadQuestions') || 'Erreur lors du chargement des questions');
      } finally {
        setLoading(false);
      }
    };

    loadFirstQuestion();
  }, [t]);

  const findNextQuestion = (currentOrder: number, answers: Record<string, any>): any | null => {
    // Find questions with ordre greater than current
    const nextQuestions = allQuestions
      .filter(q => q.ordre > currentOrder)
      .sort((a, b) => a.ordre - b.ordre);

    for (const question of nextQuestions) {
      // Check if the question should be shown based on condition_affichage
      if (question.condition_affichage) {
        const shouldShow = evaluateCondition(question.condition_affichage, answers);
        if (!shouldShow) continue; // Skip this question
      }
      return question;
    }

    return null; // No more questions
  };

  const handleAnswer = async (value: any) => {
    if (!currentQuestion) return;

    try {
      console.log('Handling answer:', value, 'for question:', currentQuestion.key_reponse);
      
      // Save answer using key_reponse as the key
      const newAnswers = { ...answers, [currentQuestion.key_reponse]: value };
      setAnswers(newAnswers);

      // Check if there's branching logic
      let nextQuestion = null;
      
      if (currentQuestion.branchements_json && currentQuestion.branchements_json[value]) {
        const targetQuestionId = currentQuestion.branchements_json[value];
        // Find question by id
        nextQuestion = allQuestions.find(q => q.id === targetQuestionId);
      } else {
        // Get next question in order
        nextQuestion = findNextQuestion(currentQuestion.ordre, newAnswers);
      }

      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        const questionIndex = allQuestions.findIndex(q => q.id === nextQuestion.id) + 1;
        setCurrentQuestionIndex(questionIndex);
        setProgress((questionIndex / totalQuestions) * 100);
      } else {
        // No more questions, show results
        setShowResults(true);
      }
    } catch (err) {
      console.error('Error handling answer:', err);
      setError(t('errors.navigation') || 'Erreur de navigation');
    }
  };

  const evaluateCondition = (condition: string, answers: Record<string, any>): boolean => {
    try {
      // Remove any whitespace
      condition = condition.trim();

      // Handle AND conditions first
      if (condition.includes(' AND ')) {
        return condition
          .split(' AND ')
          .every(subCond => evaluateCondition(subCond.trim(), answers));
      }

      // Handle OR conditions
      if (condition.includes(' OR ')) {
        return condition
          .split(' OR ')
          .some(subCond => evaluateCondition(subCond.trim(), answers));
      }

      // Handle IN conditions (e.g., "q_status IN {opt_A,opt_B}")
      if (condition.includes(' IN ')) {
        const [key, valuesStr] = condition.split(' IN ');
        const values = valuesStr
          .replace(/[{}\[\]]/g, '')
          .split(',')
          .map(v => v.trim());
        return values.includes(answers[key.trim()]);
      }

      // Handle numeric comparisons
      const numericMatch = condition.match(/^(.+?)([><]=?)(.+)$/);
      if (numericMatch) {
        const [, key, operator, valueStr] = numericMatch;
        const value = parseFloat(valueStr.trim());
        const answerValue = parseFloat(answers[key.trim()]);
        
        if (!isNaN(value) && !isNaN(answerValue)) {
          switch (operator) {
            case '>': return answerValue > value;
            case '>=': return answerValue >= value;
            case '<': return answerValue < value;
            case '<=': return answerValue <= value;
          }
        }
      }

      // Handle basic equality conditions (e.g., "q_age = opt_18plus")
      if (condition.includes('=')) {
        const [key, value] = condition.split('=').map(s => s.trim());
        return answers[key] === value;
      }

      // Default to true if condition can't be evaluated
      console.warn(`Could not evaluate condition: ${condition}`);
      return true;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return true; // Show question by default if evaluation fails
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 text-red-700">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          {t('common.retry') || 'Réessayer'}
        </button>
      </div>
    );
  }

  if (showResults) {
    return <EligibilityResults answers={answers} onBack={() => setShowResults(false)} />;
  }

  if (!currentQuestion) return null;

  // Debug information
  console.log('Current question type:', currentQuestion.type_reponse);
  console.log('Current question options:', currentQuestion.options_json);

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block text-purple-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold inline-block text-gray-600">
              Question {currentQuestionIndex} sur {totalQuestions}
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-purple-100">
          <div
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {currentQuestion.question}
        </h3>

        {/* Answer inputs - Handle different variations of type names */}
        {(currentQuestion.type_reponse === 'Oui_Non') && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer('opt_oui')}
              className="px-6 py-4 text-center bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 font-medium"
            >
              Oui
            </button>
            <button
              onClick={() => handleAnswer('opt_non')}
              className="px-6 py-4 text-center bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 font-medium"
            >
              Non
            </button>
          </div>
        )}

        {(currentQuestion.type_reponse === 'Number' || 
          currentQuestion.type_reponse === 'Nombre') && (
          <div className="space-y-2">
            <input
              type="number"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="Entrez un nombre"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  if (!isNaN(value)) handleAnswer(value);
                }
              }}
            />
            <p className="text-sm text-gray-500">Appuyez sur Entrée pour valider</p>
          </div>
        )}

        {(currentQuestion.type_reponse === 'Choix_Multiple_ABC' || 
          currentQuestion.type_reponse === 'Choix_Multiple' ||
          currentQuestion.type_reponse === 'Choix_Multiple_Simple') && 
          currentQuestion.options_json && (
          <div className="space-y-3">
            {Object.entries(currentQuestion.options_json).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                className="w-full px-6 py-4 text-left bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 font-medium"
              >
                {label as string}
              </button>
            ))}
          </div>
        )}

        {/* Fallback if type doesn't match any known type */}
        {!['Oui_Non', 'Number', 'Nombre', 'Choix_Multiple_ABC', 'Choix_Multiple', 'Choix_Multiple_Simple']
           .includes(currentQuestion.type_reponse) && (
          <div className="p-4 bg-red-50 text-red-700 rounded">
            Type de question non reconnu: {currentQuestion.type_reponse}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
      </div>

      {/* Privacy notice */}
      <p className="text-sm text-gray-500 text-center">
        Vos réponses restent sur votre appareil et ne sont pas enregistrées.
      </p>
    </div>
  );
};

export default EligibilityWizard;