import { logger } from './logger';

interface PerformanceMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  
  // Métriques de traduction
  totalTranslations: number;
  successfulTranslations: number;
  failedTranslations: number;
  averageConfidence: number;
  averageTranslationTime: number;
  
  // Métriques audio
  totalAudioDuration: number; // en secondes
  speechRecognitionErrors: number;
  textToSpeechErrors: number;
  
  // Métriques de coûts (estimatifs)
  estimatedAzureCost: number;
  audioProcessingTime: number; // en millisecondes
  
  // Métriques de qualité
  userSatisfactionScore?: number;
  technicalIssues: string[];
  languageDetectionAccuracy: number;
}

interface TranslationEvent {
  timestamp: Date;
  duration: number;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  wordCount: number;
  success: boolean;
  error?: string;
}

interface AudioEvent {
  timestamp: Date;
  type: 'recognition' | 'synthesis';
  duration: number;
  success: boolean;
  error?: string;
  audioLength?: number; // en secondes
}

export class PerformanceMonitor {
  private sessions = new Map<string, PerformanceMetrics>();
  private translationEvents = new Map<string, TranslationEvent[]>();
  private audioEvents = new Map<string, AudioEvent[]>();
  
  // Tarification Azure approximative (en USD)
  private readonly AZURE_PRICING = {
    speechToText: 0.0006, // par minute
    textToSpeech: 0.004,  // par 1M caractères
    translation: 0.00001, // par caractère
    neuralVoices: 0.016   // par 1M caractères
  };

  /**
   * Démarre le monitoring d'une nouvelle session
   */
  startSession(sessionId: string): void {
    const metrics: PerformanceMetrics = {
      sessionId,
      startTime: new Date(),
      totalTranslations: 0,
      successfulTranslations: 0,
      failedTranslations: 0,
      averageConfidence: 0,
      averageTranslationTime: 0,
      totalAudioDuration: 0,
      speechRecognitionErrors: 0,
      textToSpeechErrors: 0,
      estimatedAzureCost: 0,
      audioProcessingTime: 0,
      technicalIssues: [],
      languageDetectionAccuracy: 0
    };

    this.sessions.set(sessionId, metrics);
    this.translationEvents.set(sessionId, []);
    this.audioEvents.set(sessionId, []);
    
    logger.info('Performance monitoring started', { sessionId });
  }

  /**
   * Enregistre un événement de traduction
   */
  recordTranslation(sessionId: string, event: {
    duration: number;
    sourceLanguage: string;
    targetLanguage: string;
    confidence: number;
    textLength: number;
    success: boolean;
    error?: string;
  }): void {
    const metrics = this.sessions.get(sessionId);
    const events = this.translationEvents.get(sessionId);
    
    if (!metrics || !events) {
      logger.warn('Session not found for translation event', { sessionId });
      return;
    }

    // Enregistrer l'événement
    const translationEvent: TranslationEvent = {
      timestamp: new Date(),
      duration: event.duration,
      sourceLanguage: event.sourceLanguage,
      targetLanguage: event.targetLanguage,
      confidence: event.confidence,
      wordCount: this.estimateWordCount(event.textLength),
      success: event.success,
      error: event.error
    };
    
    events.push(translationEvent);

    // Mettre à jour les métriques
    metrics.totalTranslations++;
    
    if (event.success) {
      metrics.successfulTranslations++;
    } else {
      metrics.failedTranslations++;
      if (event.error) {
        metrics.technicalIssues.push(`Translation: ${event.error}`);
      }
    }

    // Recalculer les moyennes
    this.updateAverages(sessionId);
    
    // Estimer le coût
    this.updateCostEstimate(sessionId, event.textLength);
    
    logger.debug('Translation event recorded', { 
      sessionId, 
      success: event.success,
      confidence: event.confidence 
    });
  }

