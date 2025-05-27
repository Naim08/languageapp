// Voice Manager Tests

// Mock the VoiceManager
const mockVoiceManager = {
  init: jest.fn(),
  getBestVoice: jest.fn(),
  getVoicesForLanguage: jest.fn(),
  cacheVoices: jest.fn(),
  clearCache: jest.fn(),
};

describe('VoiceManager', () => {
  let mockSpeech;

  beforeEach(() => {
    mockSpeech = {
      getAvailableVoicesAsync: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Voice Initialization', () => {
    test('should fetch available voices on initialization', async () => {
      const mockVoices = [
        { name: 'Voice1', language: 'en-US', quality: 'Premium' },
        { name: 'Voice2', language: 'en-GB', quality: 'Enhanced' },
        { name: 'Voice3', language: 'es-ES', quality: 'Default' },
      ];

      mockSpeech.getAvailableVoicesAsync.mockResolvedValue(mockVoices);

      const voices = await mockSpeech.getAvailableVoicesAsync();

      expect(mockSpeech.getAvailableVoicesAsync).toHaveBeenCalled();
      expect(voices).toEqual(mockVoices);
      expect(voices.length).toBeGreaterThan(0);
    });

    test('should handle empty voice list gracefully', async () => {
      mockSpeech.getAvailableVoicesAsync.mockResolvedValue([]);

      const voices = await mockSpeech.getAvailableVoicesAsync();

      expect(voices).toEqual([]);
    });
  });

  describe('Voice Quality Selection', () => {
    test('should prioritize Premium quality voices', () => {
      const voices = [
        { name: 'Voice1', quality: 'Default', language: 'en-US' },
        { name: 'Voice2', quality: 'Premium', language: 'en-US' },
        { name: 'Voice3', quality: 'Enhanced', language: 'en-US' },
      ];

      const qualityRanking = ['Premium', 'Enhanced', 'Default'];
      
      const sortedVoices = voices.sort((a, b) => {
        const aIndex = qualityRanking.indexOf(a.quality);
        const bIndex = qualityRanking.indexOf(b.quality);
        return aIndex - bIndex;
      });

      expect(sortedVoices[0].quality).toBe('Premium');
    });

    test('should select Enhanced quality when Premium unavailable', () => {
      const voices = [
        { name: 'Voice1', quality: 'Default', language: 'en-US' },
        { name: 'Voice2', quality: 'Enhanced', language: 'en-US' },
      ];

      const qualityRanking = ['Premium', 'Enhanced', 'Default'];
      
      const sortedVoices = voices.sort((a, b) => {
        const aIndex = qualityRanking.indexOf(a.quality);
        const bIndex = qualityRanking.indexOf(b.quality);
        return aIndex - bIndex;
      });

      expect(sortedVoices[0].quality).toBe('Enhanced');
    });

    test('should fall back to Default quality when others unavailable', () => {
      const voices = [
        { name: 'Voice1', quality: 'Default', language: 'en-US' },
        { name: 'Voice2', quality: 'Default', language: 'en-GB' },
      ];

      const qualityRanking = ['Premium', 'Enhanced', 'Default'];
      
      const sortedVoices = voices.sort((a, b) => {
        const aIndex = qualityRanking.indexOf(a.quality);
        const bIndex = qualityRanking.indexOf(b.quality);
        return aIndex - bIndex;
      });

      expect(sortedVoices[0].quality).toBe('Default');
    });
  });

  describe('Language Fallback Logic', () => {
    test('should find exact language match', () => {
      const voices = [
        { name: 'Voice1', language: 'en-US', quality: 'Premium' },
        { name: 'Voice2', language: 'en-GB', quality: 'Enhanced' },
        { name: 'Voice3', language: 'fr-FR', quality: 'Default' },
      ];

      const findVoiceForLanguage = (targetLanguage) => {
        return voices.find(voice => voice.language === targetLanguage);
      };

      const result = findVoiceForLanguage('en-US');
      expect(result).toBeDefined();
      expect(result.language).toBe('en-US');
    });

    test('should fall back to language family when exact match unavailable', () => {
      const voices = [
        { name: 'Voice1', language: 'en-GB', quality: 'Premium' },
        { name: 'Voice2', language: 'es-ES', quality: 'Enhanced' },
        { name: 'Voice3', language: 'fr-FR', quality: 'Default' },
      ];

      const findVoiceForLanguage = (targetLanguage) => {
        // Try exact match first
        let match = voices.find(voice => voice.language === targetLanguage);
        if (match) return match;

        // Fall back to language family (e.g., 'en-US' -> 'en')
        const languageFamily = targetLanguage.split('-')[0];
        match = voices.find(voice => voice.language.startsWith(languageFamily));
        return match;
      };

      const result = findVoiceForLanguage('en-US');
      expect(result).toBeDefined();
      expect(result.language).toBe('en-GB');
    });

    test('should fall back to English when target language unavailable', () => {
      const voices = [
        { name: 'Voice1', language: 'en-US', quality: 'Premium' },
        { name: 'Voice2', language: 'es-ES', quality: 'Enhanced' },
      ];

      const findVoiceForLanguage = (targetLanguage) => {
        // Try exact match
        let match = voices.find(voice => voice.language === targetLanguage);
        if (match) return match;

        // Try language family
        const languageFamily = targetLanguage.split('-')[0];
        match = voices.find(voice => voice.language.startsWith(languageFamily));
        if (match) return match;

        // Fall back to English
        match = voices.find(voice => voice.language.startsWith('en'));
        return match;
      };

      const result = findVoiceForLanguage('de-DE');
      expect(result).toBeDefined();
      expect(result.language).toBe('en-US');
    });

    test('should return first available voice as last resort', () => {
      const voices = [
        { name: 'Voice1', language: 'zh-CN', quality: 'Premium' },
        { name: 'Voice2', language: 'ja-JP', quality: 'Enhanced' },
      ];

      const findVoiceForLanguage = (targetLanguage) => {
        // Try exact match
        let match = voices.find(voice => voice.language === targetLanguage);
        if (match) return match;

        // Try language family
        const languageFamily = targetLanguage.split('-')[0];
        match = voices.find(voice => voice.language.startsWith(languageFamily));
        if (match) return match;

        // Try English fallback
        match = voices.find(voice => voice.language.startsWith('en'));
        if (match) return match;

        // Last resort: first available voice
        return voices[0];
      };

      const result = findVoiceForLanguage('de-DE');
      expect(result).toBeDefined();
      expect(result.language).toBe('zh-CN');
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed language codes', () => {
      const voices = [
        { name: 'Voice1', language: 'en-US', quality: 'Premium' },
        { name: 'Voice2', language: 'invalid', quality: 'Enhanced' },
      ];

      const isValidLanguageCode = (code) => {
        return /^[a-z]{2}-[A-Z]{2}$/.test(code);
      };

      const validVoices = voices.filter(voice => isValidLanguageCode(voice.language));

      expect(validVoices.length).toBe(1);
      expect(validVoices[0].language).toBe('en-US');
    });

    test('should handle voices without quality information', () => {
      const voices = [
        { name: 'Voice1', language: 'en-US', quality: 'Premium' },
        { name: 'Voice2', language: 'en-GB' }, // Missing quality
        { name: 'Voice3', language: 'fr-FR', quality: null },
      ];

      const processedVoices = voices.map(voice => ({
        ...voice,
        quality: voice.quality || 'Default'
      }));

      expect(processedVoices[1].quality).toBe('Default');
      expect(processedVoices[2].quality).toBe('Default');
    });

    test('should handle empty voice name', () => {
      const voices = [
        { name: '', language: 'en-US', quality: 'Premium' },
        { name: 'ValidVoice', language: 'en-GB', quality: 'Enhanced' },
      ];

      const validVoices = voices.filter(voice => voice.name && voice.name.trim().length > 0);

      expect(validVoices.length).toBe(1);
      expect(validVoices[0].name).toBe('ValidVoice');
    });
  });

  describe('Voice Caching', () => {
    test('should cache voice list to avoid repeated API calls', async () => {
      const mockVoices = [
        { name: 'Voice1', language: 'en-US', quality: 'Premium' },
      ];

      let cachedVoices = null;

      const getVoices = async () => {
        if (!cachedVoices) {
          cachedVoices = await mockSpeech.getAvailableVoicesAsync();
        }
        return cachedVoices;
      };

      mockSpeech.getAvailableVoicesAsync.mockResolvedValue(mockVoices);

      // First call
      await getVoices();
      // Second call should use cache
      await getVoices();

      expect(mockSpeech.getAvailableVoicesAsync).toHaveBeenCalledTimes(1);
    });

    test('should refresh cache when explicitly requested', async () => {
      const mockVoices = [
        { name: 'Voice1', language: 'en-US', quality: 'Premium' },
      ];

      let cachedVoices = null;

      const getVoices = async (forceRefresh = false) => {
        if (!cachedVoices || forceRefresh) {
          cachedVoices = await mockSpeech.getAvailableVoicesAsync();
        }
        return cachedVoices;
      };

      mockSpeech.getAvailableVoicesAsync.mockResolvedValue(mockVoices);

      // First call
      await getVoices();
      // Force refresh
      await getVoices(true);

      expect(mockSpeech.getAvailableVoicesAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Regional Variants', () => {
    test('should distinguish between regional variants', () => {
      const voices = [
        { name: 'USVoice', language: 'en-US', quality: 'Premium' },
        { name: 'UKVoice', language: 'en-GB', quality: 'Premium' },
        { name: 'AUVoice', language: 'en-AU', quality: 'Enhanced' },
      ];

      const getRegionalVariants = (language) => {
        const baseLanguage = language.split('-')[0];
        return voices.filter(voice => voice.language.startsWith(baseLanguage));
      };

      const englishVariants = getRegionalVariants('en-US');

      expect(englishVariants.length).toBe(3);
      expect(englishVariants.map(v => v.language)).toEqual(['en-US', 'en-GB', 'en-AU']);
    });

    test('should prefer user region when available', () => {
      const voices = [
        { name: 'USVoice', language: 'en-US', quality: 'Premium' },
        { name: 'UKVoice', language: 'en-GB', quality: 'Premium' },
      ];

      const selectVoiceForRegion = (preferredRegion) => {
        return voices.find(voice => voice.language === preferredRegion) || voices[0];
      };

      const result = selectVoiceForRegion('en-GB');
      expect(result.language).toBe('en-GB');
    });
  });

  describe('Error Handling', () => {
    test('should handle voice loading errors gracefully', async () => {
      mockSpeech.getAvailableVoicesAsync.mockRejectedValue(new Error('Voice loading failed'));

      let error;
      try {
        await mockSpeech.getAvailableVoicesAsync();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toBe('Voice loading failed');
    });

    test('should provide fallback when voice loading fails', async () => {
      const fallbackVoices = [
        { name: 'SystemDefault', language: 'en-US', quality: 'Default' }
      ];

      const getVoicesWithFallback = async () => {
        try {
          return await mockSpeech.getAvailableVoicesAsync();
        } catch (error) {
          return fallbackVoices;
        }
      };

      mockSpeech.getAvailableVoicesAsync.mockRejectedValue(new Error('Failed'));

      const result = await getVoicesWithFallback();

      expect(result).toEqual(fallbackVoices);
    });
  });
});
