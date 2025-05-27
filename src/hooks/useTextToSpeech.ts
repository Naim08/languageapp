import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import TextToSpeechService from '@/services/speech/TextToSpeechService';
import {
  TTSError,
  TTSState,
  SpeechLanguage,
  UserLevel,
  TTSVoice,
} from '@/services/speech/types';

interface UseTextToSpeechOptions {
  language?: SpeechLanguage;
  userLevel?: UserLevel;
  autoInitialize?: boolean;
  onStart?: (utteranceId: string) => void;
  onDone?: (utteranceId: string) => void;
  onError?: (error: TTSError) => void;
  onPause?: (utteranceId: string) => void;
  onResume?: (utteranceId: string) => void;
  onStop?: (utteranceId: string) => void;
}

interface UseTextToSpeechReturn {
  // State
  isAvailable: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  currentUtterance: any;
  queueLength: number;
  availableVoices: TTSVoice[];
  error: TTSError | null;
  isInitialized: boolean;
  
  // Actions
  speak: (text: string, options?: {
    language?: SpeechLanguage;
    userLevel?: UserLevel;
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: string;
  }) => Promise<string>;
  speakForLevel: (text: string, userLevel: UserLevel, language?: SpeechLanguage) => Promise<string>;
  speakSentences: (sentences: string[], options?: {
    language?: SpeechLanguage;
    userLevel?: UserLevel;
    pauseBetween?: number;
  }) => Promise<string[]>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  clearQueue: () => Promise<void>;
  initialize: () => Promise<boolean>;
  
  // Voice management
  getVoicesForLanguage: (language: SpeechLanguage) => Promise<TTSVoice[]>;
  
  // Utility
  clearError: () => void;
  setLanguage: (language: SpeechLanguage) => void;
  setUserLevel: (level: UserLevel) => void;
}

