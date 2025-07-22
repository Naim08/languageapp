import { supabase } from '../../lib/supabase'
import {
  GeminiConversationRequest,
  GeminiConversationResponse,
  GeminiTranslationRequest,
  GeminiTranslationResponse,
  GeminiMessage,
  EdgeFunctionResponse,
  isEdgeFunctionError,
  EDGE_FUNCTION_ENDPOINTS,
  UserLevel
} from '../../types/edge-functions'

/**
 * Gemini Service - Client for Google Gemini Edge Functions
 * 
 * This service communicates with Supabase Edge Functions that handle
 * Google Gemini API calls securely from the backend.
 */
export class GeminiService {
  private static instance: GeminiService
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService()
    }
    return GeminiService.instance
  }

  /**
   * Generate conversation responses using Gemini
   */
  async generateConversation(params: {
    prompt: string
    context?: string
    language?: string
    user_level?: UserLevel
    task_type?: 'conversation' | 'grammar_check' | 'translation' | 'explanation'
    history?: GeminiMessage[]
  }): Promise<GeminiConversationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-conversation', {
        body: {
          prompt: params.prompt,
          context: params.context,
          language: params.language || 'English',
          user_level: params.user_level || 'intermediate',
          task_type: params.task_type || 'conversation',
          history: params.history || []
        } as GeminiConversationRequest
      })

      if (error) {
        throw new Error(`Gemini Conversation Error: ${error.message}`)
      }

      if (isEdgeFunctionError(data)) {
        throw new Error(`Gemini Conversation API Error: ${data.error}`)
      }

      return data as GeminiConversationResponse
    } catch (error) {
      console.error('Gemini Conversation Service Error:', error)
      throw error
    }
  }

  /**
   * Translate text using Gemini
   */
  async translateText(params: {
    text: string
    source_language: string
    target_language: string
    user_level?: UserLevel
    include_explanation?: boolean
  }): Promise<GeminiTranslationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-translation', {
        body: {
          text: params.text,
          source_language: params.source_language,
          target_language: params.target_language,
          user_level: params.user_level || 'intermediate',
          include_explanation: params.include_explanation || false
        } as GeminiTranslationRequest
      })

      if (error) {
        throw new Error(`Gemini Translation Error: ${error.message}`)
      }

      if (isEdgeFunctionError(data)) {
        throw new Error(`Gemini Translation API Error: ${data.error}`)
      }

      return data as GeminiTranslationResponse
    } catch (error) {
      console.error('Gemini Translation Service Error:', error)
      throw error
    }
  }

  /**
   * Check grammar and provide corrections
   */
  async checkGrammar(params: {
    text: string
    language?: string
    user_level?: UserLevel
    context?: string
  }): Promise<GeminiConversationResponse> {
    return this.generateConversation({
      prompt: params.text,
      context: params.context,
      language: params.language || 'English',
      user_level: params.user_level || 'intermediate',
      task_type: 'grammar_check'
    })
  }

  /**
   * Get language explanations
   */
  async explainLanguageConcept(params: {
    concept: string
    language?: string
    user_level?: UserLevel
    context?: string
  }): Promise<GeminiConversationResponse> {
    return this.generateConversation({
      prompt: params.concept,
      context: params.context,
      language: params.language || 'English',
      user_level: params.user_level || 'intermediate',
      task_type: 'explanation'
    })
  }

  /**
   * Create an AI conversation partner
   */
  async startConversationPractice(params: {
    topic?: string
    language?: string
    user_level?: UserLevel
    context?: string
    history?: GeminiMessage[]
  }): Promise<GeminiConversationResponse> {
    const prompt = params.topic 
      ? `Let's practice ${params.language || 'English'} conversation about: ${params.topic}`
      : `Let's practice ${params.language || 'English'} conversation. Please start with a greeting and suggest a topic.`

    return this.generateConversation({
      prompt,
      context: params.context,
      language: params.language || 'English',
      user_level: params.user_level || 'intermediate',
      task_type: 'conversation',
      history: params.history || []
    })
  }

  /**
   * Continue conversation with history
   */
  async continueConversation(params: {
    message: string
    language?: string
    user_level?: UserLevel
    context?: string
    history: GeminiMessage[]
  }): Promise<GeminiConversationResponse> {
    return this.generateConversation({
      prompt: params.message,
      context: params.context,
      language: params.language || 'English',
      user_level: params.user_level || 'intermediate',
      task_type: 'conversation',
      history: params.history
    })
  }

  /**
   * Get detailed translation with alternatives
   */
  async getDetailedTranslation(params: {
    text: string
    source_language: string
    target_language: string
    user_level?: UserLevel
  }): Promise<GeminiTranslationResponse> {
    return this.translateText({
      text: params.text,
      source_language: params.source_language,
      target_language: params.target_language,
      user_level: params.user_level || 'intermediate',
      include_explanation: true
    })
  }

  /**
   * Quick translation without explanations
   */
  async quickTranslate(params: {
    text: string
    source_language: string
    target_language: string
  }): Promise<GeminiTranslationResponse> {
    return this.translateText({
      text: params.text,
      source_language: params.source_language,
      target_language: params.target_language,
      include_explanation: false
    })
  }

  /**
   * Check if Gemini services are available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Test with a minimal request
      await this.generateConversation({
        prompt: 'test',
        task_type: 'conversation'
      })
      return true
    } catch (error) {
      console.warn('Gemini services unavailable:', error)
      return false
    }
  }

  /**
   * Get supported task types
   */
  getSupportedTaskTypes(): ('conversation' | 'grammar_check' | 'translation' | 'explanation')[] {
    return ['conversation', 'grammar_check', 'translation', 'explanation']
  }

  /**
   * Extract conversation text from Gemini response
   */
  extractResponseText(response: GeminiConversationResponse): string {
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0]
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || ''
      }
    }
    return ''
  }

  /**
   * Create conversation history entry
   */
  createHistoryEntry(role: 'user' | 'model', text: string): GeminiMessage {
    return {
      role,
      parts: [{ text }]
    }
  }

  /**
   * Format conversation history for display
   */
  formatConversationHistory(history: GeminiMessage[]): Array<{ role: string; content: string }> {
    return history.map(message => ({
      role: message.role,
      content: message.parts.map(part => part.text).join(' ')
    }))
  }
}

export const geminiService = GeminiService.getInstance()
