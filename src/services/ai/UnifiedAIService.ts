import { openAIService, OpenAIService } from './OpenAIService'
import { geminiService, GeminiService } from './GeminiService'
import { UserLevel } from '../../types/edge-functions'

/**
 * Unified AI Service - Orchestrates OpenAI and Gemini services
 * 
 * This service provides a unified interface for AI capabilities with
 * intelligent fallback logic, load balancing, and feature routing.
 */
export class UnifiedAIService {
  private static instance: UnifiedAIService
  private openAI: OpenAIService
  private gemini: GeminiService
  private availability = {
    openai: true,
    gemini: true,
    lastChecked: 0
  }

  private constructor() {
    this.openAI = openAIService
    this.gemini = geminiService
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService()
    }
    return UnifiedAIService.instance
  }

  /**
   * Text-to-Speech (uses unified-tts Edge Function with OpenAI and Gemini support)
   */
  async textToSpeech(params: {
    text: string
    voice?: string
    speed?: number
    user_level?: UserLevel
    provider?: 'openai' | 'gemini' | 'auto'
  }): Promise<ArrayBuffer> {
    try {
      console.log('🎤 UnifiedAI: Starting TTS with params:', params);
      
      // Use unified-tts Edge Function
      const response = await this.openAI.callUnifiedTTS({
        text: params.text,
        voice: params.voice as any,
        speed: params.speed,
        user_level: params.user_level,
        provider: params.provider || 'auto',
        fallback_enabled: true
      })
      
      console.log('🎤 UnifiedAI: Got TTS response:', {
        type: typeof response,
        isArrayBuffer: response instanceof ArrayBuffer,
        size: response instanceof ArrayBuffer ? response.byteLength : 'N/A'
      });
      
      if (!response) {
        throw new Error('No audio data received from TTS service');
      }
      
      if (!(response instanceof ArrayBuffer)) {
        throw new Error('Invalid audio data format received from TTS service');
      }
      
      return response
    } catch (error) {
      console.error('🎤 UnifiedAI: TTS Error:', error)
      throw new Error(`Text-to-speech service unavailable: ${error.message}`)
    }
  }

  /**
   * Speech-to-Text (always uses OpenAI Whisper)
   */
  async speechToText(params: {
    audio: string
    language?: string
    prompt?: string
  }): Promise<{ text: string; confidence?: number }> {
    try {
      const result = await this.openAI.speechToText({
        audio: params.audio,
        language: params.language,
        prompt: params.prompt
      })
      
      return {
        text: result.text,
        confidence: 1.0 // Whisper doesn't provide confidence scores
      }
    } catch (error) {
      console.error('STT Error:', error)
      throw new Error('Speech-to-text service unavailable')
    }
  }

  /**
   * Conversation with intelligent provider selection
   */
  async generateConversation(params: {
    messages?: Array<{ role: string; content: string }>
    prompt?: string
    language?: string
    user_level?: UserLevel
    context?: string
    provider?: 'openai' | 'gemini' | 'auto'
  }): Promise<{ text: string; provider: string; usage?: any }> {
    const provider = params.provider || 'auto'
    
    // Auto-select provider based on availability and task type
    const selectedProvider = provider === 'auto' 
      ? await this.selectOptimalProvider('conversation')
      : provider

    try {
      if (selectedProvider === 'openai') {
        const messages = params.messages || [
          { role: 'user', content: params.prompt || '' }
        ]
        
        const result = await this.openAI.generateConversation({
          messages: messages as any,
          language: params.language,
          user_level: params.user_level,
          context: params.context
        })

        const responseText = result.choices?.[0]?.message?.content || ''
        return {
          text: responseText,
          provider: 'openai',
          usage: result.usage
        }
      } else {
        const result = await this.gemini.generateConversation({
          prompt: params.prompt || params.messages?.slice(-1)[0]?.content || '',
          language: params.language,
          user_level: params.user_level,
          context: params.context,
          task_type: 'conversation'
        })

        const responseText = this.gemini.extractResponseText(result)
        return {
          text: responseText,
          provider: 'gemini',
          usage: result.usageMetadata
        }
      }
    } catch (error) {
      console.error(`${selectedProvider} conversation error:`, error)
      
      // Try fallback provider
      const fallbackProvider = selectedProvider === 'openai' ? 'gemini' : 'openai'
      if (await this.isProviderAvailable(fallbackProvider)) {
        console.log(`Falling back to ${fallbackProvider}`)
        return this.generateConversation({
          ...params,
          provider: fallbackProvider
        })
      }
      
      throw new Error('All conversation services unavailable')
    }
  }

  /**
   * Translation (prefers Gemini, falls back to OpenAI conversation)
   */
  async translateText(params: {
    text: string
    source_language: string
    target_language: string
    user_level?: UserLevel
    include_explanation?: boolean
  }): Promise<{ translation: string; explanation?: string; provider: string }> {
    try {
      // Try Gemini first for translation
      if (await this.isProviderAvailable('gemini')) {
        const result = await this.gemini.translateText(params)
        
        // Parse the translation from Gemini response
        const responseText = this.gemini.extractResponseText(result.result as any)
        let translation = responseText
        let explanation = undefined

        if (params.include_explanation) {
          try {
            const parsed = JSON.parse(responseText)
            translation = parsed.translation || responseText
            explanation = parsed.explanation
          } catch {
            // If not JSON, use the whole response as translation
            translation = responseText
          }
        }

        return {
          translation,
          explanation,
          provider: 'gemini'
        }
      }
    } catch (error) {
      console.error('Gemini translation error:', error)
    }

    // Fallback to OpenAI conversation
    try {
      const prompt = `Translate this text from ${params.source_language} to ${params.target_language}: "${params.text}"`
      const result = await this.openAI.generateConversation({
        messages: [{ role: 'user', content: prompt }],
        language: params.target_language,
        user_level: params.user_level
      })

      const translation = result.choices?.[0]?.message?.content || ''
      return {
        translation,
        provider: 'openai'
      }
    } catch (error) {
      console.error('OpenAI translation fallback error:', error)
      throw new Error('Translation services unavailable')
    }
  }

  /**
   * Grammar checking (prefers Gemini)
   */
  async checkGrammar(params: {
    text: string
    language?: string
    user_level?: UserLevel
  }): Promise<{ feedback: string; provider: string }> {
    try {
      if (await this.isProviderAvailable('gemini')) {
        const result = await this.gemini.checkGrammar(params)
        const feedback = this.gemini.extractResponseText(result)
        return { feedback, provider: 'gemini' }
      }
    } catch (error) {
      console.error('Gemini grammar check error:', error)
    }

    // Fallback to OpenAI
    try {
      const prompt = `Please check the grammar of this ${params.language || 'English'} text and provide corrections: "${params.text}"`
      const result = await this.openAI.generateConversation({
        messages: [{ role: 'user', content: prompt }],
        language: params.language,
        user_level: params.user_level
      })

      const feedback = result.choices?.[0]?.message?.content || ''
      return { feedback, provider: 'openai' }
    } catch (error) {
      console.error('OpenAI grammar check fallback error:', error)
      throw new Error('Grammar checking services unavailable')
    }
  }

  /**
   * Get available voices (from OpenAI)
   */
  getAvailableVoices(): string[] {
    return this.openAI.getAvailableVoices()
  }

  /**
   * Get speed for user level
   */
  getSpeedForUserLevel(userLevel: UserLevel, baseSpeed: number = 1.0): number {
    return this.openAI.getSpeedForUserLevel(userLevel, baseSpeed)
  }

  /**
   * Check service availability
   */
  async checkAvailability(): Promise<{
    openai: boolean
    gemini: boolean
    overall: boolean
  }> {
    const now = Date.now()
    
    // Check every 5 minutes
    if (now - this.availability.lastChecked > 5 * 60 * 1000) {
      this.availability.openai = await this.openAI.checkAvailability()
      this.availability.gemini = await this.gemini.checkAvailability()
      this.availability.lastChecked = now
    }

    return {
      openai: this.availability.openai,
      gemini: this.availability.gemini,
      overall: this.availability.openai || this.availability.gemini
    }
  }

  /**
   * Select optimal provider for a task
   */
  private async selectOptimalProvider(taskType: 'conversation' | 'translation' | 'grammar'): Promise<'openai' | 'gemini'> {
    const availability = await this.checkAvailability()
    
    // If only one is available, use it
    if (availability.openai && !availability.gemini) return 'openai'
    if (availability.gemini && !availability.openai) return 'gemini'
    if (!availability.overall) return 'openai' // Default fallback

    // Both available - choose based on task type
    switch (taskType) {
      case 'translation':
      case 'grammar':
        return 'gemini' // Gemini is better for language analysis
      case 'conversation':
      default:
        return 'openai' // OpenAI has good conversation flow
    }
  }

  /**
   * Check if a specific provider is available
   */
  private async isProviderAvailable(provider: 'openai' | 'gemini'): Promise<boolean> {
    const availability = await this.checkAvailability()
    return availability[provider]
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    availability: typeof this.availability
    features: {
      tts: string[]
      stt: string[]
      conversation: string[]
      translation: string[]
      grammar: string[]
    }
  } {
    return {
      availability: this.availability,
      features: {
        tts: ['openai'],
        stt: ['openai'],
        conversation: ['openai', 'gemini'],
        translation: ['gemini', 'openai'],
        grammar: ['gemini', 'openai']
      }
    }
  }
}

export const unifiedAIService = UnifiedAIService.getInstance()
