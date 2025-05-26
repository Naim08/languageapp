import { useState, useEffect, useCallback, useRef } from 'react';
import SpeechRecognitionService from '@/services/speech/SpeechRecognitionService';
import {
  SpeechRecognitionError,
  SpeechRecognitionState,
  SpeechLanguage,
} from '@/services/speech/types';

interface UseSpeechRecognitionOptions {
  language?: SpeechLanguage;
  autoStart?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: SpeechRecognitionError) => void;
}

interface UseSpeechRecognitionReturn {
  // State
  isListening: boolean;
  isAvailable: boolean;
  transcript: string;
  partialTranscript: string;
  error: SpeechRecognitionError | null;
  audioLevel: number;
  currentLanguage: string;
  
  // Actions
  start: (language?: SpeechLanguage) => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
  switchLanguage: (language: SpeechLanguage) => Promise<void>;
  clearTranscript: () => void;
  clearError: () => void;
}

export const useSpeechRecognition = (
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const {
    language = 'en-US',
    autoStart = false,
    onResult,
    onError,
  } = options;

  // State
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionError | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Refs for stable callbacks
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize service
  useEffect(() => {
    let isMounted = true;

    const initializeService = async () => {
      try {
        const available = await SpeechRecognitionService.initialize();
        if (isMounted) {
          setIsAvailable(available);
          
          if (available && autoStart) {
            await start();
          }
        }
      } catch (err) {
        console.error('Failed to initialize speech recognition:', err);
        if (isMounted) {
          setIsAvailable(false);
        }
      }
    };

    initializeService();

    return () => {
      isMounted = false;
    };
  }, [autoStart]);

  // Setup event callbacks
  useEffect(() => {
    const callbacks = {
      onStart: () => {
        setIsListening(true);
        setError(null);
      },
      
      onEnd: () => {
        setIsListening(false);
        setPartialTranscript('');
        setAudioLevel(0);
      },
      
      onResult: (results: string[]) => {
        if (results && results.length > 0) {
          const finalTranscript = results[0];
          setTranscript(finalTranscript);
          setPartialTranscript('');
          onResultRef.current?.(finalTranscript);
        }
      },
      
      onPartialResults: (results: string[]) => {
        if (results && results.length > 0) {
          setPartialTranscript(results[0]);
        }
      },
      
      onError: (speechError: SpeechRecognitionError) => {
        setError(speechError);
        setIsListening(false);
        setPartialTranscript('');
        setAudioLevel(0);
        onErrorRef.current?.(speechError);
      },
      
      onVolumeChanged: (volume: number) => {
        setAudioLevel(volume);
      },
    };

    SpeechRecognitionService.setCallbacks(callbacks);

    // Cleanup function
    return () => {
      SpeechRecognitionService.setCallbacks({});
    };
  }, []);

  // Update current language when service language changes
  useEffect(() => {
    const updateLanguage = () => {
      const serviceLanguage = SpeechRecognitionService.getCurrentLanguage();
      setCurrentLanguage(serviceLanguage as SpeechLanguage);
    };

    updateLanguage();
  }, [isListening]);

  // Memoized action functions
  const start = useCallback(async (startLanguage?: SpeechLanguage) => {
    try {
      setError(null);
      await SpeechRecognitionService.start(startLanguage || language);
    } catch (err) {
      const speechError: SpeechRecognitionError = {
        code: 'START_ERROR',
        message: err instanceof Error ? err.message : 'Failed to start speech recognition',
        description: 'Unable to start speech recognition. Please check your microphone permissions.',
      };
      setError(speechError);
      onErrorRef.current?.(speechError);
    }
  }, [language]);

  const stop = useCallback(async () => {
    try {
      await SpeechRecognitionService.stop();
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, []);

  const cancel = useCallback(async () => {
    try {
      await SpeechRecognitionService.cancel();
      setPartialTranscript('');
      setAudioLevel(0);
    } catch (err) {
      console.error('Error canceling speech recognition:', err);
    }
  }, []);

  const switchLanguage = useCallback(async (newLanguage: SpeechLanguage) => {
    try {
      setError(null);
      await SpeechRecognitionService.switchLanguage(newLanguage);
      setCurrentLanguage(newLanguage);
    } catch (err) {
      const speechError: SpeechRecognitionError = {
        code: 'LANGUAGE_SWITCH_ERROR',
        message: err instanceof Error ? err.message : 'Failed to switch language',
        description: 'Unable to switch speech recognition language.',
      };
      setError(speechError);
      onErrorRef.current?.(speechError);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setPartialTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      SpeechRecognitionService.cancel().catch(console.error);
    };
  }, []);

  return {
    // State
    isListening,
    isAvailable,
    transcript,
    partialTranscript,
    error,
    audioLevel,
    currentLanguage,
    
    // Actions
    start,
    stop,
    cancel,
    switchLanguage,
    clearTranscript,
    clearError,
  };
};
