import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Settings, Wrench } from 'lucide-react';

const AideLogementWizard: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/effectuer-demarche');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aide au logement</h1>
              <p className="text-gray-600">Assistant pour votre demande d'aide</p>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-12 h-12 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Assistant en cours de développement
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            L'assistant d'aide au logement sera bientôt disponible avec un processus 
            guidé et intuitif pour vous accompagner dans vos démarches.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-blue-700">
              <p className="font-medium mb-2">Fonctionnalités à venir :</p>
              <ul className="text-sm space-y-1 text-left max-w-md mx-auto">
                <li>• Formulaire guidé étape par étape</li>
                <li>• Scanner automatique de documents</li>
                <li>• Calcul automatique des montants</li>
                <li>• Génération de dossier complet</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux démarches
          </button>
        </div>
      </div>
    </div>
  );
};

export default AideLogementWizard; 