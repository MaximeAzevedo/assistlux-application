import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  CheckCircle2,
  Users,
  FileText,
  Sparkles,
  Target
} from 'lucide-react';

const VerificateurEligibilite: React.FC = () => {
  const navigate = useNavigate();

  const handleStartEligibilityCheck = () => {
    navigate('/eligibility-wizard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8">
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Vérificateur d'Éligibilité
                </h1>
                <p className="text-gray-600">
                  Découvrez les aides auxquelles vous avez droit
                </p>
              </div>
            </div>

            {/* Vérificateur d'éligibilité Card */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1 mb-6">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                      <Target className="w-8 h-8 text-purple-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Découvrir mes aides
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Disponible
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Répondez à quelques questions pour découvrir toutes les aides sociales auxquelles vous êtes éligible au Luxembourg
                      </p>
                    </div>
                  </div>

                  {/* Stats en ligne */}
                  <div className="flex items-center justify-center gap-8 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="font-semibold">8</span>
                      </div>
                      <p className="text-xs text-gray-600">questions</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold">2-3</span>
                      </div>
                      <p className="text-xs text-gray-600">min</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">Premium</span>
                      </div>
                      <p className="text-xs text-gray-600">100% anonyme</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleStartEligibilityCheck}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <span>Commencer le test d'éligibilité</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1 text-sm">
                      Évaluation personnalisée et confidentielle
                    </h4>
                    <p className="text-purple-800 text-sm">
                      Notre algorithme intelligent analyse votre situation pour identifier toutes les aides disponibles : 
                      allocation de vie chère, logement social, prime énergie, subventions de loyer et bien plus. 
                      Vos données restent privées et sécurisées.
                    </p>
                  </div>
                </div>
              </div>

              {/* Avantages */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700 font-medium">Résultats instantanés</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700 font-medium">Toutes les aides du Luxembourg</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700 font-medium">Conseils personnalisés</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700 font-medium">Accompagnement premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificateurEligibilite; 