import { useState, useEffect } from 'react';
import EligibilityWizardRefactored from '../components/EligibilityChecker/EligibilityWizardRefactored';
import EligibilityWizardShared from '../components/EligibilityChecker/EligibilityWizardShared';
import EligibilityResultsShared from '../components/EligibilityChecker/EligibilityResultsShared';
import { useNavigate } from 'react-router-dom';
import { Users, User, ArrowLeft } from 'lucide-react';

const EligibilityWizardDirect: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'classic' | 'shared' | 'results'>('select');
  const [results, setResults] = useState<any>(null);

  const handleBack = () => {
    if (mode === 'select') {
      navigate('/');
    } else {
      setMode('select');
      setResults(null);
    }
  };

  const handleModeSelect = (selectedMode: 'classic' | 'shared') => {
    setMode(selectedMode);
  };

  const handleComplete = (eligibilityResults: any) => {
    setResults(eligibilityResults);
    setMode('results');
  };

  const handleRestart = () => {
    setResults(null);
    setMode('select');
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

  if (mode === 'classic') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Vérificateur d'Éligibilité AssistLux
            </h1>
            <p className="text-lg text-gray-600">
              Découvrez les aides sociales auxquelles vous avez droit au Luxembourg
            </p>
          </div>

          <EligibilityWizardRefactored onBack={handleBack} />
        </div>
      </div>
    );
  }

  // Mode selection
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
              Choisissez le mode d'utilisation qui vous convient
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Mode Écran Partagé */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1">
              <div className="bg-white rounded-xl p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Mode Écran Partagé</h3>
                    <div className="flex items-center gap-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      ✨ NOUVEAU
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Idéal pour les entretiens avec un travailleur social. Interface bilingue en temps réel, 
                  questions ultra-simples et rapport détaillé pour les deux parties.
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
                  onClick={() => handleModeSelect('shared')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Démarrer en mode partagé
                </button>
              </div>
            </div>

            {/* Mode Classique */}
            <div className="border-2 border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Mode Personnel</h3>
                  <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    CLASSIQUE
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                Version individuelle traditionnelle pour une utilisation autonome. 
                Interface simple et directe en français uniquement.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Utilisation individuelle</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Interface en français</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Résultats standards</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Questions guidées classiques</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500 mb-4">
                ⏱️ 2-3 minutes | 🔒 100% privé | 📋 Résultats simples
              </div>

              <button
                onClick={() => handleModeSelect('classic')}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Utiliser le mode classique
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h4 className="font-semibold text-purple-900 mb-2 text-center">
              🔒 Politique de Confidentialité Stricte
            </h4>
            <p className="text-purple-800 text-sm text-center">
              Aucune donnée personnelle n'est stockée, quelle que soit l'option choisie. 
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