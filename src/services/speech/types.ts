export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionError {
  code: string;
  message: string;
  description: string;
}

export interface SpeechRecognitionState {
  isListening: boolean;
  isAvailable: boolean;
  hasPermission: boolean;
  currentLanguage: string;
  audioLevel: number;
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (results: string[]) => void;
  onPartialResults?: (results: string[]) => void;
  onError?: (error: SpeechRecognitionError) => void;
  onVolumeChanged?: (volume: number) => void;
}

export interface SpeechRecognitionConfig {
  language: string;
  maxResults?: number;
  partialResults?: boolean;
  continuousRecognition?: boolean;
  recognitionTimeout?: number;
  audioLevelUpdateInterval?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export type SpeechLanguage = 
  // English variants
  | 'en-US' | 'en-GB' | 'en-AU' | 'en-CA' | 'en-IN' | 'en-ZA'
  // Spanish variants
  | 'es-ES' | 'es-MX' | 'es-AR' | 'es-CO' | 'es-PE' | 'es-VE'
  // French variants
  | 'fr-FR' | 'fr-CA' | 'fr-BE' | 'fr-CH'
  // German variants
  | 'de-DE' | 'de-AT' | 'de-CH'
  // Italian
  | 'it-IT'
  // Portuguese variants
  | 'pt-BR' | 'pt-PT'
  // Asian languages
  | 'ja-JP' | 'ko-KR' | 'zh-CN' | 'zh-TW' | 'zh-HK'
  // Other European languages
  | 'nl-NL' | 'sv-SE' | 'da-DK' | 'no-NO' | 'fi-FI'
  | 'ru-RU' | 'pl-PL' | 'cs-CZ' | 'hu-HU' | 'ro-RO'
  // Arabic and Hebrew
  | 'ar-SA' | 'he-IL'
  // Hindi and other Indian languages
  | 'hi-IN' | 'ta-IN' | 'te-IN'
  // Bengali variants (note: bn-IN not supported by expo-speech)
  | 'bn-BD' | 'bn'
  // Southeast Asian languages
  | 'th-TH' | 'vi-VN' | 'id-ID' | 'ms-MY'
  | 'gu-IN' | 'mr-IN' | 'pa-IN';


export interface LanguageInfo {
  code: SpeechLanguage;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
}

export interface AudioVisualizerData {
  amplitude: number;
  frequency: number;
  timestamp: number;
}

export interface SpeechRecognitionPermission {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'restricted';
}

// Text-to-Speech Types
export interface TTSUtterance {
  id: string;
  text: string;
  language: SpeechLanguage;
  rate: number;
  pitch: number;
  volume: number;
  voice?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: TTSError) => void;
}

export interface TTSError {
  code: string;
  message: string;
  utteranceId?: string;
}

export interface TTSState {
  isAvailable: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentUtterance: TTSUtterance | null;
  queueLength: number;
  availableVoices: TTSVoice[];
}

export interface TTSVoice {
  identifier: string;
  name: string;
  language: string;
  quality: 'low' | 'normal' | 'high' | 'enhanced';
  notInstalled?: boolean;
}

export interface TTSConfig {
  defaultRate: number;
  defaultPitch: number;
  defaultVolume: number;
  queueMode: 'replace' | 'add';
  autoLanguageDetection: boolean;
}

export interface TTSCallbacks {
  onStart?: (utteranceId: string) => void;
  onDone?: (utteranceId: string) => void;
  onPause?: (utteranceId: string) => void;
  onResume?: (utteranceId: string) => void;
  onStop?: (utteranceId: string) => void;
  onError?: (error: TTSError) => void;
  onProgress?: (utteranceId: string, characterIndex: number) => void;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LevelBasedTTSConfig {
  rate: Record<UserLevel, number>;
  pitch: Record<UserLevel, number>;
  volume: Record<UserLevel, number>;
}

// Whisper.rn Types for Offline Speech Recognition
export type WhisperModel = 'tiny' | 'tiny.en' | 'base' | 'base.en' | 'small' | 'small.en' | 'medium' | 'medium.en' | 'large';

export interface WhisperConfig {
  modelPath: string;
  language?: string;
  enableCoreML?: boolean;
  enableRealtime?: boolean;
  maxAudioLength?: number;
}

export interface WhisperContext {
  transcribe: (audioPath: string, options?: WhisperTranscribeOptions) => Promise<WhisperResult>;
  transcribeRealtime: (options?: WhisperRealtimeOptions) => Promise<WhisperRealtimeSession>;
  release: () => Promise<void>;
}

export interface WhisperTranscribeOptions {
  language?: string;
  maxTokens?: number;
  temperature?: number;
  wordTimestamps?: boolean;
}

export interface WhisperRealtimeOptions extends WhisperTranscribeOptions {
  audioSessionOnStartIos?: any;
  audioSessionOnStopIos?: any;
}

export interface WhisperResult {
  result: string;
  segments?: WhisperSegment[];
  isCapturing?: boolean;
  processTime?: number;
  recordingTime?: number;
}

export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

export interface WhisperRealtimeSession {
  stop: () => Promise<void>;
  subscribe: (callback: (result: WhisperResult) => void) => void;
}

export type SpeechRecognitionEngine = 'native' | 'whisper';

export interface EnhancedSpeechRecognitionConfig extends SpeechRecognitionConfig {
  engine?: SpeechRecognitionEngine;
  whisperConfig?: WhisperConfig;
  fallbackToNative?: boolean;
}

export interface SpeechRecognitionCapabilities {
  supportsOffline: boolean;
  supportsContinuous: boolean;
  supportsConfidence: boolean;
  supportsWordTimestamps: boolean;
  maxLanguages: number;
  engine: SpeechRecognitionEngine;
}