export const useTextToSpeech = (
  options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn => {
  const {
    language = 'en-US',
    userLevel = 'intermediate',
    autoInitialize = true,
    onStart,
    onDone,
    onError,
    onPause,
    onResume,
    onStop,
  } = options;

  // State
  const [state, setState] = useState<TTSState>({
    isAvailable: false,
    isSpeaking: false,
    isPaused: false,
    currentUtterance: null,
    queueLength: 0,
    availableVoices: [],
  });
  
  const [error, setError] = useState<TTSError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SpeechLanguage>(language);
  const [currentUserLevel, setCurrentUserLevel] = useState<UserLevel>(userLevel);

  // Refs
  const ttsService = useRef<TextToSpeechService>(TextToSpeechService.getInstance());
  const mounted = useRef(true);
  const stateUpdateInterval = useRef<NodeJS.Timeout | undefined>();
  const appStateListener = useRef<any>(null);

  // Initialize service
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      const success = await ttsService.current.initialize();
      
      if (mounted.current) {
        setIsInitialized(success);
        
        if (success) {
          // Set up callbacks
          ttsService.current.setCallbacks({
            onStart: (utteranceId: string) => {
              if (mounted.current) {
                setState(prev => ({ ...prev, isSpeaking: true, isPaused: false }));
                onStart?.(utteranceId);
              }
            },
            onDone: (utteranceId: string) => {
              if (mounted.current) {
                setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
                onDone?.(utteranceId);
              }
            },
            onPause: (utteranceId: string) => {
              if (mounted.current) {
                setState(prev => ({ ...prev, isPaused: true }));
                onPause?.(utteranceId);
              }
            },
            onResume: (utteranceId: string) => {
              if (mounted.current) {
                setState(prev => ({ ...prev, isPaused: false }));
                onResume?.(utteranceId);
              }
            },
            onStop: (utteranceId: string) => {
              if (mounted.current) {
                setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
                onStop?.(utteranceId);
              }
            },
            onError: (error: TTSError) => {
              if (mounted.current) {
                setState(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
                setError(error);
                onError?.(error);
              }
            },
          });

          // Update initial state
          updateState();
          
          // Start periodic state updates
          startStateUpdates();
        }
      }
      
      return success;
    } catch (err) {
      console.error('TTS initialization error:', err);
      if (mounted.current) {
        setError({
          code: 'INIT_ERROR',
          message: err instanceof Error ? err.message : 'Failed to initialize TTS',
        });
        setIsInitialized(false);
      }
      return false;
    }
  }, [onStart, onDone, onError, onPause, onResume, onStop]);

  // Update state from service
  const updateState = useCallback(() => {
    if (mounted.current && isInitialized) {
      const serviceState = ttsService.current.getState();
      setState(serviceState);
    }
  }, [isInitialized]);

  // Start periodic state updates
  const startStateUpdates = useCallback(() => {
    if (stateUpdateInterval.current) {
      clearInterval(stateUpdateInterval.current);
    }
    
    stateUpdateInterval.current = setInterval(updateState, 100);
  }, [updateState]);

  // Stop state updates
  const stopStateUpdates = useCallback(() => {
    if (stateUpdateInterval.current) {
      clearInterval(stateUpdateInterval.current);
      stateUpdateInterval.current = undefined;
    }
  }, []);

  // Speak text
  const speak = useCallback(async (
    text: string,
    speechOptions: {
      language?: SpeechLanguage;
      userLevel?: UserLevel;
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: string;
    } = {}
  ): Promise<string> => {
    if (!isInitialized) {
      throw new Error('TTS not initialized');
    }

    clearError();
    
    return ttsService.current.speak(text, {
      language: speechOptions.language || currentLanguage,
      userLevel: speechOptions.userLevel || currentUserLevel,
      ...speechOptions,
    });
  }, [isInitialized, currentLanguage, currentUserLevel]);

  // Speak for specific level
  const speakForLevel = useCallback(async (
    text: string,
    level: UserLevel,
    lang?: SpeechLanguage
  ): Promise<string> => {
    return speak(text, {
      language: lang || currentLanguage,
      userLevel: level,
    });
  }, [speak, currentLanguage]);

  // Speak multiple sentences
  const speakSentences = useCallback(async (
    sentences: string[],
    speechOptions: {
      language?: SpeechLanguage;
      userLevel?: UserLevel;
      pauseBetween?: number;
    } = {}
  ): Promise<string[]> => {
    if (!isInitialized) {
      throw new Error('TTS not initialized');
    }

    clearError();
    
    return ttsService.current.speakSentences(sentences, {
      language: speechOptions.language || currentLanguage,
      userLevel: speechOptions.userLevel || currentUserLevel,
      ...speechOptions,
    });
  }, [isInitialized, currentLanguage, currentUserLevel]);

  // Control functions
  const pause = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;
    await ttsService.current.pause();
  }, [isInitialized]);

  const resume = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;
    await ttsService.current.resume();
  }, [isInitialized]);

  const stop = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;
    await ttsService.current.stop();
  }, [isInitialized]);

  const clearQueue = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;
    await ttsService.current.clearQueue();
  }, [isInitialized]);

  // Voice management
  const getVoicesForLanguage = useCallback(async (lang: SpeechLanguage): Promise<TTSVoice[]> => {
    if (!isInitialized) return [];
    return ttsService.current.getVoicesForLanguage(lang);
  }, [isInitialized]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setLanguage = useCallback((lang: SpeechLanguage) => {
    setCurrentLanguage(lang);
  }, []);

  const setUserLevel = useCallback((level: UserLevel) => {
    setCurrentUserLevel(level);
  }, []);

  // Effects
  useEffect(() => {
    mounted.current = true;
    
    if (autoInitialize) {
      initialize();
    }

    return () => {
      mounted.current = false;
      stopStateUpdates();
    };
  }, [autoInitialize, initialize, stopStateUpdates]);

  // Handle app state changes for interruptions
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background - handle potential interruptions
        if (state.isSpeaking) {
          ttsService.current.handleInterruption().catch(console.error);
        }
      } else if (nextAppState === 'active') {
        // App coming to foreground - resume if needed
        if (state.isPaused) {
          setTimeout(() => {
            ttsService.current.resumeAfterInterruption().catch(console.error);
          }, 100);
        }
      }
    };

    appStateListener.current = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (appStateListener.current) {
        appStateListener.current.remove();
      }
    };
  }, [state.isSpeaking, state.isPaused]);

  // Update language when prop changes
  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  // Update user level when prop changes
  useEffect(() => {
    setCurrentUserLevel(userLevel);
  }, [userLevel]);

  return {
    // State
    isAvailable: state.isAvailable,
    isSpeaking: state.isSpeaking,
    isPaused: state.isPaused,
    currentUtterance: state.currentUtterance,
    queueLength: state.queueLength,
    availableVoices: state.availableVoices,
    error,
    isInitialized,
    
    // Actions
    speak,
    speakForLevel,
    speakSentences,
    pause,
    resume,
    stop,
    clearQueue,
    initialize,
    
    // Voice management
    getVoicesForLanguage,
    
    // Utility
    clearError,
    setLanguage,
    setUserLevel,
  };
};
