import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Settings, Shield } from 'lucide-react';

const PersonalSpace: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Espace Personnel
          </h1>
          <p className="text-gray-600">
            Gérez vos informations et suivez vos démarches
          </p>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-12 h-12 text-purple-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Espace en cours de développement
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Votre espace personnel sera bientôt disponible avec de nouvelles fonctionnalités 
            pour gérer vos informations, suivre vos démarches et accéder à vos documents.
          </p>

          {currentUser && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-purple-700">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Connecté en tant que: {currentUser.email}</span>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Merci de votre patience pendant que nous améliorons cette section.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSpace;