import * as Speech from 'expo-speech';
import { TTSVoice, SpeechLanguage } from './types';

class VoiceManager {
  private static instance: VoiceManager;
  private availableVoices: TTSVoice[] = [];
  private voicesLoaded: boolean = false;
  
  // Language to voice identifier mappings for common high-quality voices
  private preferredVoices: Record<string, string[]> = {
    // English variants
    'en-US': ['com.apple.ttsbundle.Samantha-compact', 'Alex', 'en-us-x-iol-local'],
    'en-GB': ['com.apple.ttsbundle.Daniel-compact', 'Daniel', 'en-gb-x-gbd-local'],
    'en-AU': ['com.apple.ttsbundle.Karen-compact', 'Karen', 'en-au-x-auc-local'],
    
    // Spanish variants
    'es-ES': ['com.apple.ttsbundle.Monica-compact', 'Monica', 'es-es-x-eed-local'],
    'es-MX': ['com.apple.ttsbundle.Paulina-compact', 'Paulina', 'es-mx-x-esf-local'],
    
    // French variants
    'fr-FR': ['com.apple.ttsbundle.Thomas-compact', 'Thomas', 'fr-fr-x-frd-local'],
    'fr-CA': ['com.apple.ttsbundle.Amelie-compact', 'Amelie', 'fr-ca-x-caf-local'],
    
    // German
    'de-DE': ['com.apple.ttsbundle.Anna-compact', 'Anna', 'de-de-x-deg-local'],
    
    // Italian
    'it-IT': ['com.apple.ttsbundle.Alice-compact', 'Alice', 'it-it-x-itd-local'],
    
    // Portuguese
    'pt-BR': ['com.apple.ttsbundle.Luciana-compact', 'Luciana', 'pt-br-x-ptd-local'],
    'pt-PT': ['com.apple.ttsbundle.Joana-compact', 'Joana', 'pt-pt-x-jmn-local'],
    
    // Asian languages - REMOVED: Not reliably supported by expo-speech
    // 'ja-JP': ['com.apple.ttsbundle.Kyoko-compact', 'Kyoko', 'ja-jp-x-jad-local'],
    // 'ko-KR': ['com.apple.ttsbundle.Yuna-compact', 'Yuna', 'ko-kr-x-koc-local'],
    // 'zh-CN': ['com.apple.ttsbundle.Ting-Ting-compact', 'Ting-Ting', 'zh-cn-x-chs-local'],
    // 'zh-TW': ['com.apple.ttsbundle.Mei-Jia-compact', 'Mei-Jia', 'zh-tw-x-cht-local'],
    
    // Other European languages
    'nl-NL': ['com.apple.ttsbundle.Ellen-compact', 'Ellen', 'nl-nl-x-nlc-local'],
    'sv-SE': ['com.apple.ttsbundle.Alva-compact', 'Alva', 'sv-se-x-cmh-local'],
    'da-DK': ['com.apple.ttsbundle.Sara-compact', 'Sara', 'da-dk-x-sfb-local'],
    'no-NO': ['com.apple.ttsbundle.Nora-compact', 'Nora', 'no-no-x-nob-local'],
    'ru-RU': ['com.apple.ttsbundle.Milena-compact', 'Milena', 'ru-ru-x-ruc-local'],
    
    // Arabic and Hebrew
    'ar-SA': ['com.apple.ttsbundle.Maged-compact', 'Maged', 'ar-sa-x-are-local'],
    'he-IL': ['com.apple.ttsbundle.Carmit-compact', 'Carmit', 'he-il-x-heb-local'],
    
    // Hindi and Indian languages
    'hi-IN': ['com.apple.ttsbundle.Lekha-compact', 'Lekha', 'hi-in-x-hid-local'],
    
    // Bengali languages - REMOVED: Not supported by expo-speech
    // 'bn-BD': ['com.apple.ttsbundle.Rishi-compact', 'Rishi', 'bn-bd-x-bdd-local'],
    // 'bn': ['com.apple.ttsbundle.Rishi-compact', 'Rishi', 'bn-bd-x-bdd-local'], // Fallback to generic Bengali
  };

  private constructor() {}

  static getInstance(): VoiceManager {
    if (!VoiceManager.instance) {
      VoiceManager.instance = new VoiceManager();
    }
    return VoiceManager.instance;
  }

  async loadAvailableVoices(): Promise<TTSVoice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      
      this.availableVoices = voices.map(voice => ({
        identifier: voice.identifier,
        name: voice.name,
        language: voice.language,
        quality: this.determineVoiceQuality(voice.identifier, voice.name),
        notInstalled: false, // Default to false since expo-speech doesn't provide this property
      }));
      
