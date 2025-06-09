import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, 
  FileText,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import ProceduresGuide from '../components/ProceduresGuide/ProceduresGuide';
import EligibilityWizardRefactored from '../components/EligibilityChecker/EligibilityWizardRefactored';

const ProcessAssistant: React.FC = () => {
  const [currentPath, setCurrentPath] = React.useState<'selection' | 'guided' | 'help' | 'wizard'>('selection');

  if (currentPath === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-transparent pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-gray-100/50 p-12">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Comment pouvons-nous vous aider ?
                  </h1>
                </div>
              </div>

              <div className="grid gap-6">
                <button
                  onClick={() => setCurrentPath('help')}
                  className="flex items-start gap-6 p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200 transform hover:scale-[1.02] text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Découvrir les aides auxquelles j'ai droit
                    </h3>
                    <p className="text-gray-600">
                      Notre assistant vous aide à identifier les aides sociales adaptées à votre situation
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentPath('guided')}
                  className="flex items-start gap-6 p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-200 transform hover:scale-[1.02] text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Effectuer une démarche
                    </h3>
                    <p className="text-gray-600">
                      Obtenez une assistance étape par étape pour compléter votre dossier
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === 'help') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-transparent pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-gray-100/50 p-12">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Découvrir les aides disponibles
                  </h1>
                </div>
              </div>

              <div className="prose prose-purple max-w-none mb-8">
                <p className="text-lg text-gray-600">
                  Notre assistant intelligent va vous poser quelques questions pour comprendre votre situation et vous présenter les aides auxquelles vous pourriez avoir droit.
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-purple-900 mb-4">
                  Comment ça marche ?
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">1</span>
                    <span className="text-purple-900">Répondez à quelques questions simples sur votre situation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">2</span>
                    <span className="text-purple-900">Notre assistant analyse vos réponses en temps réel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">3</span>
                    <span className="text-purple-900">Découvrez les aides adaptées à votre situation</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPath('selection')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                >
                  Retour
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setCurrentPath('wizard')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                >
                  Commencer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPath === 'wizard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-transparent pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-gray-100/50 p-12">
            <div className="relative z-10">
              <EligibilityWizardRefactored
                onBack={() => setCurrentPath('help')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-transparent pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-gray-100/50 p-12">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Assistant de démarche
                </h1>
              </div>
            </div>

            <ProceduresGuide />

            <button
              onClick={() => setCurrentPath('selection')}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              Retour
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessAssistant;