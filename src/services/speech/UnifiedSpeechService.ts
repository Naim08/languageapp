import SpeechRecognitionService from './SpeechRecognitionService';
import WhisperService from './WhisperService';
import {
  SpeechRecognitionCallbacks,
  SpeechRecognitionConfig,
  SpeechRecognitionError,
  SpeechRecognitionState,
  SpeechLanguage,
  SpeechRecognitionEngine,
  EnhancedSpeechRecognitionConfig,
  WhisperModel,
} from './types';

class UnifiedSpeechService {
  private static instance: UnifiedSpeechService;
  private currentEngine: SpeechRecognitionEngine = 'native';
  private config: EnhancedSpeechRecognitionConfig;
  private callbacks: SpeechRecognitionCallbacks = {};

  private constructor() {
    this.config = {
      language: 'en-US',
      maxResults: 5,
      partialResults: true,
      continuousRecognition: false,
      recognitionTimeout: 15000,
      audioLevelUpdateInterval: 100,
      speechTimeout: 5000,
      endSilenceTimeout: 2000,
      engine: 'native',
      fallbackToNative: true,
    };
  }

  static getInstance(): UnifiedSpeechService {
    if (!UnifiedSpeechService.instance) {
      UnifiedSpeechService.instance = new UnifiedSpeechService();
    }
    return UnifiedSpeechService.instance;
  }

  async initialize(engine: SpeechRecognitionEngine = 'native', whisperModel?: WhisperModel): Promise<boolean> {
    console.log('🎯 Initializing unified speech service with engine:', engine);
    
    this.currentEngine = engine;
    this.config.engine = engine;

    try {
      if (engine === 'whisper') {
        const success = await WhisperService.initialize(whisperModel || 'base');
        if (!success && this.config.fallbackToNative) {
          console.log('📱 Falling back to native speech recognition');
          this.currentEngine = 'native';
          return await SpeechRecognitionService.initialize();
        }
        return success;
      } else {
        return await SpeechRecognitionService.initialize();
      }
    } catch (error) {
      console.error('❌ Failed to initialize speech service:', error);
      
      if (this.config.fallbackToNative && engine === 'whisper') {
        console.log('📱 Falling back to native speech recognition');
        this.currentEngine = 'native';
        return await SpeechRecognitionService.initialize();
      }
      
      return false;
    }
  }

  async switchEngine(engine: SpeechRecognitionEngine, whisperModel?: WhisperModel): Promise<boolean> {
    console.log('🔄 Switching speech engine from', this.currentEngine, 'to', engine);
    
    // Stop current engine
    await this.stop();
    
    // Switch to new engine
    const success = await this.initialize(engine, whisperModel);
    
    if (success) {
      // Transfer callbacks to new engine
      this.getCurrentService().setCallbacks(this.callbacks);
    }
    
    return success;
  }

  private getCurrentService() {
    return this.currentEngine === 'whisper' ? WhisperService : SpeechRecognitionService;
  }

  async start(language?: SpeechLanguage): Promise<void> {
    console.log('🚀 Starting unified speech service with engine:', this.currentEngine);
    return await this.getCurrentService().start(language);
  }

  async stop(): Promise<void> {
    return await this.getCurrentService().stop();
  }

  async cancel(): Promise<void> {
    return await this.getCurrentService().cancel();
  }

  async destroy(): Promise<void> {
    await SpeechRecognitionService.destroy();
    await WhisperService.destroy();
  }

  async switchLanguage(language: SpeechLanguage): Promise<void> {
    return await this.getCurrentService().switchLanguage(language);
  }

  // Configuration methods
  setCallbacks(callbacks: SpeechRecognitionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.getCurrentService().setCallbacks(this.callbacks);
  }

