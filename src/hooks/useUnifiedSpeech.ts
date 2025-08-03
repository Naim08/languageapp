import { useState, useCallback, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useTextToSpeech } from './useTextToSpeech';

interface UnifiedSpeechOptions {
  language?: string;
  voice?: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onListeningStart?: () => void;
  onListeningEnd?: () => void;
  onTranscript?: (text: string) => void;
  onError?: (error: any) => void;
}

interface UnifiedSpeechReturn {
  // Combined state
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: any;
  
  // Speech recognition
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  
  // Text to speech
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  
  // Combined actions
  toggleListening: () => Promise<void>;
  reset: () => void;
}

export const useUnifiedSpeech = (
  options: UnifiedSpeechOptions = {}
): UnifiedSpeechReturn => {
  const {
    language = 'en-US',
    voice,
    onSpeechStart,
    onSpeechEnd,
    onListeningStart,
    onListeningEnd,
    onTranscript,
    onError,
  } = options;

  // Use existing hooks
  const speechRecognition = useSpeechRecognition({
    language,
    onResult: (transcript) => {
      onTranscript?.(transcript);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const textToSpeech = useTextToSpeech({
    language,
    voice,
    onStart: onSpeechStart,
    onDone: onSpeechEnd,
    onError: (error) => {
      onError?.(error);
    },
  });

  // Combined state
  const [isActive, setIsActive] = useState(false);

  // Actions
  const startListening = useCallback(async () => {
    try {
      setIsActive(true);
      onListeningStart?.();
      await speechRecognition.start(language);
    } catch (error) {
      setIsActive(false);
      onError?.(error);
    }
  }, [language, speechRecognition, onListeningStart, onError]);

  const stopListening = useCallback(async () => {
    try {
      await speechRecognition.stop();
      setIsActive(false);
      onListeningEnd?.();
    } catch (error) {
      onError?.(error);
    }
  }, [speechRecognition, onListeningEnd, onError]);

  const speak = useCallback(async (text: string) => {
    try {
      setIsActive(true);
      await textToSpeech.speak(text, { voice });
    } catch (error) {
      setIsActive(false);
      onError?.(error);
    }
  }, [textToSpeech, voice, onError]);

  const stopSpeaking = useCallback(async () => {
    try {
      await textToSpeech.stop();
      setIsActive(false);
    } catch (error) {
      onError?.(error);
    }
  }, [textToSpeech, onError]);

  const toggleListening = useCallback(async () => {
    if (speechRecognition.isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [speechRecognition.isListening, startListening, stopListening]);

  const reset = useCallback(() => {
    speechRecognition.clearTranscript();
    speechRecognition.clearError();
    textToSpeech.clearError();
    setIsActive(false);
  }, [speechRecognition, textToSpeech]);

  return {
    // Combined state
    isActive,
    isListening: speechRecognition.isListening,
    isSpeaking: textToSpeech.isSpeaking,
    transcript: speechRecognition.transcript,
    error: speechRecognition.error || textToSpeech.error,
    
    // Speech recognition
    startListening,
    stopListening,
    
    // Text to speech
    speak,
    stopSpeaking,
    
    // Combined actions
    toggleListening,
    reset,
  };
};