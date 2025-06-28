import React from 'react';
import { Settings, Database } from 'lucide-react';
import ServiceImporter from '../components/Admin/ServiceImporter';

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Administration
            </h1>
          </div>
          <p className="text-gray-600">
            Gestion des données et configuration du système d'assistance sociale.
          </p>
        </div>

        {/* Import Section */}
        <div className="space-y-6">
          <ServiceImporter />
          
          {/* Status Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                État du Système
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-1">
                  Base de Données
                </h3>
                <p className="text-green-700 text-sm">
                  ✅ Connectée et opérationnelle
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-1">
                  Recherche
                </h3>
                <p className="text-blue-700 text-sm">
                  🔍 Système de recherche optimisé
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-1">
                  Chatbot
                </h3>
                <p className="text-purple-700 text-sm">
                  🤖 IA intégrée et fonctionnelle
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-medium text-yellow-900 mb-3">
              📋 Comment ça marche
            </h3>
            <div className="space-y-2 text-yellow-800 text-sm">
              <p><strong>1. Import des données :</strong> Cliquez sur "Importer les Services Sociaux" pour charger la base de données avec tous les services luxembourgeois.</p>
              <p><strong>2. Test du système :</strong> Une fois importé, testez le chatbot avec des questions comme "j'ai besoin d'aide alimentaire" ou "où manger gratuitement".</p>
              <p><strong>3. Réponses automatiques :</strong> Le système détecte automatiquement le type de besoin et propose les services appropriés avec toutes les informations pratiques.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 