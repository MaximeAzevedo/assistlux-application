import { useState, useEffect } from 'react';
import EligibilityWizardShared from '../components/EligibilityChecker/EligibilityWizardShared';
import EligibilityResultsShared from '../components/EligibilityChecker/EligibilityResultsShared';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';

const EligibilityWizardDirect: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'start' | 'shared' | 'results'>('start');
  const [results, setResults] = useState<any>(null);

  const handleBack = () => {
    if (mode === 'start') {
      navigate('/');
    } else {
      setMode('start');
      setResults(null);
    }
  };

  const handleStart = () => {
    setMode('shared');
  };

  const handleComplete = (eligibilityResults: any) => {
    setResults(eligibilityResults);
    setMode('results');
  };

  const handleRestart = () => {
    setResults(null);
    setMode('start');
  };

  if (mode === 'results') {
    return (
      <EligibilityResultsShared 
        results={results}
        onBack={handleBack}
        onRestart={handleRestart}
      />
    );
  }

  if (mode === 'shared') {
    return (
      <EligibilityWizardShared 
        onBack={handleBack}
        onComplete={handleComplete}
      />
    );
  }

  // Interface de démarrage
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Vérificateur d'Éligibilité AssistLux
            </h1>
            <p className="text-lg text-gray-600">
              Découvrez les aides sociales auxquelles vous avez droit au Luxembourg
            </p>
          </div>

          {/* Mode Écran Partagé - Centré */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1">
              <div className="bg-white rounded-xl p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Vérificateur d'Éligibilité</h3>
                    <div className="flex items-center gap-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      ✨ NOUVELLE VERSION
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Interface collaborative idéale pour les entretiens avec un travailleur social. 
                  Questions ultra-simples, traduction temps réel et rapport détaillé pour les deux parties.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Interface collaborative travailleur social / bénéficiaire</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Traduction temps réel (FR/DE/LU/EN)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Rapport bilingue instantané</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Questions guidées avec aide contextuelle</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 mb-4">
                  ⏱️ 3-5 minutes | 🔒 100% privé | 📄 Rapport imprimable
                </div>

                <button
                  onClick={handleStart}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Commencer le vérificateur
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h4 className="font-semibold text-purple-900 mb-2 text-center">
              🔒 Politique de Confidentialité Stricte
            </h4>
            <p className="text-purple-800 text-sm text-center">
              Aucune donnée personnelle n'est stockée. 
              Toutes les réponses sont traitées en mémoire uniquement et supprimées à la fin de la session.
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityWizardDirect; 