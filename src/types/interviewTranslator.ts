export type SpeakerRole = 'assistant' | 'user';

export interface TranslationMessage {
  id: string;
  timestamp: Date;
  speaker: SpeakerRole;
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  targetLanguage: string;
  confidence: number;
  duration?: number;
}

export interface Participant {
  name: string;
  language: string;
}

export interface InterviewSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  assistantLanguage: string;
  userLanguage: string;
  messages: TranslationMessage[];
  status: 'active' | 'paused' | 'completed';
  participants: {
    assistant: Participant;
    user: Participant;
  };
  summary?: InterviewSummary;
}

export interface InterviewSummary {
  id: string;
  sessionId: string;
  generatedAt: Date;
  mainTopics: string[];
  keyDecisions: Array<{
    decision: string;
    responsible: SpeakerRole | 'both';
    deadline?: Date;
    followUp?: string;
  }>;
  unsolvedIssues: string[];
  nextSteps: string[];
  aiRecommendations: {
    suggestedFollowUp: string[];
    relevantServices: string[];
    documentationNeeded: string[];
  };
  statistics: {
    duration: string;
    messageCount: number;
    averageQuality: number;
    estimatedCost: number;
  };
}

export interface SessionStats {
  duration: string;
  messageCount: number;
  averageQuality: number;
  estimatedCost: number;
}

export interface TranslationQuality {
  overall: number;
  speechRecognition: number;
  translation: number;
  synthesis: number;
}

export interface UseInterviewTranslatorProps {
  userLanguage: string;
  onSessionUpdate?: (session: InterviewSession) => void;
}

export interface UseInterviewTranslatorReturn {
  isListening: boolean;
  isTranslating: boolean;
  isStreaming: boolean; // 🚀 NOUVEAU : État streaming translation
  translationQuality: number;
  messages: TranslationMessage[];
  sessionStats: SessionStats | null;
  startListening: () => void;
  stopListening: () => void;
  switchSpeaker: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => Promise<void>;
  generateSummary: () => Promise<InterviewSummary | null>;
  exportToPDF: () => Promise<void>;
  toggleAutoListenMode: () => void;
} 