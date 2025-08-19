export type ExerciseType =
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'translation'
  | 'pronunciation'
  | 'listening'
  | 'speaking';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseQuestion {
  id: string;
  type: ExerciseType;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  targetLanguage: string;
  concept: string; // Grammar concept being tested (e.g., "gustar_plural")
  difficulty: ExerciseDifficulty;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
  imageUrl?: string; // URL for option-specific image
  imageAlt?: string; // Alt text for accessibility
}

export interface MultipleChoiceQuestion extends ExerciseQuestion {
  type: 'multiple_choice';
  options: MultipleChoiceOption[];
}

export interface FillInBlankQuestion extends ExerciseQuestion {
  type: 'fill_in_blank';
  correctAnswers: string[]; // Multiple possible correct answers
  hint?: string;
}

export interface TranslationQuestion extends ExerciseQuestion {
  type: 'translation';
  sourceLanguage: string;
  acceptableTranslations: string[];
}

export interface PronunciationQuestion extends ExerciseQuestion {
  type: 'pronunciation';
  expectedPhonetics?: string;
  minimumAccuracy: number; // 0-100
}

export type AnyExerciseQuestion = 
  | MultipleChoiceQuestion 
  | FillInBlankQuestion 
  | TranslationQuestion 
  | PronunciationQuestion;

export interface ExerciseAnswer {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  score: number; // 0-100
  timeSpent: number; // milliseconds
  timestamp: Date;
  audioUrl?: string; // For pronunciation exercises
}

export interface ExerciseAttempt {
  id: string;
  questionId: string;
  userId: string;
  answer: ExerciseAnswer;
  needsExplanation?: boolean; // User requested explanation
  mistakePattern?: string; // AI-detected pattern
}

export interface ExerciseResult {
  id: string;
  exerciseId: string;
  userId: string;
  answers: ExerciseAnswer[];
  totalScore: number;
  accuracy: number; // percentage correct
  timeSpent: number;
  completedAt: Date;
  conceptsMastered: string[];
  conceptsToReview: string[];
}

export interface ExerciseProgress {
  concept: string;
  attempts: number;
  correctAnswers: number;
  averageScore: number;
  lastAttempt: Date;
  masteryLevel: number; // 0-100
  needsReview: boolean;
}

// For analytics and tracking
export interface ExerciseAnalytics {
  conceptId: string;
  totalAttempts: number;
  successRate: number;
  commonMistakes: string[];
  averageTimeSpent: number;
  difficultyRating: number; // 1-5 based on user performance
} 