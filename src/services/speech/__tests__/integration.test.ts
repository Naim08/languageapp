import { TextToSpeechService } from '../services/speech/TextToSpeechService';
import { VoiceManager } from '../services/speech/VoiceManager';
import * as Speech from 'expo-speech';
import { AppState } from 'react-native';

// Integration tests for the complete TTS system
describe('TTS Integration Tests', () => {
  let ttsService: TextToSpeechService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock realistic voice data
    const mockVoices = [
      { identifier: 'com.apple.voice.premium.en-US.Ava', name: 'Ava', quality: 'Premium', language: 'en-US' },
      { identifier: 'com.apple.voice.enhanced.en-US.Alex', name: 'Alex', quality: 'Enhanced', language: 'en-US' },
      { identifier: 'com.apple.voice.enhanced.es-ES.Jorge', name: 'Jorge', quality: 'Enhanced', language: 'es-ES' },
      { identifier: 'com.apple.voice.enhanced.fr-FR.Thomas', name: 'Thomas', quality: 'Enhanced', language: 'fr-FR' },
    ];
    
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue(mockVoices);
    (Speech.speak as jest.Mock).mockImplementation((text, options) => {
      // Simulate async speech completion
      setTimeout(() => options.onDone?.(), 100);
    });
    
    ttsService = new TextToSpeechService();
  });

  afterEach(() => {
    ttsService.destroy();
  });

  describe('Complete User Journeys', () => {
    it('should handle beginner user language learning session', async () => {
      // Beginner user learning Spanish
      const spanishPhrase = 'Hola, ¿cómo estás?';
      const options = {
        language: 'es-ES',
        userLevel: 'beginner' as const,
        onStart: jest.fn(),
        onDone: jest.fn(),
      };

      await ttsService.speak(spanishPhrase, options);

      expect(Speech.speak).toHaveBeenCalledWith(spanishPhrase, expect.objectContaining({
        language: 'es-ES',
        rate: 0.8, // Slower for beginners
        voice: 'com.apple.voice.enhanced.es-ES.Jorge',
      }));
      
      expect(options.onStart).toHaveBeenCalled();
    });

    it('should handle advanced user rapid learning session', async () => {
      // Advanced user practicing multiple languages quickly
      const phrases = [
        { text: 'Hello world', language: 'en-US' },
        { text: 'Bonjour le monde', language: 'fr-FR' },
        { text: 'Hola mundo', language: 'es-ES' },
      ];

      for (const phrase of phrases) {
        await ttsService.speak(phrase.text, {
          language: phrase.language,
          userLevel: 'advanced',
        });
      }

      expect(Speech.speak).toHaveBeenCalledTimes(3);
      expect(Speech.speak).toHaveBeenNthCalledWith(1, 'Hello world', expect.objectContaining({
        rate: 1.2, // Faster for advanced users
      }));
    });

    it('should handle phone call interruption scenario', async () => {
      // User is practicing when phone call comes in
      const longText = 'This is a long practice sentence that will be interrupted by a phone call';
      
      // Start speaking
      await ttsService.speak(longText);
      
      // Simulate phone call (app goes to background)
      const appStateCallback = (AppState.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      appStateCallback('background');
      
      expect(ttsService.isPaused()).toBe(true);
      
      // Phone call ends, app returns to foreground
      appStateCallback('active');
      
      // Should resume automatically
      expect(Speech.resume).toHaveBeenCalled();
    });

    it('should handle Bluetooth headphone connection during speaking', async () => {
      // User starts speaking with phone speaker
      await ttsService.speak('Testing audio output');
      
      // Simulate Bluetooth connection (interruption)
      ttsService.handleInterruption();
      
      expect(ttsService.isPaused()).toBe(true);
      
      // Bluetooth connected, resume
      ttsService.resumeAfterInterruption();
      
      expect(Speech.resume).toHaveBeenCalled();
    });
  });

  describe('Queue Management Scenarios', () => {
    it('should handle rapid-fire pronunciation practice', async () => {
      // Simulate user clicking multiple words quickly
      const words = ['cat', 'dog', 'house', 'tree', 'water'];
      
      // Mock isSpeaking to simulate ongoing speech
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);
      
      // Add all words to queue
      const promises = words.map(word => ttsService.speak(word));
      await Promise.all(promises);
      
      // Only first word should be spoken immediately
      expect(Speech.speak).toHaveBeenCalledTimes(1);
      expect(Speech.speak).toHaveBeenCalledWith('cat', expect.any(Object));
      
      // Queue should contain remaining words
      const queueStatus = ttsService.getQueueStatus();
      expect(queueStatus.queueLength).toBe(4);
    });

    it('should handle user stopping during queue processing', async () => {
      // Add multiple items to queue
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);
      
      await ttsService.speak('First');
      await ttsService.speak('Second');
      await ttsService.speak('Third');
      
      // User decides to stop
      ttsService.stop();
      
      expect(Speech.stop).toHaveBeenCalled();
      expect(ttsService.getQueueStatus().queueLength).toBe(0);
    });

    it('should handle queue with mixed languages and speeds', async () => {
      // User practicing different languages at different speeds
      const phrases = [
        { text: 'Slow English', language: 'en-US', userLevel: 'beginner' as const },
        { text: 'Fast French', language: 'fr-FR', userLevel: 'advanced' as const },
        { text: 'Medium Spanish', language: 'es-ES', userLevel: 'intermediate' as const },
      ];

      jest.spyOn(ttsService, 'isSpeaking')
        .mockReturnValueOnce(false) // First call speaks immediately
        .mockReturnValueOnce(true)  // Second call goes to queue
        .mockReturnValueOnce(true); // Third call goes to queue

      for (const phrase of phrases) {
        await ttsService.speak(phrase.text, {
          language: phrase.language,
          userLevel: phrase.userLevel,
        });
      }

      // First phrase should be spoken with beginner speed
      expect(Speech.speak).toHaveBeenCalledWith('Slow English', expect.objectContaining({
        rate: 0.8,
      }));
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from voice selection failure', async () => {
      // Mock voice manager to fail once, then succeed
      const mockVoiceManager = new VoiceManager();
      jest.spyOn(mockVoiceManager, 'getVoiceForLanguage')
        .mockResolvedValueOnce(null) // First call fails
        .mockResolvedValueOnce({     // Second call succeeds
          identifier: 'com.apple.voice.enhanced.en-US.Alex',
          name: 'Alex',
          quality: 'Enhanced',
          language: 'en-US'
        });

      // Replace the service's voice manager
      (ttsService as any).voiceManager = mockVoiceManager;

      await ttsService.speak('Test with fallback');

      // Should still speak with system default voice
      expect(Speech.speak).toHaveBeenCalledWith('Test with fallback', expect.objectContaining({
        voice: undefined, // Fallback to system default
      }));
    });

    it('should continue queue processing after speech error', async () => {
      // Mock first speech call to fail, second to succeed
      (Speech.speak as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('Speech engine error');
        })
        .mockImplementationOnce((text, options) => {
          setTimeout(() => options.onDone?.(), 50);
        });

      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);

      await ttsService.speak('Will fail');
      await ttsService.speak('Will succeed');

      // Simulate queue processing after error
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(false);
      
      // Trigger queue processing (normally done by onDone callback)
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(Speech.speak).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large text efficiently', async () => {
      const largeText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
      
      const startTime = Date.now();
      await ttsService.speak(largeText);
      const endTime = Date.now();
      
      // Should not take more than 100ms to queue (actual speech is mocked)
      expect(endTime - startTime).toBeLessThan(100);
      expect(Speech.speak).toHaveBeenCalledWith(largeText, expect.any(Object));
    });

    it('should not leak memory with many operations', async () => {
      // Simulate many speak operations
      for (let i = 0; i < 100; i++) {
        await ttsService.speak(`Text ${i}`);
        if (i % 10 === 0) {
          ttsService.stop(); // Periodically clear queue
        }
      }
      
      // Should not accumulate memory (queue should be manageable)
      const finalQueueStatus = ttsService.getQueueStatus();
      expect(finalQueueStatus.queueLength).toBeLessThan(10);
    });
  });

  describe('Real-world Edge Cases', () => {
    it('should handle empty text gracefully', async () => {
      await ttsService.speak('');
      await ttsService.speak('   '); // Only whitespace
      await ttsService.speak('\n\t'); // Only special characters

      // Should handle without errors
      expect(Speech.speak).toHaveBeenCalledTimes(3);
    });

    it('should handle special characters and emojis', async () => {
      const specialTexts = [
        'Hello 👋 world 🌍',
        'Price: $19.99 (20% off)',
        'Email: test@example.com',
        'Math: 2 + 2 = 4',
        'Date: 2024-01-01',
      ];

      for (const text of specialTexts) {
        await ttsService.speak(text);
      }

      expect(Speech.speak).toHaveBeenCalledTimes(specialTexts.length);
    });

    it('should handle rapid pause/resume cycles', async () => {
      await ttsService.speak('Testing rapid controls');
      
      // Rapid pause/resume cycles
      for (let i = 0; i < 5; i++) {
        ttsService.pause();
        ttsService.resume();
      }
      
      // Should handle gracefully without errors
      expect(Speech.pause).toHaveBeenCalledTimes(5);
      expect(Speech.resume).toHaveBeenCalledTimes(5);
    });

    it('should handle app state changes during queue processing', async () => {
      // Add items to queue
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);
      
      await ttsService.speak('First');
      await ttsService.speak('Second');
      
      // App goes to background during queue processing
      const appStateCallback = (AppState.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      appStateCallback('background');
      
      // App returns to foreground
      appStateCallback('active');
      
      // Queue should be preserved and processing should resume
      expect(ttsService.getQueueStatus().queueLength).toBeGreaterThan(0);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide clear status feedback', () => {
      const status = ttsService.getQueueStatus();
      
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('isProcessing');
      expect(typeof status.queueLength).toBe('number');
      expect(typeof status.isProcessing).toBe('boolean');
    });

    it('should support all user levels with appropriate speeds', async () => {
      const userLevels = ['beginner', 'intermediate', 'advanced'] as const;
      const expectedRates = [0.8, 1.0, 1.2];
      
      for (let i = 0; i < userLevels.length; i++) {
        await ttsService.speak('Test', { userLevel: userLevels[i] });
        
        expect(Speech.speak).toHaveBeenLastCalledWith('Test', expect.objectContaining({
          rate: expectedRates[i],
        }));
      }
    });

    it('should maintain voice consistency for same language', async () => {
      // Multiple phrases in same language should use same voice
      await ttsService.speak('First phrase', { language: 'en-US' });
      await ttsService.speak('Second phrase', { language: 'en-US' });
      
      const calls = (Speech.speak as jest.Mock).mock.calls;
      const voice1 = calls[0][1].voice;
      const voice2 = calls[1][1].voice;
      
      expect(voice1).toBe(voice2);
    });
  });
});
