export const API_CONFIG = {
  OPENAI_API_URL: 'https://api.openai.com/v1',
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
} as const;

export const SPEECH_CONFIG = {
  // OpenAI Whisper settings
  WHISPER_MODEL: 'whisper-1',
  MAX_AUDIO_DURATION: 60000, // 1 minute in milliseconds
  SUPPORTED_AUDIO_FORMATS: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
  
  // TTS Provider Configuration (aligned with unified-tts Edge Function)
  TTS_PROVIDERS: ['openai', 'gemini', 'auto'] as const,
  DEFAULT_PROVIDER: 'auto' as const,
  
  // OpenAI TTS settings
  TTS_MODEL: 'tts-1',
  TTS_HD_MODEL: 'tts-1-hd',
  DEFAULT_VOICE: 'alloy',
  // OpenAI TTS Voices (complete list from unified-tts Edge Function)
  OPENAI_VOICES: ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse'] as const,
  
  // Gemini TTS settings
  GEMINI_TTS_MODEL: 'gemini-2.5-flash-tts',
  DEFAULT_GEMINI_VOICE: 'Puck',
  // Gemini TTS Voices (complete list from unified-tts Edge Function)
  GEMINI_VOICES: [
    'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe',
    'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
    'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird',
    'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
  ] as const,
  
  // Combined voices for compatibility (all available voices)
  AVAILABLE_VOICES: [
    // OpenAI voices
    'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse',
    // Gemini voices
    'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe',
    'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
    'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird',
    'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
  ] as const,
  
  DEFAULT_SPEED: 1.0,
  SPEED_RANGE: { min: 0.25, max: 4.0 },
  
  // Default languages
  DEFAULT_LANGUAGE: 'en-US',
  SUPPORTED_LANGUAGES: [
    'en-US', 'en-GB', 'en-AU', 'en-CA',
    'es-ES', 'es-MX', 
    'fr-FR', 'fr-CA',
    'de-DE',
    'it-IT',
    'pt-BR', 'pt-PT',
    'ja-JP', 'ko-KR', 'zh-CN',
    'nl-NL', 'ru-RU',
    'ar-SA', 'hi-IN'
  ],
} as const;

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MAX_RECORDING_DURATION: 60000, // 1 minute
  RECORDING_QUALITY: 'high',
} as const;

export const SUBSCRIPTION_CONFIG = {
  TRIAL_DURATION_DAYS: 7,
  PRODUCTS: {
    MONTHLY: 'premium_monthly',
    YEARLY: 'premium_yearly',
  },
} as const;

export const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  CONVERSATION_HISTORY: '@conversation_history',
  SUBSCRIPTION_STATE: '@subscription_state',
  THEME_PREFERENCE: '@theme_preference',
} as const;
