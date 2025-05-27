import { renderHook, act } from '@testing-library/react-native';
import { useTextToSpeech } from '../useTextToSpeech';
import { TextToSpeechService } from '../services/speech/TextToSpeechService';
import { AppState } from 'react-native';

// Mock the TextToSpeechService
jest.mock('../services/speech/TextToSpeechService');

describe('useTextToSpeech', () => {
  let mockTTSService: jest.Mocked<TextToSpeechService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock TTS service
    mockTTSService = {
      speak: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      isSpeaking: jest.fn().mockReturnValue(false),
      isPaused: jest.fn().mockReturnValue(false),
      getQueueStatus: jest.fn().mockReturnValue({ queueLength: 0, isProcessing: false }),
      handleInterruption: jest.fn(),
      resumeAfterInterruption: jest.fn(),
      destroy: jest.fn(),
    } as any;

    (TextToSpeechService as jest.Mock).mockImplementation(() => mockTTSService);
  });

  describe('Basic Functionality', () => {
    it('should initialize TTS service on mount', () => {
      renderHook(() => useTextToSpeech());
      
      expect(TextToSpeechService).toHaveBeenCalledTimes(1);
    });

    it('should provide speak function', () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      expect(typeof result.current.speak).toBe('function');
    });

    it('should provide control functions', () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.resume).toBe('function');
    });

    it('should provide status properties', () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      expect(typeof result.current.isSpeaking).toBe('boolean');
      expect(typeof result.current.isPaused).toBe('boolean');
      expect(typeof result.current.queueLength).toBe('number');
    });
  });

  describe('Speaking Operations', () => {
    it('should call TTS service speak method', async () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      await act(async () => {
        await result.current.speak('Hello world');
      });
      
      expect(mockTTSService.speak).toHaveBeenCalledWith('Hello world', undefined);
    });

    it('should pass options to TTS service', async () => {
      const { result } = renderHook(() => useTextToSpeech());
      const options = { language: 'fr-FR', rate: 0.8 };
      
      await act(async () => {
        await result.current.speak('Bonjour', options);
      });
      
      expect(mockTTSService.speak).toHaveBeenCalledWith('Bonjour', options);
    });

    it('should update speaking status', async () => {
      mockTTSService.isSpeaking.mockReturnValue(true);
      
      const { result } = renderHook(() => useTextToSpeech());
      
      await act(async () => {
        await result.current.speak('Test');
      });
      
      expect(result.current.isSpeaking).toBe(true);
    });
  });

  describe('Control Operations', () => {
    it('should stop speaking', () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      act(() => {
        result.current.stop();
      });
      
      expect(mockTTSService.stop).toHaveBeenCalled();
    });

    it('should pause speaking', () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      act(() => {
        result.current.pause();
      });
      
      expect(mockTTSService.pause).toHaveBeenCalled();
    });

    it('should resume speaking', () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      act(() => {
        result.current.resume();
      });
      
      expect(mockTTSService.resume).toHaveBeenCalled();
    });
  });

  describe('Status Updates', () => {
    it('should update status when service state changes', () => {
      mockTTSService.isSpeaking.mockReturnValue(true);
      mockTTSService.isPaused.mockReturnValue(true);
      mockTTSService.getQueueStatus.mockReturnValue({ queueLength: 2, isProcessing: true });
      
      const { result, rerender } = renderHook(() => useTextToSpeech());
      
      // Force re-render to trigger status update
      rerender();
      
      expect(result.current.isSpeaking).toBe(true);
      expect(result.current.isPaused).toBe(true);
      expect(result.current.queueLength).toBe(2);
    });
  });

  describe('App State Handling', () => {
    it('should set up app state listener', () => {
      renderHook(() => useTextToSpeech());
      
      expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should handle app backgrounding', () => {
      renderHook(() => useTextToSpeech());
      
      // Get the app state callback
      const appStateCallback = (AppState.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      act(() => {
        appStateCallback('background');
      });
      
      expect(mockTTSService.handleInterruption).toHaveBeenCalled();
    });

    it('should handle app foregrounding', () => {
      renderHook(() => useTextToSpeech());
      
      // Get the app state callback
      const appStateCallback = (AppState.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      act(() => {
        appStateCallback('active');
      });
      
      expect(mockTTSService.resumeAfterInterruption).toHaveBeenCalled();
    });

    it('should not handle interruption when app becomes inactive', () => {
      renderHook(() => useTextToSpeech());
      
      const appStateCallback = (AppState.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'change')?.[1];
      
      act(() => {
        appStateCallback('inactive');
      });
      
      // Should not trigger interruption for inactive state
      expect(mockTTSService.handleInterruption).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup TTS service on unmount', () => {
      const { unmount } = renderHook(() => useTextToSpeech());
      
      unmount();
      
      expect(mockTTSService.destroy).toHaveBeenCalled();
    });

    it('should remove app state listener on unmount', () => {
      const mockRemove = jest.fn();
      (AppState.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });
      
      const { unmount } = renderHook(() => useTextToSpeech());
      
      unmount();
      
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle TTS service errors gracefully', async () => {
      mockTTSService.speak.mockRejectedValue(new Error('TTS Error'));
      
      const { result } = renderHook(() => useTextToSpeech());
      
      // Should not throw
      await act(async () => {
        await expect(result.current.speak('Test')).resolves.not.toThrow();
      });
    });

    it('should handle service initialization errors', () => {
      (TextToSpeechService as jest.Mock).mockImplementation(() => {
        throw new Error('Init error');
      });
      
      // Should not throw during hook initialization
      expect(() => {
        renderHook(() => useTextToSpeech());
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useTextToSpeech());
      
      const firstSpeak = result.current.speak;
      const firstStop = result.current.stop;
      const firstPause = result.current.pause;
      const firstResume = result.current.resume;
      
      rerender();
      
      expect(result.current.speak).toBe(firstSpeak);
      expect(result.current.stop).toBe(firstStop);
      expect(result.current.pause).toBe(firstPause);
      expect(result.current.resume).toBe(firstResume);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle rapid successive calls', async () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      await act(async () => {
        await Promise.all([
          result.current.speak('First'),
          result.current.speak('Second'),
          result.current.speak('Third'),
        ]);
      });
      
      expect(mockTTSService.speak).toHaveBeenCalledTimes(3);
    });

    it('should handle stop during speaking', async () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      await act(async () => {
        result.current.speak('Test');
        result.current.stop();
      });
      
      expect(mockTTSService.speak).toHaveBeenCalled();
      expect(mockTTSService.stop).toHaveBeenCalled();
    });

    it('should handle pause/resume cycle', () => {
      const { result } = renderHook(() => useTextToSpeech());
      
      act(() => {
        result.current.pause();
        result.current.resume();
      });
      
      expect(mockTTSService.pause).toHaveBeenCalled();
      expect(mockTTSService.resume).toHaveBeenCalled();
    });
  });
});
