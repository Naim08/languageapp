export const API_CONFIG = {
  OPENAI_API_URL: 'https://api.openai.com/v1',
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
} as const;

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MAX_RECORDING_DURATION: 60000, // 1 minute
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
