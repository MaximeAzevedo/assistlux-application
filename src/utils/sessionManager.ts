import { logger } from './logger';

interface SessionConfig {
  maxDurationMs: number;
  maxInactivityMs: number;
  maxMessagesCount: number;
  autoCleanup: boolean;
}

interface SessionData {
  id: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  isActive: boolean;
  languages: {
    assistant: string;
    user: string;
  };
}

const DEFAULT_CONFIG: SessionConfig = {
  maxDurationMs: 2 * 60 * 60 * 1000, // 2 heures max
  maxInactivityMs: 10 * 60 * 1000,   // 10 minutes d'inactivité
  maxMessagesCount: 1000,             // 1000 messages max
  autoCleanup: true
};

export class SessionManager {
  private sessions = new Map<string, SessionData>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Nettoyage périodique des sessions expirées
    if (this.config.autoCleanup) {
      setInterval(() => this.cleanupExpiredSessions(), 60000); // Chaque minute
    }
  }

  /**
   * Crée une nouvelle session avec timeout automatique
   */
  createSession(languages: { assistant: string; user: string }): string {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    
    const sessionData: SessionData = {
      id: sessionId,
      startTime: now,
      lastActivity: now,
      messageCount: 0,
      isActive: true,
      languages
    };

    this.sessions.set(sessionId, sessionData);
    this.setupSessionTimeouts(sessionId);
    
    logger.interviewStart(sessionId, languages);
    
    return sessionId;
  }

  /**
   * Met à jour l'activité de la session
   */
  updateActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    session.lastActivity = new Date();
    session.messageCount++;

    // Vérifier les limites
    if (session.messageCount >= this.config.maxMessagesCount) {
      logger.warn('Session reached maximum message count', { sessionId, messageCount: session.messageCount });
      this.endSession(sessionId, 'MESSAGE_LIMIT_REACHED');
      return false;
    }

    // Réinitialiser le timeout d'inactivité
    this.resetInactivityTimeout(sessionId);
    
    return true;
  }

  /**
   * Termine une session et nettoie les données
   */
  endSession(sessionId: string, reason: string = 'USER_REQUESTED'): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const duration = Date.now() - session.startTime.getTime();
    const stats = {
      duration: this.formatDuration(duration),
      messageCount: session.messageCount,
      quality: 0 // Sera calculé par le composant
    };

    // Marquer comme inactive
    session.isActive = false;
    
    // Nettoyer les timeouts
    this.clearSessionTimeouts(sessionId);
    
    // Logger la fin de session
    logger.interviewEnd(sessionId, stats);
    logger.info('Session ended', { sessionId, reason, stats });
    
    // Supprimer de la mémoire après un délai court (pour permettre l'export)
    setTimeout(() => {
      this.sessions.delete(sessionId);
      logger.debug('Session data purged from memory', { sessionId });
    }, 30000); // 30 secondes pour permettre l'export
  }

  /**
   * Vérifie si une session est valide et active
   */
  isSessionValid(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.isActive ?? false;
  }

  /**
   * Obtient les statistiques d'une session
   */
  getSessionStats(sessionId: string): Partial<SessionData> | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const duration = Date.now() - session.startTime.getTime();
    return {
      id: session.id,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
      isActive: session.isActive,
      languages: session.languages
    };
  }

  /**
   * Configure les timeouts automatiques pour une session
   */
  private setupSessionTimeouts(sessionId: string): void {
    // Timeout de durée maximale
    const maxDurationTimeout = setTimeout(() => {
      logger.warn('Session reached maximum duration', { sessionId });
      this.endSession(sessionId, 'MAX_DURATION_REACHED');
    }, this.config.maxDurationMs);

    // Timeout d'inactivité
    const inactivityTimeout = setTimeout(() => {
      logger.warn('Session ended due to inactivity', { sessionId });
      this.endSession(sessionId, 'INACTIVITY_TIMEOUT');
    }, this.config.maxInactivityMs);

    this.timeouts.set(`${sessionId}_duration`, maxDurationTimeout);
    this.timeouts.set(`${sessionId}_inactivity`, inactivityTimeout);
  }

  /**
   * Réinitialise le timeout d'inactivité
   */
  private resetInactivityTimeout(sessionId: string): void {
    const inactivityKey = `${sessionId}_inactivity`;
    const existingTimeout = this.timeouts.get(inactivityKey);
    
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const newTimeout = setTimeout(() => {
      logger.warn('Session ended due to inactivity', { sessionId });
      this.endSession(sessionId, 'INACTIVITY_TIMEOUT');
    }, this.config.maxInactivityMs);

    this.timeouts.set(inactivityKey, newTimeout);
  }

  /**
   * Nettoie tous les timeouts d'une session
   */
  private clearSessionTimeouts(sessionId: string): void {
    const durationKey = `${sessionId}_duration`;
    const inactivityKey = `${sessionId}_inactivity`;

    [durationKey, inactivityKey].forEach(key => {
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(key);
      }
    });
  }

  /**
   * Nettoie les sessions expirées
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - session.startTime.getTime();
      const inactivityAge = now - session.lastActivity.getTime();

      if (sessionAge > this.config.maxDurationMs || 
          inactivityAge > this.config.maxInactivityMs) {
        this.endSession(sessionId, 'CLEANUP_EXPIRED');
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired sessions', { cleanedCount });
    }
  }

  /**
   * Formate la durée en format lisible
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  /**
   * Obtient le nombre de sessions actives
   */
  getActiveSessionCount(): number {
    return Array.from(this.sessions.values()).filter(s => s.isActive).length;
  }

  /**
   * Force le nettoyage de toutes les sessions (pour démontage)
   */
  cleanup(): void {
    logger.info('Cleaning up all sessions', { sessionCount: this.sessions.size });
    
    // Terminer toutes les sessions actives
    for (const sessionId of this.sessions.keys()) {
      this.endSession(sessionId, 'SYSTEM_CLEANUP');
    }

    // Nettoyer tous les timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    
    this.timeouts.clear();
    this.sessions.clear();
  }
}

// Instance globale singleton
export const sessionManager = new SessionManager(); 