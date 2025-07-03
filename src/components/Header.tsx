import { useState } from 'react';
import { Menu, X, Home, ArrowLeft, Globe, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isMainPage = location.pathname === '/';

  return (
    <header className="sticky top-4 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav 
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100/50"
        aria-label="Top"
      >
        <div className="w-full py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {!isMainPage && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100/80 hover:bg-gray-200/80 rounded-full transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{t('nav.back')}</span>
              </button>
            )}
            
            <Link 
              to="/" 
              className="flex items-center gap-2 transform hover:scale-105 transition-transform"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg">
                <Home className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                AssistLux
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-8">
              <Link 
                to="/scan" 
                className="text-gray-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:bg-clip-text hover:text-transparent font-semibold transition-all relative group"
              >
                {t('nav.scan')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/verificateur-eligibilite" 
                className="text-gray-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:bg-clip-text hover:text-transparent font-semibold transition-all relative group"
              >
                Vérifier éligibilité
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/convertisseur-fichiers" 
                className="text-gray-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:bg-clip-text hover:text-transparent font-semibold transition-all relative group flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Convertisseur
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/effectuer-demarche" 
                className="text-gray-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:bg-clip-text hover:text-transparent font-semibold transition-all relative group"
              >
                Effectuer démarche
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/traducteur-entretiens" 
                className="text-gray-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:bg-clip-text hover:text-transparent font-semibold transition-all relative group"
              >
                Traducteur
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/carte-interactive" 
                className="text-gray-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:bg-clip-text hover:text-transparent font-semibold transition-all relative group"
              >
                {t('nav.map')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div 
          className={`lg:hidden ${isOpen ? 'block' : 'hidden'} border-t border-gray-200 bg-white/95 backdrop-blur-sm rounded-b-3xl overflow-hidden`}
          style={{
            animation: isOpen ? 'slideDown 0.2s ease-out forwards' : 'none'
          }}
        >
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              to="/scan"
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.scan')}
            </Link>
            <Link
              to="/verificateur-eligibilite"
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Vérifier éligibilité
            </Link>
            <Link
              to="/convertisseur-fichiers"
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <RefreshCw className="w-4 h-4" />
              Convertisseur de fichiers
            </Link>
            <Link
              to="/effectuer-demarche"
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Effectuer démarche
            </Link>
            <Link
              to="/traducteur-entretiens"
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Traducteur d'entretiens
            </Link>
            <Link
              to="/carte-interactive"
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.map')}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;