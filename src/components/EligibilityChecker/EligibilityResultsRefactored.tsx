import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ExternalLink, Loader2, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import type { EligibilityResult, CategorizedResults, Recommendation } from '../../hooks/useEligibilityEngine';

// ═══════════════════════════════════════════════════════════
// TYPES ET INTERFACES
// ═══════════════════════════════════════════════════════════

interface EligibilityResultsRefactoredProps {
  results: EligibilityResult[];
  categorized: CategorizedResults | null;
  recommendations: Recommendation[];
  loading: boolean;
  onBack: () => void;
  onRestart: () => void;
  onExport: (options?: any) => void;
  exportLoading: boolean;
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL - RÉSULTATS REFACTORISÉS
// ═══════════════════════════════════════════════════════════

const EligibilityResultsRefactored: React.FC<EligibilityResultsRefactoredProps> = ({
  results,
  categorized,
  recommendations,
  loading,
  onBack,
  onRestart,
  onExport,
  exportLoading
}) => {
  const { t } = useTranslation();

  // ─────────────────────────────────────────────────────────
  // ÉTAT DE CHARGEMENT
  // ─────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* EN-TÊTE SIMPLE */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <CheckCircle className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Résultats de votre analyse
          </h2>
        </div>
        
        <p className="text-gray-600">
          Nous avons identifié {categorized?.eligible.length || 0} résultat{(categorized?.eligible.length || 0) > 1 ? 's' : ''} pour votre situation.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AIDES ÉLIGIBLES UNIQUEMENT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      {categorized?.eligible && categorized.eligible.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Aides auxquelles vous êtes éligible
          </h3>
          <div className="space-y-4">
            {categorized.eligible.map((result, index) => (
              <AidCard key={`eligible-${index}`} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AUCUN RÉSULTAT */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      {(!categorized?.eligible || categorized.eligible.length === 0) && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Aucune aide automatiquement détectée
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Selon vos réponses, nous n'avons pas trouvé d'aides correspondant exactement à votre situation. 
            Nous vous recommandons de contacter un assistant social pour une analyse plus approfondie.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACTIONS PRINCIPALES */}
      {/* ═══════════════════════════════════════════════════════════ */}
      
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200">
        
        {/* Actions de navigation */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors font-medium rounded-xl border-2 border-gray-200 hover:border-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au questionnaire
          </button>

          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-6 py-3 text-purple-700 hover:text-purple-900 transition-colors font-medium rounded-xl border-2 border-purple-200 hover:border-purple-300"
          >
            <RefreshCw className="w-5 h-5" />
            Recommencer
          </button>
        </div>

        {/* Actions d'export */}
        {categorized?.eligible && categorized.eligible.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => onExport({ format: 'txt' })}
              disabled={exportLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg disabled:opacity-50"
            >
              {exportLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Télécharger les résultats
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// COMPOSANTS UTILITAIRES
// ═══════════════════════════════════════════════════════════

interface AidCardProps {
  result: EligibilityResult;
}

const AidCard: React.FC<AidCardProps> = ({ result }) => {
  return (
    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {result.aid_id}
            </h3>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Éligible
            </span>
          </div>
          
          {result.message && (
            <p className="text-gray-700 mb-4 leading-relaxed">{result.message}</p>
          )}
          
          <div className="flex flex-wrap gap-3">
            {result.form && (
              <a
                href={result.form}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Télécharger
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {result.source && (
              <a
                href={result.source}
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

export default EligibilityResultsRefactored; 