// Système de logging sécurisé et conforme RGPD
interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class SecureLogger {
  private isProduction = import.meta.env.PROD;
  private isDevelopment = import.meta.env.DEV;
  private minLevel = this.isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

  /**
   * Sanitise les données pour éviter de logger des informations personnelles
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Masquer les données personnelles communes
      return data
        .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NOM_REDACTED]')
        .replace(/\b\d{13}\b/g, '[MATRICULE_REDACTED]')
        .replace(/(\+352\s?)?[\d\s-]{8,}/g, '[TEL_REDACTED]')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
        .replace(/\b\d+[,\.]\d{2}\s*€?\b/g, '[MONTANT_REDACTED]');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Masquer les champs sensibles
        if (['originalText', 'translatedText', 'text', 'content'].includes(key)) {
          sanitized[key] = this.isDevelopment ? value : '[CONTENT_REDACTED]';
        } else if (['name', 'firstName', 'lastName', 'email', 'phone'].includes(key)) {
          sanitized[key] = '[PERSONAL_DATA_REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private log(level: number, message: string, data?: any): void {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    const logEntry = {
      timestamp,
      level: Object.keys(LOG_LEVELS)[level],
      message,
      ...(sanitizedData && { data: sanitizedData }),
      ...(this.isDevelopment && { environment: 'development' })
    };

    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug('🔧', logEntry);
        break;
      case LOG_LEVELS.INFO:
        console.info('ℹ️', logEntry);
        break;
      case LOG_LEVELS.WARN:
        console.warn('⚠️', logEntry);
        break;
      case LOG_LEVELS.ERROR:
        console.error('❌', logEntry);
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  // Méthodes spécialisées pour le traducteur
  interviewStart(sessionId: string, languages: { assistant: string; user: string }): void {
    this.info('Interview session started', {
      sessionId,
      languages,
      timestamp: new Date().toISOString()
    });
  }

  interviewEnd(sessionId: string, stats: { duration: string; messageCount: number; quality: number }): void {
    this.info('Interview session ended', {
      sessionId,
      stats,
      timestamp: new Date().toISOString()
    });
  }

  translationResult(success: boolean, sourceLanguage: string, targetLanguage: string, confidence?: number): void {
    this.debug('Translation completed', {
      success,
      sourceLanguage,
      targetLanguage,
      confidence,
      textLength: '[REDACTED_FOR_PRIVACY]'
    });
  }

  azureServiceError(service: 'speech' | 'openai', error: string): void {
    this.error(`Azure ${service} service error`, {
      service,
      error: error.substring(0, 100), // Limiter la longueur pour éviter les fuites
      timestamp: new Date().toISOString()
    });
  }
}

export const logger = new SecureLogger();

// Export des types pour TypeScript
export type { LogLevel };
export { LOG_LEVELS }; 