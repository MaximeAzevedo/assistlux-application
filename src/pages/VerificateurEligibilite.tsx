import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EligibilityWizardShared from '../components/EligibilityChecker/EligibilityWizardShared';
import EligibilityResultsShared from '../components/EligibilityChecker/EligibilityResultsShared';
import { 
  Search, 
  ArrowRight, 
  Users,
  FileText,
  Globe,
  Shield,
  Clock
} from 'lucide-react';

const VerificateurEligibilite: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'intro' | 'questionnaire' | 'results'>('intro');
  const [results, setResults] = useState<any>(null);

  const handleStartEligibilityCheck = () => {
    setMode('questionnaire');
  };

  const handleComplete = (eligibilityResults: any) => {
    setResults(eligibilityResults);
    setMode('results');
  };

  const handleBack = () => {
    if (mode === 'intro') {
      navigate('/');
    } else {
      setMode('intro');
      setResults(null);
    }
  };

  const handleRestart = () => {
    setResults(null);
    setMode('intro');
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

  if (mode === 'questionnaire') {
    return (
      <EligibilityWizardShared 
        onBack={handleBack}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Vérificateur d'Éligibilité
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Identifiez toutes les aides sociales auxquelles vous avez droit au Luxembourg
            </p>
          </div>

          {/* Card principale */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1">
              <div className="bg-white rounded-xl p-6">
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Interface Collaborative
                    </h3>
                    <p className="text-gray-600">
                      Conçue pour les entretiens avec un travailleur social. 
                      Interface multilingue avec rapport détaillé instantané.
                    </p>
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700">Mode collaboratif</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700">6 langues supportées</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700">Rapport bilingue</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700">100% confidentiel</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-8 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold text-lg">11</span>
                    </div>
                    <p className="text-xs text-gray-600">questions max</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold text-lg">3-5</span>
                    </div>
                    <p className="text-xs text-gray-600">minutes</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                      <Globe className="w-4 h-4" />
                      <span className="font-bold text-lg">6</span>
                    </div>
                    <p className="text-xs text-gray-600">langues</p>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleStartEligibilityCheck}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <span>Commencer la vérification</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Avantages */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h5 className="font-semibold text-blue-900 mb-2">Analyse Intelligente</h5>
                <p className="text-sm text-blue-800">
                  Identifie automatiquement toutes les aides disponibles selon votre situation.
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Globe className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h5 className="font-semibold text-green-900 mb-2">Multilingue</h5>
                <p className="text-sm text-green-800">
                  Interface en français, allemand, luxembourgeois, anglais, portugais, italien.
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h5 className="font-semibold text-purple-900 mb-2">Mode Collaboratif</h5>
                <p className="text-sm text-purple-800">
                  Travailleur social et bénéficiaire voient les informations simultanément.
                </p>
              </div>
            </div>
          </div>

          {/* Politique de Confidentialité */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">
                  🔒 Confidentialité Stricte
                </h4>
                <p className="text-purple-800 text-sm">
                  Aucune donnée personnelle n'est stockée. Toutes les réponses sont traitées en mémoire 
                  uniquement et supprimées automatiquement à la fin de la session.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation de retour */}
          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Retour à l'accueil
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerificateurEligibilite; 