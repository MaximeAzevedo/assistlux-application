// Popup pour afficher les exemples anonymisés de documents

import React from 'react';
import { X, Eye, FileText, AlertTriangle } from 'lucide-react';
import { DOCUMENTS } from '../../constants/logementSocial';

interface PopupExempleProps {
  documentId: string;
  onClose: () => void;
}

const PopupExemple: React.FC<PopupExempleProps> = ({ documentId, onClose }) => {
  const document = DOCUMENTS.find(d => d.id === documentId);

  if (!document) return null;

  // Construction du chemin de l'exemple
  const exemplePath = document.exempleFileName 
    ? `/exemples/${document.exempleFileName}`
    : null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Exemple de document
              </h2>
              <p className="text-gray-600">{document.nom}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Avertissement */}
        <div className="p-6 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-semibold text-yellow-900 mb-1">
                ⚠️ Document d'exemple anonymisé
              </h3>
              <p className="text-yellow-800">
                Ce document est fourni à titre d'exemple uniquement. Toutes les informations 
                personnelles ont été anonymisées. Utilisez-le comme référence pour identifier 
                le type de document que vous devez fournir.
              </p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 max-h-[60vh] overflow-auto">
          {/* Zone d'affichage du document */}
          <div className="bg-gray-50 rounded-xl overflow-hidden mb-6">
            {exemplePath ? (
              <div className="min-h-[400px]">
                {/* Pour les PDF */}
                {exemplePath.endsWith('.pdf') && (
                  <iframe
                    src={exemplePath}
                    className="w-full h-[500px] border-0"
                    title={`Exemple: ${document.nom}`}
                  />
                )}

                {/* Pour les images */}
                {(exemplePath.endsWith('.jpg') || exemplePath.endsWith('.jpeg') || exemplePath.endsWith('.png')) && (
                  <img
                    src={exemplePath}
                    alt={`Exemple: ${document.nom}`}
                    className="w-full h-auto"
                  />
                )}
              </div>
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">Exemple en préparation</h3>
                  <p className="text-gray-400">
                    L'exemple pour ce document sera bientôt disponible.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Informations sur le document */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                📋 Points clés à retenir :
              </h3>
              <p className="text-gray-600 mb-4">{document.description}</p>
            </div>

            {/* Conseils spécifiques */}
            {document.conseils && document.conseils.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  💡 Conseils pour ce document :
                </h4>
                <ul className="space-y-2">
                  {document.conseils.map((conseil, index) => (
                    <li key={index} className="flex items-start gap-2 text-blue-800">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{conseil}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conseils généraux pour l'utilisation de l'exemple */}
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                ✅ Comment utiliser cet exemple :
              </h4>
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Comparez le format avec votre document personnel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Vérifiez que toutes les informations importantes sont présentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Assurez-vous que votre document est lisible et complet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>N'hésitez pas à demander conseil si vous avez des doutes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              💼 Document anonymisé • Exemple fourni à titre indicatif
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupExemple; 