import React, { useState } from 'react';
import { Shield, Check, X, Eye, Clock, Trash2, MapPin } from 'lucide-react';

interface GDPRConsentProps {
  onAccept: () => void;
  onReject: () => void;
  isVisible: boolean;
}

export const GDPRConsent: React.FC<GDPRConsentProps> = ({
  onAccept,
  onReject,
  isVisible
}) => {
  const [hasReadDetails, setHasReadDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Protection des Données Personnelles</h2>
              <p className="text-purple-100">Conformité RGPD - Consentement Requis</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Résumé principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🎤 Utilisation du Traducteur d'Entretiens
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Pour utiliser notre traducteur d'entretiens en temps réel, nous devons traiter temporairement 
              vos données vocales via des services Azure basés en Europe. Votre consentement explicite est requis.
            </p>
          </div>

          {/* Points clés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-green-900">Données en Europe</div>
                <div className="text-sm text-green-700">Traitement exclusivement via Azure EU</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Traitement Temporaire</div>
                <div className="text-sm text-blue-700">Aucun stockage permanent</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium text-purple-900">Transparent</div>
                <div className="text-sm text-purple-700">Vous contrôlez vos données</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-medium text-red-900">Suppression Auto</div>
                <div className="text-sm text-red-700">Nettoyage après chaque session</div>
              </div>
            </div>
          </div>

          {/* Bouton détails */}
          <button
            onClick={() => {
              setShowDetails(!showDetails);
              if (!showDetails) setHasReadDetails(true);
            }}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-medium mb-4"
          >
            <Eye className="h-4 w-4" />
            <span>{showDetails ? 'Masquer' : 'Voir'} les détails techniques</span>
          </button>

          {/* Détails techniques */}
          {showDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
              <h4 className="font-semibold mb-3">🔧 Détails Techniques du Traitement</h4>
              
              <div className="space-y-3">
                <div>
                  <strong>Services utilisés :</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Azure Speech Services (région: West Europe)</li>
                    <li>Azure OpenAI (région: Sweden Central)</li>
                  </ul>
                </div>
                
                <div>
                  <strong>Données traitées :</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Enregistrements vocaux temporaires (transcription)</li>
                    <li>Texte transcrit (traduction)</li>
                    <li>Métadonnées de session (langues, qualité)</li>
                  </ul>
                </div>
                
                <div>
                  <strong>Finalités :</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Reconnaissance vocale en temps réel</li>
                    <li>Traduction automatique bidirectionnelle</li>
                    <li>Synthèse vocale</li>
                  </ul>
                </div>
                
                <div>
                  <strong>Durée de conservation :</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Pendant la session: En mémoire temporaire uniquement</li>
                    <li>Après la session: Suppression automatique immédiate</li>
                    <li>Export: Optionnel, local uniquement, sous votre contrôle</li>
                  </ul>
                </div>
                
                <div>
                  <strong>Vos droits :</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Retirer votre consentement à tout moment</li>
                    <li>Arrêter la session immédiatement</li>
                    <li>Contrôler l'export des données</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Checkbox confirmation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadDetails}
                onChange={(e) => setHasReadDetails(e.target.checked)}
                className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="text-sm">
                <div className="font-medium text-gray-900 mb-1">
                  ✅ Je comprends et j'accepte le traitement de mes données
                </div>
                <div className="text-gray-700">
                  J'ai lu les informations ci-dessus et je consens explicitement au traitement 
                  temporaire de mes données vocales par les services Azure EU dans le cadre 
                  de la traduction d'entretiens.
                </div>
              </div>
            </label>
          </div>

          {/* Note légale */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong>Base légale :</strong> Consentement (Art. 6.1.a RGPD) | 
            <strong> Responsable :</strong> AssistLux | 
            <strong> Contact DPO :</strong> dpo@assistlux.lu
          </div>
        </div>

        {/* Footer avec boutons */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Refuser</span>
          </button>
          
          <button
            onClick={onAccept}
            disabled={!hasReadDetails}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
              hasReadDetails
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>Accepter et Continuer</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 