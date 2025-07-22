import { useState, useCallback } from 'react';

interface TTSError {
  code: string;
  message: string;
  details?: any;
}

interface UseTextToSpeechOptions {
  language?: string;
  voice?: string;
  speed?: number;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: TTSError) => void;
}

interface UseTextToSpeechReturn {
  isAvailable: boolean;
  isSpeaking: boolean;
  error: TTSError | null;
  speak: (text: string, options?: { voice?: string; speed?: number }) => Promise<void>;
  stop: () => Promise<void>;
  clearError: () => void;
  getAvailableVoices: () => string[];
}

export const useTextToSpeech = (
  options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn => {
  const {
    voice,
    speed = 1.0,
    onStart,
    onDone,
    onError,
  } = options;

  const [isAvailable] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<TTSError | null>(null);

  const handleError = useCallback((ttsError: TTSError) => {
    setError(ttsError);
    setIsSpeaking(false);
    onError?.(ttsError);
  }, [onError]);

  const speak = useCallback(async (text: string, speakOptions?: { voice?: string; speed?: number }) => {
    try {
      console.log('TTS: Starting to speak:', text);
      setError(null);
      setIsSpeaking(true);
      onStart?.();

      // Mock implementation for now
      console.log('TTS: Would speak with options:', {
        text,
        voice: speakOptions?.voice || voice,
        speed: speakOptions?.speed || speed,
      });

      // Simulate speaking for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSpeaking(false);
      onDone?.();
    } catch (err) {
      console.error('TTS Error:', err);
      handleError({
        code: 'TTS_ERROR',
        message: 'Failed to speak text',
        details: err,
      });
    }
  }, [voice, speed, onStart, onDone, handleError]);

  const stop = useCallback(async () => {
    try {
      console.log('TTS: Stopping speech');
      setIsSpeaking(false);
    } catch (err) {
      console.error('TTS Stop Error:', err);
      handleError({
        code: 'TTS_STOP_ERROR',
        message: 'Failed to stop speech',
        details: err,
      });
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAvailableVoices = useCallback(() => {
    return ['en-US-Standard-A', 'en-US-Standard-B', 'en-US-Wavenet-A'];
  }, []);

  return {
    isAvailable,
    isSpeaking,
    error,
    speak,
    stop,
    clearError,
    getAvailableVoices,
  };
};