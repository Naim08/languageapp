import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';
import {
  SpeechRecognitionCallbacks,
  SpeechRecognitionConfig,
  SpeechRecognitionError,
  SpeechRecognitionState,
  RetryConfig,
  SpeechLanguage,
  SpeechRecognitionPermission,
} from './types';

class SpeechRecognitionService {
  private static instance: SpeechRecognitionService;
  private state: SpeechRecognitionState;
  private callbacks: SpeechRecognitionCallbacks;
  private config: SpeechRecognitionConfig;
  private retryConfig: RetryConfig;
  private retryCount: number = 0;
  private audioLevelTimer?: NodeJS.Timeout;
  private lastVolumeUpdate: number = 0;

  private constructor() {
    this.state = {
      isListening: false,
      isAvailable: false,
      hasPermission: false,
      currentLanguage: 'en-US',
      audioLevel: 0,
    };

    this.callbacks = {};
    
    this.config = {
      language: 'en-US',
      maxResults: 5,
      partialResults: true,
      continuousRecognition: false,
      recognitionTimeout: 30000,
      audioLevelUpdateInterval: 100,
    };

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      backoffFactor: 2,
    };

    this.initializeVoiceEvents();
  }

  static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService();
    }
    return SpeechRecognitionService.instance;
  }

  private initializeVoiceEvents(): void {
    Voice.onSpeechStart = this.handleSpeechStart.bind(this);
    Voice.onSpeechEnd = this.handleSpeechEnd.bind(this);
    Voice.onSpeechResults = this.handleSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.handleSpeechPartialResults.bind(this);
    Voice.onSpeechError = this.handleSpeechError.bind(this);
    Voice.onSpeechVolumeChanged = this.handleVolumeChanged.bind(this);
    Voice.onSpeechRecognized = this.handleSpeechRecognized.bind(this);
  }

  async initialize(): Promise<boolean> {
    try {
      const isAvailable = await Voice.isAvailable();
      this.state.isAvailable = !!isAvailable;
      
      if (this.state.isAvailable) {
        await this.checkPermissions();
      }
      
      return this.state.isAvailable;
    } catch (error) {
      console.error('Speech recognition initialization error:', error);
      this.state.isAvailable = false;
      return false;
    }
  }

  private async checkPermissions(): Promise<void> {
    try {
      // On iOS, permissions are handled by the system when Voice.start() is called
      // On Android, we can check if recording permission is available
      this.state.hasPermission = true;
    } catch (error) {
      console.error('Permission check error:', error);
      this.state.hasPermission = false;
    }
  }

  async start(language?: SpeechLanguage): Promise<void> {
    if (!this.state.isAvailable) {
      throw new Error('Speech recognition not available');
    }

    if (this.state.isListening) {
      console.warn('Speech recognition already running');
      return;
    }

    try {
      this.retryCount = 0;
      const targetLanguage = language || this.config.language;
      
      await Voice.start(targetLanguage);
      this.state.currentLanguage = targetLanguage;
      this.startAudioLevelMonitoring();
      
    } catch (error) {
      await this.handleStartError(error, language);
    }
  }

  private async handleStartError(error: any, language?: SpeechLanguage): Promise<void> {
    const speechError: SpeechRecognitionError = {
      code: error.code || 'START_ERROR',
      message: error.message || 'Failed to start speech recognition',
      description: this.getErrorDescription(error.code),
    };

    if (this.shouldRetry(speechError)) {
      await this.retryStart(language);
    } else {
      this.callbacks.onError?.(speechError);
    }
  }

  private shouldRetry(error: SpeechRecognitionError): boolean {
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'];
    return (
      this.retryCount < this.retryConfig.maxRetries &&
      retryableErrors.some(code => error.code.includes(code))
    );
  }

  private async retryStart(language?: SpeechLanguage): Promise<void> {
    this.retryCount++;
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, this.retryCount - 1),
      this.retryConfig.maxDelay
    );

    setTimeout(async () => {
      try {
        await this.start(language);
      } catch (retryError) {
        console.error(`Retry ${this.retryCount} failed:`, retryError);
      }
    }, delay);
  }

  async stop(): Promise<void> {
    if (!this.state.isListening) {
      return;
    }

    try {
      await Voice.stop();
      this.stopAudioLevelMonitoring();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      this.callbacks.onError?.({
        code: 'STOP_ERROR',
        message: 'Failed to stop speech recognition',
        description: 'An error occurred while stopping the speech recognition service',
      });
    }
  }

  async cancel(): Promise<void> {
    if (!this.state.isListening) {
      return;
    }

    try {
      await Voice.cancel();
      this.stopAudioLevelMonitoring();
    } catch (error) {
      console.error('Error canceling speech recognition:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      this.stopAudioLevelMonitoring();
      await Voice.destroy();
      Voice.removeAllListeners();
      this.state.isListening = false;
    } catch (error) {
      console.error('Error destroying speech recognition:', error);
    }
  }

  async switchLanguage(language: SpeechLanguage): Promise<void> {
    const wasListening = this.state.isListening;
    
    if (wasListening) {
      await this.stop();
    }

    this.config.language = language;
    
    if (wasListening) {
      // Small delay to ensure clean transition
      setTimeout(() => {
        this.start(language);
      }, 100);
    }
  }

  /**
   * Set the language for speech recognition
   * @param language The language code to use
   */
  setLanguage(language: SpeechLanguage): void {
    this.config.language = language;
    if (!this.state.isListening) {
      this.state.currentLanguage = language;
    }
  }

  /**
   * Get the current language being used
   */
  getCurrentLanguage(): SpeechLanguage {
    return this.state.currentLanguage as SpeechLanguage;
  }

  /**
   * Check if a specific language is supported
   * @param language The language code to check
   */
  isLanguageSupported(language: string): boolean {
    // This would ideally check against the device's supported languages
    // For now, we'll trust that React Native Voice handles unsupported languages gracefully
    return true;
  }

  /**
   * Get available languages (this is a simplified version)
   * In a real implementation, you might want to query the device for supported languages
   */
  async getAvailableLanguages(): Promise<string[]> {
    try {
      // React Native Voice doesn't provide a direct method to get available languages
      // So we return our predefined list
      const { SUPPORTED_LANGUAGES } = await import('./languages');
      return SUPPORTED_LANGUAGES.map(lang => lang.code);
    } catch (error) {
      console.error('Error getting available languages:', error);
      return ['en-US']; // fallback
    }
  }

  /**
   * Start speech recognition with a specific language
   * @param language The language to use for recognition
   */
  async startWithLanguage(language: SpeechLanguage): Promise<void> {
    if (this.state.isListening) {
      await this.stop();
      // Wait a moment before starting with new language
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.setLanguage(language);
    await this.start(language);
  }

  private startAudioLevelMonitoring(): void {
    if (Platform.OS === 'android') {
      // Android provides native volume events
      return;
    }

    // iOS fallback - simulate audio levels
    this.audioLevelTimer = setInterval(() => {
      if (this.state.isListening) {
        // Simulate varying audio levels when listening
        const simulatedLevel = Math.random() * 50 + 25;
        this.updateAudioLevel(simulatedLevel);
      }
    }, this.config.audioLevelUpdateInterval);
  }

  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelTimer) {
      clearInterval(this.audioLevelTimer);
      this.audioLevelTimer = undefined;
    }
    this.updateAudioLevel(0);
  }

  private updateAudioLevel(level: number): void {
    const normalizedLevel = Math.max(0, Math.min(100, level));
    this.state.audioLevel = normalizedLevel;
    
    const now = Date.now();
    if (now - this.lastVolumeUpdate >= this.config.audioLevelUpdateInterval!) {
      this.callbacks.onVolumeChanged?.(normalizedLevel);
      this.lastVolumeUpdate = now;
    }
  }

  // Event Handlers
  private handleSpeechStart(): void {
    this.state.isListening = true;
    this.callbacks.onStart?.();
  }

  private handleSpeechEnd(): void {
    this.state.isListening = false;
    this.stopAudioLevelMonitoring();
    this.callbacks.onEnd?.();
  }

  private handleSpeechResults(event: any): void {
    const results = event.value || [];
    this.callbacks.onResult?.(results);
  }

  private handleSpeechPartialResults(event: any): void {
    const results = event.value || [];
    this.callbacks.onPartialResults?.(results);
  }

  private handleSpeechError(event: any): void {
    const error: SpeechRecognitionError = {
      code: event.error?.code || 'UNKNOWN_ERROR',
      message: event.error?.message || 'Speech recognition error',
      description: this.getErrorDescription(event.error?.code),
    };

    this.state.isListening = false;
    this.stopAudioLevelMonitoring();
    this.callbacks.onError?.(error);
  }

  private handleSpeechRecognized(): void {
    // Speech was recognized successfully
  }

  private handleVolumeChanged(event: any): void {
    if (Platform.OS === 'android' && event.value !== undefined) {
      // Convert dB to 0-100 range (typical range: -40dB to 0dB)
      const dbValue = event.value;
      const normalizedLevel = Math.max(0, Math.min(100, ((dbValue + 40) / 40) * 100));
      this.updateAudioLevel(normalizedLevel);
    }
  }

  private getErrorDescription(errorCode?: string): string {
    const errorDescriptions: Record<string, string> = {
      'PERMISSION_DENIED': 'Microphone permission was denied. Please enable microphone access in settings.',
      'NETWORK_ERROR': 'Network connection required for speech recognition. Please check your internet connection.',
      'AUDIO_ERROR': 'Audio recording error. Please check your microphone.',
      'SERVER_ERROR': 'Speech recognition service temporarily unavailable. Please try again.',
      'TIMEOUT': 'Speech recognition timed out. Please try speaking again.',
      'NO_MATCH': 'No speech was detected. Please try speaking more clearly.',
      'RECOGNIZER_BUSY': 'Speech recognizer is busy. Please wait and try again.',
      'INSUFFICIENT_PERMISSIONS': 'Insufficient permissions for speech recognition.',
    };

    return errorDescriptions[errorCode || ''] || 'An unknown error occurred during speech recognition.';
  }

  // Public getters
  getState(): SpeechRecognitionState {
    return { ...this.state };
  }

  isListening(): boolean {
    return this.state.isListening;
  }

  isAvailable(): boolean {
    return this.state.isAvailable;
  }

  getCurrentLanguage(): SpeechLanguage {
    return this.state.currentLanguage as SpeechLanguage;
  }

  getAudioLevel(): number {
    return this.state.audioLevel;
  }

  // Configuration methods
  setCallbacks(callbacks: SpeechRecognitionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  updateConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Utility methods
  async getSupportedLanguages(): Promise<string[]> {
    // Return common supported languages
    return [
      'en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'de-DE', 
      'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'
    ];
  }

  async checkPermissionStatus(): Promise<SpeechRecognitionPermission> {
    try {
      // This is a simplified implementation
      // In a real app, you might want to use a permission library
      return {
        granted: this.state.hasPermission,
        canAskAgain: true,
        status: this.state.hasPermission ? 'granted' : 'undetermined',
      };
    } catch (error) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }
}

export default SpeechRecognitionService.getInstance();
