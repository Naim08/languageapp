import { LanguageInfo, SpeechLanguage } from './types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  // English variants (OpenAI Whisper optimized)
  { code: 'en-US', name: 'English (United States)', nativeName: 'English (US)', region: 'North America', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English (UK)', region: 'Europe', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (AU)', region: 'Oceania', flag: '🇦🇺' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (CA)', region: 'North America', flag: '��🇦' },

  // Spanish variants
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', region: 'Europe', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'North America', flag: '🇲🇽' },

  // French variants
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', region: 'Europe', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', region: 'North America', flag: '🇨🇦' },

  // German
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', region: 'Europe', flag: '🇩🇪' },

  // Italian
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano (Italia)', region: 'Europe', flag: '🇮🇹' },

  // Portuguese variants
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'South America', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', region: 'Europe', flag: '🇵🇹' },

  // Asian languages (OpenAI Whisper supported)
  { code: 'ja-JP', name: 'Japanese (Japan)', nativeName: '日本語 (日本)', region: 'Asia', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean (South Korea)', nativeName: '한국어 (대한민국)', region: 'Asia', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', region: 'Asia', flag: '🇨🇳' },

  // Other European languages
  { code: 'nl-NL', name: 'Dutch (Netherlands)', nativeName: 'Nederlands (Nederland)', region: 'Europe', flag: '🇳🇱' },
  { code: 'ru-RU', name: 'Russian (Russia)', nativeName: 'Русский (Россия)', region: 'Europe', flag: '🇷��' },

  // Arabic and Hindi
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)', region: 'Middle East', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी (भारत)', region: 'Asia', flag: '🇮🇳' },
];

export const getLanguageInfo = (code: SpeechLanguage): LanguageInfo | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const isLanguageSupported = (code: string): code is SpeechLanguage => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};
