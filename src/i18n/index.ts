import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all locale files
import en from './locales/en.json';
import fr from './locales/fr.json';
import lb from './locales/lb.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import ar from './locales/ar.json';
import uk from './locales/uk.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  lb: { translation: lb },
  de: { translation: de },
  pt: { translation: pt },
  es: { translation: es },
  ar: { translation: ar },
  uk: { translation: uk }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'lb', 'de', 'pt', 'es', 'ar', 'uk'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'preferredLanguage',
      caches: ['localStorage']
    },
    react: {
      useSuspense: false
    }
  });

// Handle RTL languages
const handleLanguageChange = (lng: string) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

i18n.on('languageChanged', handleLanguageChange);

// Set initial direction
handleLanguageChange(i18n.language);

export default i18n;