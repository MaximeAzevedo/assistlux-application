import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { InterviewSession, InterviewSummary as InterviewSummaryType } from '../../types/interviewTranslator';

interface InterviewSummaryProps {
  session: InterviewSession;
  onBack: () => void;
  onExportPDF: () => Promise<void>;
  onNewSession: () => void;
}

const InterviewSummary: React.FC<InterviewSummaryProps> = ({
  session,
  onBack,
  onExportPDF,
  onNewSession
}) => {
  const [summary, setSummary] = useState<InterviewSummaryType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Génération automatique de la synthèse au montage
  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async () => {
    setIsGenerating(true);
    
    try {
      // Simulation de génération IA (remplacer par vraie logique)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSummary: InterviewSummaryType = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        generatedAt: new Date(),
        mainTopics: [
          'Demande d\'aide au logement',
          'Situation familiale',
          'Ressources financières',
          'Démarches administratives'
        ],
        keyDecisions: [
          {
            decision: 'Constitution du dossier aide au logement',
            responsible: 'both',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            followUp: 'Rendez-vous de suivi dans 2 semaines'
          },
          {
            decision: 'Demande de justificatifs complémentaires',
            responsible: 'user',
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        ],
        unsolvedIssues: [
          'Clarification sur les revenus du conjoint',
          'Vérification de l\'éligibilité APL'
        ],
        nextSteps: [
          'Rassembler les justificatifs de revenus',
          'Prendre rendez-vous avec le service logement',
          'Compléter le formulaire en ligne',
          'Programmer un suivi téléphonique'
        ],
        aiRecommendations: {
          suggestedFollowUp: [
            'Accompagnement personnalisé pour les démarches',
            'Aide à la constitution du dossier',
            'Suivi régulier de l\'avancement'
          ],
          relevantServices: [
            'Service logement municipal',
            'CAF - Caisse d\'Allocations Familiales',
            'Action Logement',
            'Associations d\'aide au logement'
          ],
          documentationNeeded: [
            'Derniers bulletins de salaire',
            'Avis d\'imposition',
            'Justificatif de domicile',
            'Pièce d\'identité',
            'Attestation employeur'
          ]
        },
        statistics: {
          duration: '12:34',
          messageCount: session.messages.length,
          averageQuality: 87,
          estimatedCost: 2.45
        }
      };
      
      setSummary(mockSummary);
    } catch (error) {
      console.error('Erreur génération synthèse:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportPDF();
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Génération de la synthèse
          </h2>
          
          <p className="text-gray-600 mb-6">
            L'IA analyse votre entretien et génère une synthèse structurée...
          </p>
          
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-xl border border-gray-100/50 p-12 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur de génération
          </h2>
          <p className="text-gray-600 mb-6">
            Impossible de générer la synthèse de l'entretien.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Retour</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Synthèse d'Entretien
                  </h1>
                  <p className="text-sm text-gray-600">
                    Générée le {summary.generatedAt.toLocaleDateString('fr-FR')} à {summary.generatedAt.toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Export...' : 'Exporter PDF'}
              </button>
              
              <button
                onClick={onNewSession}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Nouvel entretien
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistiques de session */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-100/50">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Informations de session
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{summary.statistics.duration}</div>
                  <div className="text-sm text-gray-600">Durée</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summary.statistics.messageCount}</div>
                  <div className="text-sm text-gray-600">Messages</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.statistics.averageQuality}%</div>
                  <div className="text-sm text-gray-600">Qualité</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{summary.statistics.estimatedCost.toFixed(2)}€</div>
                  <div className="text-sm text-gray-600">Coût</div>
                </div>
              </div>
            </div>

            {/* Sujets principaux */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-100/50">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Sujets abordés
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {summary.mainTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Décisions et actions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-100/50">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Décisions et actions
              </h2>
              
              <div className="space-y-4">
                {summary.keyDecisions.map((decision, index) => (
                  <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{decision.decision}</h3>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${decision.responsible === 'assistant' ? 'bg-purple-100 text-purple-800' :
                          decision.responsible === 'user' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {decision.responsible === 'assistant' ? 'Assistant' :
                         decision.responsible === 'user' ? 'Usager' : 'Les deux'}
                      </span>
                    </div>
                    
                    {decision.deadline && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Échéance:</strong> {decision.deadline.toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    
                    {decision.followUp && (
                      <p className="text-sm text-gray-600">
                        <strong>Suivi:</strong> {decision.followUp}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-100/50">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Prochaines étapes
              </h2>
              
              <div className="space-y-3">
                {summary.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-gray-900">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Points non résolus */}
            {summary.unsolvedIssues.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-100/50">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Points à clarifier
                </h3>
                
                <div className="space-y-2">
                  {summary.unsolvedIssues.map((issue, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations IA */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-gray-100/50">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Recommandations IA
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Suivi suggéré</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {summary.aiRecommendations.suggestedFollowUp.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Services pertinents</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {summary.aiRecommendations.relevantServices.map((service, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Documents nécessaires</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {summary.aiRecommendations.documentationNeeded.map((doc, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSummary; 