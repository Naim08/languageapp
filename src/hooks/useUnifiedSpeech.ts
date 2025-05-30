import { useState, useEffect, useCallback, useRef } from 'react';
import UnifiedSpeechService from '@/services/speech/UnifiedSpeechService';
import {
  SpeechRecognitionError,
  SpeechLanguage,
  SpeechRecognitionEngine,
  WhisperModel,
} from '@/services/speech/types';

interface UseUnifiedSpeechOptions {
  language?: SpeechLanguage;
  engine?: SpeechRecognitionEngine;
  whisperModel?: WhisperModel;
  autoStart?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: SpeechRecognitionError) => void;
  onEngineSwitch?: (engine: SpeechRecognitionEngine) => void;
}

interface UseUnifiedSpeechReturn {
  // State
  isListening: boolean;
  isAvailable: boolean;
  transcript: string;
  partialTranscript: string;
  error: SpeechRecognitionError | null;
  audioLevel: number;
  currentLanguage: string;
  currentEngine: SpeechRecognitionEngine;
  
  // Actions
  start: (language?: SpeechLanguage) => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
  switchLanguage: (language: SpeechLanguage) => Promise<void>;
  switchEngine: (engine: SpeechRecognitionEngine, whisperModel?: WhisperModel) => Promise<void>;
  clearTranscript: () => void;
  clearError: () => void;
  
  // Whisper specific
  downloadModel: (model: WhisperModel, onProgress?: (progress: number) => void) => Promise<string>;
  getAvailableModels: () => Promise<WhisperModel[]>;
  isModelDownloaded: (model: WhisperModel) => Promise<boolean>;
  getModelInfo: (model: WhisperModel) => any;
  
  // Diagnostics
  runDiagnostics: () => Promise<any>;
  getCapabilities: () => any;
}

export const useUnifiedSpeech = (
  options: UseUnifiedSpeechOptions = {}
): UseUnifiedSpeechReturn => {
  const {
    language = 'en-US',
    engine = 'native',
    whisperModel = 'base',
    autoStart = false,
    onResult,
    onError,
    onEngineSwitch,
  } = options;

  // State
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionError | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentEngine, setCurrentEngine] = useState<SpeechRecognitionEngine>(engine);

  // Refs for stable callbacks
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onEngineSwitchRef = useRef(onEngineSwitch);

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onEngineSwitchRef.current = onEngineSwitch;
  }, [onEngineSwitch]);

  // Initialize service
  useEffect(() => {
    let isMounted = true;

    const initializeService = async () => {
      try {
        console.log('🎯 Initializing unified speech service...');
        const available = await UnifiedSpeechService.initialize(engine, whisperModel);
        
        if (isMounted) {
          setIsAvailable(available);
          setCurrentEngine(UnifiedSpeechService.getCurrentEngine());
          
          if (available && autoStart) {
            await start();
          }
        }
      } catch (err) {
        console.error('Failed to initialize unified speech service:', err);
        if (isMounted) {
          setIsAvailable(false);
        }
      }
    };

    initializeService();

    return () => {
      isMounted = false;
    };
  }, [engine, whisperModel, autoStart]);

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

    UnifiedSpeechService.setCallbacks(callbacks);

    // Cleanup function
    return () => {
      UnifiedSpeechService.setCallbacks({});
    };
  }, []);

  // Update current language and engine when service changes
  useEffect(() => {
    const updateState = () => {
      const serviceState = UnifiedSpeechService.getState();
      setCurrentLanguage(serviceState.currentLanguage as SpeechLanguage);
      setCurrentEngine(serviceState.engine);
    };

    updateState();
  }, [isListening]);

  // Memoized action functions
  const start = useCallback(async (startLanguage?: SpeechLanguage) => {
    try {
      setError(null);
      await UnifiedSpeechService.start(startLanguage || language);
    } catch (err) {
      const speechError: SpeechRecognitionError = {
        code: 'START_ERROR',
        message: err instanceof Error ? err.message : 'Failed to start speech recognition',
        description: 'Unable to start speech recognition. Please check your setup.',
      };
      setError(speechError);
      onErrorRef.current?.(speechError);
    }
  }, [language]);

  const stop = useCallback(async () => {
    try {
      await UnifiedSpeechService.stop();
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, []);

  const cancel = useCallback(async () => {
    try {
      await UnifiedSpeechService.cancel();
      setPartialTranscript('');
      setAudioLevel(0);
    } catch (err) {
      console.error('Error canceling speech recognition:', err);
    }
  }, []);

  const switchLanguage = useCallback(async (newLanguage: SpeechLanguage) => {
    try {
      setError(null);
      await UnifiedSpeechService.switchLanguage(newLanguage);
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

  const switchEngine = useCallback(async (newEngine: SpeechRecognitionEngine, model?: WhisperModel) => {
    try {
      setError(null);
      console.log('🔄 Switching to engine:', newEngine, model ? `with model: ${model}` : '');
      
      const success = await UnifiedSpeechService.switchEngine(newEngine, model);
      
      if (success) {
        setCurrentEngine(newEngine);
        onEngineSwitchRef.current?.(newEngine);
      } else {
        throw new Error(`Failed to switch to ${newEngine} engine`);
      }
    } catch (err) {
      const speechError: SpeechRecognitionError = {
        code: 'ENGINE_SWITCH_ERROR',
        message: err instanceof Error ? err.message : 'Failed to switch engine',
        description: 'Unable to switch speech recognition engine.',
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

  // Whisper-specific functions
  const downloadModel = useCallback(async (model: WhisperModel, onProgress?: (progress: number) => void) => {
    return await UnifiedSpeechService.downloadWhisperModel(model, onProgress);
  }, []);

  const getAvailableModels = useCallback(async () => {
    return await UnifiedSpeechService.getAvailableWhisperModels();
  }, []);

  const isModelDownloaded = useCallback(async (model: WhisperModel) => {
    return await UnifiedSpeechService.isWhisperModelDownloaded(model);
  }, []);

  const getModelInfo = useCallback((model: WhisperModel) => {
    return UnifiedSpeechService.getWhisperModelInfo(model);
  }, []);

  // Diagnostics functions
  const runDiagnostics = useCallback(async () => {
    return await UnifiedSpeechService.runDiagnostics();
  }, []);

  const getCapabilities = useCallback(() => {
    return UnifiedSpeechService.getEngineCapabilities();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      UnifiedSpeechService.cancel().catch(console.error);
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
    currentEngine,
    
    // Actions
    start,
    stop,
    cancel,
    switchLanguage,
    switchEngine,
    clearTranscript,
    clearError,
    
    // Whisper specific
    downloadModel,
    getAvailableModels,
    isModelDownloaded,
    getModelInfo,
    
    // Diagnostics
    runDiagnostics,
    getCapabilities,
  };
};