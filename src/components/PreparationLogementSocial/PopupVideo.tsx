// Popup pour afficher les vidéos explicatives

import React from 'react';
import { X, Play, Volume2, Globe } from 'lucide-react';
import { DOCUMENTS, LANGUES } from '../../constants/logementSocial';
import { LangueVideo } from '../../types/logementSocial';

interface PopupVideoProps {
  documentId: string;
  langue: LangueVideo;
  onClose: () => void;
}

const PopupVideo: React.FC<PopupVideoProps> = ({ documentId, langue, onClose }) => {
  const document = DOCUMENTS.find(d => d.id === documentId);
  const langueInfo = LANGUES.find(l => l.code === langue);

  if (!document) return null;

  // Construction du chemin de la vidéo
  const videoPath = document.videoFileName 
    ? `/videos/${langue}/${document.videoFileName}.mp4`
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Vidéo explicative
              </h2>
              <p className="text-gray-600">{document.nom}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicateur de langue */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
              <Globe className="w-4 h-4 text-gray-600" />
              <span>{langueInfo?.flag} {langueInfo?.label}</span>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Zone vidéo */}
          <div className="bg-gray-900 rounded-xl overflow-hidden mb-6">
            {videoPath ? (
              <video
                className="w-full aspect-video"
                controls
                autoPlay
                preload="metadata"
              >
                <source src={videoPath} type="video/mp4" />
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Votre navigateur ne supporte pas les vidéos HTML5.</p>
                  </div>
                </div>
              </video>
            ) : (
              <div className="aspect-video flex items-center justify-center text-white">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">Vidéo en préparation</h3>
                  <p className="text-gray-300">
                    La vidéo pour ce document sera bientôt disponible.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Informations sur le document */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">À propos de ce document :</h3>
              <p className="text-gray-600">{document.description}</p>
            </div>

            {/* Conseils */}
            {document.conseils && document.conseils.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Conseils pratiques :</h4>
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

            {/* Statut du document */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Statut du document</h4>
                  <p className="text-gray-600">
                    {document.obligatoire ? 'Document obligatoire' : 'Document optionnel'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  document.obligatoire 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {document.obligatoire ? 'Obligatoire' : 'Optionnel'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Vidéo disponible en {LANGUES.length} langues
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupVideo; 