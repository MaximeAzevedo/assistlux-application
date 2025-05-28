import i18next from 'i18next';
import openai from './openaiConfig';

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
  try {
    if (!text || !targetLanguage || !(targetLanguage in supportedLanguages)) {
      // En développement seulement
      if (import.meta.env.DEV) {
        console.warn('Invalid translation parameters:', { text: !!text, targetLanguage });
      }
      return text;
    }

    const languageInfo = supportedLanguages[targetLanguage as SupportedLanguage];
    const languagePrompt = targetLanguage === 'lb' 
      ? 'Translate to Luxembourgish (Lëtzebuergesch). Use proper Luxembourgish grammar, vocabulary, and expressions.'
      : `Translate to ${languageInfo.name} (${languageInfo.nativeName}).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator specializing in ${languageInfo.name}. ${languagePrompt}
Maintain the original meaning and tone while ensuring the translation is clear and natural.
Be precise and accurate.
Preserve any formatting, numbers, and special characters.
Consider cultural context and use appropriate idiomatic expressions.
Return ONLY the translated text.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    return response.choices[0]?.message?.content || text;
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., 'en', 'fr', 'ar', 'lb'). Be precise and only return the code."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const detectedLanguage = response.choices[0]?.message?.content?.toLowerCase() || i18next.language || 'fr';
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