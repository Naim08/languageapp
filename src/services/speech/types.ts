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
  | 'hi-IN' | 'ta-IN' | 'te-IN' | 'bn-IN'
  // Southeast Asian languages
  | 'th-TH' | 'vi-VN' | 'id-ID' | 'ms-MY'
  | 'bn-BD' | 'gu-IN' | 'mr-IN' | 'pa-IN';


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
