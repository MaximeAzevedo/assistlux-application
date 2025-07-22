// Composant principal pour la préparation documents logement social

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useLogementSocial } from '../../hooks/useLogementSocial';
import QuestionnaireLogement from './QuestionnaireLogement';
import ChecklistDocuments from './ChecklistDocuments';
import PopupVideo from './PopupVideo';
import PopupExemple from './PopupExemple';

const PreparationLogementSocial: React.FC = () => {
  const navigate = useNavigate();
  const logementSocial = useLogementSocial();

  const { state, statistiques, popupContent, fermerPopup } = logementSocial;

  // ═══════════════════════════════════════════════════════════
  // RENDU CONDITIONNEL SELON L'ÉTAPE
  // ═══════════════════════════════════════════════════════════

  const renderContent = () => {
    switch (state.etape) {
      case 'questionnaire':
        return <QuestionnaireLogement {...logementSocial} />;
      
      case 'checklist':
        return <ChecklistDocuments {...logementSocial} />;
      
      default:
        return <QuestionnaireLogement {...logementSocial} />;
    }
  };

  const renderStatutGlobal = () => {
    if (state.etape === 'questionnaire') return null;

    const { obligatoiresComplets, pourcentageTotal, pret } = statistiques;

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              pret ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              {pret ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {pret ? 'Dossier prêt !' : 'Préparation en cours'}
              </h3>
              <p className="text-sm text-gray-600">
                Documents obligatoires : {obligatoiresComplets}% • Total : {pourcentageTotal}%
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{pourcentageTotal}%</div>
            <div className="text-xs text-gray-500">complété</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                pret ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${pourcentageTotal}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Navigation */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/effectuer-demarche')}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>

            {/* Indicateur de langue vidéo */}
            {state.etape === 'checklist' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Vidéos en :</span>
                <span className="font-medium">{state.langueVideo === 'fr' ? 'Français' : state.langueVideo}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Home className="w-4 h-4" />
            Préparation Logement Social
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Préparez votre dossier de demande
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {state.etape === 'questionnaire' 
              ? "Répondez à quelques questions pour générer votre liste personnalisée de documents"
              : "Cochez les documents que vous possédez et découvrez comment obtenir les autres"
            }
          </p>
        </div>

        {/* Statut global */}
        {renderStatutGlobal()}

        {/* Contenu principal */}
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>

        {/* Info Box - Privacy */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-4xl mx-auto mt-8">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ 100% Conforme RGPD
              </h3>
              <p className="text-green-800 leading-relaxed">
                Aucun document n'est téléchargé ou stocké. Vos réponses restent sur votre appareil. 
                Cette aide à la préparation vous permet d'arriver organisé(e) à votre rendez-vous.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popups */}
      {popupContent.isOpen && popupContent.type === 'video' && (
        <PopupVideo
          documentId={popupContent.documentId}
          langue={popupContent.langue!}
          onClose={fermerPopup}
        />
      )}

      {popupContent.isOpen && popupContent.type === 'exemple' && (
        <PopupExemple
          documentId={popupContent.documentId}
          onClose={fermerPopup}
        />
      )}
    </div>
  );
};

export default PreparationLogementSocial; 