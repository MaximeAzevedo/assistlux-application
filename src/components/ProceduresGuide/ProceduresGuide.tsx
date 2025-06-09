import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, 
  ArrowRight, 
  Clock, 
  FileText, 
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Home,
  Camera,
  Euro
} from 'lucide-react';

const ProceduresGuide: React.FC = () => {
  const navigate = useNavigate();

  const handleStartProcedure = (procedureId: string) => {
    navigate(`/effectuer-demarche/${procedureId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-8">
          <div className="relative z-10">
            {/* Header simplifié */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Accompagnateur de Démarches
                </h1>
                <p className="text-gray-600">
                  Votre assistant intelligent pour les procédures administratives
                </p>
              </div>
            </div>

            {/* Grid des démarches disponibles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              
              {/* Allocation Vie Chère Card - NOUVEAU */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Euro className="w-8 h-8 text-green-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Allocation Vie Chère
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          2025
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Formulaire intelligent pré-rempli avec IA pour votre demande FNS
                      </p>
                      
                      {/* Badge Scanner IA */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium mb-4">
                        <Sparkles className="w-3 h-3" />
                        IA + Formulaire officiel
                      </div>
                    </div>
                  </div>

                  {/* Stats en ligne */}
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="font-semibold">5</span>
                      </div>
                      <p className="text-xs text-gray-600">étapes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">8-12</span>
                      </div>
                      <p className="text-xs text-gray-600">min</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold">Smart</span>
                      </div>
                      <p className="text-xs text-gray-600">Pré-rempli</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate('/allocation-vie-chere')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <span>Démarrer ma demande</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Aide au logement Card - NOUVEAU avec scanner IA */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                      <Home className="w-8 h-8 text-blue-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Aide au logement
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Nouveau
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Assistance financière pour le logement avec scanner IA de documents
                      </p>
                      
                      {/* Badge Scanner IA */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-4">
                        <Camera className="w-3 h-3" />
                        Scanner IA intégré
                      </div>
                    </div>
                  </div>

                  {/* Stats en ligne */}
                  <div className="flex items-center justify-center gap-8 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="font-semibold">5</span>
                      </div>
                      <p className="text-xs text-gray-600">étapes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">10-15</span>
                      </div>
                      <p className="text-xs text-gray-600">min</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Camera className="w-4 h-4" />
                        <span className="font-semibold">Auto</span>
                      </div>
                      <p className="text-xs text-gray-600">Pré-remplissage</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartProcedure('aide-logement')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <span>Commencer ma démarche</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Assistance Judiciaire Card - Design épuré */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-8 h-8 text-purple-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Assistance Judiciaire
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Disponible
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Aide juridictionnelle pour vos procédures judiciaires au Luxembourg
                      </p>
                    </div>
                  </div>

                  {/* Stats en ligne */}
                  <div className="flex items-center justify-center gap-8 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="font-semibold">5</span>
                      </div>
                      <p className="text-xs text-gray-600">étapes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">15-25</span>
                      </div>
                      <p className="text-xs text-gray-600">min</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">Expert</span>
                      </div>
                      <p className="text-xs text-gray-600">Accompagnement</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartProcedure('assistance-judiciaire')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <span>Commencer ma démarche</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">
                      Assistance personnalisée avec IA
                    </h4>
                    <p className="text-blue-800 text-sm">
                      Notre système intelligent s'adapte à votre situation spécifique et vous guide 
                      étape par étape. Le scanner IA analyse vos documents pour pré-remplir automatiquement 
                      vos formulaires. Toutes vos données sont sécurisées et confidentielles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProceduresGuide;