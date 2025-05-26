import { LanguageInfo, SpeechLanguage } from './types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  // English variants
  { code: 'en-US', name: 'English (United States)', nativeName: 'English (US)', region: 'North America', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English (UK)', region: 'Europe', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (AU)', region: 'Oceania', flag: '🇦🇺' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (CA)', region: 'North America', flag: '🇨🇦' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (IN)', region: 'Asia', flag: '🇮🇳' },
  { code: 'en-ZA', name: 'English (South Africa)', nativeName: 'English (SA)', region: 'Africa', flag: '🇿🇦' },

  // Spanish variants
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', region: 'Europe', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'North America', flag: '🇲🇽' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', region: 'South America', flag: '🇦🇷' },
  { code: 'es-CO', name: 'Spanish (Colombia)', nativeName: 'Español (Colombia)', region: 'South America', flag: '🇨🇴' },
  { code: 'es-PE', name: 'Spanish (Peru)', nativeName: 'Español (Perú)', region: 'South America', flag: '🇵🇪' },
  { code: 'es-VE', name: 'Spanish (Venezuela)', nativeName: 'Español (Venezuela)', region: 'South America', flag: '🇻🇪' },

  // French variants
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', region: 'Europe', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', region: 'North America', flag: '🇨🇦' },
  { code: 'fr-BE', name: 'French (Belgium)', nativeName: 'Français (Belgique)', region: 'Europe', flag: '🇧🇪' },
  { code: 'fr-CH', name: 'French (Switzerland)', nativeName: 'Français (Suisse)', region: 'Europe', flag: '🇨🇭' },

  // German variants
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', region: 'Europe', flag: '🇩🇪' },
  { code: 'de-AT', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', region: 'Europe', flag: '🇦🇹' },
  { code: 'de-CH', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', region: 'Europe', flag: '🇨🇭' },

  // Italian
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano (Italia)', region: 'Europe', flag: '🇮🇹' },

  // Portuguese variants
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'South America', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', region: 'Europe', flag: '🇵🇹' },

  // Asian languages
  { code: 'ja-JP', name: 'Japanese (Japan)', nativeName: '日本語 (日本)', region: 'Asia', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean (South Korea)', nativeName: '한국어 (대한민국)', region: 'Asia', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', region: 'Asia', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', region: 'Asia', flag: '🇹🇼' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong)', nativeName: '中文 (香港)', region: 'Asia', flag: '🇭🇰' },

  // Other European languages
  { code: 'nl-NL', name: 'Dutch (Netherlands)', nativeName: 'Nederlands (Nederland)', region: 'Europe', flag: '🇳🇱' },
  { code: 'sv-SE', name: 'Swedish (Sweden)', nativeName: 'Svenska (Sverige)', region: 'Europe', flag: '🇸🇪' },
  { code: 'da-DK', name: 'Danish (Denmark)', nativeName: 'Dansk (Danmark)', region: 'Europe', flag: '🇩🇰' },
  { code: 'no-NO', name: 'Norwegian (Norway)', nativeName: 'Norsk (Norge)', region: 'Europe', flag: '🇳🇴' },
  { code: 'fi-FI', name: 'Finnish (Finland)', nativeName: 'Suomi (Suomi)', region: 'Europe', flag: '🇫🇮' },
  { code: 'ru-RU', name: 'Russian (Russia)', nativeName: 'Русский (Россия)', region: 'Europe', flag: '🇷🇺' },
  { code: 'pl-PL', name: 'Polish (Poland)', nativeName: 'Polski (Polska)', region: 'Europe', flag: '🇵🇱' },
  { code: 'cs-CZ', name: 'Czech (Czech Republic)', nativeName: 'Čeština (Česká republika)', region: 'Europe', flag: '🇨🇿' },
  { code: 'hu-HU', name: 'Hungarian (Hungary)', nativeName: 'Magyar (Magyarország)', region: 'Europe', flag: '🇭🇺' },
  { code: 'ro-RO', name: 'Romanian (Romania)', nativeName: 'Română (România)', region: 'Europe', flag: '🇷🇴' },

  // Arabic and Hebrew
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)', region: 'Middle East', flag: '🇸🇦' },
  { code: 'he-IL', name: 'Hebrew (Israel)', nativeName: 'עברית (ישראל)', region: 'Middle East', flag: '🇮🇱' },

  // Hindi and other Indian languages
  { code: 'hi-IN', name: 'Hindi (India)', nativeName: 'हिन्दी (भारत)', region: 'Asia', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil (India)', nativeName: 'தமிழ் (இந்தியா)', region: 'Asia', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu (India)', nativeName: 'తెలుగు (భారతదేశం)', region: 'Asia', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali (India)', nativeName: 'বাংলা (ভারত)', region: 'Asia', flag: '🇮🇳' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)', nativeName: 'বাংলা (বাংলাদেশ)', region: 'Asia', flag: '🇧🇩' },
  { code: 'gu-IN', name: 'Gujarati (India)', nativeName: 'ગુજરાતી (ભારત)', region: 'Asia', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi (India)', nativeName: 'मराठी (भारत)', region: 'Asia', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi (India)', nativeName: 'ਪੰਜਾਬੀ (ਭਾਰਤ)', region: 'Asia', flag: '🇮🇳' },

  // Southeast Asian languages
  { code: 'th-TH', name: 'Thai (Thailand)', nativeName: 'ไทย (ประเทศไทย)', region: 'Asia', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese (Vietnam)', nativeName: 'Tiếng Việt (Việt Nam)', region: 'Asia', flag: '🇻🇳' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)', nativeName: 'Bahasa Indonesia (Indonesia)', region: 'Asia', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay (Malaysia)', nativeName: 'Bahasa Melayu (Malaysia)', region: 'Asia', flag: '🇲🇾' },
];

export const LANGUAGE_BY_REGION = {
  'North America': SUPPORTED_LANGUAGES.filter(lang => lang.region === 'North America'),
  'South America': SUPPORTED_LANGUAGES.filter(lang => lang.region === 'South America'),
  'Europe': SUPPORTED_LANGUAGES.filter(lang => lang.region === 'Europe'),
  'Asia': SUPPORTED_LANGUAGES.filter(lang => lang.region === 'Asia'),
  'Middle East': SUPPORTED_LANGUAGES.filter(lang => lang.region === 'Middle East'),
  'Africa': SUPPORTED_LANGUAGES.filter(lang => lang.region === 'Africa'),
  'Oceania': SUPPORTED_LANGUAGES.filter(lang => lang.region === 'Oceania'),
};

export const getLanguageInfo = (code: SpeechLanguage): LanguageInfo | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const isLanguageSupported = (code: string): code is SpeechLanguage => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

export const getLanguagesByRegion = (region: string): LanguageInfo[] => {
  return SUPPORTED_LANGUAGES.filter(lang => lang.region === region);
};

export const searchLanguages = (query: string): LanguageInfo[] => {
  const lowercaseQuery = query.toLowerCase();
  return SUPPORTED_LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(lowercaseQuery) ||
    lang.nativeName.toLowerCase().includes(lowercaseQuery) ||
    lang.code.toLowerCase().includes(lowercaseQuery)
  );
};
