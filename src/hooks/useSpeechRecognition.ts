import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { OpenAIService } from '@/services/ai';
import { ErrorHandlingService } from '@/services/ai/ErrorHandlingService';

interface SpeechRecognitionError {
  code: string;
  message: string;
  details?: any;
}

type SpeechLanguage = string;

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
  requestPermissions: () => Promise<void>;
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

  // Refs
  const openAIService = useRef(OpenAIService.getInstance());
  const errorHandlingService = useRef(ErrorHandlingService.getInstance());
  const audioLevelInterval = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeout = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTime = useRef<number | null>(null);
  
  // Audio recorder from expo-audio
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Initialize audio permissions and availability
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        console.log('🎤 Initializing audio system...');
        
        const { status, granted, canAskAgain } = await AudioModule.requestRecordingPermissionsAsync();
        console.log('🎤 Permission response:', { status, granted, canAskAgain });
        
        if (granted) {
          console.log('✅ Audio permissions granted successfully');
          setIsAvailable(true);
          
          // Configure audio session with more explicit settings
          await AudioModule.setAudioModeAsync({
            allowsRecording: true,
            interruptionMode: 'doNotMix',
            playsInSilentMode: true
          });
          
          console.log('🎙️ Audio session configured for recording');
          
          console.log('✅ Audio recorder configured successfully');
        } else {
          console.error('❌ Microphone permission denied:', { status, canAskAgain });
          setError({
            code: 'PERMISSION_DENIED',
            message: canAskAgain ? 'Microphone permission denied. Please grant permission in Settings.' : 'Microphone permission permanently denied',
            details: { status, canAskAgain }
          });
        }
      } catch (err) {
        console.error('❌ Error initializing audio:', err);
        setError({
          code: 'INITIALIZATION_ERROR',
          message: 'Failed to initialize audio recording',
          details: err,
        });
      }
    };

    initializeAudio();
  }, []);

  const handleError = useCallback((error: SpeechRecognitionError) => {
    setError(error);
    setIsListening(false);
    onError?.(error);
  }, [onError]);

  const start = useCallback(async (startLanguage?: SpeechLanguage) => {
    try {
      console.log('🎤 Starting speech recognition...');
      setError(null);
      setIsListening(true);
      setTranscript('');
      setPartialTranscript('');
      
      if (startLanguage) {
        setCurrentLanguage(startLanguage);
      }
      
      if (!isAvailable) {
        throw new Error('Audio recording not available');
      }

      // Prepare and start recording
      recordingStartTime.current = Date.now();
      
      // Check initial state
      console.log('🎙️ Pre-recording state:', {
        state: audioRecorder.state,
        isRecording: audioRecorder.isRecording,
        uri: audioRecorder.uri,
      });
      
      // Just use the working HIGH_QUALITY preset - iOS Simulator won't work anyway
      console.log('🎙️ Using RecordingPresets.HIGH_QUALITY');
      console.log('⚠️ NOTE: Audio recording does NOT work in iOS Simulator - use physical device');
      await audioRecorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      console.log('🎙️ After prepare state:', {
        state: audioRecorder.state,
        isRecording: audioRecorder.isRecording,
      });
      
      await audioRecorder.record();
      console.log('✅ Audio recording started');
      console.log('🎙️ Recording state:', {
        state: audioRecorder.state,
        isRecording: audioRecorder.isRecording,
      });
      
      // Simulate audio level changes during recording
      audioLevelInterval.current = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.1); // Random level between 0.1-0.9
      }, 100);
      
    } catch (err) {
      console.error('❌ Error starting recording:', err);
      handleError({
        code: 'START_ERROR',
        message: 'Failed to start speech recognition',
        details: err,
      });
    }
  }, [isAvailable, onResult, handleError]);

  const stop = useCallback(async () => {
    try {
      console.log('🛑 Stopping speech recognition...');
      setIsListening(false);
      setAudioLevel(0);
      
      // Clear intervals
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
        audioLevelInterval.current = null;
      }
      
      if (autoStopTimeout.current) {
        clearTimeout(autoStopTimeout.current);
        autoStopTimeout.current = null;
      }
      
      // Stop recording and get the audio file
      console.log('🛑 Stopping recording...');
      console.log('🎙️ Pre-stop state:', {
        state: audioRecorder.state,
        isRecording: audioRecorder.isRecording,
        duration: audioRecorder.duration,
      });
      
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      
      console.log('🎙️ Post-stop state:', {
        state: audioRecorder.state,
        isRecording: audioRecorder.isRecording,
        duration: audioRecorder.duration,
        uri: uri,
      });
      
      if (!uri) {
        console.warn('⚠️ No audio file URI available after recording');
        console.log('🔍 Audio recorder state:', {
          state: audioRecorder.state,
          uri: audioRecorder.uri,
          duration: audioRecorder.duration,
        });
        return;
      }
      
      console.log('📁 Audio file saved at:', uri);
      
      // Get file extension
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'm4a';
      console.log('📄 Audio file extension:', fileExtension);
      
      // Get file info for debugging
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('📊 Audio file info:', fileInfo);
      console.log('🎤 Audio recorder final state:', {
        state: audioRecorder.state,
        uri: audioRecorder.uri,
        duration: audioRecorder.duration,
        isRecording: audioRecorder.isRecording,
        fileExtension: fileExtension,
      });
      
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      // Always copy the file for inspection, even if empty
      const documentsDir = FileSystem.documentDirectory;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const testFileName = `recording-${timestamp}.${fileExtension}`;
      const testFilePath = `${documentsDir}${testFileName}`;
      
      try {
        await FileSystem.copyAsync({
          from: uri,
          to: testFilePath
        });
        console.log('📁 Audio file copied for inspection:', testFilePath);
        console.log('📱 File location:', testFileName);
      } catch (copyError) {
        console.warn('Failed to copy audio file:', copyError);
      }

      // Check if file is too small (likely empty or just headers)
      if (fileInfo.size <= 1024) { // Less than 1KB is likely empty/invalid
        console.warn(`⚠️ Audio file too small: ${fileInfo.size} bytes - likely iOS Simulator limitation`);
        console.log('💡 TIP: The iOS Simulator has known issues with microphone recording.');
        console.log('💡 To test speech recognition:');
        console.log('   1. Run on a physical iOS device');
        console.log('   2. Or use Xcode Device menu → Microphone → Check "Audio Input"');
        console.log('   3. Or test with a pre-recorded audio file');
        
        const fallbackTranscript = `iOS Simulator recording issue (${fileInfo.size}B) - Use physical device or check Xcode → Device → Microphone`;
        setTranscript(fallbackTranscript);
        onResult?.(fallbackTranscript);
        return;
      }
      
      // Convert audio file to base64 for API submission
      console.log('🔄 Converting audio to base64...');
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64Audio || base64Audio.length === 0) {
        console.warn('⚠️ Failed to convert audio to base64 or empty content');
        const fallbackTranscript = `Audio file exists (${fileInfo.size}B) but conversion failed - File saved as: ${testFileName}`;
        setTranscript(fallbackTranscript);
        onResult?.(fallbackTranscript);
        return;
      }
      
      // Additional check: base64 should be reasonable size for audio
      if (base64Audio.length < 100) {
        console.warn(`⚠️ Base64 audio too short: ${base64Audio.length} chars`);
        const fallbackTranscript = `Audio content too short (${base64Audio.length} chars) - File saved as: ${testFileName}`;
        setTranscript(fallbackTranscript);
        onResult?.(fallbackTranscript);
        return;
      }
      
      console.log('📤 Sending audio to Whisper API...');
      console.log('🔍 Audio data info:', {
        base64Length: base64Audio.length,
        language: currentLanguage,
        fileSize: fileInfo.size
      });
      
      // Send to OpenAI Whisper API for transcription
      try {
        const response = await openAIService.current.speechToText({
          audio: base64Audio,
          language: currentLanguage === 'en-US' ? 'en' : currentLanguage?.split('-')[0], // Convert 'en-US' to 'en'
          model: 'whisper-1',
          response_format: 'json'
        });
        
        const transcription = response.text;
        console.log('✅ Transcription received:', transcription);
        
        if (transcription && transcription.trim().length > 0) {
          setTranscript(transcription);
          onResult?.(transcription);
        } else {
          console.warn('⚠️ Empty transcription received');
          setTranscript('');
        }
      } catch (apiError) {
        console.error('🚨 Detailed API error:', apiError);
        
        // For development: show error but don't crash
        const fallbackTranscript = `Audio recorded (${(fileInfo.size / 1024).toFixed(1)}KB) - Transcription failed: ${apiError.message}`;
        setTranscript(fallbackTranscript);
        onResult?.(fallbackTranscript);
        return;
      }
      
      // Clean up the temporary audio file
      try {
        await FileSystem.deleteAsync(uri);
        console.log('🗑️ Temporary audio file deleted');
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete temporary audio file:', deleteError);
      }
      
    } catch (err) {
      console.error('❌ Error stopping recording or transcribing:', err);
      handleError({
        code: 'STOP_ERROR',
        message: 'Failed to stop recording or transcribe audio',
        details: err,
      });
    }
  }, [currentLanguage, onResult, handleError]);

  const cancel = useCallback(async () => {
    try {
      console.log('❌ Canceling speech recognition...');
      setIsListening(false);
      setAudioLevel(0);
      setPartialTranscript('');
      
      // Clear intervals
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
        audioLevelInterval.current = null;
      }
      
      if (autoStopTimeout.current) {
        clearTimeout(autoStopTimeout.current);
        autoStopTimeout.current = null;
      }
      
      // Stop recording without processing
      if (audioRecorder.state === 'recording') {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        
        // Clean up the temporary audio file
        if (uri) {
          try {
            await FileSystem.deleteAsync(uri);
            console.log('🗑️ Temporary audio file deleted after cancel');
          } catch (deleteError) {
            console.warn('⚠️ Failed to delete temporary audio file after cancel:', deleteError);
          }
        }
      }
      
    } catch (err) {
      console.error('❌ Error canceling recording:', err);
    }
  }, []);

  const switchLanguage = useCallback(async (newLanguage: SpeechLanguage) => {
    setCurrentLanguage(newLanguage);
    if (isListening) {
      await cancel();
      await start(newLanguage);
    }
  }, [isListening, cancel, start]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setPartialTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const requestPermissions = useCallback(async () => {
    console.log('Requesting permissions...');
    // Permissions are handled by expo-audio
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
    requestPermissions,
  };
};