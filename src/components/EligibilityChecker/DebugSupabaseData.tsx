import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

interface Question {
  id: string;
  ordre: number;
  question: string;
  key_reponse: string;
  type_reponse: string;
  options_json?: any;
  condition_affichage?: string;
}

interface Conclusion {
  id: string;
  titre_aide: string;
  logic_condition: string;
  texte_conclusion: string;
  categorie: string;
  url_formulaire?: string;
  url_source?: string;
}

export const DebugSupabaseData: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [conclusions, setConclusions] = useState<Conclusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Chargement données Supabase...');

      // Charger les questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('ordre');

      if (questionsError) {
        console.error('Erreur questions:', questionsError);
        setError(`Erreur questions: ${questionsError.message}`);
      } else {
        console.log('Questions chargées:', questionsData);
        setQuestions(questionsData || []);
      }

      // Charger les conclusions
      const { data: conclusionsData, error: conclusionsError } = await supabase
        .from('conclusions')
        .select('*')
        .order('titre_aide');

      if (conclusionsError) {
        console.error('Erreur conclusions:', conclusionsError);
        setError(prev => prev ? `${prev} | Erreur conclusions: ${conclusionsError.message}` : `Erreur conclusions: ${conclusionsError.message}`);
      } else {
        console.log('Conclusions chargées:', conclusionsData);
        setConclusions(conclusionsData || []);
      }

    } catch (err) {
      console.error('Erreur générale:', err);
      setError(`Erreur générale: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogic = (testAnswers: Record<string, any>, description: string) => {
    console.log(`\n🧪 TEST: ${description}`);
    console.log('Réponses:', testAnswers);
    
    conclusions.forEach(conclusion => {
      const isEligible = evaluateCondition(conclusion.logic_condition, testAnswers);
      console.log(`   ${conclusion.titre_aide}: ${isEligible ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}`);
    });
  };

  // Fonction d'évaluation simplifiée
  const evaluateCondition = (condition: string, answers: Record<string, any>): boolean => {
    if (!condition) return true;

    try {
      // Handle AND conditions
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

      // Handle equality
      if (condition.includes(' = ')) {
        const [key, value] = condition.split(' = ').map(s => s.trim());
        return answers[key] === value;
      }

      // Handle numeric comparisons
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

      return false;
    } catch (error) {
      console.error('Erreur évaluation:', error);
      return false;
    }
  };

  const runTests = () => {
    // Test 1: Profil éligible
    testLogic({
      q_residence_lux: 'opt_oui',
      q_nationalite_cat: 'opt_A',
      q_sejour_legal_rnpp: 'opt_oui',
      q_age: 25,
      q_institution: 'opt_non',
      q_revenus_mensuels: 2500
    }, 'Profil éligible standard');

    // Test 2: Résidence = NON
    testLogic({
      q_residence_lux: 'opt_non'
    }, 'Résidence = NON (devrait donner 0 aides)');

    // Test 3: Revenus élevés
    testLogic({
      q_residence_lux: 'opt_oui',
      q_nationalite_cat: 'opt_A',
      q_sejour_legal_rnpp: 'opt_oui',
      q_age: 25,
      q_institution: 'opt_non',
      q_revenus_mensuels: 15000
    }, 'Revenus très élevés');
  };

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🔍 Debug Supabase - Chargement...</h2>
        <div className="animate-pulse">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">🔍 Debug - Données Supabase Actuelles</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Questions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">📋 Questions ({questions.length})</h3>
        {questions.length === 0 ? (
          <div className="text-red-600">❌ Aucune question trouvée</div>
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="bg-white p-3 rounded border">
                <div className="font-medium">
                  {q.ordre}. {q.question} ({q.key_reponse})
                </div>
                <div className="text-sm text-gray-600">Type: {q.type_reponse}</div>
                {q.options_json && (
                  <div className="text-sm text-blue-600">
                    Options: {JSON.stringify(q.options_json)}
                  </div>
                )}
                {q.condition_affichage && (
                  <div className="text-sm text-orange-600">
                    Condition: {q.condition_affichage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conclusions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">🎯 Aides/Conclusions ({conclusions.length})</h3>
        {conclusions.length === 0 ? (
          <div className="text-red-600">❌ Aucune aide trouvée</div>
        ) : (
          <div className="space-y-3">
            {conclusions.map(c => (
              <div key={c.id} className="bg-white p-3 rounded border">
                <div className="font-medium flex items-center gap-2">
                  {c.titre_aide}
                  <span className={`px-2 py-1 rounded text-xs ${
                    c.categorie === 'Eligible' ? 'bg-green-100 text-green-800' :
                    c.categorie === 'Maybe' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {c.categorie}
                  </span>
                </div>
                <div className="text-sm text-purple-600 font-mono">
                  Condition: {c.logic_condition}
                </div>
                <div className="text-sm text-gray-600">
                  {c.texte_conclusion?.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton de test */}
      <div className="border-t pt-4">
        <button
          onClick={runTests}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🧪 Lancer les tests de logique (voir console)
        </button>
        <div className="text-sm text-gray-600 mt-2">
          Les résultats des tests s'afficheront dans la console du navigateur (F12)
        </div>
      </div>

      {/* Bouton de rechargement */}
      <div className="mt-4">
        <button
          onClick={loadData}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          🔄 Recharger les données
        </button>
      </div>
    </div>
  );
};

export default DebugSupabaseData; 