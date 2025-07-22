// Composant checklist pour la préparation logement social

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Play, 
  Eye, 
  Globe, 
  AlertTriangle,
  FileText,
  Download,
  RotateCcw
} from 'lucide-react';
import { LANGUES, CATEGORIES } from '../../constants/logementSocial';
import { DocumentAvecStatut, LangueVideo } from '../../types/logementSocial';
import { useLogementSocial } from '../../hooks/useLogementSocial';

interface ChecklistDocumentsProps extends ReturnType<typeof useLogementSocial> {}

const ChecklistDocuments: React.FC<ChecklistDocumentsProps> = ({
  state,
  statistiques,
  toggleDocument,
  ajouterNote,
  changerLangueVideo,
  ouvrirPopupVideo,
  ouvrirPopupExemple,
  retourQuestionnaire,
  exporterDonnees
}) => {
  const [filtreCategorie, setFiltreCategorie] = useState<string>('all');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // FILTRAGE DES DOCUMENTS
  // ═══════════════════════════════════════════════════════════

  const documentsFiltres = state.documentsRequis.filter(doc => {
    const matchCategorie = filtreCategorie === 'all' || doc.categorie === filtreCategorie;
    const matchStatut = !showOnlyMissing || !doc.possede;
    return matchCategorie && matchStatut;
  });

  // ═══════════════════════════════════════════════════════════
  // RENDU D'UN DOCUMENT
  // ═══════════════════════════════════════════════════════════

  const renderDocument = (document: DocumentAvecStatut) => {
    const categorie = CATEGORIES.find(c => c.id === document.categorie);
    const isCompleted = document.possede;

    return (
      <div
        key={document.id}
        className={`bg-white rounded-xl border-2 transition-all duration-200 ${
          isCompleted 
            ? 'border-green-200 bg-green-50/30' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
        }`}
      >
        <div className="p-6">
          {/* En-tête du document */}
          <div className="flex items-start gap-4 mb-4">
            {/* Checkbox */}
            <button
              onClick={() => toggleDocument(document.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>

            {/* Info document */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`text-lg font-semibold ${
                  isCompleted ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {document.nom}
                </h3>
                
                {/* Badge obligatoire/optionnel */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  document.obligatoire
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {document.obligatoire ? 'Obligatoire' : 'Optionnel'}
                </span>
              </div>

              <p className="text-gray-600 mb-3">{document.description}</p>

              {/* Badge catégorie */}
              {categorie && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{categorie.icon}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${categorie.color}-100 text-${categorie.color}-700`}>
                    {categorie.label}
                  </span>
                </div>
              )}

              {/* Conseils */}
              {document.conseils && document.conseils.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Conseils :</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {document.conseils.map((conseil, index) => (
                          <li key={index}>• {conseil}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-4">
            {/* Bouton vidéo */}
            {document.videoFileName && (
              <button
                onClick={() => ouvrirPopupVideo(document.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Vidéo explicative</span>
              </button>
            )}

            {/* Bouton exemple */}
            {document.exempleFileName && (
              <button
                onClick={() => ouvrirPopupExemple(document.id)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Voir l'exemple</span>
              </button>
            )}
          </div>

          {/* Zone de notes */}
          <div>
            <textarea
              value={document.notes || ''}
              onChange={(e) => ajouterNote(document.id, e.target.value)}
              placeholder="Ajouter une note personnelle..."
              className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════

  const handleExport = () => {
    const data = exporterDonnees();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checklist-logement-social-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Sélecteur de langue */}
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Langue des vidéos :</span>
            <select
              value={state.langueVideo}
              onChange={(e) => changerLangueVideo(e.target.value as LangueVideo)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUES.map(langue => (
                <option key={langue.code} value={langue.code}>
                  {langue.flag} {langue.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-3">
            <select
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyMissing}
                onChange={(e) => setShowOnlyMissing(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Seulement les manquants</span>
            </label>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{statistiques.total}</div>
          <div className="text-sm text-gray-600">Total documents</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{statistiques.possedes}</div>
          <div className="text-sm text-gray-600">Possédés</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{statistiques.manquants}</div>
          <div className="text-sm text-gray-600">Manquants</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{statistiques.obligatoiresComplets}%</div>
          <div className="text-sm text-gray-600">Obligatoires</div>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="space-y-4">
        {documentsFiltres.length > 0 ? (
          documentsFiltres.map(renderDocument)
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun document trouvé
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos filtres pour voir plus de documents.
            </p>
          </div>
        )}
      </div>

      {/* Actions finales */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={retourQuestionnaire}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Modifier mes réponses</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recommencer</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exporter ma liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message de fin */}
      {statistiques.pret && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">
                🎉 Félicitations ! Votre dossier est prêt !
              </h3>
              <p className="text-green-800 leading-relaxed">
                Vous avez tous les documents obligatoires. Vous pouvez maintenant prendre 
                rendez-vous avec les services de logement social de votre commune. 
                N'oubliez pas d'apporter tous les documents cochés !
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistDocuments; 