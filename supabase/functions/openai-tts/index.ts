import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  handleCORSPreflight,
  parseRequestBody,
  getOpenAIApiKey,
  createOpenAIHeaders,
  createAudioHeaders,
  createErrorResponse,
  createValidationError,
  createApiKeyError,
  adjustSpeedForUserLevel,
  sanitizeText,
  UserLevel
} from '../_shared/utils.ts'

interface TTSRequest {
  text: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  model?: 'tts-1' | 'tts-1-hd'
  speed?: number
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac'
  user_level?: UserLevel
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { 
      text, 
      voice = 'alloy', 
      model = 'tts-1', 
      speed = 1.0, 
      response_format = 'mp3', 
      user_level = 'intermediate' 
    } = await parseRequestBody<TTSRequest>(req, ['text'])

    // Sanitize and validate text
    const sanitizedText = sanitizeText(text)
    if (!sanitizedText) {
      return createValidationError('Text is required and cannot be empty')
    }

    // Adjust speed based on user level
    const adjustedSpeed = adjustSpeedForUserLevel(speed, user_level)

    // Get OpenAI API key
    let openaiApiKey: string
    try {
      openaiApiKey = getOpenAIApiKey()
    } catch (error) {
      return createApiKeyError('OpenAI')
    }

    // Call OpenAI TTS API
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: createOpenAIHeaders(openaiApiKey),
      body: JSON.stringify({
        model,
        input: sanitizedText,
        voice,
        speed: adjustedSpeed,
        response_format,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI TTS API error:', errorData)
      return createErrorResponse(
        'Text-to-speech generation failed',
        openaiResponse.status,
        errorData
      )
    }

    // Get the audio data
    const audioBuffer = await openaiResponse.arrayBuffer()
    
    // Return the audio with appropriate headers
    return new Response(audioBuffer, {
      headers: createAudioHeaders(response_format, audioBuffer.byteLength, {
        'X-Voice-Used': voice,
        'X-Model-Used': model,
        'X-Speed-Adjusted': adjustedSpeed.toString(),
        'X-User-Level': user_level
      }),
    })

  } catch (error) {
    console.error('OpenAI TTS function error:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
