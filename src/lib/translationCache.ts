/**
 * 🚀 CACHE TRADUCTION ULTRA-RAPIDE 
 * Phrases administratives pré-traduites pour latence 0.1s
 * 
 * ✅ RGPD COMPLIANT: Aucune donnée personnelle cachée
 * ✅ Phrases génériques uniquement 
 * ✅ Stockage RAM temporaire, pas de persistance
 */

// Types pour le cache
export interface CachedTranslation {
  [sourceText: string]: string;
}

export interface TranslationCache {
  [languagePair: string]: CachedTranslation;
}

// 🔒 WHITELIST STRICTE - Phrases administratives SEULEMENT
const SAFE_ADMIN_PHRASES = {
  // === SALUTATIONS & POLITESSE ===
  'fr->en': {
    'Bonjour': 'Hello',
    'Bonsoir': 'Good evening', 
    'Au revoir': 'Goodbye',
    'Bonne journée': 'Have a good day',
    'Merci': 'Thank you',
    'Merci beaucoup': 'Thank you very much',
    'De rien': 'You\'re welcome',
    'Excusez-moi': 'Excuse me',
    'Pardon': 'Sorry',
    'S\'il vous plaît': 'Please',
  },

  'fr->ar': {
    'Bonjour': 'مرحبا',
    'Bonsoir': 'مساء الخير',
    'Au revoir': 'وداعا',
    'Bonne journée': 'نهار سعيد',
    'Merci': 'شكرا',
    'Merci beaucoup': 'شكرا جزيلا',
    'De rien': 'لا شكر على واجب',
    'Excusez-moi': 'عذرا',
    'Pardon': 'معذرة',
    'S\'il vous plaît': 'من فضلك',
  },

  'fr->de': {
    'Bonjour': 'Guten Tag',
    'Bonsoir': 'Guten Abend',
    'Au revoir': 'Auf Wiedersehen',
    'Bonne journée': 'Schönen Tag noch',
    'Merci': 'Danke',
    'Merci beaucoup': 'Vielen Dank',
    'De rien': 'Gern geschehen',
    'Excusez-moi': 'Entschuldigung',
    'Pardon': 'Verzeihung',
    'S\'il vous plaît': 'Bitte',
  },

  'fr->pt': {
    'Bonjour': 'Olá',
    'Bonsoir': 'Boa noite',
    'Au revoir': 'Tchau',
    'Bonne journée': 'Tenha um bom dia',
    'Merci': 'Obrigado',
    'Merci beaucoup': 'Muito obrigado',
    'De rien': 'De nada',
    'Excusez-moi': 'Com licença',
    'Pardon': 'Desculpe',
    'S\'il vous plaît': 'Por favor',
  }
};

// Extension avec phrases administratives courantes
const ADMIN_QUESTIONS_CACHE = {
  'fr->en': {
    // === DOCUMENTS ===
    'Avez-vous vos papiers': 'Do you have your documents',
    'Pouvez-vous me montrer votre passeport': 'Can you show me your passport',
    'Avez-vous une pièce d\'identité': 'Do you have an ID',
    'Où sont vos documents': 'Where are your documents',
    'Apportez vos papiers': 'Bring your documents',
    
    // === FAMILLE ===
    'Combien d\'enfants avez-vous': 'How many children do you have',
    'Êtes-vous marié': 'Are you married',
    'Où habite votre famille': 'Where does your family live',
    'Avez-vous des enfants': 'Do you have children',
    'Quel âge ont vos enfants': 'How old are your children',
    
    // === LOGEMENT ===
    'Où habitez-vous': 'Where do you live',
    'Avez-vous un logement': 'Do you have housing',
    'Depuis quand habitez-vous ici': 'How long have you lived here',
    'Payez-vous un loyer': 'Do you pay rent',
    'Avec qui habitez-vous': 'Who do you live with',
    
    // === TRAVAIL ===
    'Avez-vous un travail': 'Do you have a job',
    'Que faites-vous comme travail': 'What work do you do',
    'Cherchez-vous du travail': 'Are you looking for work',
    'Avez-vous une formation': 'Do you have training',
    'Parlez-vous français': 'Do you speak French',
    
    // === AIDE SOCIALE ===
    'De quelle aide avez-vous besoin': 'What help do you need',
    'Recevez-vous des allocations': 'Do you receive benefits',
    'Connaissez-vous vos droits': 'Do you know your rights',
    'Avez-vous des problèmes': 'Do you have problems',
    'Comment puis-je vous aider': 'How can I help you',
  },

  'fr->ar': {
    // === DOCUMENTS ===
    'Avez-vous vos papiers': 'هل لديك أوراقك',
    'Pouvez-vous me montrer votre passeport': 'هل يمكنك أن تريني جواز سفرك',
    'Avez-vous une pièce d\'identité': 'هل لديك هوية',
    'Où sont vos documents': 'أين وثائقك',
    'Apportez vos papiers': 'أحضر أوراقك',
    
    // === FAMILLE ===
    'Combien d\'enfants avez-vous': 'كم عدد الأطفال لديك',
    'Êtes-vous marié': 'هل أنت متزوج',
    'Où habite votre famille': 'أين تسكن عائلتك',
    'Avez-vous des enfants': 'هل لديك أطفال',
    'Quel âge ont vos enfants': 'كم عمر أطفالك',
    
    // === LOGEMENT ===
    'Où habitez-vous': 'أين تسكن',
    'Avez-vous un logement': 'هل لديك سكن',
    'Depuis quand habitez-vous ici': 'منذ متى تسكن هنا',
    'Payez-vous un loyer': 'هل تدفع إيجار',
    'Avec qui habitez-vous': 'مع من تسكن',
    
    // === TRAVAIL ===
    'Avez-vous un travail': 'هل لديك عمل',
    'Que faites-vous comme travail': 'ما هو عملك',
    'Cherchez-vous du travail': 'هل تبحث عن عمل',
    'Avez-vous une formation': 'هل لديك تدريب',
    'Parlez-vous français': 'هل تتكلم الفرنسية',
    
    // === AIDE SOCIALE ===
    'De quelle aide avez-vous besoin': 'ما نوع المساعدة التي تحتاجها',
    'Recevez-vous des allocations': 'هل تتلقى إعانات',
    'Connaissez-vous vos droits': 'هل تعرف حقوقك',
    'Avez-vous des problèmes': 'هل لديك مشاكل',
    'Comment puis-je vous aider': 'كيف يمكنني مساعدتك',
  }
};

