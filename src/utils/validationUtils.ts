// ═══════════════════════════════════════════════════════════
// UTILITAIRES DE VALIDATION CENTRALISÉS
// ═══════════════════════════════════════════════════════════

// Expressions régulières centralisées
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_LU: /^(\+352\s?)?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}\s?[0-9]{2}$/,
  PHONE_INTERNATIONAL: /^\+?[1-9]\d{1,14}$/,
  IBAN: /^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/,
  MATRICULE_LU: /^\d{13}$/,
  POSTAL_CODE_LU: /^L-\d{4}$/,
  DATE_DD_MM_YYYY: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/,
  DATE_YYYY_MM_DD: /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
} as const;

// ═══════════════════════════════════════════════════════════
// FONCTIONS DE VALIDATION PRINCIPALES
// ═══════════════════════════════════════════════════════════

/**
 * Validation d'email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return VALIDATION_PATTERNS.EMAIL.test(email.trim());
}

/**
 * Validation de téléphone (Luxembourg et international)
 */
export function isValidPhone(phone: string, country: 'LU' | 'INTERNATIONAL' = 'LU'): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  const cleanPhone = phone.replace(/\s/g, '');
  
  if (country === 'LU') {
    return VALIDATION_PATTERNS.PHONE_LU.test(phone);
  }
  
  return VALIDATION_PATTERNS.PHONE_INTERNATIONAL.test(cleanPhone);
}

/**
 * Validation IBAN
 */
export function isValidIBAN(iban: string): boolean {
  if (!iban || typeof iban !== 'string') return false;
  return VALIDATION_PATTERNS.IBAN.test(iban.replace(/\s/g, ''));
}

/**
 * Validation matricule luxembourgeois
 */
export function isValidMatricule(matricule: string): boolean {
  if (!matricule || typeof matricule !== 'string') return false;
  return VALIDATION_PATTERNS.MATRICULE_LU.test(matricule.replace(/\s/g, ''));
}

/**
 * Validation code postal luxembourgeois
 */
export function isValidPostalCodeLU(postalCode: string): boolean {
  if (!postalCode || typeof postalCode !== 'string') return false;
  return VALIDATION_PATTERNS.POSTAL_CODE_LU.test(postalCode.trim());
}

/**
 * Validation de date
 */
export function isValidDate(date: string, format: 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'): boolean {
  if (!date || typeof date !== 'string') return false;
  
  const pattern = format === 'DD/MM/YYYY' 
    ? VALIDATION_PATTERNS.DATE_DD_MM_YYYY 
    : VALIDATION_PATTERNS.DATE_YYYY_MM_DD;
    
  if (!pattern.test(date)) return false;
  
  // Validation supplémentaire avec Date
  try {
    let dateObj: Date;
    
    if (format === 'DD/MM/YYYY') {
      const [day, month, year] = date.split('/').map(Number);
      dateObj = new Date(year, month - 1, day);
      return dateObj.getDate() === day && 
             dateObj.getMonth() === month - 1 && 
             dateObj.getFullYear() === year;
    } else {
      dateObj = new Date(date);
      return dateObj.toISOString().split('T')[0] === date;
    }
  } catch {
    return false;
  }
}

/**
 * Validation d'URL
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return VALIDATION_PATTERNS.URL.test(url.trim());
}

/**
 * Validation de champ requis
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

/**
 * Validation de longueur
 */
export function isValidLength(value: string, min: number, max?: number): boolean {
  if (!value || typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= min && (max === undefined || length <= max);
}

/**
 * Validation d'âge
 */
export function isValidAge(birthDate: string | Date, minAge: number = 0, maxAge: number = 120): boolean {
  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age;
      
    return actualAge >= minAge && actualAge <= maxAge;
  } catch {
    return false;
  }
}

/**
 * Validation de nombre positif
 */
export function isPositiveNumber(value: number): boolean {
  return !isNaN(value) && value >= 0;
}

// ═══════════════════════════════════════════════════════════
// VALIDATEURS COMPOSÉS
// ═══════════════════════════════════════════════════════════

/**
 * Validation complète d'un profil utilisateur
 */
export function validateUserProfile(profile: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (profile.email && !isValidEmail(profile.email)) {
    errors.push('Email invalide');
  }
  
  if (profile.phone && !isValidPhone(profile.phone)) {
    errors.push('Numéro de téléphone invalide');
  }
  
  if (profile.firstName && !isValidLength(profile.firstName, 2, 50)) {
    errors.push('Prénom doit contenir entre 2 et 50 caractères');
  }
  
  if (profile.lastName && !isValidLength(profile.lastName, 2, 50)) {
    errors.push('Nom doit contenir entre 2 et 50 caractères');
  }
  
  if (profile.dateOfBirth && !isValidDate(profile.dateOfBirth)) {
    errors.push('Date de naissance invalide');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validation d'adresse luxembourgeoise
 */
export function validateLuxembourgAddress(address: {
  street?: string;
  postalCode?: string;
  city?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (address.street && !isValidLength(address.street, 5, 100)) {
    errors.push('Adresse doit contenir entre 5 et 100 caractères');
  }
  
  if (address.postalCode && !isValidPostalCodeLU(address.postalCode)) {
    errors.push('Code postal luxembourgeois invalide (format: L-1234)');
  }
  
  if (address.city && !isValidLength(address.city, 2, 50)) {
    errors.push('Ville doit contenir entre 2 et 50 caractères');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ═══════════════════════════════════════════════════════════
// UTILITAIRES DE NETTOYAGE
// ═══════════════════════════════════════════════════════════

/**
 * Nettoie et formate un numéro de téléphone
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Supprimer tous les espaces et caractères spéciaux
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ajouter +352 si c'est un numéro luxembourgeois sans préfixe
  if (cleaned.length === 8 && !cleaned.startsWith('+')) {
    cleaned = '+352' + cleaned;
  }
  
  return cleaned;
}

/**
 * Nettoie et formate un IBAN
 */
export function cleanIBAN(iban: string): string {
  if (!iban) return '';
  return iban.replace(/\s/g, '').toUpperCase();
}

/**
 * Nettoie et formate un email
 */
export function cleanEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
} 