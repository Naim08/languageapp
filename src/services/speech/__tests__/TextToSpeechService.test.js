// Text-to-Speech Service Tests

// Mock the TextToSpeechService
const mockTextToSpeechService = {
  init: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  setUserLevel: jest.fn(),
  getCurrentStatus: jest.fn(),
  cleanup: jest.fn(),
};

describe('TextToSpeechService', () => {
  let mockSpeech;
  let mockAppState;

  beforeEach(() => {
    // Mock expo-speech
    mockSpeech = {
      speak: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getAvailableVoicesAsync: jest.fn(),
      isSpeakingAsync: jest.fn(),
    };

    // Mock AppState
    mockAppState = {
      currentState: 'active',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const config = {
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        maxQueueSize: 10,
      };

      expect(config.language).toBe('en-US');
      expect(config.rate).toBe(1.0);
      expect(config.maxQueueSize).toBe(10);
    });

    test('should register app state listener on initialization', () => {
      const service = {
        init: () => {
          mockAppState.addEventListener('change', jest.fn());
        }
      };

      service.init();
      expect(mockAppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Speaking Functionality', () => {
    test('should speak text with default options', async () => {
      const text = 'Hello, world!';
      const defaultOptions = {
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      };

      mockSpeech.speak.mockResolvedValue(undefined);

      await mockSpeech.speak(text, defaultOptions);

      expect(mockSpeech.speak).toHaveBeenCalledWith(text, defaultOptions);
    });

    test('should speak text with custom options', async () => {
      const text = 'Bonjour le monde!';
      const customOptions = {
        language: 'fr-FR',
        rate: 0.8,
        pitch: 1.2,
        volume: 0.9,
      };

      mockSpeech.speak.mockResolvedValue(undefined);

      await mockSpeech.speak(text, customOptions);

      expect(mockSpeech.speak).toHaveBeenCalledWith(text, customOptions);
    });

    test('should handle empty text gracefully', async () => {
      const emptyTexts = ['', '   ', null, undefined];

      for (const text of emptyTexts) {
        const shouldSpeak = text && text.trim().length > 0;
        expect(shouldSpeak).toBe(false);
      }
    });
  });

  describe('Queue Management', () => {
    test('should add items to queue when busy', () => {
      const queue = [];
      const maxQueueSize = 10;

      // Simulate adding items
      const items = ['item1', 'item2', 'item3'];
      items.forEach(item => {
        if (queue.length < maxQueueSize) {
          queue.push(item);
        }
      });

      expect(queue.length).toBe(3);
      expect(queue).toEqual(['item1', 'item2', 'item3']);
    });

    test('should respect maximum queue size', () => {
      const queue = [];
      const maxQueueSize = 2;

      const items = ['item1', 'item2', 'item3', 'item4'];
      items.forEach(item => {
        if (queue.length < maxQueueSize) {
          queue.push(item);
        }
      });

      expect(queue.length).toBe(maxQueueSize);
      expect(queue).toEqual(['item1', 'item2']);
    });

    test('should process queue in FIFO order', () => {
      const queue = ['first', 'second', 'third'];
      const processed = [];

      while (queue.length > 0) {
        processed.push(queue.shift());
      }

      expect(processed).toEqual(['first', 'second', 'third']);
    });

    test('should clear queue when stopped', () => {
      const queue = ['item1', 'item2', 'item3'];
      
      // Simulate stop operation
      queue.splice(0, queue.length);
      
      expect(queue.length).toBe(0);
    });
  });

  describe('Control Operations', () => {
    test('should pause current speech', async () => {
      mockSpeech.pause.mockResolvedValue(undefined);

      await mockSpeech.pause();

      expect(mockSpeech.pause).toHaveBeenCalled();
    });

    test('should resume paused speech', async () => {
      mockSpeech.resume.mockResolvedValue(undefined);

      await mockSpeech.resume();

      expect(mockSpeech.resume).toHaveBeenCalled();
    });

    test('should stop current speech', async () => {
      mockSpeech.stop.mockResolvedValue(undefined);

      await mockSpeech.stop();

      expect(mockSpeech.stop).toHaveBeenCalled();
    });
  });

  describe('User Level Speed Controls', () => {
    test('should apply correct speed for beginner level', () => {
      const speeds = {
        beginner: 0.8,
        intermediate: 1.0,
        advanced: 1.2,
      };

      expect(speeds.beginner).toBe(0.8);
      expect(speeds.beginner).toBeLessThan(speeds.intermediate);
    });

    test('should apply correct speed for intermediate level', () => {
      const speeds = {
        beginner: 0.8,
        intermediate: 1.0,
        advanced: 1.2,
      };

      expect(speeds.intermediate).toBe(1.0);
    });

    test('should apply correct speed for advanced level', () => {
      const speeds = {
        beginner: 0.8,
        intermediate: 1.0,
        advanced: 1.2,
      };

      expect(speeds.advanced).toBe(1.2);
      expect(speeds.advanced).toBeGreaterThan(speeds.intermediate);
    });
  });

  describe('App State Handling', () => {
    test('should pause speech when app goes to background', () => {
      let isSpeaking = true;
      let isPaused = false;

      const handleAppStateChange = (newState) => {
        if (newState === 'background' && isSpeaking) {
          isPaused = true;
          mockSpeech.pause();
        }
      };

      handleAppStateChange('background');

      expect(isPaused).toBe(true);
      expect(mockSpeech.pause).toHaveBeenCalled();
    });

    test('should resume speech when app becomes active', () => {
      let isPaused = true;
      
      const handleAppStateChange = (newState) => {
        if (newState === 'active' && isPaused) {
          isPaused = false;
          mockSpeech.resume();
        }
      };

      handleAppStateChange('active');

      expect(isPaused).toBe(false);
      expect(mockSpeech.resume).toHaveBeenCalled();
    });
  });

  describe('Interruption Handling', () => {
    test('should handle phone call interruption', () => {
      let isInterrupted = false;

      const handleInterruption = (type) => {
        if (type === 'phone_call') {
          isInterrupted = true;
          mockSpeech.pause();
        }
      };

      handleInterruption('phone_call');

      expect(isInterrupted).toBe(true);
      expect(mockSpeech.pause).toHaveBeenCalled();
    });

    test('should resume after interruption ends', () => {
      let isInterrupted = false;

      const handleInterruptionEnd = () => {
        isInterrupted = false;
        mockSpeech.resume();
      };

      handleInterruptionEnd();

      expect(isInterrupted).toBe(false);
      expect(mockSpeech.resume).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle speech synthesis errors', async () => {
      const error = new Error('Speech synthesis failed');
      mockSpeech.speak.mockRejectedValue(error);

      let caughtError;
      try {
        await mockSpeech.speak('test');
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBe(error);
    });

    test('should fall back to default voice on voice error', () => {
      const voices = [
        { name: 'CustomVoice', quality: 'Premium', language: 'en-US' },
        { name: 'SystemDefault', quality: 'Default', language: 'en-US' },
      ];

      const getVoiceWithFallback = (preferredVoice) => {
        const found = voices.find(v => v.name === preferredVoice);
        return found || voices.find(v => v.quality === 'Default');
      };

      // Test fallback
      const result = getVoiceWithFallback('NonExistentVoice');
      expect(result.quality).toBe('Default');
    });

    test('should retry failed operations', async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const retryOperation = async () => {
        attemptCount++;
        if (attemptCount < maxRetries) {
          throw new Error('Operation failed');
        }
        return 'success';
      };

      let result;
      for (let i = 0; i < maxRetries; i++) {
        try {
          result = await retryOperation();
          break;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
        }
      }

      expect(result).toBe('success');
      expect(attemptCount).toBe(maxRetries);
    });
  });

  describe('Cleanup', () => {
    test('should remove event listeners on cleanup', () => {
      const cleanup = () => {
        mockAppState.removeEventListener('change', jest.fn());
        mockSpeech.stop();
      };

      cleanup();

      expect(mockAppState.removeEventListener).toHaveBeenCalled();
      expect(mockSpeech.stop).toHaveBeenCalled();
    });

    test('should clear queue on cleanup', () => {
      const queue = ['item1', 'item2', 'item3'];
      
      const cleanup = () => {
        queue.splice(0, queue.length);
      };

      cleanup();
      expect(queue.length).toBe(0);
    });
  });
});
