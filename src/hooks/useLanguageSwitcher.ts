import { useState, useCallback } from 'react';
import { SpeechLanguage } from '../services/speech/types';
import { getLanguageInfo, isLanguageSupported } from '../services/speech/languages';
import speechService from '../services/speech/SpeechRecognitionService';

export interface UseLanguageSwitcherReturn {
  currentLanguage: SpeechLanguage;
  setLanguage: (language: SpeechLanguage) => Promise<boolean>;
  getLanguageDisplayName: (language?: SpeechLanguage) => string;
  isValidLanguage: (language: string) => boolean;
  supportedLanguages: SpeechLanguage[];
}

/**
 * Hook for managing speech recognition language switching
 */
export const useLanguageSwitcher = (
  initialLanguage: SpeechLanguage = 'en-US'
): UseLanguageSwitcherReturn => {
  const [currentLanguage, setCurrentLanguage] = useState<SpeechLanguage>(initialLanguage);

  const setLanguage = useCallback(async (language: SpeechLanguage): Promise<boolean> => {
    try {
      if (!isLanguageSupported(language)) {
        console.warn(`Language ${language} is not supported`);
        return false;
      }

      // If speech recognition is currently running, restart with new language
      const wasListening = speechService.isListening();
      
      if (wasListening) {
        await speechService.stop();
        // Brief pause to ensure clean stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update the service language
      speechService.setLanguage(language);
      setCurrentLanguage(language);

      // Restart if it was listening before
      if (wasListening) {
        await speechService.start(language);
      }

      return true;
    } catch (error) {
      console.error('Failed to switch language:', error);
      return false;
    }
  }, []);

  const getLanguageDisplayName = useCallback((language?: SpeechLanguage): string => {
    const lang = language || currentLanguage;
    const info = getLanguageInfo(lang);
    return info ? `${info.flag} ${info.name}` : lang;
  }, [currentLanguage]);

  const isValidLanguage = useCallback((language: string): boolean => {
    return isLanguageSupported(language);
  }, []);

  // This would ideally be fetched from the speech service
  const supportedLanguages: SpeechLanguage[] = [
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-ZA',
    'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-PE', 'es-VE',
    'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH',
    'de-DE', 'de-AT', 'de-CH',
    'it-IT',
    'pt-BR', 'pt-PT',
    'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'zh-HK',
    'nl-NL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI',
    'ru-RU', 'pl-PL', 'cs-CZ', 'hu-HU', 'ro-RO',
    'ar-SA', 'he-IL',
    'hi-IN', 'ta-IN', 'te-IN', 'bn-IN', 'bn-BD', 'gu-IN', 'mr-IN', 'pa-IN',
    'th-TH', 'vi-VN', 'id-ID', 'ms-MY'
  ];

  return {
    currentLanguage,
    setLanguage,
    getLanguageDisplayName,
    isValidLanguage,
    supportedLanguages,
  };
};
