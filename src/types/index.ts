export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fallback?: T;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioUrl?: string;
  pronunciationScore?: number;
}

export interface ConversationState {
  messages: Message[];
  currentTopic: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  mistakeCount: number;
  vocabularyIntroduced: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  dailyGoalMinutes: number;
  createdAt: Date;
}

export interface SubscriptionState {
  isTrialActive: boolean;
  trialStartDate: Date;
  trialEndDate: Date;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'canceled';
  currentTier?: string;
  autoRenewEnabled: boolean;
}

// Export exercise types
export * from './exercise';
