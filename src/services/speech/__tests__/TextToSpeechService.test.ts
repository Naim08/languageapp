import { TextToSpeechService } from '../TextToSpeechService';
import { VoiceManager } from '../VoiceManager';
import * as Speech from 'expo-speech';
import { AppState } from 'react-native';

// Mock dependencies
jest.mock('../VoiceManager');
jest.mock('expo-speech');

describe('TextToSpeechService', () => {
  let ttsService: TextToSpeechService;
  let mockVoiceManager: jest.Mocked<VoiceManager>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mock VoiceManager
    mockVoiceManager = {
      getVoiceForLanguage: jest.fn().mockResolvedValue({
        identifier: 'com.apple.voice.enhanced.en-US.Alex',
        name: 'Alex',
        quality: 'Enhanced',
        language: 'en-US'
      }),
      initializeVoices: jest.fn().mockResolvedValue(undefined),
    } as any;

    (VoiceManager as jest.Mock).mockImplementation(() => mockVoiceManager);

    // Create service instance
    ttsService = new TextToSpeechService();
  });

  afterEach(() => {
    ttsService.destroy();
  });

  describe('Initialization', () => {
    it('should initialize voice manager on creation', () => {
      expect(VoiceManager).toHaveBeenCalledTimes(1);
      expect(mockVoiceManager.initializeVoices).toHaveBeenCalledTimes(1);
    });
  });

  describe('Basic Speaking Functionality', () => {
    it('should speak text with default options', async () => {
      const text = 'Hello world';
      
      await ttsService.speak(text);
      
      expect(Speech.speak).toHaveBeenCalledWith(text, expect.objectContaining({
        language: 'en-US',
        rate: 1.0,
        voice: 'com.apple.voice.enhanced.en-US.Alex',
      }));
    });

    it('should speak text with custom options', async () => {
      const text = 'Bonjour le monde';
      const options = {
        language: 'fr-FR',
        rate: 0.8,
        onStart: jest.fn(),
        onDone: jest.fn(),
      };

      mockVoiceManager.getVoiceForLanguage.mockResolvedValue({
        identifier: 'com.apple.voice.enhanced.fr-FR.Thomas',
        name: 'Thomas',
        quality: 'Enhanced',
        language: 'fr-FR'
      });

      await ttsService.speak(text, options);

      expect(mockVoiceManager.getVoiceForLanguage).toHaveBeenCalledWith('fr-FR');
      expect(Speech.speak).toHaveBeenCalledWith(text, expect.objectContaining({
        language: 'fr-FR',
        rate: 0.8,
        voice: 'com.apple.voice.enhanced.fr-FR.Thomas',
      }));
    });

    it('should handle rate adjustment based on user level', async () => {
      // Test beginner level (should use 0.8x rate)
      await ttsService.speak('Test', { userLevel: 'beginner' });
      expect(Speech.speak).toHaveBeenLastCalledWith('Test', expect.objectContaining({
        rate: 0.8,
      }));

      // Test intermediate level (should use 1.0x rate)
      await ttsService.speak('Test', { userLevel: 'intermediate' });
      expect(Speech.speak).toHaveBeenLastCalledWith('Test', expect.objectContaining({
        rate: 1.0,
      }));

      // Test advanced level (should use 1.2x rate)
      await ttsService.speak('Test', { userLevel: 'advanced' });
      expect(Speech.speak).toHaveBeenLastCalledWith('Test', expect.objectContaining({
        rate: 1.2,
      }));
    });
  });

  describe('Queue Management', () => {
    it('should add utterances to queue when service is speaking', async () => {
      // Mock isSpeaking to return true
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);

      const utterance1 = 'First utterance';
      const utterance2 = 'Second utterance';

      await ttsService.speak(utterance1);
      await ttsService.speak(utterance2);

      // First utterance should be spoken immediately
      expect(Speech.speak).toHaveBeenCalledTimes(1);
      expect(Speech.speak).toHaveBeenCalledWith(utterance1, expect.any(Object));
    });

    it('should process queue after current utterance finishes', async () => {
      const utterance1 = 'First utterance';
      const utterance2 = 'Second utterance';
      let onDoneCallback: (() => void) | undefined;

      // Mock Speech.speak to capture the onDone callback
      (Speech.speak as jest.Mock).mockImplementation((text, options) => {
        onDoneCallback = options.onDone;
      });

      // Mock isSpeaking to return true initially
      const isSpeakingMock = jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);

      await ttsService.speak(utterance1);
      await ttsService.speak(utterance2);

      // Change isSpeaking to false and trigger onDone
      isSpeakingMock.mockReturnValue(false);
      onDoneCallback?.();

      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(Speech.speak).toHaveBeenCalledTimes(2);
      expect(Speech.speak).toHaveBeenNthCalledWith(2, utterance2, expect.any(Object));
    });

    it('should clear queue when stop is called', async () => {
      // Add items to queue
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);
      
      await ttsService.speak('First');
      await ttsService.speak('Second');
      await ttsService.speak('Third');

      // Stop should clear the queue
      ttsService.stop();

      expect(Speech.stop).toHaveBeenCalled();
    });

    it('should handle queue when paused and resumed', async () => {
      const utterance = 'Test utterance';
      
      await ttsService.speak(utterance);
      
      ttsService.pause();
      expect(Speech.pause).toHaveBeenCalled();

      ttsService.resume();
      expect(Speech.resume).toHaveBeenCalled();
    });
  });

  describe('App State Handling', () => {
    it('should handle app going to background', () => {
      const pauseSpy = jest.spyOn(ttsService, 'pause');
      
      // Simulate app state change to background
      const appStateCallback = (AppState.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      appStateCallback('background');
      
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should handle app returning to foreground', () => {
      const resumeSpy = jest.spyOn(ttsService, 'resumeAfterInterruption');
      
      // First, simulate going to background
      const appStateCallback = (AppState.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      appStateCallback('background');
      appStateCallback('active');
      
      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe('Interruption Management', () => {
    it('should handle interruptions properly', () => {
      const pauseSpy = jest.spyOn(ttsService, 'pause');
      
      ttsService.handleInterruption();
      
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should resume after interruption ends', () => {
      const resumeSpy = jest.spyOn(ttsService, 'resume');
      
      // First interrupt, then resume
      ttsService.handleInterruption();
      ttsService.resumeAfterInterruption();
      
      expect(resumeSpy).toHaveBeenCalled();
    });

    it('should not resume if manually stopped during interruption', () => {
      const resumeSpy = jest.spyOn(ttsService, 'resume');
      
      // Interrupt, then manually stop, then try to resume
      ttsService.handleInterruption();
      ttsService.stop();
      ttsService.resumeAfterInterruption();
      
      expect(resumeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Voice Fallback', () => {
    it('should handle missing voice gracefully', async () => {
      mockVoiceManager.getVoiceForLanguage.mockResolvedValue(null);

      await ttsService.speak('Test text', { language: 'invalid-lang' });

      expect(Speech.speak).toHaveBeenCalledWith('Test text', expect.objectContaining({
        language: 'invalid-lang',
        voice: undefined, // Should fallback to system default
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle speech errors gracefully', async () => {
      const onError = jest.fn();
      
      // Mock Speech.speak to throw an error
      (Speech.speak as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Speech error');
      });

      await ttsService.speak('Test', { onError });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should continue processing queue after error', async () => {
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(true);

      // First utterance throws error
      (Speech.speak as jest.Mock)
        .mockImplementationOnce(() => { throw new Error('Error'); })
        .mockImplementationOnce((text, options) => { options.onDone?.(); });

      await ttsService.speak('Error utterance');
      await ttsService.speak('Success utterance');

      // Simulate queue processing
      jest.spyOn(ttsService, 'isSpeaking').mockReturnValue(false);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(Speech.speak).toHaveBeenCalledTimes(2);
    });
  });

  describe('Status Methods', () => {
    it('should correctly report speaking status', () => {
      expect(typeof ttsService.isSpeaking()).toBe('boolean');
    });

    it('should correctly report paused status', () => {
      expect(typeof ttsService.isPaused()).toBe('boolean');
      
      ttsService.pause();
      expect(ttsService.isPaused()).toBe(true);
      
      ttsService.resume();
      expect(ttsService.isPaused()).toBe(false);
    });

    it('should provide queue status', () => {
      const status = ttsService.getQueueStatus();
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('isProcessing');
      expect(typeof status.queueLength).toBe('number');
      expect(typeof status.isProcessing).toBe('boolean');
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const stopSpy = jest.spyOn(ttsService, 'stop');
      
      ttsService.destroy();
      
      expect(stopSpy).toHaveBeenCalled();
    });
  });
});
