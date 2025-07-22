/**
 * Edge Functions TypeScript Types and API Interfaces
 * 
 * This file defines the TypeScript interfaces and types used for 
 * communication between the React Native app and Supabase Edge Functions.
 */

import { OpenAIVoice, GeminiVoice } from '../services/speech/types'

// Common types
export type UserLevel = 'beginner' | 'intermediate' | 'advanced'
export type SpeechLanguage = string

// ==================== OpenAI Services ====================

// Text-to-Speech (TTS) Types
export interface OpenAITTSRequest {
  text: string
  voice?: OpenAIVoice
  model?: 'tts-1' | 'tts-1-hd' | 'gpt-4o-mini-tts'
  speed?: number
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav'
  user_level?: UserLevel
}

export interface OpenAITTSResponse {
  // Returns audio buffer directly
  audio: ArrayBuffer
}

// Speech-to-Text (Whisper) Types
export interface OpenAIWhisperRequest {
  audio: string // base64 encoded audio
  model?: 'whisper-1'
  language?: string
  prompt?: string
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

export interface OpenAIWhisperResponse {
  text: string
  language?: string
  duration?: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

// Conversation Types
export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIConversationRequest {
  messages: ConversationMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  language?: string
  user_level?: UserLevel
  context?: string
}

export interface OpenAIConversationResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ==================== Gemini Services ====================

// Gemini Message Types
export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

// Gemini Conversation Types
export interface GeminiConversationRequest {
  prompt: string
  context?: string
  language?: string
  user_level?: UserLevel
  task_type?: 'conversation' | 'grammar_check' | 'translation' | 'explanation'
  history?: GeminiMessage[]
}

export interface GeminiConversationResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
      role: string
    }
    finishReason: string
    index: number
  }>
  usageMetadata: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

// Gemini Translation Types
export interface GeminiTranslationRequest {
  text: string
  source_language: string
  target_language: string
  user_level?: UserLevel
  include_explanation?: boolean
}

export interface GeminiTranslationResponse {
  original_text: string
  source_language: string
  target_language: string
  user_level: UserLevel
  result: {
    candidates: Array<{
      content: {
        parts: Array<{
          text: string
        }>
      }
    }>
  }
}

// ==================== Error Types ====================

export interface EdgeFunctionError {
  error: string
  details?: string
  message?: string
}

// ==================== Service Response Types ====================

export type EdgeFunctionResponse<T> = T | EdgeFunctionError

// Type guards
export function isEdgeFunctionError(response: any): response is EdgeFunctionError {
  return response && typeof response.error === 'string'
}

// ==================== API Endpoints ====================

export const EDGE_FUNCTION_ENDPOINTS = {
  OPENAI_TTS: 'openai-tts',
  OPENAI_WHISPER: 'openai-whisper', 
  OPENAI_CONVERSATION: 'openai-conversation',
  GEMINI_CONVERSATION: 'gemini-conversation',
  GEMINI_TRANSLATION: 'gemini-translation',
} as const

// Unified TTS Edge Function Types (supports both OpenAI and Gemini)
export interface UnifiedTTSRequest {
  text: string
  provider?: 'openai' | 'gemini' | 'auto'
  voice?: OpenAIVoice | GeminiVoice
  model?: string
  speed?: number
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav'
  user_level?: UserLevel
  language?: string
  style_prompt?: string
  fallback_enabled?: boolean
}

export interface UnifiedTTSResponse {
  // Returns audio buffer directly
  audio: ArrayBuffer
  provider?: 'openai' | 'gemini'
  voice_used?: string
}