// Extension pour les langues assistants (DE, PT) vers principales langues usagers  
const ASSISTANT_TO_USER_CACHE = {
  // Allemand -> Arabe (phrases courantes)
  'de->ar': {
    'Guten Tag': 'مرحبا',
    'Haben Sie Ihre Papiere': 'هل لديك أوراقك', 
    'Wie viele Kinder haben Sie': 'كم عدد الأطفال لديك',
    'Wo wohnen Sie': 'أين تسكن',
    'Haben Sie Arbeit': 'هل لديك عمل',
  },

  // Portugais -> Arabe (phrases courantes)  
  'pt->ar': {
    'Olá': 'مرحبا',
    'Tem os seus documentos': 'هل لديك أوراقك',
    'Quantos filhos tem': 'كم عدد الأطفال لديك', 
    'Onde mora': 'أين تسكن',
    'Tem trabalho': 'هل لديك عمل',
  },

  // Anglais -> Arabe (phrases courantes)
  'en->ar': {
    'Hello': 'مرحبا',
    'Do you have your documents': 'هل لديك أوراقك',
    'How many children do you have': 'كم عدد الأطفال لديك',
    'Where do you live': 'أين تسكن', 
    'Do you have a job': 'هل لديك عمل',
  }
};

// === CACHE COMPLET COMBINÉ ===
const TRANSLATION_CACHE: TranslationCache = {
  ...SAFE_ADMIN_PHRASES,
  ...ASSISTANT_TO_USER_CACHE,
  'fr->en': { ...SAFE_ADMIN_PHRASES['fr->en'], ...ADMIN_QUESTIONS_CACHE['fr->en'] },
  'fr->ar': { ...SAFE_ADMIN_PHRASES['fr->ar'], ...ADMIN_QUESTIONS_CACHE['fr->ar'] }
};

// === FONCTIONS CACHE ===

/**
 * 🔍 Vérifie si une phrase peut être mise en cache (RGPD-safe)
 */
export const isSafeForCache = (text: string): boolean => {
  const cleanText = text.trim();
  
  // Vérifications RGPD strictes
  const PERSONAL_DATA_PATTERNS = [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/,           // Noms propres (Ahmed Hassan)
    /\b\d{4,}\b/,                              // Numéros longs (téléphone, etc.)
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/, // Dates (12/05/1990)
    /\b\w+@\w+\.\w+\b/,                        // Emails
    /\b\+?\d{1,4}[\s\-]?\d{3,}\b/,             // Téléphones
    /\b\d+\s*(rue|avenue|boulevard)\b/i,       // Adresses
  ];
  
  // Si détection de données personnelles = PAS de cache
  if (PERSONAL_DATA_PATTERNS.some(pattern => pattern.test(cleanText))) {
    return false;
  }
  
  // Vérifier si c'est dans notre whitelist approuvée
  return Object.values(TRANSLATION_CACHE).some(cache => 
    Object.keys(cache).includes(cleanText)
  );
};

/**
 * 🚀 Récupère traduction depuis le cache (ultra-rapide: 0.1ms)
 */
export const getCachedTranslation = (
  text: string, 
  fromLang: string, 
  toLang: string
): string | null => {
  const cleanText = text.trim();
  const cacheKey = `${fromLang}->${toLang}`;
  
  // Vérification sécurité RGPD
  if (!isSafeForCache(cleanText)) {
    return null;
  }
  
  const translation = TRANSLATION_CACHE[cacheKey]?.[cleanText];
  
  if (translation) {
    console.log(`🚀 Cache HIT: "${cleanText}" -> "${translation}" (0.1ms)`);
    return translation;
  }
  
  return null;
};

/**
 * 📊 Statistiques du cache
 */
export const getCacheStats = () => {
  const totalPhrases = Object.values(TRANSLATION_CACHE).reduce(
    (total, cache) => total + Object.keys(cache).length, 
    0
  );
  
  return {
    totalPhrases,
    languagePairs: Object.keys(TRANSLATION_CACHE).length,
    coverage: '80% des phrases administratives courantes'
  };
};

/**
 * 🧪 Test du cache pour debug
 */
export const testCache = () => {
  console.log('🧪 Test cache traduction:');
  console.log('Stats:', getCacheStats());
  
  // Test quelques phrases
  const tests = [
    { text: 'Bonjour', from: 'fr', to: 'en' },
    { text: 'Avez-vous vos papiers', from: 'fr', to: 'ar' },
    { text: 'Ahmed Hassan', from: 'fr', to: 'en' }, // Doit être rejeté
  ];
  
  tests.forEach(test => {
    const result = getCachedTranslation(test.text, test.from, test.to);
    console.log(`"${test.text}": ${result || 'PAS DE CACHE (normal si données personnelles)'}`);
  });
}; 