  /**
   * Enregistre un événement audio
   */
  recordAudio(sessionId: string, event: {
    type: 'recognition' | 'synthesis';
    duration: number;
    success: boolean;
    error?: string;
    audioLength?: number;
  }): void {
    const metrics = this.sessions.get(sessionId);
    const events = this.audioEvents.get(sessionId);
    
    if (!metrics || !events) {
      logger.warn('Session not found for audio event', { sessionId });
      return;
    }

    // Enregistrer l'événement
    const audioEvent: AudioEvent = {
      timestamp: new Date(),
      type: event.type,
      duration: event.duration,
      success: event.success,
      error: event.error,
      audioLength: event.audioLength
    };
    
    events.push(audioEvent);

    // Mettre à jour les métriques
    if (event.audioLength) {
      metrics.totalAudioDuration += event.audioLength;
    }
    
    metrics.audioProcessingTime += event.duration;

    if (!event.success) {
      if (event.type === 'recognition') {
        metrics.speechRecognitionErrors++;
      } else {
        metrics.textToSpeechErrors++;
      }
      
      if (event.error) {
        metrics.technicalIssues.push(`${event.type}: ${event.error}`);
      }
    }

    // Mettre à jour le coût audio
    this.updateAudioCostEstimate(sessionId, audioEvent);
    
    logger.debug('Audio event recorded', { 
      sessionId, 
      type: event.type,
      success: event.success 
    });
  }

  /**
   * Termine une session et retourne les métriques finales
   */
  endSession(sessionId: string, userSatisfactionScore?: number): PerformanceMetrics | null {
    const metrics = this.sessions.get(sessionId);
    
    if (!metrics) {
      logger.warn('Session not found for ending', { sessionId });
      return null;
    }

    metrics.endTime = new Date();
    metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
    metrics.userSatisfactionScore = userSatisfactionScore;

    // Calculer les métriques finales
    this.calculateFinalMetrics(sessionId);
    
    logger.info('Performance monitoring ended', { 
      sessionId,
      duration: metrics.duration,
      totalTranslations: metrics.totalTranslations,
      estimatedCost: metrics.estimatedAzureCost
    });

    return metrics;
  }

  /**
   * Obtient les métriques actuelles d'une session
   */
  getSessionMetrics(sessionId: string): PerformanceMetrics | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Obtient un rapport de performance détaillé
   */
  getPerformanceReport(sessionId: string): {
    metrics: PerformanceMetrics;
    translationEvents: TranslationEvent[];
    audioEvents: AudioEvent[];
    recommendations: string[];
  } | null {
    const metrics = this.sessions.get(sessionId);
    const translationEvents = this.translationEvents.get(sessionId);
    const audioEvents = this.audioEvents.get(sessionId);
    
    if (!metrics || !translationEvents || !audioEvents) {
      return null;
    }

    const recommendations = this.generateRecommendations(metrics, translationEvents, audioEvents);

    return {
      metrics,
      translationEvents,
      audioEvents,
      recommendations
    };
  }

  /**
   * Nettoie les données d'une session
   */
  cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.translationEvents.delete(sessionId);
    this.audioEvents.delete(sessionId);
    
