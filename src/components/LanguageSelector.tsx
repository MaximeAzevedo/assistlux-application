import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'fr', name: 'Français' },
  { code: 'lb', name: 'Lëtzebuergesch' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' },
  { code: 'ar', name: 'العربية' },
  { code: 'uk', name: 'Українська' }
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && languages.some(lang => lang.code === storedLang)) {
      i18n.changeLanguage(storedLang);
    } else {
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = languages.some(lang => lang.code === browserLang) ? browserLang : 'fr';
      i18n.changeLanguage(supportedLang);
      localStorage.setItem('preferredLanguage', supportedLang);
    }
  }, [i18n]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#language-menu') && !target.closest('#language-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
    setIsOpen(false);
  };

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100/80 hover:bg-gray-200/80 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        id="language-menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{currentLang.name}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div
          id="language-dropdown"
          className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none transform origin-top-right transition-all duration-200 ease-out"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="py-2" role="none">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  language.code === i18n.language
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                } transition-colors`}
                role="menuitem"
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;