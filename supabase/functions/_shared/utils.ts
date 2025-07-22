import { corsHeaders } from './cors.ts'

// Common types used across functions
export type UserLevel = 'beginner' | 'intermediate' | 'advanced'

// API key management
export function getOpenAIApiKey(): string {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }
  return apiKey
}

export function getGeminiApiKey(): string {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }
  return apiKey
}

// Common error response helper
export function createErrorResponse(
  error: string, 
  status: number = 500, 
  details?: string
): Response {
  return new Response(
    JSON.stringify({ 
      error,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    }),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Common validation error
export function createValidationError(message: string): Response {
  return createErrorResponse(message, 400)
}

// API key error responses
export function createApiKeyError(provider: 'OpenAI' | 'Gemini'): Response {
  return createErrorResponse(`${provider} API key not configured`, 500)
}

// Speed adjustment for user levels (TTS)
export function adjustSpeedForUserLevel(
  baseSpeed: number, 
  userLevel: UserLevel
): number {
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

// Common system prompt generator for language learning
export function createLanguageLearningPrompt(
  userLevel: UserLevel,
  language: string,
  taskType: string,
  context?: string
): string {
  const basePrompt = `You are an AI language tutor helping a ${userLevel} level student with ${taskType} in ${language}.`
  
  const levelGuidelines = {
    beginner: 'Use simple vocabulary and short sentences. Explain concepts clearly and be very encouraging.',
    intermediate: 'Use moderate complexity. Provide corrections and explanations when helpful.',
    advanced: 'Use natural language. Focus on nuances, advanced concepts, and subtle corrections.'
  }
  
  const guidelines = levelGuidelines[userLevel]
  const contextPart = context ? `\n\nContext: ${context}` : ''
  
  return `${basePrompt}\n\n${guidelines}${contextPart}`
}

// Common Gemini safety settings
export const GEMINI_SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH", 
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  }
]

// Common OpenAI headers
export function createOpenAIHeaders(apiKey: string): HeadersInit {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

// Common response headers with caching
export function createSuccessHeaders(
  contentType: string = 'application/json',
  cacheControl: string = 'no-cache'
): HeadersInit {
  return {
    ...corsHeaders,
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'X-Timestamp': new Date().toISOString()
  }
}

// Audio response headers
export function createAudioHeaders(
  format: string,
  byteLength: number,
  additionalHeaders: Record<string, string> = {}
): HeadersInit {
  return {
    ...corsHeaders,
    'Content-Type': `audio/${format}`,
    'Content-Length': byteLength.toString(),
    'Cache-Control': 'public, max-age=3600',
    ...additionalHeaders
  }
}

// Retry logic for API calls
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Input sanitization
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 10000) // Limit length
}

// Validate language code
export function isValidLanguageCode(code: string): boolean {
  const validCodes = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru', 'ar', 'hi', 'nl', 'sv', 'da', 'no', 'fi'
  ]
  return validCodes.includes(code.toLowerCase().slice(0, 2))
}

// Common CORS preflight handler
export function handleCORSPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  return null
}

// Request body parser with validation
export async function parseRequestBody<T>(
  req: Request,
  requiredFields: string[]
): Promise<T> {
  const body = await req.json() as T
  
  for (const field of requiredFields) {
    if (!(field in body) || (body as any)[field] === undefined || (body as any)[field] === null) {
      throw new Error(`${field} is required`)
    }
  }
  
  return body
}