      this.voicesLoaded = true;
      return this.availableVoices;
    } catch (error) {
      console.error('Error loading available voices:', error);
      this.voicesLoaded = false;
      return [];
    }
  }

  private determineVoiceQuality(identifier: string, name: string): 'low' | 'normal' | 'high' | 'enhanced' {
    // Enhanced quality voices (usually neural or premium voices)
    if (identifier.includes('enhanced') || identifier.includes('neural') || identifier.includes('premium')) {
      return 'enhanced';
    }
    
    // High quality voices (compact versions of system voices)
    if (identifier.includes('compact') || identifier.includes('high-quality')) {
      return 'high';
    }
    
    // Standard system voices
    if (identifier.includes('com.apple.ttsbundle') || identifier.includes('com.google.android.tts')) {
      return 'normal';
    }
    
    // Fallback for basic/online voices
    return 'low';
  }  async getBestVoiceForLanguage(language: SpeechLanguage): Promise<string | undefined> {
    if (!this.voicesLoaded) {
      await this.loadAvailableVoices();
    }

    const languageCode = language.toLowerCase();
    const preferredVoiceIds = this.preferredVoices[languageCode] || [];

    // First, try to find preferred voices in order of preference
    for (const voiceId of preferredVoiceIds) {
      const voice = this.availableVoices.find(v =>
        v.identifier.includes(voiceId) || v.name.includes(voiceId)
      );
      if (voice && !voice.notInstalled) {
        return voice.identifier;
      }
    }

    // If no preferred voice found, find the best available voice for the language
    const languageVoices = this.availableVoices.filter(voice =>
      voice.language.toLowerCase().startsWith(languageCode.split('-')[0]) &&
      !voice.notInstalled
    );

    if (languageVoices.length === 0) {
      // Try fallback language if available
      const fallbackLanguage = this.getFallbackLanguage(language);
      if (fallbackLanguage !== language) {
        return this.getBestVoiceForLanguage(fallbackLanguage);
      }
      
      // If no fallback works, return any available voice as last resort
      const anyVoice = this.availableVoices.find(v => !v.notInstalled);
      return anyVoice?.identifier;
    }

    // Sort by quality: enhanced > high > normal > low
    const qualityOrder: Record<string, number> = { 
      'enhanced': 4, 
      'high': 3, 
      'normal': 2, 
      'low': 1 
    };
    
    languageVoices.sort((a, b) => 
      (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0)
    );

    return languageVoices[0].identifier;
  }

  async getVoicesForLanguage(language: SpeechLanguage): Promise<TTSVoice[]> {
    if (!this.voicesLoaded) {
      await this.loadAvailableVoices();
    }

    const languageCode = language.toLowerCase();
    return this.availableVoices.filter(voice => 
      voice.language.toLowerCase().startsWith(languageCode.split('-')[0])
    );
  }

  getAvailableVoices(): TTSVoice[] {
    return this.availableVoices;
  }

  async isVoiceAvailable(voiceId: string): Promise<boolean> {
    if (!this.voicesLoaded) {
      await this.loadAvailableVoices();
    }

    const voice = this.availableVoices.find(v => v.identifier === voiceId);
    return voice !== undefined && !voice.notInstalled;
  }

  // Get fallback language for cases where exact language voice is not available
  getFallbackLanguage(language: SpeechLanguage): SpeechLanguage {
    const languageMap: Record<string, SpeechLanguage> = {
      // English fallbacks
      'en-gb': 'en-US',
      'en-au': 'en-US', 
      'en-ca': 'en-US',
      'en-in': 'en-US',
      'en-za': 'en-US',
      
      // Spanish fallbacks
      'es-mx': 'es-ES',
      'es-ar': 'es-ES',
      'es-co': 'es-ES',
      'es-pe': 'es-ES',
      'es-ve': 'es-ES',
      
      // French fallbacks
      'fr-ca': 'fr-FR',
      'fr-be': 'fr-FR',
      'fr-ch': 'fr-FR',
      
      // German fallbacks
      'de-at': 'de-DE',
      'de-ch': 'de-DE',
      
      // Portuguese fallbacks
      'pt-pt': 'pt-BR',
      
      // Chinese fallbacks
      'zh-tw': 'zh-CN',
      'zh-hk': 'zh-CN',
    };

    return languageMap[language.toLowerCase()] || language;
  }
}

export default VoiceManager;
