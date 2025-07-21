import i18next from 'i18next';
import { azureOpenAIClient, DEPLOYMENT_NAME } from './openaiConfig';
import { aiService } from './aiService';
import { getCachedTranslation, testCache } from './translationCache'; // 🚀 Import du cache ultra-rapide

// Language codes and names mapping
export const supportedLanguages = {
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true, flag: '🇸🇦' },
  en: { name: 'English', nativeName: 'English', rtl: false, flag: '🇬🇧' },
  fr: { name: 'French', nativeName: 'Français', rtl: false, flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false, flag: '🇩🇪' },
  lb: { name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', rtl: false, flag: '🇱🇺' },
  pt: { name: 'Portuguese', nativeName: 'Português', rtl: false, flag: '🇵🇹' },
  ru: { name: 'Russian', nativeName: 'Русский', rtl: false, flag: '🇷🇺' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', rtl: false, flag: '🇹🇷' },
  fa: { name: 'Persian', nativeName: 'فارسی', rtl: true, flag: '🇮🇷' },
  ur: { name: 'Urdu', nativeName: 'اردو', rtl: true, flag: '🇵🇰' },
  it: { name: 'Italian', nativeName: 'Italiano', rtl: false, flag: '🇮🇹' },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false, flag: '🇪🇸' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', rtl: false, flag: '🇳🇱' },
  pl: { name: 'Polish', nativeName: 'Polski', rtl: false, flag: '🇵🇱' },
  ro: { name: 'Romanian', nativeName: 'Română', rtl: false, flag: '🇷🇴' }
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
    // 🚀 CACHE ULTRA-RAPIDE - Essayer le cache avec langue source auto-détectée
    const sourceLanguage = i18next.language || 'fr';
    const cachedTranslation = getCachedTranslation(text, sourceLanguage, targetLanguage);
    if (cachedTranslation) {
      return cachedTranslation; // Retour immédiat depuis le cache
    }

    // 🐌 Fallback vers OpenAI si pas en cache
    return await aiService.translateText(text, targetLanguage);
  } catch (error) {
    // Log seulement en développement
    if (import.meta.env.DEV) {
      console.error('Translation error:', error);
    }
    return text;
  }
}

export async function translateTextForInterview(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  if (!text?.trim()) return text;
  
  try {
    // 🚀 CACHE ULTRA-RAPIDE - Vérification en premier (0.1ms)
    const cachedTranslation = getCachedTranslation(text, sourceLanguage, targetLanguage);
    if (cachedTranslation) {
      return cachedTranslation; // Retour immédiat depuis le cache
    }

    // 🐌 Fallback vers OpenAI si pas en cache (800ms)
    console.log(`⏱️ Cache MISS pour "${text.substring(0, 30)}..." - Appel OpenAI`);
    return await aiService.translateTextForInterview(text, sourceLanguage, targetLanguage);
  } catch (error) {
    // Log seulement en développement
    if (import.meta.env.DEV) {
      console.error('Interview translation error:', error);
    }
    // Fallback vers traduction normale
    return await translateText(text, targetLanguage);
  }
}

