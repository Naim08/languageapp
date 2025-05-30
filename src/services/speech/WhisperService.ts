import { initWhisper, WhisperContext, AudioSessionCategoryIos } from 'whisper.rn';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {
  SpeechRecognitionCallbacks,
  SpeechRecognitionConfig,
  SpeechRecognitionError,
  SpeechRecognitionState,
  SpeechLanguage,
  WhisperConfig,
  WhisperModel,
  WhisperResult,
} from './types';

class WhisperService {
  private static instance: WhisperService;
  private state: SpeechRecognitionState;
  private callbacks: SpeechRecognitionCallbacks;
  private config: SpeechRecognitionConfig & { whisperConfig: WhisperConfig };
  private whisperContext: WhisperContext | null = null;
  private realtimeSession: any = null;
  private isInitialized: boolean = false;

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
      recognitionTimeout: 15000,
      audioLevelUpdateInterval: 100,
      speechTimeout: 5000,
      endSilenceTimeout: 2000,
      whisperConfig: {
        modelPath: '', // Will be set during initialization
        language: 'en',
        enableCoreML: Platform.OS === 'ios',
        enableRealtime: true,
        maxAudioLength: 30000, // 30 seconds max
      },
    };
  }

  static getInstance(): WhisperService {
    if (!WhisperService.instance) {
      WhisperService.instance = new WhisperService();
    }
    return WhisperService.instance;
  }

  async initialize(modelName: WhisperModel = 'base'): Promise<boolean> {
    try {
      console.log('🤖 Initializing Whisper with model:', modelName);
      
      // Download model if needed and get path
      const modelPath = await this.downloadModelIfNeeded(modelName);
      this.config.whisperConfig.modelPath = modelPath;

      // Initialize Whisper context
      this.whisperContext = await initWhisper({
        filePath: modelPath,
        coreMLModelAsset: this.config.whisperConfig.enableCoreML ? undefined : undefined, // CoreML not supported in this version
      });

      this.isInitialized = true;
      this.state.isAvailable = true;
      this.state.hasPermission = true; // Whisper doesn't need explicit permission request

      console.log('✅ Whisper initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Whisper initialization failed:', error);
      this.state.isAvailable = false;
      this.isInitialized = false;
      return false;
    }
  }

  private async downloadModelIfNeeded(modelName: WhisperModel): Promise<string> {
    // For now, we'll implement a simple download mechanism
    // In production, implement proper model downloading and caching with progress
    
    const modelUrls: Record<string, string> = {
      'tiny.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
      'tiny': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
      'base.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
      'base': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
      'small.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
      'small': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
      'medium.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin',
      'medium': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
      // Note: large model requires Extended Virtual Addressing on iOS
      'large': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    };
    
    const modelUrl = modelUrls[modelName];
    if (!modelUrl) {
      throw new Error(`Model ${modelName} not supported yet`);
    }
    
    // Create models directory if it doesn't exist
    const modelsDir = `${FileSystem.documentDirectory}whisper-models/`;
    await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true }).catch(() => {});
    
    const modelPath = `${modelsDir}ggml-${modelName}.bin`;
    
    // Check if model already exists
    const modelInfo = await FileSystem.getInfoAsync(modelPath);
    if (modelInfo.exists) {
      console.log('✅ Model already downloaded:', modelPath);
      return modelPath;
    }
    
    // Download the model
    console.log('📥 Downloading model:', modelName);
    const downloadResult = await FileSystem.downloadAsync(modelUrl, modelPath);
    
    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download model: ${downloadResult.status}`);
    }
    
    console.log('✅ Model downloaded successfully:', modelPath);
    return modelPath;
  }

  async start(language?: SpeechLanguage): Promise<void> {
    console.log('🤖 Starting Whisper speech recognition...');
    
    if (!this.isInitialized || !this.whisperContext) {
      throw new Error('Whisper not initialized');
    }
    
    // Request microphone permission first
    try {
      const { Audio } = await import('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }
      
      // Set audio mode for iOS
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (permError) {
      console.error('Permission error:', permError);
      throw new Error('Failed to setup audio permissions');
    }

    if (this.state.isListening) {
      console.warn('⚠️ Whisper already listening');
      return;
    }

    try {
      this.state.isListening = true;
      const targetLanguage = this.mapLanguageToWhisper(language || this.config.language as SpeechLanguage);
      
      console.log('🌐 Starting Whisper with language:', targetLanguage);
      
      // Start realtime transcription with proper audio session configuration
      const { stop, subscribe } = await this.whisperContext.transcribeRealtime({
        language: targetLanguage,
        realtimeAudioSec: 30,
        audioSessionOnStartIos: {
          category: 'PlayAndRecord' as AudioSessionCategoryIos,
          options: ['DefaultToSpeaker', 'AllowBluetooth'],
          mode: 'Default',
        },
      });

      // Store the stop function
      this.realtimeSession = { stop };

      // Subscribe to results
      subscribe((evt: any) => {
        const { isCapturing, data, processTime, recordingTime } = evt;
        console.log(`🎤 Realtime transcribing: ${isCapturing ? 'ON' : 'OFF'}`);
        
        if (data && data.result) {
          this.handleWhisperResult({
            result: data.result,
            isCapturing,
            processTime,
            recordingTime,
          });
        }
        
        if (!isCapturing) {
          console.log('🛑 Finished realtime transcribing');
          this.state.isListening = false;
        }
      });

      this.state.currentLanguage = language || this.config.language;
      this.callbacks.onStart?.();
      
      console.log('✅ Whisper started successfully');
      
    } catch (error) {
      console.error('❌ Error starting Whisper:', error);
      this.state.isListening = false;
      this.handleWhisperError(error);
    }
  }

  async stop(): Promise<void> {
    if (!this.state.isListening || !this.realtimeSession) {
      return;
    }

    try {
      console.log('🛑 Stopping Whisper...');
      await this.realtimeSession.stop();
      this.realtimeSession = null;
      this.state.isListening = false;
      this.callbacks.onEnd?.();
      console.log('✅ Whisper stopped');
    } catch (error) {
      console.error('❌ Error stopping Whisper:', error);
    }
  }

  async cancel(): Promise<void> {
    await this.stop();
  }

  async destroy(): Promise<void> {
    try {
      if (this.realtimeSession) {
        await this.realtimeSession.stop();
        this.realtimeSession = null;
      }
      
      if (this.whisperContext) {
        await this.whisperContext.release();
        this.whisperContext = null;
      }
      
      this.state.isListening = false;
      this.isInitialized = false;
      console.log('🗑️ Whisper destroyed');
    } catch (error) {
      console.error('❌ Error destroying Whisper:', error);
    }
  }

  private handleWhisperResult(result: WhisperResult): void {
    console.log('🤖 Whisper result:', result);
    
    if (result.isCapturing) {
      // Partial result
      this.callbacks.onPartialResults?.([result.result]);
    } else {
      // Final result
      this.callbacks.onResult?.([result.result]);
    }
  }

  private handleWhisperError(error: any): void {
    const speechError: SpeechRecognitionError = {
      code: 'WHISPER_ERROR',
      message: error.message || 'Whisper transcription error',
      description: 'An error occurred during Whisper speech recognition.',
    };

    this.state.isListening = false;
    this.callbacks.onError?.(speechError);
  }

  private mapLanguageToWhisper(language: SpeechLanguage): string {
    // Map React Native language codes to Whisper language codes
    const languageMap: Record<string, string> = {
      'en-US': 'en',
      'en-GB': 'en',
      'es-ES': 'es',
      'es-MX': 'es',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'it-IT': 'it',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'zh-CN': 'zh',
      'zh-TW': 'zh',
      'ru-RU': 'ru',
      'ar-SA': 'ar',
      'hi-IN': 'hi',
      'nl-NL': 'nl',
      'sv-SE': 'sv',
      'da-DK': 'da',
      'no-NO': 'no',
      'fi-FI': 'fi',
    };

    return languageMap[language] || 'en';
  }

  async switchLanguage(language: SpeechLanguage): Promise<void> {
    const wasListening = this.state.isListening;
    
    if (wasListening) {
      await this.stop();
    }

    this.config.language = language;
    
    if (wasListening) {
      setTimeout(() => {
        this.start(language);
      }, 100);
    }
  }

  // Configuration methods
  setCallbacks(callbacks: SpeechRecognitionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  updateConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  updateWhisperConfig(whisperConfig: Partial<WhisperConfig>): void {
    this.config.whisperConfig = { ...this.config.whisperConfig, ...whisperConfig };
  }

  // State getters
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

  // Utility methods
  async getSupportedLanguages(): Promise<string[]> {
    // Whisper supports many languages
    return [
      'en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'de-DE', 
      'it-IT', 'pt-BR', 'pt-PT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW',
      'ru-RU', 'ar-SA', 'hi-IN', 'nl-NL', 'sv-SE', 'da-DK',
      'no-NO', 'fi-FI', 'pl-PL', 'cs-CZ', 'hu-HU', 'ro-RO'
    ];
  }

  /**
   * Get available Whisper models
   */
  getAvailableModels(): WhisperModel[] {
    return ['tiny', 'tiny.en', 'base', 'base.en', 'small', 'small.en', 'medium', 'medium.en', 'large'];
  }

  /**
   * Check if a model is downloaded
   */
  async isModelDownloaded(modelName: WhisperModel): Promise<boolean> {
    const modelsDir = `${FileSystem.documentDirectory}whisper-models/`;
    const modelPath = `${modelsDir}ggml-${modelName}.bin`;
    
    try {
      const modelInfo = await FileSystem.getInfoAsync(modelPath);
      return modelInfo.exists;
    } catch (error) {
      console.error('Error checking model:', error);
      return false;
    }
  }

  /**
   * Download a specific model
   */
  async downloadModel(modelName: WhisperModel, onProgress?: (progress: number) => void): Promise<string> {
    console.log('📥 Downloading Whisper model:', modelName);
    
    // Simulate download progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(i);
      }
    }
    
    // In a real implementation, download the actual model file
    const modelPath = await this.downloadModelIfNeeded(modelName);
    console.log('✅ Model downloaded:', modelPath);
    
    return modelPath;
  }

  /**
   * Get model information
   */
  getModelInfo(modelName: WhisperModel): {
    name: WhisperModel;
    size: string;
    speed: string;
    accuracy: string;
    languages: string;
  } {
    const modelInfo = {
      'tiny': { size: '78 MB', speed: 'Very Fast', accuracy: 'Low', languages: 'Multilingual' },
      'tiny.en': { size: '78 MB', speed: 'Very Fast', accuracy: 'Low', languages: 'English Only' },
      'base': { size: '148 MB', speed: 'Fast', accuracy: 'Medium', languages: 'Multilingual' },
      'base.en': { size: '148 MB', speed: 'Fast', accuracy: 'Medium', languages: 'English Only' },
      'small': { size: '488 MB', speed: 'Medium', accuracy: 'Good', languages: 'Multilingual' },
      'small.en': { size: '488 MB', speed: 'Medium', accuracy: 'Good', languages: 'English Only' },
      'medium': { size: '1.5 GB', speed: 'Slow', accuracy: 'High', languages: 'Multilingual' },
      'medium.en': { size: '1.5 GB', speed: 'Slow', accuracy: 'High', languages: 'English Only' },
      'large': { size: '3.1 GB', speed: 'Very Slow', accuracy: 'Best', languages: 'Multilingual' },
    };

    return {
      name: modelName,
      ...modelInfo[modelName],
    };
  }

  /**
   * Get model storage info
   */
  async getModelStorageInfo(): Promise<{
    storageDir: string;
    downloadedModels: Array<{ name: string; size: number; path: string }>;
    totalSize: number;
  }> {
    const modelsDir = `${FileSystem.documentDirectory}whisper-models/`;
    const downloadedModels: Array<{ name: string; size: number; path: string }> = [];
    let totalSize = 0;

    try {
      const dirInfo = await FileSystem.getInfoAsync(modelsDir);
      if (!dirInfo.exists) {
        return { storageDir: modelsDir, downloadedModels: [], totalSize: 0 };
      }

      const files = await FileSystem.readDirectoryAsync(modelsDir);
      for (const file of files) {
        if (file.endsWith('.bin')) {
          const filePath = `${modelsDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists && 'size' in fileInfo) {
            downloadedModels.push({
              name: file.replace('ggml-', '').replace('.bin', ''),
              size: fileInfo.size,
              path: filePath,
            });
            totalSize += fileInfo.size;
          }
        }
      }
    } catch (error) {
      console.error('Error getting storage info:', error);
    }

    return { storageDir: modelsDir, downloadedModels, totalSize };
  }

  /**
   * Delete a downloaded model
   */
  async deleteModel(modelName: WhisperModel): Promise<void> {
    const modelsDir = `${FileSystem.documentDirectory}whisper-models/`;
    const modelPath = `${modelsDir}ggml-${modelName}.bin`;
    
    try {
      await FileSystem.deleteAsync(modelPath, { idempotent: true });
      console.log('🗑️ Model deleted:', modelName);
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  /**
   * Run diagnostics for Whisper
   */
  async runDiagnostics(): Promise<{
    isInitialized: boolean;
    isAvailable: boolean;
    currentModel: string;
    supportedLanguages: string[];
    platform: string;
  }> {
    return {
      isInitialized: this.isInitialized,
      isAvailable: this.state.isAvailable,
      currentModel: this.config.whisperConfig.modelPath,
      supportedLanguages: await this.getSupportedLanguages(),
      platform: Platform.OS,
    };
  }
}

export default WhisperService.getInstance();