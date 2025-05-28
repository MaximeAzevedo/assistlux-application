import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

interface EligibilityResultsProps {
  answers: Record<string, any>;
  onBack: () => void;
}

const EligibilityResults: React.FC<EligibilityResultsProps> = ({ answers, onBack }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const analyzeEligibility = async () => {
      try {
        // Get all conclusions with correct table name
        const { data: conclusions, error: conclusionsError } = await supabase
          .from('conclusions') // Corrected table name
          .select('*');

        if (conclusionsError) throw conclusionsError;
        if (!conclusions) return;

        // Log for debugging
        console.log('Answers:', answers);
        console.log('Conclusions:', conclusions);

        // Evaluate each conclusion's condition against the answers
        const eligibleResults = conclusions
          .map(conclusion => {
            const isEligible = evaluateCondition(conclusion.logic_condition, answers);
            console.log(`Evaluating ${conclusion.titre_aide}: ${conclusion.logic_condition} = ${isEligible}`);
            
            if (!isEligible) return null;

            return {
              aid_id: conclusion.titre_aide,
              message: conclusion.texte_conclusion,
              category: conclusion.categorie,
              form: conclusion.url_formulaire,
              source: conclusion.url_source,
              action: conclusion.action
            };
          })
          .filter(Boolean);

        setResults(eligibleResults);
      } catch (err) {
        console.error('Error analyzing eligibility:', err);
        setError(t('errors.analysis') || 'Erreur lors de l\'analyse');
      } finally {
        setLoading(false);
      }
    };

    analyzeEligibility();
  }, [answers, t]);

  const evaluateCondition = (condition: string, answers: Record<string, any>): boolean => {
    try {
      if (!condition) return false;
      
      // Remove any whitespace
      condition = condition.trim();

      // Handle AND conditions first (highest precedence)
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
        const match = condition.match(/(.+?)\s+IN\s+\{(.+?)\}/);
        if (match) {
          const [, key, valuesStr] = match;
          const values = valuesStr.split(',').map(v => v.trim());
          const answerValue = answers[key.trim()];
          return values.includes(answerValue);
        }
      }

      // Handle NOT conditions
      if (condition.startsWith('NOT ')) {
        const subCondition = condition.substring(4).trim();
        return !evaluateCondition(subCondition, answers);
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
        const answerValue = answers[key];
        
        // Handle numeric equality
        if (!isNaN(parseFloat(value)) && !isNaN(parseFloat(answerValue))) {
          return parseFloat(answerValue) === parseFloat(value);
        }
        
        // String equality
        return answerValue === value;
      }

      // Handle != conditions
      if (condition.includes('!=')) {
        const [key, value] = condition.split('!=').map(s => s.trim());
        return answers[key] !== value;
      }

      console.warn(`Could not evaluate condition: ${condition}`);
      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error, condition);
      return false;
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

  const eligibleAids = results.filter(r => r.category === 'Eligible');
  const maybeEligibleAids = results.filter(r => r.category === 'Maybe');
  const ineligibleAids = results.filter(r => r.category === 'Not_Eligible');

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">
          Résultats de votre analyse
        </h2>
        <p className="text-purple-800">
          {results.length > 0 
            ? `Nous avons identifié ${results.length} aide${results.length > 1 ? 's' : ''} pour votre situation.`
            : 'Voici les résultats de votre analyse d\'éligibilité.'}
        </p>
      </div>

      {/* Eligible aids */}
      {eligibleAids.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Aides auxquelles vous êtes éligible
          </h3>
          <div className="space-y-4">
            {eligibleAids.map((result, index) => (
              <AidCard key={`eligible-${index}`} {...result} />
            ))}
          </div>
        </div>
      )}

      {/* Maybe eligible aids */}
      {maybeEligibleAids.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Aides potentielles (vérification nécessaire)
          </h3>
          <div className="space-y-4">
            {maybeEligibleAids.map((result, index) => (
              <AidCard key={`maybe-${index}`} {...result} />
            ))}
          </div>
        </div>
      )}

      {/* No aids found */}
      {results.length === 0 && (
        <div className="bg-yellow-50 rounded-xl p-6">
          <p className="text-yellow-800">
            Selon vos réponses, nous n'avons pas trouvé d'aides correspondant exactement à votre situation. 
            Cela ne signifie pas qu'aucune aide n'est disponible. Nous vous recommandons de contacter 
            un assistant social ou les services sociaux de votre commune pour une analyse plus approfondie.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors font-medium"
        >
          ← Refaire le test
        </button>

        <button
          onClick={() => {
            // Generate summary text
            const summary = generateSummary(results, answers);
            // Create blob and download
            const blob = new Blob([summary], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resultats-eligibilite-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg"
        >
          <Download className="w-5 h-5" />
          Télécharger les résultats
        </button>
      </div>
    </div>
  );
};

// Aid Card Component
const AidCard: React.FC<any> = ({ aid_id, message, category, form, source, action }) => {
  const categoryConfig = {
    Eligible: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      label: 'Éligible'
    },
    Maybe: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      label: 'Peut-être éligible'
    },
    Not_Eligible: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-800',
      label: 'Non éligible'
    }
  };

  const config = categoryConfig[category] || categoryConfig.Not_Eligible;

  return (
    <div className={`${config.bgColor} rounded-xl p-6 border ${config.borderColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {aid_id}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.badgeBg} ${config.badgeText}`}>
              {config.label}
            </span>
          </div>
          
          {message && (
            <p className="text-gray-700 mb-4 leading-relaxed">{message}</p>
          )}
          
          <div className="flex flex-wrap gap-3">
            {form && (
              <a
                href={form}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                {action || 'Faire la demande'}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {source && (
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
              >
                Plus d'informations
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate summary for download
const generateSummary = (results: any[], answers: Record<string, any>) => {
  const date = new Date().toLocaleDateString('fr-FR');
  let summary = `RÉSULTATS D'ÉLIGIBILITÉ AUX AIDES SOCIALES\n`;
  summary += `Date: ${date}\n\n`;
  
  summary += `VOS RÉPONSES:\n`;
  Object.entries(answers).forEach(([key, value]) => {
    summary += `- ${key}: ${value}\n`;
  });
  
  summary += `\n\nAIDES IDENTIFIÉES:\n\n`;
  
  const eligible = results.filter(r => r.category === 'Eligible');
  const maybe = results.filter(r => r.category === 'Maybe');
  
  if (eligible.length > 0) {
    summary += `AIDES AUXQUELLES VOUS ÊTES ÉLIGIBLE:\n`;
    eligible.forEach(aid => {
      summary += `\n- ${aid.aid_id}\n`;
      if (aid.message) summary += `  Description: ${aid.message}\n`;
      if (aid.form) summary += `  Formulaire: ${aid.form}\n`;
      if (aid.source) summary += `  Information: ${aid.source}\n`;
    });
  }
  
  if (maybe.length > 0) {
    summary += `\n\nAIDES POTENTIELLES (VÉRIFICATION NÉCESSAIRE):\n`;
    maybe.forEach(aid => {
      summary += `\n- ${aid.aid_id}\n`;
      if (aid.message) summary += `  Description: ${aid.message}\n`;
      if (aid.form) summary += `  Formulaire: ${aid.form}\n`;
      if (aid.source) summary += `  Information: ${aid.source}\n`;
    });
  }
  
  summary += `\n\nCe document est fourni à titre indicatif. Veuillez contacter les services sociaux pour confirmer votre éligibilité.`;
  
  return summary;
};

export default EligibilityResults;