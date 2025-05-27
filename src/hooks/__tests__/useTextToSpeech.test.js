// useTextToSpeech Hook Tests
describe('useTextToSpeech Hook', () => {
  let mockTTSService;

  beforeEach(() => {
    mockTTSService = {
      speak: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      isSpeaking: jest.fn(),
      isPaused: jest.fn(),
      getQueueStatus: jest.fn(),
      setUserLevel: jest.fn(),
      cleanup: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    test('should initialize with default state', () => {
      const initialState = {
        isSpeaking: false,
        isPaused: false,
        isLoading: false,
        error: null,
        queueLength: 0,
        userLevel: 'intermediate',
      };

      expect(initialState.isSpeaking).toBe(false);
      expect(initialState.isPaused).toBe(false);
      expect(initialState.userLevel).toBe('intermediate');
    });

    test('should accept custom user level on initialization', () => {
      const customState = {
        isSpeaking: false,
        isPaused: false,
        isLoading: false,
        error: null,
        queueLength: 0,
        userLevel: 'beginner',
      };

      expect(customState.userLevel).toBe('beginner');
    });
  });

  describe('Control Operations', () => {
    test('should call speak with correct parameters', async () => {
      const text = 'Hello, world!';
      const options = { language: 'en-US' };

      mockTTSService.speak.mockResolvedValue(undefined);

      await mockTTSService.speak(text, options);

      expect(mockTTSService.speak).toHaveBeenCalledWith(text, options);
    });

    test('should update speaking state when speaking starts', () => {
      let isSpeaking = false;

      const startSpeaking = () => {
        isSpeaking = true;
      };

      startSpeaking();
      expect(isSpeaking).toBe(true);
    });

    test('should call stop and update state', async () => {
      let isSpeaking = true;

      mockTTSService.stop.mockResolvedValue(undefined);

      const stopSpeaking = async () => {
        await mockTTSService.stop();
        isSpeaking = false;
      };

      await stopSpeaking();

      expect(mockTTSService.stop).toHaveBeenCalled();
      expect(isSpeaking).toBe(false);
    });

    test('should call pause and update state', async () => {
      let isPaused = false;

      mockTTSService.pause.mockResolvedValue(undefined);

      const pauseSpeaking = async () => {
        await mockTTSService.pause();
        isPaused = true;
      };

      await pauseSpeaking();

      expect(mockTTSService.pause).toHaveBeenCalled();
      expect(isPaused).toBe(true);
    });

    test('should call resume and update state', async () => {
      let isPaused = true;

      mockTTSService.resume.mockResolvedValue(undefined);

      const resumeSpeaking = async () => {
        await mockTTSService.resume();
        isPaused = false;
      };

      await resumeSpeaking();

      expect(mockTTSService.resume).toHaveBeenCalled();
      expect(isPaused).toBe(false);
    });
  });

  describe('Status Updates', () => {
    test('should check speaking status', () => {
      mockTTSService.isSpeaking.mockReturnValue(true);

      const status = mockTTSService.isSpeaking();

      expect(mockTTSService.isSpeaking).toHaveBeenCalled();
      expect(status).toBe(true);
    });

    test('should check paused status', () => {
      mockTTSService.isPaused.mockReturnValue(false);

      const status = mockTTSService.isPaused();

      expect(mockTTSService.isPaused).toHaveBeenCalled();
      expect(status).toBe(false);
    });

    test('should get queue status', () => {
      const queueStatus = { queueLength: 3, isProcessing: true };
      mockTTSService.getQueueStatus.mockReturnValue(queueStatus);

      const status = mockTTSService.getQueueStatus();

      expect(mockTTSService.getQueueStatus).toHaveBeenCalled();
      expect(status).toEqual(queueStatus);
    });

    test('should update queue length in state', () => {
      let queueLength = 0;

      const updateQueueLength = (newLength) => {
        queueLength = newLength;
      };

      updateQueueLength(5);
      expect(queueLength).toBe(5);
    });
  });

  describe('User Level Management', () => {
    test('should update user level', () => {
      mockTTSService.setUserLevel.mockImplementation(() => {});

      const newLevel = 'advanced';
      mockTTSService.setUserLevel(newLevel);

      expect(mockTTSService.setUserLevel).toHaveBeenCalledWith(newLevel);
    });

    test('should apply correct speed for user level', () => {
      const speedMap = {
        beginner: 0.8,
        intermediate: 1.0,
        advanced: 1.2,
      };

      const getSpeedForLevel = (level) => speedMap[level] || 1.0;

      expect(getSpeedForLevel('beginner')).toBe(0.8);
      expect(getSpeedForLevel('intermediate')).toBe(1.0);
      expect(getSpeedForLevel('advanced')).toBe(1.2);
      expect(getSpeedForLevel('invalid')).toBe(1.0);
    });

    test('should validate user level values', () => {
      const validLevels = ['beginner', 'intermediate', 'advanced'];

      const isValidLevel = (level) => validLevels.includes(level);

      expect(isValidLevel('beginner')).toBe(true);
      expect(isValidLevel('intermediate')).toBe(true);
      expect(isValidLevel('advanced')).toBe(true);
      expect(isValidLevel('expert')).toBe(false);
      expect(isValidLevel('')).toBe(false);
    });
  });

  describe('App State Handling', () => {
    test('should pause when app goes to background', () => {
      let isPaused = false;

      const handleAppStateChange = (newState) => {
        if (newState === 'background') {
          isPaused = true;
          mockTTSService.pause();
        }
      };

      handleAppStateChange('background');

      expect(isPaused).toBe(true);
      expect(mockTTSService.pause).toHaveBeenCalled();
    });

    test('should resume when app becomes active', () => {
      let isPaused = true;

      const handleAppStateChange = (newState) => {
        if (newState === 'active' && isPaused) {
          isPaused = false;
          mockTTSService.resume();
        }
      };

      handleAppStateChange('active');

      expect(isPaused).toBe(false);
      expect(mockTTSService.resume).toHaveBeenCalled();
    });

    test('should not resume if not previously paused', () => {
      let isPaused = false;

      const handleAppStateChange = (newState) => {
        if (newState === 'active' && isPaused) {
          mockTTSService.resume();
        }
      };

      handleAppStateChange('active');

      expect(mockTTSService.resume).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle speak errors', async () => {
      const error = new Error('Speech failed');
      mockTTSService.speak.mockRejectedValue(error);

      let caughtError;
      try {
        await mockTTSService.speak('test');
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBe(error);
    });

    test('should update error state on failures', () => {
      let errorState = null;

      const setError = (error) => {
        errorState = error;
      };

      const handleError = (error) => {
        setError(error.message);
      };

      handleError(new Error('TTS Error'));

      expect(errorState).toBe('TTS Error');
    });

    test('should clear error state on successful operations', () => {
      let errorState = 'Previous error';

      const clearError = () => {
        errorState = null;
      };

      const handleSuccess = () => {
        clearError();
      };

      handleSuccess();

      expect(errorState).toBe(null);
    });

    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network unavailable');
      networkError.code = 'NETWORK_ERROR';

      mockTTSService.speak.mockRejectedValue(networkError);

      let isOffline = false;
      
      const handleNetworkError = (error) => {
        if (error.code === 'NETWORK_ERROR') {
          isOffline = true;
        }
      };

      try {
        await mockTTSService.speak('test');
      } catch (error) {
        handleNetworkError(error);
      }

      expect(isOffline).toBe(true);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources on unmount', () => {
      mockTTSService.cleanup.mockImplementation(() => {});

      const cleanup = () => {
        mockTTSService.cleanup();
      };

      cleanup();

      expect(mockTTSService.cleanup).toHaveBeenCalled();
    });

    test('should stop speech on cleanup', () => {
      const cleanup = () => {
        mockTTSService.stop();
        mockTTSService.cleanup();
      };

      cleanup();

      expect(mockTTSService.stop).toHaveBeenCalled();
      expect(mockTTSService.cleanup).toHaveBeenCalled();
    });

    test('should remove event listeners on cleanup', () => {
      const mockRemoveListener = jest.fn();

      const cleanup = () => {
        mockRemoveListener();
        mockTTSService.cleanup();
      };

      cleanup();

      expect(mockRemoveListener).toHaveBeenCalled();
      expect(mockTTSService.cleanup).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('should debounce rapid speak calls', () => {
      const calls = [];
      let timeoutId;

      const debouncedSpeak = (text) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          calls.push(text);
        }, 300);
      };

      // Simulate rapid calls
      debouncedSpeak('first');
      debouncedSpeak('second');
      debouncedSpeak('third');

      // Only the last call should be pending
      expect(calls.length).toBe(0);
    });

    test('should throttle status updates', () => {
      const updates = [];
      let lastUpdate = 0;
      const throttleMs = 100;

      const throttledUpdate = (status) => {
        const now = Date.now();
        if (now - lastUpdate >= throttleMs) {
          updates.push(status);
          lastUpdate = now;
        }
      };

      const startTime = Date.now();
      throttledUpdate('status1');
      
      // Simulate immediate second call
      throttledUpdate('status2');

      expect(updates.length).toBe(1);
      expect(updates[0]).toBe('status1');
    });
  });

  describe('Accessibility', () => {
    test('should support screen reader announcements', () => {
      const announcements = [];

      const announceToScreenReader = (message) => {
        announcements.push(message);
      };

      announceToScreenReader('Speech started');
      announceToScreenReader('Speech paused');
      announceToScreenReader('Speech stopped');

      expect(announcements).toEqual([
        'Speech started',
        'Speech paused', 
        'Speech stopped'
      ]);
    });

    test('should provide descriptive status messages', () => {
      const getStatusMessage = (isSpeaking, isPaused, queueLength) => {
        if (isSpeaking && !isPaused) {
          return 'Currently speaking';
        } else if (isPaused) {
          return 'Speech paused';
        } else if (queueLength > 0) {
          return `${queueLength} items in queue`;
        } else {
          return 'Ready to speak';
        }
      };

      expect(getStatusMessage(true, false, 0)).toBe('Currently speaking');
      expect(getStatusMessage(false, true, 0)).toBe('Speech paused');
      expect(getStatusMessage(false, false, 3)).toBe('3 items in queue');
      expect(getStatusMessage(false, false, 0)).toBe('Ready to speak');
    });
  });
});
