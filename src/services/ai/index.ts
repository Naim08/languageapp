/**
 * AI Services Index
 * 
 * Central export point for all AI-related services including
 * OpenAI, Gemini, unified services, rate limiting, and error handling.
 */

// Re-export types from edge-functions for convenience
export type {
  OpenAITTSRequest,
  OpenAITTSResponse,
  OpenAIWhisperRequest,
  OpenAIWhisperResponse,
  OpenAIConversationRequest,
  OpenAIConversationResponse,
  GeminiConversationRequest,
  GeminiConversationResponse,
  GeminiTranslationRequest,
  GeminiTranslationResponse,
  GeminiMessage,
  UserLevel,
  EdgeFunctionResponse,
  EdgeFunctionError
} from '../../types/edge-functions'

// Core AI Services
export { default as UnifiedAIService } from './UnifiedAIService';
export { default as OpenAIService } from './OpenAIService';
export { default as GeminiService } from './GeminiService';
export { default as PixabayImageService } from './PixabayImageService';
export { default as UnsplashImageService } from './UnsplashImageService';

// Support Services
export { RateLimitService, rateLimitService } from './RateLimitService'
export { 
  ErrorHandlingService, 
  errorHandlingService,
  APIError,
  ErrorType,
  type RetryConfig,
  type CircuitBreakerConfig,
  type ErrorContext
} from './ErrorHandlingService'

// Import services for convenience functions
import { unifiedAIService } from './UnifiedAIService'
import { errorHandlingService } from './ErrorHandlingService'
import { UserLevel } from '../../types/edge-functions'

// Convenience functions for common operations
export const aiServices = {
  /**
   * Quick access to unified AI service
   */
  unified: unifiedAIService,
  
  /**
   * Text-to-speech with error handling
   */
  speak: async (text: string, options?: {
    voice?: string
    speed?: number
    user_level?: UserLevel
  }) => {
    return unifiedAIService.textToSpeech({
      text,
      ...options
    })
  },

  /**
   * Speech-to-text with error handling
   */
  transcribe: async (audio: string, options?: {
    language?: string
    prompt?: string
  }) => {
    return unifiedAIService.speechToText({
      audio,
      ...options
    })
  },

  /**
   * Generate conversation response
   */
  chat: async (message: string, options?: {
    language?: string
    user_level?: UserLevel
    context?: string
    provider?: 'openai' | 'gemini' | 'auto'
  }) => {
    return unifiedAIService.generateConversation({
      prompt: message,
      ...options
    })
  },

  /**
   * Translate text
   */
  translate: async (text: string, from: string, to: string, options?: {
    user_level?: UserLevel
    include_explanation?: boolean
  }) => {
    return unifiedAIService.translateText({
      text,
      source_language: from,
      target_language: to,
      ...options
    })
  },

  /**
   * Check grammar
   */
  checkGrammar: async (text: string, options?: {
    language?: string
    user_level?: UserLevel
  }) => {
    return unifiedAIService.checkGrammar({
      text,
      ...options
    })
  },

  /**
   * Get service health status
   */
  getHealth: async () => {
    const availability = await unifiedAIService.checkAvailability()
    const stats = unifiedAIService.getServiceStats()
    const circuitBreakers = errorHandlingService.getAllCircuitBreakerStatuses()
    
    return {
      availability,
      stats,
      circuitBreakers,
      timestamp: new Date().toISOString()
    }
  }
}

export default aiServices
