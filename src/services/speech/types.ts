// OpenAI Whisper Speech Recognition Types (via Edge Functions)
export interface SpeechRecognitionResult {
  transcript: string;
  confidence?: number;
  isFinal: boolean;
}

export interface SpeechRecognitionError {
  code: string;
  message: string;
}

export interface SpeechRecognitionState {
  isListening: boolean;
  isAvailable: boolean;
  currentLanguage: string;
  audioLevel: number;
}

export interface SpeechRecognitionCallbacks {
  onResult?: (result: string) => void;
  onError?: (error: SpeechRecognitionError) => void;
}

// Simplified config for OpenAI Whisper Edge Functions
export interface SpeechRecognitionConfig {
  language: string;
}

// OpenAI Whisper supported languages (simplified set)
export type SpeechLanguage = 
  // Primary languages supported by OpenAI Whisper
  | 'en-US' | 'en-GB' | 'en-AU' | 'en-CA'
  | 'es-ES' | 'es-MX' 
  | 'fr-FR' | 'fr-CA'
  | 'de-DE'
  | 'it-IT'
  | 'pt-BR' | 'pt-PT'
  | 'ja-JP' | 'ko-KR' | 'zh-CN'
  | 'nl-NL' | 'ru-RU'
  | 'ar-SA' | 'hi-IN';

export interface LanguageInfo {
  code: SpeechLanguage;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
}


// OpenAI TTS Types (via unified-tts Edge Functions)
export interface TTSError {
  code: string;
  message: string;
}

export interface TTSState {
  isSpeaking: boolean;
}

// TTS Provider types (aligned with unified-tts Edge Function)
export type TTSProvider = 'openai' | 'gemini' | 'auto';

// OpenAI TTS Voice options (complete list from unified-tts)
export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer' | 'verse';

// Gemini TTS Voice options (complete list from unified-tts)
export type GeminiVoice = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Leda' | 'Orus' | 'Aoede' | 'Callirrhoe' | 'Autonoe' | 
                         'Enceladus' | 'Iapetus' | 'Umbriel' | 'Algieba' | 'Despina' | 'Erinome' | 'Algenib' | 'Rasalgethi' | 
                         'Laomedeia' | 'Achernar' | 'Alnilam' | 'Schedar' | 'Gacrux' | 'Pulcherrima' | 'Achird' | 
                         'Zubenelgenubi' | 'Vindemiatrix' | 'Sadachbia' | 'Sadaltager' | 'Sulafat';

// Combined voice type for unified usage
export type TTSVoice = OpenAIVoice | GeminiVoice;

// User level for adaptive TTS (used by unified-tts Edge Function)
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TTSOptions {
  voice?: TTSVoice;
  provider?: TTSProvider;
  speed?: number; // 0.25 to 4.0
  model?: string;
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
  user_level?: UserLevel;
  language?: string;
  style_prompt?: string;
  fallback_enabled?: boolean;
}

export interface TTSCallbacks {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: TTSError) => void;
}
// Audio recording configuration
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  quality: 'low' | 'medium' | 'high';
  maxDuration: number; // in milliseconds
}
