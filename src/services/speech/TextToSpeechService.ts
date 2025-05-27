import * as Speech from 'expo-speech';
import { Platform, AppState, AppStateStatus } from 'react-native';
import VoiceManager from './VoiceManager';
import {
  TTSUtterance,
  TTSError,
  TTSState,
  TTSConfig,
  TTSCallbacks,
  SpeechLanguage,
  UserLevel,
  LevelBasedTTSConfig,
} from './types';

class TextToSpeechService {
  private static instance: TextToSpeechService;
  private state: TTSState;
  private config: TTSConfig;
  private levelConfig: LevelBasedTTSConfig;
  private callbacks: TTSCallbacks;
  private voiceManager: VoiceManager;
  private utteranceQueue: TTSUtterance[] = [];
  private currentUtteranceId: string | null = null;
  private isProcessingQueue: boolean = false;
  private appStateSubscription: any = null;
  private wasPlayingBeforeBackground: boolean = false;

  private constructor() {
    this.state = {
      isAvailable: false,
      isSpeaking: false,
      isPaused: false,
      currentUtterance: null,
      queueLength: 0,
      availableVoices: [],
    };

    this.config = {
      defaultRate: 1.0,
      defaultPitch: 1.0,
      defaultVolume: 1.0,
      queueMode: 'add',
      autoLanguageDetection: true,
    };

    this.levelConfig = {
      rate: {
        beginner: 0.8,
        intermediate: 1.0,
        advanced: 1.2,
      },
      pitch: {
        beginner: 1.0,
        intermediate: 1.0,
        advanced: 1.0,
      },
      volume: {
        beginner: 1.0,
        intermediate: 1.0,
        advanced: 1.0,
      },
  };
    this.callbacks = {};
    this.voiceManager = VoiceManager.getInstance();
    
    // Set up app state listener for background handling
    this.setupAppStateListener();
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background
      if (this.state.isSpeaking) {
        this.wasPlayingBeforeBackground = true;
        this.pause().catch(console.error);
      }
    } else if (nextAppState === 'active') {
      // App is coming to foreground
      if (this.wasPlayingBeforeBackground && this.state.isPaused) {
        this.wasPlayingBeforeBackground = false;
        // Resume after a short delay to ensure audio system is ready
        setTimeout(() => {
          this.resume().catch(console.error);
        }, 100);
      }
    }
  };

  static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if TTS is available
      this.state.isAvailable = await Speech.isSpeakingAsync().then(() => true).catch(() => false);
      
      if (this.state.isAvailable) {
        // Load available voices
        this.state.availableVoices = await this.voiceManager.loadAvailableVoices();
      }
      
      return this.state.isAvailable;
    } catch (error) {
      console.error('TTS initialization error:', error);
      this.state.isAvailable = false;
      return false;
    }
  }

  setCallbacks(callbacks: TTSCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  setConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setLevelConfig(levelConfig: Partial<LevelBasedTTSConfig>): void {
    this.levelConfig = { ...this.levelConfig, ...levelConfig };
  }

  async speak(
    text: string,
    options: {
      language?: SpeechLanguage;
      userLevel?: UserLevel;
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: string;
      onStart?: () => void;
      onDone?: () => void;
      onError?: (error: TTSError) => void;
    } = {}
  ): Promise<string> {
    if (!this.state.isAvailable) {
      throw new Error('Text-to-Speech is not available on this device');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (text.length > Speech.maxSpeechInputLength) {
      throw new Error(`Text is too long. Maximum length is ${Speech.maxSpeechInputLength} characters`);
    }

    const utteranceId = this.generateUtteranceId();
    const language = options.language || 'en-US';
    const userLevel = options.userLevel || 'intermediate';

    // Get level-based speech rate if not explicitly provided
    const rate = options.rate ?? this.levelConfig.rate[userLevel];
    const pitch = options.pitch ?? this.levelConfig.pitch[userLevel];
    const volume = options.volume ?? this.levelConfig.volume[userLevel];

    // Get the best voice for the language
    let voice = options.voice;
    if (!voice && this.config.autoLanguageDetection) {
      voice = await this.voiceManager.getBestVoiceForLanguage(language);
    }

    const utterance: TTSUtterance = {
      id: utteranceId,
      text,
      language,
      rate,
      pitch,
      volume,
      voice,
      onStart: options.onStart,
      onDone: options.onDone,
      onError: options.onError,
    };

    if (this.config.queueMode === 'replace') {
      await this.stop();
      this.utteranceQueue = [];
    }

    this.utteranceQueue.push(utterance);
    this.state.queueLength = this.utteranceQueue.length;

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }

    return utteranceId;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.utteranceQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.utteranceQueue.length > 0) {
      const utterance = this.utteranceQueue.shift();
      if (!utterance) break;

      this.state.currentUtterance = utterance;
      this.state.queueLength = this.utteranceQueue.length;
      
      try {
        await this.speakUtterance(utterance);
      } catch (error) {
        console.error('Error speaking utterance:', error);
        const ttsError: TTSError = {
          code: 'SPEECH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown TTS error',
          utteranceId: utterance.id,
        };
        utterance.onError?.(ttsError);
        this.callbacks.onError?.(ttsError);
      }
    }

    this.isProcessingQueue = false;
    this.state.currentUtterance = null;
  }

  private async speakUtterance(utterance: TTSUtterance): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentUtteranceId = utterance.id;
      
      const speechOptions: any = {
        language: utterance.language,
        pitch: utterance.pitch,
        rate: utterance.rate,
        volume: utterance.volume,
        onStart: () => {
          this.state.isSpeaking = true;
          this.state.isPaused = false;
          utterance.onStart?.();
          this.callbacks.onStart?.(utterance.id);
        },
        onDone: () => {
          this.state.isSpeaking = false;
          this.state.isPaused = false;
          this.currentUtteranceId = null;
          utterance.onDone?.();
          this.callbacks.onDone?.(utterance.id);
          resolve();
        },
        onError: (error: any) => {
          this.state.isSpeaking = false;
          this.state.isPaused = false;
          this.currentUtteranceId = null;
          
          const ttsError: TTSError = {
            code: error.code || 'SPEECH_ERROR',
            message: error.message || 'Speech synthesis failed',
            utteranceId: utterance.id,
          };
          
          utterance.onError?.(ttsError);
          this.callbacks.onError?.(ttsError);
          reject(error);
        },
      };

      // Add voice if available
      if (utterance.voice) {
        speechOptions.voice = utterance.voice;
      }

      // Platform-specific options
      if (Platform.OS === 'ios') {
        speechOptions.iosVoiceId = utterance.voice;
      } else if (Platform.OS === 'android') {
        speechOptions.androidParams = {
          KEY_PARAM_PAN: 0,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        };
      }

      Speech.speak(utterance.text, speechOptions);
    });
  }

  async pause(): Promise<void> {
    if (!this.state.isSpeaking) {
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        await Speech.pause();
        this.state.isPaused = true;
        
        if (this.currentUtteranceId) {
          this.callbacks.onPause?.(this.currentUtteranceId);
        }
      } else {
        // Android doesn't support pause, so we stop instead
        await this.stop();
      }
    } catch (error) {
      console.error('Error pausing speech:', error);
      throw error;
    }
  }

  async resume(): Promise<void> {
    if (!this.state.isPaused) {
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        await Speech.resume();
        this.state.isPaused = false;
        
        if (this.currentUtteranceId) {
          this.callbacks.onResume?.(this.currentUtteranceId);
        }
      }
    } catch (error) {
      console.error('Error resuming speech:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      // Clear the queue first to prevent new utterances from starting
      this.utteranceQueue = [];
      this.state.queueLength = 0;
      this.isProcessingQueue = false;
      
      await Speech.stop();
      
      if (this.currentUtteranceId) {
        this.callbacks.onStop?.(this.currentUtteranceId);
      }
      
      this.state.isSpeaking = false;
      this.state.isPaused = false;
      this.state.currentUtterance = null;
      this.currentUtteranceId = null;
    } catch (error) {
      console.error('Error stopping speech:', error);
      // Force reset state even if stop() fails
      this.state.isSpeaking = false;
      this.state.isPaused = false;
      this.state.currentUtterance = null;
      this.currentUtteranceId = null;
      throw error;
    }
  }

  async clearQueue(): Promise<void> {
    // Stop current speech first
    if (this.state.isSpeaking) {
      await this.stop();
    }
    
    // Clear the queue
    this.utteranceQueue = [];
    this.state.queueLength = 0;
    this.isProcessingQueue = false;
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      return this.state.isSpeaking;
    }
  }

  getState(): TTSState {
    return { ...this.state };
  }

  getConfig(): TTSConfig {
    return { ...this.config };
  }

  getLevelConfig(): LevelBasedTTSConfig {
    return { ...this.levelConfig };
  }

  async getAvailableVoices(): Promise<any[]> {
    return this.state.availableVoices;
  }

  async getVoicesForLanguage(language: SpeechLanguage): Promise<any[]> {
    return this.voiceManager.getVoicesForLanguage(language);
  }

  private generateUtteranceId(): string {
    return `utterance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility method to speak with level-based configuration
  async speakForLevel(
    text: string,
    userLevel: UserLevel,
    language: SpeechLanguage = 'en-US',
    options: Partial<{
      onStart: () => void;
      onDone: () => void;
      onError: (error: TTSError) => void;
    }> = {}
  ): Promise<string> {
    return this.speak(text, {
      language,
      userLevel,
      ...options,
    });
  }

  // Method to speak multiple sentences with pauses
  async speakSentences(
    sentences: string[],
    options: {
      language?: SpeechLanguage;
      userLevel?: UserLevel;
      pauseBetween?: number; // milliseconds
      onSentenceStart?: (index: number, sentence: string) => void;
      onSentenceDone?: (index: number, sentence: string) => void;
      onAllDone?: () => void;
      onError?: (error: TTSError) => void;
    } = {}
  ): Promise<string[]> {
    const utteranceIds: string[] = [];
    const { pauseBetween = 500, onSentenceStart, onSentenceDone, onAllDone, onError, ...speechOptions } = options;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      try {
        const utteranceId = await this.speak(sentence, {
          ...speechOptions,
          onStart: () => onSentenceStart?.(i, sentence),
          onDone: () => {
            onSentenceDone?.(i, sentence);
            if (i === sentences.length - 1) {
              onAllDone?.();
            }
          },
          onError,
        });
        
        utteranceIds.push(utteranceId);
        
        // Add pause between sentences (except for the last one)
        if (i < sentences.length - 1 && pauseBetween > 0) {
          await new Promise(resolve => setTimeout(resolve, pauseBetween));
        }
      } catch (error) {
        console.error(`Error speaking sentence ${i}:`, error);
        const ttsError: TTSError = {
          code: 'SENTENCE_ERROR',
          message: `Failed to speak sentence ${i + 1}`,
        };
        onError?.(ttsError);
      }
    }

    return utteranceIds;
  }

  // Voice-related methods
  async getBestVoiceForLanguage(language: SpeechLanguage): Promise<string | undefined> {
    return this.voiceManager.getBestVoiceForLanguage(language);
  }

  // Method to handle interruptions (like phone calls)
  async handleInterruption(): Promise<void> {
    if (this.state.isSpeaking) {
      this.wasPlayingBeforeBackground = true;
      await this.pause();
    }
  }

  async resumeAfterInterruption(): Promise<void> {
    if (this.wasPlayingBeforeBackground && this.state.isPaused) {
      this.wasPlayingBeforeBackground = false;
      await this.resume();
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.clearQueue().catch(console.error);
    
    // Reset all state
    this.state = {
      isAvailable: false,
      isSpeaking: false,
      isPaused: false,
      currentUtterance: null,
      queueLength: 0,
      availableVoices: [],
    };
    
    this.callbacks = {};
  }
}

export default TextToSpeechService;
