import i18next from 'i18next';
import { azureOpenAIClient, DEPLOYMENT_NAME } from './openaiConfig';
import { aiService } from './aiService';

// Language codes and names mapping
export const supportedLanguages = {
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
  en: { name: 'English', nativeName: 'English', rtl: false },
  fr: { name: 'French', nativeName: 'Français', rtl: false },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false },
  lb: { name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', rtl: false },
  pt: { name: 'Portuguese', nativeName: 'Português', rtl: false },
  ru: { name: 'Russian', nativeName: 'Русский', rtl: false },
  tr: { name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  fa: { name: 'Persian', nativeName: 'فارسی', rtl: true },
  ur: { name: 'Urdu', nativeName: 'اردو', rtl: true },
  it: { name: 'Italian', nativeName: 'Italiano', rtl: false },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false },
  nl: { name: 'Dutch', nativeName: 'Nederlands', rtl: false },
  pl: { name: 'Polish', nativeName: 'Polski', rtl: false },
  ro: { name: 'Romanian', nativeName: 'Română', rtl: false }
} as const;

export type SupportedLanguage = keyof typeof supportedLanguages;

// List of fields that should never be translated
export const nonTranslatableFields = ['address', 'email', 'name', 'phone', 'website'];

// List of fields that should always be translated
export const translatableFields = ['hours', 'services', 'type'];

export function shouldTranslateField(field: string, value: string): boolean {
  // Don't translate if empty or undefined
  if (!value) return false;

  // Check if field is in the non-translatable list
  if (nonTranslatableFields.includes(field)) return false;

  // Check if field is in the translatable list
  if (translatableFields.includes(field)) return true;

  // For any other fields, apply additional rules
  if (field === 'name') {
    // Don't translate official organization names
    const officialPrefixes = [
      'Office social',
      'ASTI',
      'Caritas',
      'Croix-Rouge',
      'Ministère',
      'Centre',
      'Foyer',
      'Maison',
      'Stëmm',
      'Administration'
    ];
    return !officialPrefixes.some(prefix => value.startsWith(prefix));
  }

  // By default, allow translation for other fields
  return true;
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text?.trim()) return text;
  
  try {
    return await aiService.translateText(text, targetLanguage);
  } catch (error) {
    // Log seulement en développement
    if (import.meta.env.DEV) {
      console.error('Translation error:', error);
    }
    return text;
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    if (!text) {
      return i18next.language || 'fr';
    }

    const detectedLanguage = await aiService.detectLanguage(text);
    return (detectedLanguage in supportedLanguages) ? detectedLanguage : i18next.language || 'fr';
  } catch (error) {
    console.error('Language detection error:', error);
    return i18next.language || 'fr';
  }
}

export function getLanguageInfo(languageCode: string) {
  return (languageCode in supportedLanguages) 
    ? supportedLanguages[languageCode as SupportedLanguage] 
    : supportedLanguages.fr;
}