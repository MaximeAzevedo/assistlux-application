import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, CheckCircle2, FileText, Globe, AlertCircle } from 'lucide-react';

const ProceduresGuide: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Navigation */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Accompagnateur de Démarches
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Votre assistant intelligent pour les procédures administratives
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Préparez vos démarches administratives avec des outils respectueux de votre vie privée 
            et conformes au RGPD.
          </p>
        </div>

        {/* Nouvelle fonctionnalité - Préparation Logement Social */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-1 shadow-xl">
            <div className="bg-white rounded-xl p-8">
              <div className="flex items-start gap-6 mb-6">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Home className="w-10 h-10 text-blue-600" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Préparation Logement Social
                    </h2>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Conforme RGPD
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                    Préparez votre dossier de demande de logement social. Répondez à quelques questions 
                    pour générer une checklist personnalisée avec vidéos explicatives multilingues.
                  </p>
                  
                  {/* Features highlight */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Questionnaire intelligent</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Vidéos en 7 langues</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>Exemples anonymisés</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats et informations */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 mb-1">7</div>
                  <div className="text-sm text-blue-700">Questions intelligentes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 mb-1">21</div>
                  <div className="text-sm text-green-700">Documents référencés</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 mb-1">7</div>
                  <div className="text-sm text-purple-700">Langues disponibles</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">100%</div>
                  <div className="text-sm text-yellow-700">Conforme RGPD</div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate('/preparation-logement-social')}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <span className="text-lg">Préparer mon dossier</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
          {/* Conformité RGPD */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">
                  100% Conforme RGPD
                </h3>
                <p className="text-green-800 leading-relaxed text-sm">
                  Aucun document n'est téléchargé. Vos réponses restent sur votre appareil. 
                  Cette aide à la préparation vous permet d'arriver organisé(e) à votre rendez-vous.
                </p>
              </div>
            </div>
          </div>

          {/* Innovation technologique */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Assistance multilingue
                </h3>
                <p className="text-blue-800 leading-relaxed text-sm">
                  Vidéos explicatives disponibles en français, anglais, portugais, ukrainien, 
                  farsi, arabe et turc pour vous accompagner dans toutes les étapes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comment ça marche */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Comment ça fonctionne ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Questionnaire</h3>
              <p className="text-gray-600 text-sm">
                Répondez à 7 questions sur votre situation pour générer votre liste personnalisée
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Checklist</h3>
              <p className="text-gray-600 text-sm">
                Cochez les documents que vous avez et découvrez comment obtenir les autres
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Rendez-vous</h3>
              <p className="text-gray-600 text-sm">
                Présentez-vous organisé(e) avec tous vos documents aux services sociaux
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProceduresGuide;