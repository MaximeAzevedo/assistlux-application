import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, 
  HandHelping as HandWaving,
  FileText,
  ClipboardList,
  MapPin,
  Video,
  Euro,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WhyChoose from './WhyChoose';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  const handleChatClick = () => {
    if (typeof (window as any).toggleChat === 'function') {
      (window as any).toggleChat();
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div 
        className="max-w-2xl mx-auto mb-16 animate-fadeIn"
        style={{
          animation: 'fadeIn 0.6s ease-out, slideUp 0.6s ease-out',
          animationFillMode: 'both'
        }}
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-12 shadow-2xl hover:shadow-3xl transition-shadow duration-300 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <HandWaving className="w-10 h-10 text-primary" />
            </div>

            <h1 className="mb-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('home.title')}
              </div>
            </h1>

            <p className="text-lg text-night/70 mb-8 leading-relaxed font-light">
              {t('home.subtitle')}
            </p>

            <button
              onClick={handleChatClick}
              className="relative w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-primary to-pink-600 text-white rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              <div className="flex items-center justify-center gap-2 relative z-10">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{t('home.chatButton')}</span>
              </div>
            </button>

            <p className="text-sm text-night/50 text-center mt-4">
              {t('home.microcopy')}
            </p>
          </div>

          <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/10 via-fuchsia-200/5 to-transparent rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/10 via-violet-200/5 to-transparent rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="text-center mb-12">
          <h2 className="mb-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('features.title')}
            </div>
          </h2>
          <p className="text-lg text-night/70 leading-relaxed font-light">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Document Scanner Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.scanner.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.scanner.description')}
              </p>
              <Link
                to="/scan"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                {t('features.scanner.button')} →
              </Link>
            </div>
          </div>

          {/* Allocation Vie Chère Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Allocation de Vie Chère 2025
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Formulaire intelligent pré-rempli avec IA pour votre demande d'allocation de vie chère du FNS
              </p>
              <Link
                to="/allocation-vie-chere"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                Démarrer ma demande →
              </Link>
            </div>
          </div>

          {/* Process Assistance Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.process.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.process.description')}
              </p>
              <Link
                to="/eligibility-check"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                Démarrer une démarche →
              </Link>
            </div>
          </div>

          {/* Service Map Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.map.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.map.description')}
              </p>
              <Link
                to="/carte-interactive"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                {t('features.map.button')} →
              </Link>
            </div>
          </div>

          {/* Explainer Videos Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.videos.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.videos.description')}
              </p>
              <Link
                to="/aides-et-informations"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                {t('features.videos.button')} →
              </Link>
            </div>
          </div>

          {/* Eligibility Check Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('features.eligibility.title')}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('features.eligibility.description')}
              </p>
              <Link
                to="/verificateur-eligibilite"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                {t('features.eligibility.button')} →
              </Link>
            </div>
          </div>

          {/* Traducteur d'entretiens Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Traducteur d'entretiens
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Traduction vocale temps réel pour vos entretiens sociaux. Interface bilingue avec synthèse IA automatique.
              </p>
              <Link
                to="/traducteur-entretiens"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                Commencer →
              </Link>
            </div>
          </div>

          {/* Convertisseur de fichiers Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Convertisseur Image → PDF
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Convertissez vos images (JPEG, PNG, HEIC, WEBP...) en PDF localement. Aucun envoi vers des serveurs externes.
              </p>
              <Link
                to="/convertisseur-fichiers"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                Convertir des fichiers →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <WhyChoose />
    </main>
  );
};

export default Dashboard;