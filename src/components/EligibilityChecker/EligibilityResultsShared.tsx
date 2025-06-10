import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Download, 
  ArrowLeft,
  Users,
  Clock,
  Globe,
  ExternalLink,
  Printer
} from 'lucide-react';

interface EligibilityConclusion {
  id: string;
  titre_aide: string;
  logic_condition: string;
  texte_conclusion: string;
  categorie: string;
  action: string;
  url_formulaire?: string;
  url_source?: string;
}

interface EligibilityCompleteResult {
  eligible_aids: EligibilityConclusion[];
  ineligible_aids: EligibilityConclusion[];
  session_summary: {
    total_time: number;
    questions_answered: number;
    language_used: string;
  };
  session?: any;
  report?: {
    professional: string;
    user: string;
  };
}

interface EligibilityResultsSharedProps {
  results: EligibilityCompleteResult;
  onBack: () => void;
  onRestart?: () => void;
}

const EligibilityResultsShared: React.FC<EligibilityResultsSharedProps> = ({
  results,
  onBack,
  onRestart
}) => {
  const [showProfessionalReport, setShowProfessionalReport] = useState(false);
  const [showUserReport, setShowUserReport] = useState(false);

  const { eligible_aids, session_summary, report } = results;
  const hasEligibleAids = eligible_aids.length > 0;

  const handlePrintReport = (reportType: 'professional' | 'user') => {
    if (!report) return;
    
    const content = reportType === 'professional' ? report.professional : report.user;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Rapport d'Éligibilité AssistLux</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              h1 { color: #7c3aed; }
              .header { border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 20px; }
              .aid { background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 5px; }
              .eligible { border-left: 4px solid #10b981; }
              .steps { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏠 AssistLux - Rapport d'Éligibilité</h1>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-LU')}</p>
              <p><strong>Questions répondues:</strong> ${session_summary.questions_answered}</p>
            </div>
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${content}</pre>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #666; font-size: 12px;">
              <p>🔒 Ce rapport respecte la vie privée - Aucune donnée personnelle n'est stockée</p>
              <p>AssistLux © ${new Date().getFullYear()} - Outil d'accompagnement social</p>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
      newWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${hasEligibleAids ? 'bg-green-600' : 'bg-yellow-600'} flex items-center justify-center`}>
                {hasEligibleAids ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : (
                  <XCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Résultats d'Éligibilité
                </h1>
                <p className="text-gray-600">
                  {hasEligibleAids 
                    ? `${eligible_aids.length} aide(s) disponible(s)`
                    : 'Aucune aide nationale éligible'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{session_summary.questions_answered} questions répondues</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section Travailleur Social */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-purple-900">Pour le Travailleur Social</h2>
            </div>

            {hasEligibleAids ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">
                    ✅ Aides Éligibles ({eligible_aids.length})
                  </h3>
                  <div className="space-y-3">
                    {eligible_aids.map((aid) => (
                      <div key={aid.id} className="bg-white border border-green-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900">{aid.titre_aide}</h4>
                        <p className="text-sm text-gray-600 mt-1">{aid.texte_conclusion}</p>
                        {aid.url_formulaire && (
                          <div className="mt-2">
                            <button
                              onClick={() => window.open(aid.url_formulaire, '_blank')}
                              className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                            >
                              <Download className="w-3 h-3" />
                              Télécharger formulaire
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">📋 Prochaines Actions</h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Télécharger les formulaires nécessaires</li>
                    <li>• Accompagner le remplissage avec le bénéficiaire</li>
                    <li>• Prévoir un suivi dans 1 mois</li>
                    <li>• Vérifier les documents requis</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Aucune aide nationale</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Le bénéficiaire ne remplit pas les critères pour les aides nationales.
                </p>
                <div className="text-sm text-yellow-800">
                  <strong>Actions suggérées :</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Orienter vers les services communaux</li>
                    <li>• Vérifier les aides locales disponibles</li>
                    <li>• Consulter guichet.public.lu</li>
                  </ul>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProfessionalReport(!showProfessionalReport)}
              className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              {showProfessionalReport ? 'Masquer' : 'Afficher'} rapport détaillé
            </button>

            {showProfessionalReport && report && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Rapport Professionnel</h4>
                  <button
                    onClick={() => handlePrintReport('professional')}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    <Printer className="w-4 h-4 inline mr-1" />
                    Imprimer
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap bg-white p-3 rounded border max-h-64 overflow-y-auto">
                  {report.professional}
                </pre>
              </div>
            )}
          </div>

          {/* Section Bénéficiaire */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-900">Pour le Bénéficiaire</h2>
            </div>

            {hasEligibleAids ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    🎉 Excellente nouvelle !
                  </h3>
                  <p className="text-green-800">
                    Vous êtes éligible à <strong>{eligible_aids.length}</strong> aide(s) au Luxembourg
                  </p>
                </div>

                <div className="space-y-3">
                  {eligible_aids.map((aid) => (
                    <div key={aid.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900">{aid.titre_aide}</h4>
                          <p className="text-blue-800 text-sm mt-1">{aid.texte_conclusion}</p>
                          <p className="text-blue-700 text-xs mt-2">
                            📄 Formulaire disponible avec votre travailleur social
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Vos prochaines étapes</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Votre travailleur social vous aidera à remplir les formulaires</li>
                    <li>• Gardez vos documents d'identité et preuves de revenus</li>
                    <li>• Un suivi sera organisé pour vérifier l'avancement</li>
                    <li>• N'hésitez pas à poser des questions</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <h3 className="text-xl font-bold text-yellow-900 mb-3">
                  Pas d'aide nationale actuellement
                </h3>
                <p className="text-yellow-800 mb-4">
                  Vous ne remplissez pas les critères pour les aides nationales luxembourgeoises, 
                  mais des solutions existent au niveau local.
                </p>
                <div className="bg-yellow-100 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-900 mb-2">💡 Que faire maintenant ?</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 text-left">
                    <li>• Contactez votre commune pour les aides locales</li>
                    <li>• Consultez guichet.public.lu pour plus d'informations</li>
                    <li>• Votre situation peut évoluer, refaites le test plus tard</li>
                  </ul>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowUserReport(!showUserReport)}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4 inline mr-2" />
              {showUserReport ? 'Masquer' : 'Afficher'} votre résumé
            </button>

            {showUserReport && report && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Votre Résumé Personnel</h4>
                  <button
                    onClick={() => handlePrintReport('user')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Printer className="w-4 h-4 inline mr-1" />
                    Imprimer
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap bg-white p-3 rounded border max-h-64 overflow-y-auto">
                  {report.user}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au menu
            </button>

            <div className="flex gap-4">
              {onRestart && (
                <button
                  onClick={onRestart}
                  className="px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Nouveau test
                </button>
              )}
              
              <button
                onClick={() => window.open('https://guichet.public.lu', '_blank')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 inline mr-2" />
                Consulter Guichet.lu
              </button>
            </div>

            <div className="text-sm text-gray-500">
              🔒 Aucune donnée personnelle n'est stockée
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityResultsShared; 