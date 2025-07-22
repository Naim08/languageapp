import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  handleCORSPreflight,
  parseRequestBody,
  getOpenAIApiKey,
  createOpenAIHeaders,
  createSuccessHeaders,
  createErrorResponse,
  createValidationError,
  createApiKeyError
} from '../_shared/utils.ts'

interface WhisperRequest {
  audio: string // base64 encoded audio
  model?: 'whisper-1'
  language?: string
  prompt?: string
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { 
      audio, 
      model = 'whisper-1', 
      language, 
      prompt, 
      response_format = 'json',
      temperature = 0 
    } = await parseRequestBody<WhisperRequest>(req, ['audio'])

    // Get OpenAI API key
    let openaiApiKey: string
    try {
      openaiApiKey = getOpenAIApiKey()
    } catch (error) {
      return createApiKeyError('OpenAI')
    }

    // Convert base64 audio to blob
    const audioBuffer = Uint8Array.from(atob(audio), c => c.charCodeAt(0))
    
    // Check if the audio data is empty
    if (audioBuffer.length === 0) {
      return createErrorResponse('Audio data is empty', 400, 'No audio content provided')
    }
    
    // Try to detect audio format from the first few bytes
    let mimeType = 'audio/m4a'
    let extension = 'm4a'
    
    // Common audio format magic bytes
    if (audioBuffer[0] === 0x49 && audioBuffer[1] === 0x44 && audioBuffer[2] === 0x33) {
      mimeType = 'audio/mp3'
      extension = 'mp3'
    } else if (audioBuffer[0] === 0x52 && audioBuffer[1] === 0x49 && audioBuffer[2] === 0x46 && audioBuffer[3] === 0x46) {
      mimeType = 'audio/wav'
      extension = 'wav'
    }
    
    console.log(`Detected audio format: ${mimeType}, size: ${audioBuffer.length} bytes`)
    
    const audioBlob = new Blob([audioBuffer], { type: mimeType })

    // Create FormData for multipart upload
    const formData = new FormData()
    formData.append('file', audioBlob, `audio.${extension}`)
    formData.append('model', model)
    
    if (language) {
      formData.append('language', language)
    }
    
    if (prompt) {
      formData.append('prompt', prompt)
    }
    
    formData.append('response_format', response_format)
    formData.append('temperature', temperature.toString())

    // Call OpenAI Whisper API
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI Whisper API error:', errorData)
      return createErrorResponse(
        'Speech-to-text transcription failed',
        openaiResponse.status,
        errorData
      )
    }

    // Get the transcription result
    let result
    if (response_format === 'json' || response_format === 'verbose_json') {
      result = await openaiResponse.json()
    } else {
      result = { text: await openaiResponse.text() }
    }
    
    // Return the transcription result
    return new Response(JSON.stringify(result), {
      headers: createSuccessHeaders('application/json', 'no-cache'),
    })

  } catch (error) {
    console.error('Whisper function error:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
