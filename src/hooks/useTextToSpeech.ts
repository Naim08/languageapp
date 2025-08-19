import { useState, useCallback, useRef, useEffect } from 'react';
import { createAudioPlayer } from 'expo-audio';
import { UnifiedAIService } from '@/services/ai/UnifiedAIService';
import { TTSVoice, UserLevel } from '@/services/speech/types';
import * as FileSystem from 'expo-file-system';
import logger from '@/services/logging/LoggingService';

interface TTSError {
  code: string;
  message: string;
  details?: any;
}

interface UseTextToSpeechOptions {
  language?: string;
  voice?: TTSVoice;
  speed?: number;
  userLevel?: UserLevel;
  provider?: 'openai' | 'gemini' | 'auto';
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: TTSError) => void;
}

interface UseTextToSpeechReturn {
  isAvailable: boolean;
  isSpeaking: boolean;
  error: TTSError | null;
  speak: (text: string, options?: { voice?: TTSVoice; speed?: number }) => Promise<void>;
  stop: () => Promise<void>;
  clearError: () => void;
  getAvailableVoices: () => string[];
}

export const useTextToSpeech = (
  options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn => {
  const {
    voice = 'alloy',
    speed = 1.0,
    userLevel = 'intermediate',
    provider = 'auto',
    onStart,
    onDone,
    onError,
  } = options;

  const [isAvailable] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<TTSError | null>(null);
  
  const playerRef = useRef<any>(null);
  const aiService = useRef(UnifiedAIService.getInstance());

  const handleError = useCallback((ttsError: TTSError) => {
    setError(ttsError);
    setIsSpeaking(false);
    onError?.(ttsError);
  }, [onError]);

  const speak = useCallback(async (text: string, speakOptions?: { voice?: TTSVoice; speed?: number }) => {
    try {
      logger.tts.info('Starting to speak with unified-tts', { text, voice: speakOptions?.voice || voice });
      setError(null);
      setIsSpeaking(true);
      onStart?.();

      // Call the unified TTS service to get audio from OpenAI/Gemini
      const audioData = await aiService.current.textToSpeech({
        text,
        voice: (speakOptions?.voice || voice) as string,
        speed: speakOptions?.speed || speed,
        user_level: userLevel,
        provider,
      });

      logger.tts.debug('Received audio data from unified-tts', {
        size: audioData.byteLength,
        type: 'ArrayBuffer'
      });

      // Stop any existing player
      if (playerRef.current) {
        await playerRef.current.remove();
        playerRef.current = null;
      }

      // Convert ArrayBuffer to base64
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(audioData))
      );
      
      // Save to temporary file
      const fileUri = `${FileSystem.cacheDirectory}tts_audio_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      logger.tts.debug('Audio saved to file', { fileUri });

      // Create audio player with the file using expo-audio
      const player = createAudioPlayer({ uri: fileUri });
      playerRef.current = player;

      // Set up event listeners
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded && status.didJustFinish) {
          logger.tts.info('Playback finished');
          setIsSpeaking(false);
          onDone?.();
          // Clean up the temporary file
          FileSystem.deleteAsync(fileUri).catch(() => {});
        }
      });

      // Play the audio
      player.play();
      logger.tts.info('Playing audio via expo-audio');

    } catch (err) {
      logger.tts.error('TTS Error', err instanceof Error ? err : new Error(String(err)));
      handleError({
        code: 'TTS_ERROR',
        message: err instanceof Error ? err.message : 'Failed to speak text',
        details: err,
      });
    }
  }, [voice, speed, userLevel, provider, onStart, onDone, handleError]);

  const stop = useCallback(async () => {
    try {
      logger.tts.info('Stopping speech');
      
      if (playerRef.current) {
        playerRef.current.pause();
        await playerRef.current.remove();
        playerRef.current = null;
      }
      
      setIsSpeaking(false);
      onDone?.();
    } catch (err) {
      logger.tts.error('TTS Stop Error', err instanceof Error ? err : new Error(String(err)));
      handleError({
        code: 'TTS_STOP_ERROR',
        message: 'Failed to stop speech',
        details: err,
      });
    }
  }, [onDone, handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAvailableVoices = useCallback(() => {
    // Return all available voices from both providers
    return [
      // OpenAI voices
      'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse',
      // Gemini voices (subset for brevity)
      'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede'
    ];
  }, []);

  // Cleanup on unmount with better error handling
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        // First try to stop playback
        try {
          playerRef.current.pause();
        } catch (e) {
          // Ignore pause errors
        }
        
        // Then remove the player
        playerRef.current.remove().catch((error: any) => {
          logger.tts.warn('Failed to remove audio player on cleanup', error);
        });
        
        // Clear reference
        playerRef.current = null;
      }
    };
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