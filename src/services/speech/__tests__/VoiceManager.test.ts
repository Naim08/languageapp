import { VoiceManager } from '../VoiceManager';
import * as Speech from 'expo-speech';

jest.mock('expo-speech');

describe('VoiceManager', () => {
  let voiceManager: VoiceManager;

  const mockVoices = [
    { identifier: 'com.apple.voice.compact.en-US.Samantha', name: 'Samantha', quality: 'Default', language: 'en-US' },
    { identifier: 'com.apple.voice.enhanced.en-US.Alex', name: 'Alex', quality: 'Enhanced', language: 'en-US' },
    { identifier: 'com.apple.voice.premium.en-US.Ava', name: 'Ava', quality: 'Premium', language: 'en-US' },
    { identifier: 'com.apple.voice.compact.en-GB.Daniel', name: 'Daniel', quality: 'Default', language: 'en-GB' },
    { identifier: 'com.apple.voice.enhanced.en-GB.Kate', name: 'Kate', quality: 'Enhanced', language: 'en-GB' },
    { identifier: 'com.apple.voice.compact.es-ES.Monica', name: 'Monica', quality: 'Default', language: 'es-ES' },
    { identifier: 'com.apple.voice.enhanced.es-ES.Jorge', name: 'Jorge', quality: 'Enhanced', language: 'es-ES' },
    { identifier: 'com.apple.voice.compact.fr-FR.Amelie', name: 'Amelie', quality: 'Default', language: 'fr-FR' },
    { identifier: 'com.apple.voice.enhanced.fr-FR.Thomas', name: 'Thomas', quality: 'Enhanced', language: 'fr-FR' },
    { identifier: 'com.apple.voice.compact.de-DE.Anna', name: 'Anna', quality: 'Default', language: 'de-DE' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue(mockVoices);
    voiceManager = new VoiceManager();
  });

  describe('Initialization', () => {
    it('should initialize voices from Speech API', async () => {
      await voiceManager.initializeVoices();
      
      expect(Speech.getAvailableVoicesAsync).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      (Speech.getAvailableVoicesAsync as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      await expect(voiceManager.initializeVoices()).resolves.not.toThrow();
    });
  });

  describe('Voice Selection by Quality', () => {
    beforeEach(async () => {
      await voiceManager.initializeVoices();
    });

    it('should prefer Premium quality voices when available', async () => {
      const voice = await voiceManager.getVoiceForLanguage('en-US');
      
      expect(voice).toEqual(expect.objectContaining({
        name: 'Ava',
        quality: 'Premium',
        language: 'en-US'
      }));
    });

    it('should fallback to Enhanced quality when Premium not available', async () => {
      const voice = await voiceManager.getVoiceForLanguage('en-GB');
      
      expect(voice).toEqual(expect.objectContaining({
        name: 'Kate',
        quality: 'Enhanced',
        language: 'en-GB'
      }));
    });

    it('should fallback to Default quality when Enhanced not available', async () => {
      const voice = await voiceManager.getVoiceForLanguage('de-DE');
      
      expect(voice).toEqual(expect.objectContaining({
        name: 'Anna',
        quality: 'Default',
        language: 'de-DE'
      }));
    });
  });

  describe('Language Fallback Logic', () => {
    beforeEach(async () => {
      await voiceManager.initializeVoices();
    });

    it('should return exact language match when available', async () => {
      const voice = await voiceManager.getVoiceForLanguage('es-ES');
      
      expect(voice?.language).toBe('es-ES');
      expect(voice?.quality).toBe('Enhanced'); // Should prefer higher quality
    });

    it('should fallback to language family when exact match not available', async () => {
      // Request es-MX (Mexican Spanish) which is not in our mock data
      const voice = await voiceManager.getVoiceForLanguage('es-MX');
      
      // Should fallback to es-ES
      expect(voice?.language).toBe('es-ES');
      expect(voice?.name).toBe('Jorge');
    });

    it('should fallback to en-US when no language family match found', async () => {
      const voice = await voiceManager.getVoiceForLanguage('ja-JP');
      
      // Should fallback to en-US since Japanese is not available
      expect(voice?.language).toBe('en-US');
      expect(voice?.quality).toBe('Premium'); // Should be highest quality English
    });

    it('should return null when no voices are available', async () => {
      // Simulate no voices available
      (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([]);
      const emptyVoiceManager = new VoiceManager();
      await emptyVoiceManager.initializeVoices();
      
      const voice = await emptyVoiceManager.getVoiceForLanguage('en-US');
      
      expect(voice).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await voiceManager.initializeVoices();
    });

    it('should handle malformed language codes', async () => {
      const voice = await voiceManager.getVoiceForLanguage('invalid-lang');
      
      // Should fallback to en-US
      expect(voice?.language).toBe('en-US');
    });

    it('should handle empty language string', async () => {
      const voice = await voiceManager.getVoiceForLanguage('');
      
      // Should fallback to en-US
      expect(voice?.language).toBe('en-US');
    });

    it('should handle null/undefined language', async () => {
      const voice1 = await voiceManager.getVoiceForLanguage(null as any);
      const voice2 = await voiceManager.getVoiceForLanguage(undefined as any);
      
      expect(voice1?.language).toBe('en-US');
      expect(voice2?.language).toBe('en-US');
    });
  });

  describe('Voice Caching', () => {
    beforeEach(async () => {
      await voiceManager.initializeVoices();
    });

    it('should cache voice results for performance', async () => {
      // First call
      const voice1 = await voiceManager.getVoiceForLanguage('en-US');
      
      // Second call should not trigger API call again
      const voice2 = await voiceManager.getVoiceForLanguage('en-US');
      
      expect(voice1).toBe(voice2); // Should be same reference (cached)
      expect(Speech.getAvailableVoicesAsync).toHaveBeenCalledTimes(1); // Only called during init
    });
  });

  describe('Quality Ranking', () => {
    beforeEach(async () => {
      await voiceManager.initializeVoices();
    });

    it('should rank voices correctly by quality', async () => {
      // Test with a language that has multiple quality options
      const voice = await voiceManager.getVoiceForLanguage('en-US');
      
      // Should select Premium (Ava) over Enhanced (Alex) and Default (Samantha)
      expect(voice?.quality).toBe('Premium');
      expect(voice?.name).toBe('Ava');
    });

    it('should handle unknown quality levels', async () => {
      // Mock voice with unknown quality
      const voicesWithUnknown = [
        ...mockVoices,
        { identifier: 'unknown.voice', name: 'Unknown', quality: 'SuperPremium', language: 'en-US' }
      ];
      
      (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue(voicesWithUnknown);
      
      const newVoiceManager = new VoiceManager();
      await newVoiceManager.initializeVoices();
      
      const voice = await newVoiceManager.getVoiceForLanguage('en-US');
      
      // Should still work, might prefer known quality levels
      expect(voice).toBeTruthy();
      expect(voice?.language).toBe('en-US');
    });
  });

  describe('Regional Variants', () => {
    beforeEach(async () => {
      await voiceManager.initializeVoices();
    });

    it('should distinguish between regional variants', async () => {
      const usVoice = await voiceManager.getVoiceForLanguage('en-US');
      const ukVoice = await voiceManager.getVoiceForLanguage('en-GB');
      
      expect(usVoice?.language).toBe('en-US');
      expect(ukVoice?.language).toBe('en-GB');
      expect(usVoice?.identifier).not.toBe(ukVoice?.identifier);
    });

    it('should fallback within same language family', async () => {
      // Request Australian English (not in mock data)
      const voice = await voiceManager.getVoiceForLanguage('en-AU');
      
      // Should fallback to available English variant
      expect(voice?.language).toMatch(/^en-/);
    });
  });
});
