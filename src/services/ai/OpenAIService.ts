import { supabase } from '../../lib/supabase'
import { SPEECH_CONFIG } from '../../constants/config'
import {
  OpenAITTSRequest,
  OpenAITTSResponse,
  OpenAIWhisperRequest,
  OpenAIWhisperResponse,
  OpenAIConversationRequest,
  OpenAIConversationResponse,
  EdgeFunctionResponse,
  isEdgeFunctionError,
  EDGE_FUNCTION_ENDPOINTS,
  UserLevel
} from '../../types/edge-functions'

/**
 * OpenAI Service - Client for OpenAI Edge Functions
 * 
 * This service communicates with Supabase Edge Functions that handle
 * OpenAI API calls securely from the backend.
 */
export class OpenAIService {
  private static instance: OpenAIService
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService()
    }
    return OpenAIService.instance
  }

  /**
   * Generate speech from text using OpenAI TTS
   */
  async textToSpeech(params: {
    text: string
    voice?: OpenAITTSRequest['voice']
    model?: OpenAITTSRequest['model']
    speed?: number
    response_format?: OpenAITTSRequest['response_format']
    user_level?: UserLevel
  }): Promise<ArrayBuffer> {
    try {
      const { data, error } = await supabase.functions.invoke('openai-tts', {
        body: {
          text: params.text,
          voice: params.voice || 'alloy',
          model: params.model || 'tts-1',
          speed: params.speed || 1.0,
          response_format: params.response_format || 'mp3',
          user_level: params.user_level || 'intermediate'
        } as OpenAITTSRequest
      })

      if (error) {
        throw new Error(`OpenAI TTS Error: ${error.message}`)
      }

      // For binary responses (audio), data will be ArrayBuffer
      // Only check for EdgeFunctionError if it's not binary data
      if (data instanceof ArrayBuffer) {
        return data
      }

      if (isEdgeFunctionError(data)) {
        throw new Error(`OpenAI TTS API Error: ${data.error}`)
      }

      // Fallback: if data is not ArrayBuffer and not an error, cast it
      return data as ArrayBuffer
    } catch (error) {
      console.error('OpenAI TTS Service Error:', error)
      throw error
    }
  }

  /**
   * Convert speech to text using OpenAI Whisper
   */
  async speechToText(params: {
    audio: string // base64 encoded audio
    model?: OpenAIWhisperRequest['model']
    language?: string
    prompt?: string
    response_format?: OpenAIWhisperRequest['response_format']
    temperature?: number
  }): Promise<OpenAIWhisperResponse> {
    try {
      // Use fetch directly to get better error details
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      
      console.log('📤 Calling Whisper Edge Function with audio size:', params.audio.length)
      
      const response = await fetch(`${supabaseUrl}/functions/v1/openai-whisper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: params.audio,
          model: params.model || 'whisper-1',
          language: params.language,
          prompt: params.prompt,
          response_format: params.response_format || 'json',
          temperature: params.temperature || 0
        })
      })

      console.log('📥 Edge Function response status:', response.status)
      console.log('📥 Edge Function response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Edge Function error response:', errorText)
        
        // Try to parse as JSON for structured error
        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = { message: errorText }
        }
        
        throw new Error(`Whisper API Error (${response.status}): ${errorDetails.message || errorDetails.error || errorText}`)
      }

      const data = await response.json()
      
      if (isEdgeFunctionError(data)) {
        throw new Error(`OpenAI Whisper API Error: ${data.error}`)
      }

      return data as OpenAIWhisperResponse
    } catch (error) {
      console.error('OpenAI Whisper Service Error:', error)
      throw error
    }
  }

  /**
   * Generate conversation responses using OpenAI Chat
   */
  async generateConversation(params: {
    messages: OpenAIConversationRequest['messages']
    model?: string
    max_tokens?: number
    temperature?: number
    language?: string
    user_level?: UserLevel
    context?: string
  }): Promise<OpenAIConversationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('openai-conversation', {
        body: {
          messages: params.messages,
          model: params.model || 'gpt-4o-mini',
          max_tokens: params.max_tokens || 1000,
          temperature: params.temperature || 0.7,
          language: params.language || 'English',
          user_level: params.user_level || 'intermediate',
          context: params.context
        } as OpenAIConversationRequest
      })

      if (error) {
        throw new Error(`OpenAI Conversation Error: ${error.message}`)
      }

      if (isEdgeFunctionError(data)) {
        throw new Error(`OpenAI Conversation API Error: ${data.error}`)
      }

      return data as OpenAIConversationResponse
    } catch (error) {
      console.error('OpenAI Conversation Service Error:', error)
      throw error
    }
  }

  /**
   * Call unified TTS Edge Function (supports both OpenAI and Gemini)
   */
  async callUnifiedTTS(params: {
    text: string
    voice?: string
    provider?: 'openai' | 'gemini' | 'auto'
    model?: string
    speed?: number
    response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav'
    user_level?: UserLevel
    language?: string
    style_prompt?: string
    fallback_enabled?: boolean
  }): Promise<ArrayBuffer> {
    try {
      console.log('🎤 OpenAI Service: Calling unified-tts with:', params);
      
      // Call the edge function with explicit headers for binary response
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/unified-tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg, application/octet-stream, */*',
        },
        body: JSON.stringify({
          text: params.text,
          voice: params.voice || 'alloy',
          provider: params.provider || 'auto',
          model: params.model,
          speed: params.speed || 1.0,
          response_format: params.response_format || 'mp3',
          user_level: params.user_level || 'intermediate',
          language: params.language,
          style_prompt: params.style_prompt,
          fallback_enabled: params.fallback_enabled !== false
        })
      });

      console.log('🎤 OpenAI Service: Raw response status:', response.status);
      console.log('🎤 OpenAI Service: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Unified TTS Error (${response.status}): ${errorText}`);
      }

      // Get the response as ArrayBuffer for audio data
      const audioBuffer = await response.arrayBuffer();
      
      console.log('🎤 OpenAI Service: Got audio buffer:', {
        size: audioBuffer.byteLength,
        type: 'ArrayBuffer'
      });

      return audioBuffer;
    } catch (error) {
      console.error('🎤 OpenAI Service: Unified TTS Service Error:', error)
      throw error
    }
  }

  /**
   * Check if OpenAI services are available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Test with a minimal request
      await this.generateConversation({
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
      return true
    } catch (error) {
      console.warn('OpenAI services unavailable:', error)
      return false
    }
  }

  /**
   * Get available voices for TTS
   */
  getAvailableVoices(): OpenAITTSRequest['voice'][] {
    return [...SPEECH_CONFIG.OPENAI_VOICES]
  }

  /**
   * Get available models for TTS
   */
  getAvailableModels(): OpenAITTSRequest['model'][] {
    return ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts']
  }

  /**
   * Get speed adjustment for user level
   */
  getSpeedForUserLevel(userLevel: UserLevel, baseSpeed: number = 1.0): number {
    switch (userLevel) {
      case 'beginner':
        return Math.min(baseSpeed * 0.8, 1.0)
      case 'advanced':
        return Math.min(baseSpeed * 1.2, 4.0)
      case 'intermediate':
      default:
        return baseSpeed
    }
  }
}

export const openAIService = OpenAIService.getInstance()