  updateConfig(config: Partial<EnhancedSpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.engine && config.engine !== this.currentEngine) {
      // Engine change requested
      this.switchEngine(config.engine);
    } else {
      // Update current engine config
      this.getCurrentService().updateConfig(config);
    }
  }

  // State getters
  getState(): SpeechRecognitionState & { engine: SpeechRecognitionEngine } {
    return {
      ...this.getCurrentService().getState(),
      engine: this.currentEngine,
    };
  }

  isListening(): boolean {
    return this.getCurrentService().isListening();
  }

  isAvailable(): boolean {
    return this.getCurrentService().isAvailable();
  }

  getCurrentLanguage(): SpeechLanguage {
    return this.getCurrentService().getCurrentLanguage();
  }

  getAudioLevel(): number {
    return this.getCurrentService().getAudioLevel();
  }

  getCurrentEngine(): SpeechRecognitionEngine {
    return this.currentEngine;
  }

  // Utility methods
  async getSupportedLanguages(): Promise<string[]> {
    return await this.getCurrentService().getSupportedLanguages();
  }

  // Whisper-specific methods
  async getAvailableWhisperModels(): Promise<WhisperModel[]> {
    return WhisperService.getAvailableModels();
  }

  async isWhisperModelDownloaded(modelName: WhisperModel): Promise<boolean> {
    return await WhisperService.isModelDownloaded(modelName);
  }

  async downloadWhisperModel(modelName: WhisperModel, onProgress?: (progress: number) => void): Promise<string> {
    return await WhisperService.downloadModel(modelName, onProgress);
  }

  getWhisperModelInfo(modelName: WhisperModel) {
    return WhisperService.getModelInfo(modelName);
  }

  // Engine capabilities
  getEngineCapabilities(engine?: SpeechRecognitionEngine) {
    const targetEngine = engine || this.currentEngine;
    
    if (targetEngine === 'whisper') {
      return {
        supportsOffline: true,
        supportsContinuous: true,
        supportsConfidence: false,
        supportsWordTimestamps: true,
        maxLanguages: 50,
        engine: 'whisper' as const,
      };
    } else {
      return {
        supportsOffline: false,
        supportsContinuous: false,
        supportsConfidence: true,
        supportsWordTimestamps: false,
        maxLanguages: 20,
        engine: 'native' as const,
      };
    }
  }

  // Diagnostics
  async runDiagnostics() {
    const nativeDiagnostics = await SpeechRecognitionService.runDiagnostics?.() || {};
    const whisperDiagnostics = await WhisperService.runDiagnostics();
    
    return {
      currentEngine: this.currentEngine,
      config: this.config,
      native: nativeDiagnostics,
      whisper: whisperDiagnostics,
      capabilities: {
        native: this.getEngineCapabilities('native'),
        whisper: this.getEngineCapabilities('whisper'),
      },
    };
  }

  /**
   * Benchmark both engines with a test phrase
   */
  async benchmarkEngines(testPhrase: string = "Hello, this is a test of speech recognition"): Promise<{
    native?: { duration: number; accuracy: number; error?: string };
    whisper?: { duration: number; accuracy: number; error?: string };
  }> {
    const results: any = {};
    
    // Test native engine
    try {
      const startTime = Date.now();
      await this.switchEngine('native');
      
      const nativeResult = await new Promise<string>((resolve, reject) => {
        let finalResult = '';
        
        this.setCallbacks({
          onResult: (results) => {
            finalResult = results[0] || '';
            resolve(finalResult);
          },
          onError: (error) => reject(error),
        });
        
        this.start();
        
        // Simulate speaking the test phrase
        setTimeout(() => {
          this.stop();
          if (!finalResult) {
            resolve(''); // No result
          }
        }, 3000);
      });
      
      const duration = Date.now() - startTime;
      const accuracy = this.calculateAccuracy(testPhrase, nativeResult);
      
      results.native = { duration, accuracy };
    } catch (error) {
      results.native = { duration: 0, accuracy: 0, error: error.message };
    }
    
    // Test Whisper engine
    try {
      const startTime = Date.now();
      await this.switchEngine('whisper', 'base');
      
      const whisperResult = await new Promise<string>((resolve, reject) => {
        let finalResult = '';
        
        this.setCallbacks({
          onResult: (results) => {
            finalResult = results[0] || '';
            resolve(finalResult);
          },
          onError: (error) => reject(error),
        });
        
        this.start();
        
        // Simulate speaking the test phrase
        setTimeout(() => {
          this.stop();
          if (!finalResult) {
            resolve(''); // No result
          }
        }, 3000);
      });
      
      const duration = Date.now() - startTime;
      const accuracy = this.calculateAccuracy(testPhrase, whisperResult);
      
      results.whisper = { duration, accuracy };
    } catch (error) {
      results.whisper = { duration: 0, accuracy: 0, error: error.message };
    }
    
    return results;
  }

  private calculateAccuracy(expected: string, actual: string): number {
    const expectedWords = expected.toLowerCase().split(' ');
    const actualWords = actual.toLowerCase().split(' ');
    
    let matches = 0;
    const maxLength = Math.max(expectedWords.length, actualWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (expectedWords[i] === actualWords[i]) {
        matches++;
      }
    }
    
    return maxLength > 0 ? (matches / maxLength) * 100 : 0;
  }
}

export default UnifiedSpeechService.getInstance();