    logger.debug('Session data cleaned up', { sessionId });
  }

  /**
   * Met à jour les moyennes de performance
   */
  private updateAverages(sessionId: string): void {
    const metrics = this.sessions.get(sessionId);
    const events = this.translationEvents.get(sessionId);
    
    if (!metrics || !events || events.length === 0) return;

    const successfulEvents = events.filter(e => e.success);
    
    if (successfulEvents.length > 0) {
      metrics.averageConfidence = successfulEvents.reduce((sum, e) => sum + e.confidence, 0) / successfulEvents.length;
      metrics.averageTranslationTime = successfulEvents.reduce((sum, e) => sum + e.duration, 0) / successfulEvents.length;
      
      // Calculer la précision de détection de langue (approximative)
      const correctDetections = successfulEvents.filter(e => e.confidence > 0.8).length;
      metrics.languageDetectionAccuracy = correctDetections / successfulEvents.length;
    }
  }

  /**
   * Met à jour l'estimation des coûts
   */
  private updateCostEstimate(sessionId: string, textLength: number): void {
    const metrics = this.sessions.get(sessionId);
    if (!metrics) return;

    // Coût de traduction (par caractère)
    const translationCost = textLength * this.AZURE_PRICING.translation;
    
    // Coût de synthèse vocale (par caractère, voix neuronales)
    const synthesisCost = textLength * this.AZURE_PRICING.neuralVoices / 1000000;
    
    metrics.estimatedAzureCost += translationCost + synthesisCost;
  }

  /**
   * Met à jour l'estimation des coûts audio
   */
  private updateAudioCostEstimate(sessionId: string, event: AudioEvent): void {
    const metrics = this.sessions.get(sessionId);
    if (!metrics || !event.audioLength) return;

    if (event.type === 'recognition') {
      // Coût de reconnaissance vocale (par minute)
      const recognitionCost = (event.audioLength / 60) * this.AZURE_PRICING.speechToText;
      metrics.estimatedAzureCost += recognitionCost;
    }
  }

  /**
   * Calcule les métriques finales
   */
  private calculateFinalMetrics(sessionId: string): void {
    const metrics = this.sessions.get(sessionId);
    const translationEvents = this.translationEvents.get(sessionId);
    const audioEvents = this.audioEvents.get(sessionId);
    
    if (!metrics || !translationEvents || !audioEvents) return;

    // Taux de succès global
    const totalEvents = translationEvents.length + audioEvents.length;
    const successfulEvents = translationEvents.filter(e => e.success).length + 
                           audioEvents.filter(e => e.success).length;
    
    // Ajouter des métriques de qualité basées sur les événements
    if (totalEvents > 0) {
      const successRate = successfulEvents / totalEvents;
      
      // Ajouter des recommandations basées sur les performances
      if (successRate < 0.8) {
        metrics.technicalIssues.push('Taux de succès faible détecté');
      }
      
      if (metrics.averageConfidence < 0.7) {
        metrics.technicalIssues.push('Confiance de traduction faible');
      }
    }
  }

  /**
   * Génère des recommandations d'amélioration
   */
  private generateRecommendations(
    metrics: PerformanceMetrics,
    translationEvents: TranslationEvent[],
    audioEvents: AudioEvent[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommandations basées sur la qualité
    if (metrics.averageConfidence < 0.8) {
      recommendations.push('Améliorer la qualité audio pour augmenter la précision');
    }

    if (metrics.speechRecognitionErrors > metrics.totalTranslations * 0.1) {
      recommendations.push('Réduire le bruit ambiant pour améliorer la reconnaissance vocale');
    }

    // Recommandations basées sur les coûts
    if (metrics.estimatedAzureCost > 1.0) {
      recommendations.push('Session coûteuse - optimiser la durée et la fréquence');
    }

    // Recommandations basées sur les erreurs
    if (metrics.technicalIssues.length > 0) {
      recommendations.push('Résoudre les problèmes techniques identifiés');
    }

    // Recommandations basées sur la performance
    if (metrics.averageTranslationTime > 3000) {
      recommendations.push('Optimiser la connexion réseau pour réduire la latence');
    }

    return recommendations;
  }

  /**
   * Estime le nombre de mots à partir du nombre de caractères
   */
  private estimateWordCount(characterCount: number): number {
    // Approximation: 5 caractères par mot en moyenne
    return Math.ceil(characterCount / 5);
  }

  /**
   * Obtient un résumé des performances globales
   */
  getGlobalStats(): {
    totalSessions: number;
    averageSessionDuration: number;
    totalTranslations: number;
    averageSuccessRate: number;
    totalEstimatedCost: number;
  } {
    const sessions = Array.from(this.sessions.values());
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalTranslations: 0,
        averageSuccessRate: 0,
        totalEstimatedCost: 0
      };
    }

    const totalTranslations = sessions.reduce((sum, s) => sum + s.totalTranslations, 0);
    const totalSuccessful = sessions.reduce((sum, s) => sum + s.successfulTranslations, 0);
    const totalCost = sessions.reduce((sum, s) => sum + s.estimatedAzureCost, 0);
    const completedSessions = sessions.filter(s => s.duration);
    const avgDuration = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
      : 0;

    return {
      totalSessions: sessions.length,
      averageSessionDuration: avgDuration,
      totalTranslations,
      averageSuccessRate: totalTranslations > 0 ? totalSuccessful / totalTranslations : 0,
      totalEstimatedCost: totalCost
    };
  }
}

// Instance globale singleton
export const performanceMonitor = new PerformanceMonitor(); 