export async function detectLanguage(text: string): Promise<string> {
  if (!text?.trim()) {
    return 'fr'; // Langue par défaut
  }

  try {
    // 🆕 AMÉLIORATION : Patterns linguistiques enrichis et équilibrés
    const patterns = {
      // Français - mots courants d'entretiens sociaux
      'fr': /\b(je|vous|mon|ma|mes|votre|vos|avec|dans|pour|sur|par|de|du|des|le|la|les|un|une|et|ou|mais|donc|car|si|que|qui|comment|quand|où|pourquoi|bonjour|merci|excusez|pouvez|avez|êtes|suis|ai|avoir|être|faire|aller|venir|dire|voir|savoir|vouloir|pouvoir|devoir|aider|besoin|problème|document|papier|dossier|rendez|bureau|service|social|aide|logement|travail|famille|enfant|situation|difficile|urgent)\b/i,
      
      // Anglais - vocabulaire d'entretiens administratifs  
      'en': /\b(I|you|my|your|with|for|from|the|and|but|or|can|could|would|should|have|has|had|am|is|are|was|were|will|help|need|problem|document|paper|file|appointment|office|service|social|assistance|housing|work|job|family|child|situation|difficult|urgent|please|thank|excuse|sorry|hello|good|morning|afternoon|when|where|why|how|what|who)\b/i,
      
      // Espagnol - contexte social et administratif
      'es': /\b(yo|tú|usted|mi|su|con|para|por|de|del|en|el|la|los|las|un|una|y|o|pero|si|que|cómo|cuándo|dónde|por|qué|hola|gracias|disculpe|puede|tiene|es|soy|ayuda|necesito|problema|documento|papel|expediente|cita|oficina|servicio|social|asistencia|vivienda|trabajo|familia|niño|situación|difícil|urgente|buenos|días|tarde)\b/i,
      
      // Allemand - terminologie administrative
      'de': /\b(ich|Sie|mein|meine|Ihr|Ihre|mit|für|von|vom|der|die|das|den|dem|ein|eine|und|oder|aber|wenn|dass|wie|wann|wo|warum|hallo|danke|entschuldigung|können|haben|sind|bin|hilfe|brauche|problem|dokument|papier|akte|termin|büro|amt|dienst|sozial|hilfe|wohnung|arbeit|familie|kind|situation|schwierig|dringend|guten|tag|morgen)\b/i,
      
      // Italien - vocabulaire d'assistance sociale
      'it': /\b(io|lei|mio|mia|suo|sua|con|per|da|dal|il|la|lo|gli|le|un|una|e|o|ma|se|che|come|quando|dove|perché|ciao|grazie|scusi|può|ha|è|sono|aiuto|bisogno|problema|documento|carta|fascicolo|appuntamento|ufficio|servizio|sociale|assistenza|casa|lavoro|famiglia|bambino|situazione|difficile|urgente|buon|giorno|sera)\b/i,
      
      // Portugais - contexte lusophone enrichi
      'pt': /\b(eu|você|vocês|meu|minha|seu|sua|com|para|por|de|do|da|dos|das|o|a|os|as|um|uma|e|ou|mas|se|que|como|quando|onde|por|que|olá|obrigado|obrigada|desculpe|pode|tem|é|sou|estou|ajuda|preciso|problema|documento|papel|processo|marcação|escritório|serviço|social|assistência|habitação|trabalho|família|criança|situação|difícil|urgente|bom|dia|tarde|noite)\b/i,
      
      // Arabe - script complet + mots courants
      'ar': /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]|مرحبا|أهلا|شكرا|عفوا|مساعدة|أحتاج|مشكلة|وثيقة|ورقة|ملف|موعد|مكتب|خدمة|اجتماعي|مساعدة|سكن|عمل|عائلة|طفل|وضع|صعب|عاجل|يمكن|لديك|أنا|أنت|مع|من|في|على/i,
      
      // Russe - cyrillique + vocabulaire social
      'ru': /[\u0400-\u04FF]|привет|спасибо|извините|помощь|нужна|проблема|документ|бумага|дело|встреча|офис|служба|социальный|помощь|жильё|работа|семья|ребёнок|ситуация|трудный|срочный|можете|есть|я|вы|с|от|в|на/i,
      
      // Turc - vocabulaire administratif turc
      'tr': /\b(ben|siz|benim|sizin|ile|için|den|dan|bir|ve|veya|ama|eğer|nasıl|ne|nerede|neden|merhaba|teşekkür|özür|yardım|ihtiyacım|problem|belge|kağıt|dosya|randevu|ofis|hizmet|sosyal|yardım|konut|iş|aile|çocuk|durum|zor|acil|yapabilir|var|çok|daha|en|o|şu|hangi)\b/i,
      
      // Néerlandais - contexte d'aide sociale
      'nl': /\b(ik|u|mijn|uw|met|voor|van|de|het|een|en|of|maar|als|dat|hoe|wanneer|waar|waarom|hallo|dank|sorry|hulp|nodig|probleem|document|papier|dossier|afspraak|kantoor|dienst|sociaal|hulp|woning|werk|familie|kind|situatie|moeilijk|urgent|kunt|heeft|ben|bent|zeer|goed|deze)\b/i,
      
      // Polonais - terminologie d'assistance
      'pl': /\b(ja|pan|pani|mój|moja|pana|pani|z|dla|od|w|na|po|i|lub|ale|jeśli|że|jak|kiedy|gdzie|dlaczego|dzień|dziękuję|przepraszam|pomoc|potrzebuję|problem|dokument|papier|akta|wizyta|biuro|urząd|służba|społeczny|pomoc|mieszkanie|praca|rodzina|dziecko|sytuacja|trudny|pilny|może|ma|jestem|bardzo|już|tak)\b/i,
      
      // Roumain - contexte administratif
      'ro': /\b(eu|dumneavoastră|meu|mea|dumneavoastră|cu|pentru|de|din|la|pe|prin|și|sau|dar|dacă|că|cum|când|unde|de|ce|bună|mulțumesc|scuzați|ajutor|am|nevoie|problemă|document|hârtie|dosar|programare|birou|serviciu|social|asistență|locuință|muncă|familie|copil|situație|dificil|urgent|puteți|aveți|sunt|foarte|încă|așa)\b/i,
      
      // Persan - script et mots sociaux
      'fa': /[\u0600-\u06FF]|سلام|ممنون|ببخشید|کمک|نیاز|مشکل|سند|کاغذ|پرونده|قرار|اداره|خدمات|اجتماعی|کمک|مسکن|کار|خانواده|بچه|وضعیت|سخت|فوری|می‌تونید|دارید|من|شما|با|از|در|به/i,
      
      // Ourdou - script arabe adapté
      'ur': /[\u0600-\u06FF]|سلام|شکریہ|معاف|مدد|ضرورت|مسئلہ|دستاویز|کاغذ|فائل|ملاقات|دفتر|خدمات|سماجی|مدد|رہائش|کام|خاندان|بچہ|صورتحال|مشکل|فوری|کر|سکتے|ہے|میں|آپ|کے|ساتھ|سے|میں|پر/i,
      
      // Chinois - caractères + contexte social
      'zh': /[\u4e00-\u9fff]|你好|谢谢|不好意思|帮助|需要|问题|文件|纸|档案|预约|办公室|服务|社会|帮助|住房|工作|家庭|孩子|情况|困难|紧急|可以|有|我|你|和|的|在|了/i,
      
      // Japonais - hiragana/katakana/kanji + mots sociaux
      'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]|こんにちは|ありがとう|すみません|助け|必要|問題|書類|紙|ファイル|予約|事務所|サービス|社会|援助|住宅|仕事|家族|子供|状況|困難|緊急|できます|あります|私|あなた|と|の|に|で/i,
      
      // Coréen - hangul + vocabulaire social
      'ko': /[\uac00-\ud7af]|안녕하세요|감사합니다|죄송합니다|도움|필요|문제|서류|종이|파일|예약|사무실|서비스|사회|도움|주택|일|가족|아이|상황|어려운|긴급|할|있습니다|저|당신|와|의|에|서/i,
      
      // Hindi - devanagari + mots courants
      'hi': /[\u0900-\u097f]|नमस्ते|धन्यवाद|माफ|मदद|जरूरत|समस्या|दस्तावेज|कागज|फाइल|मुलाकात|कार्यालय|सेवा|सामाजिक|मदद|आवास|काम|परिवार|बच्चा|स्थिति|कठिन|जरूरी|कर|सकते|हैं|मैं|आप|के|साथ|से|में|पर/i,
      
      // Thaï - script thaï + contexte social
      'th': /[\u0e00-\u0e7f]|สวัสดี|ขอบคุณ|ขอโทษ|ช่วย|ต้องการ|ปัญหา|เอกสาร|กระดาษ|แฟ้ม|นัด|สำนักงาน|บริการ|สังคม|ช่วยเหลือ|ที่อยู่|งาน|ครอบครัว|เด็ก|สถานการณ์|ยาก|ด่วน|สามารถ|มี|ฉัน|คุณ|กับ|จาก|ใน|ที่/i,
      
      // Vietnamien - script latin + diacritiques
      'vi': /\b(tôi|bạn|anh|chị|của|với|cho|từ|trong|trên|và|hoặc|nhưng|nếu|làm|thế|nào|khi|nào|ở|đâu|tại|sao|xin|chào|cảm|ơn|xin|lỗi|giúp|đỡ|cần|vấn|đề|tài|liệu|giấy|hồ|sơ|hẹn|văn|phòng|dịch|vụ|xã|hội|trợ|giúp|nhà|ở|việc|làm|gia|đình|trẻ|em|tình|hình|khó|khăn|gấp|có|thể|rất|đã|này)\b/i,
      
      // Hébreu - script hébreu + vocabulaire social
      'he': /[\u0590-\u05ff]|שלום|תודה|סליחה|עזרה|צריך|בעיה|מסמך|נייר|תיק|פגישה|משרד|שירות|חברתי|עזרה|דיור|עבודה|משפחה|ילד|מצב|קשה|דחוף|יכול|יש|אני|אתה|את|עם|מן|ב|על/i
    };

    // 🆕 Système de scoring pondéré selon la longueur du texte
    const scores: Record<string, number> = {};
    const textLength = text.length;
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      let score = matches ? matches.length : 0;
      
      // Bonus pour les langues avec scripts spécifiques détectés
      if (['ar', 'fa', 'ur', 'he'].includes(lang) && /[\u0600-\u06FF\u0590-\u05ff]/.test(text)) {
        score += 5; // Bonus conséquent pour détection de script
      }
      if (['ru'].includes(lang) && /[\u0400-\u04FF]/.test(text)) {
        score += 5;
      }
      if (['zh'].includes(lang) && /[\u4e00-\u9fff]/.test(text)) {
        score += 5;
      }
      if (['ja'].includes(lang) && /[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
        score += 5;
      }
      if (['ko'].includes(lang) && /[\uac00-\ud7af]/.test(text)) {
        score += 5;
      }
      if (['hi'].includes(lang) && /[\u0900-\u097f]/.test(text)) {
        score += 5;
      }
      if (['th'].includes(lang) && /[\u0e00-\u0e7f]/.test(text)) {
        score += 5;
      }
      
      // Normalisation selon la longueur du texte (évite le biais des textes courts)
      if (textLength > 0) {
        score = score * (Math.min(textLength, 100) / 100); // Normalisation progressive
      }
      
      scores[lang] = score;
    }

    // 🆕 Seuil adaptatif selon la longueur du texte
    const minScore = textLength < 20 ? 1 : 2; // Plus strict pour les textes longs

    // Trouve la langue avec le score le plus élevé
    const detectedLang = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score >= minScore)[0];

    if (detectedLang && detectedLang[1] >= minScore) {
      console.log(`🎯 Langue détectée: ${detectedLang[0]} (score: ${detectedLang[1]}, longueur: ${textLength})`);
      return detectedLang[0];
    }

    // Fallback: essayer avec l'API Azure si disponible
    try {
      const languageDetectionResponse = await aiService.detectLanguage(text);
      if (languageDetectionResponse && languageDetectionResponse !== 'unknown') {
        console.log(`🔍 Langue détectée via AI: ${languageDetectionResponse}`);
        return languageDetectionResponse;
      }
    } catch (aiError) {
      console.warn('Erreur détection AI:', aiError);
    }

    // 🆕 Analyse améliorée des caractères pour les langues non détectées
    if (text.length >= 10) {
      // Détection fine des scripts
      if (/[\u0600-\u06FF]/.test(text)) {
        // Distinction arabe/persan/ourdou par fréquence de caractères spécifiques
        if (/[پچژگ]/.test(text)) return 'fa'; // Caractères spécifiques au persan
        if (/[ٹڈڑ]/.test(text)) return 'ur'; // Caractères spécifiques à l'ourdou
        return 'ar'; // Par défaut arabe
      }
      
      if (/[\u0400-\u04FF]/.test(text)) return 'ru';
      if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
      if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
      if (/[\uac00-\ud7af]/.test(text)) return 'ko';
      if (/[\u0900-\u097f]/.test(text)) return 'hi';
      if (/[\u0e00-\u0e7f]/.test(text)) return 'th';
      if (/[\u0590-\u05ff]/.test(text)) return 'he';
      
      // Détection améliorée pour les langues latines
      const vowelRatio = (text.match(/[aeiouáéíóúàèìòùâêîôûäëïöü]/gi) || []).length / text.length;
      const accentRatio = (text.match(/[àáâäèéêëìíîïòóôöùúûü]/gi) || []).length / text.length;
      
      // Si beaucoup d'accents français
      if (accentRatio > 0.02 && /[àèéêë]/.test(text)) return 'fr';
      
      // Si beaucoup de voyelles sans accents = probable anglais
      if (vowelRatio > 0.4 && accentRatio < 0.01) return 'en';
      
      // Détection fine pour langues germaniques/nordiques
      if (/[äöüß]/.test(text)) return 'de';
      if (/[æøå]/.test(text)) {
        if (/[ø]/.test(text)) return 'no';
        return 'da';
      }
    }

    console.log('🤷 Aucune langue détectée avec certitude, utilisation du français par défaut');
    console.log('Scores calculés:', Object.entries(scores).sort(([,a], [,b]) => b - a).slice(0, 5));
    return 'fr';

  } catch (error) {
    console.error('Erreur lors de la détection de langue:', error);
    return 'fr'; // Fallback sûr
  }
}

export function getLanguageInfo(languageCode: string) {
  return (languageCode in supportedLanguages) 
    ? supportedLanguages[languageCode as SupportedLanguage] 
    : supportedLanguages.fr;
}

/**
 * 🚀 Initialise et teste le cache de traduction
 * À appeler au démarrage de l'application
 */
export function initializeTranslationCache(): void {
  console.log('🚀 Initialisation du cache de traduction ultra-rapide...');
  
  try {
    // Test du cache pour vérifier qu'il fonctionne
    testCache();
    
    console.log('✅ Cache de traduction initialisé avec succès');
    console.log('🎯 Phrases courantes traduites en 0.1ms au lieu de 800ms');
  } catch (error) {
    console.warn('⚠️ Erreur initialisation cache (fallback OpenAI):', error);
  }
}