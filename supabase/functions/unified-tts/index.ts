import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer' | 'verse'
type GeminiVoice = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Leda' | 'Orus' | 'Aoede' | 'Callirrhoe' | 'Autonoe' | 
                   'Enceladus' | 'Iapetus' | 'Umbriel' | 'Algieba' | 'Despina' | 'Erinome' | 'Algenib' | 'Rasalgethi' | 
                   'Laomedeia' | 'Achernar' | 'Alnilam' | 'Schedar' | 'Gacrux' | 'Pulcherrima' | 'Achird' | 
                   'Zubenelgenubi' | 'Vindemiatrix' | 'Sadachbia' | 'Sadaltager' | 'Sulafat'

interface UnifiedTTSRequest {
  text: string
  provider?: 'openai' | 'gemini' | 'auto'
  voice?: OpenAIVoice | GeminiVoice
  model?: string
  speed?: number
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav'
  user_level?: 'beginner' | 'intermediate' | 'advanced'
  language?: string
  style_prompt?: string
  fallback_enabled?: boolean
}

// Voice provider mapping
const OPENAI_VOICES: OpenAIVoice[] = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse']
const GEMINI_VOICES: GeminiVoice[] = [
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe',
  'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
  'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird',
  'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
]

function determineProvider(voice?: string, requestedProvider?: string): 'openai' | 'gemini' {
  if (requestedProvider === 'openai' || requestedProvider === 'gemini') {
    return requestedProvider
  }
  
  if (voice && OPENAI_VOICES.includes(voice as OpenAIVoice)) {
    return 'openai'
  }
  
  if (voice && GEMINI_VOICES.includes(voice as GeminiVoice)) {
    return 'gemini'
  }
  
  // Default to OpenAI for compatibility
  return 'openai'
}

async function callOpenAITTS(request: UnifiedTTSRequest): Promise<Response> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Adjust speed based on user level
  let adjustedSpeed = request.speed || 1.0
  switch (request.user_level) {
    case 'beginner':
      adjustedSpeed = Math.min(adjustedSpeed * 0.8, 1.0)
      break
    case 'advanced':
      adjustedSpeed = Math.min(adjustedSpeed * 1.2, 4.0)
      break
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || 'tts-1',
      input: request.text,
      voice: request.voice || 'alloy',
      speed: adjustedSpeed,
      response_format: request.response_format || 'mp3',
    }),
  })

  if (!openaiResponse.ok) {
    const errorData = await openaiResponse.text()
    throw new Error(`OpenAI TTS failed: ${errorData}`)
  }

  const audioBuffer = await openaiResponse.arrayBuffer()
  return new Response(audioBuffer, {
    headers: {
      ...corsHeaders,
      'Content-Type': `audio/${request.response_format || 'mp3'}`,
      'Content-Length': audioBuffer.byteLength.toString(),
      'X-TTS-Provider': 'openai',
      'X-Voice-Used': request.voice || 'alloy',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

async function callGeminiTTS(request: UnifiedTTSRequest): Promise<Response> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Create style prompt based on user level
  let stylePrompt = request.style_prompt || ''
  if (!stylePrompt) {
    switch (request.user_level) {
      case 'beginner':
        stylePrompt = 'Speak slowly and clearly, with simple pronunciation for language learners'
        break
      case 'advanced':
        stylePrompt = 'Speak naturally with normal pace and natural expressions'
        break
      case 'intermediate':
      default:
        stylePrompt = 'Speak at a moderate pace with clear pronunciation'
        break
    }
  }

  const model = request.model || 'gemini-2.5-flash-tts'
  const requestBody = {
    model: model,
    contents: [{
      parts: [{
        text: request.text
      }]
    }],
    generationConfig: {
      responseMimeType: "audio/wav",
      speechConfig: {
        voiceConfig: {
          name: request.voice || 'Puck'
        },
        stylePrompt: stylePrompt
      }
    }
  }

  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!geminiResponse.ok) {
    const errorData = await geminiResponse.text()
    throw new Error(`Gemini TTS failed: ${errorData}`)
  }

  const result = await geminiResponse.json()
  
  if (!result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    throw new Error('No audio data received from Gemini')
  }

  const base64Audio = result.candidates[0].content.parts[0].inlineData.data
  const audioBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
  
  return new Response(audioBuffer, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.byteLength.toString(),
      'X-TTS-Provider': 'gemini',
      'X-Voice-Used': request.voice || 'Puck',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request = await req.json() as UnifiedTTSRequest

    // Validate required fields
    if (!request.text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Determine which provider to use
    const provider = determineProvider(request.voice, request.provider)
    const fallbackEnabled = request.fallback_enabled !== false // Default to true

    try {
      // Try primary provider
      if (provider === 'openai') {
        return await callOpenAITTS(request)
      } else {
        return await callGeminiTTS(request)
      }
    } catch (primaryError) {
      console.error(`Primary provider (${provider}) failed:`, primaryError)
      
      if (!fallbackEnabled) {
        throw primaryError
      }

      // Try fallback provider
      try {
        const fallbackProvider = provider === 'openai' ? 'gemini' : 'openai'
        console.log(`Falling back to ${fallbackProvider}`)
        
        // Adjust voice for fallback provider
        if (fallbackProvider === 'openai' && request.voice && GEMINI_VOICES.includes(request.voice as GeminiVoice)) {
          request.voice = 'alloy' // Default OpenAI voice
        } else if (fallbackProvider === 'gemini' && request.voice && OPENAI_VOICES.includes(request.voice as OpenAIVoice)) {
          request.voice = 'Puck' // Default Gemini voice
        }

        if (fallbackProvider === 'openai') {
          const response = await callOpenAITTS(request)
          // Add fallback header
          response.headers.set('X-TTS-Fallback', 'true')
          response.headers.set('X-TTS-Primary-Provider', provider)
          return response
        } else {
          const response = await callGeminiTTS(request)
          // Add fallback header
          response.headers.set('X-TTS-Fallback', 'true')
          response.headers.set('X-TTS-Primary-Provider', provider)
          return response
        }
      } catch (fallbackError) {
        console.error(`Fallback provider failed:`, fallbackError)
        throw new Error(`Both providers failed. Primary (${provider}): ${primaryError.message}. Fallback: ${fallbackError.message}`)
      }
    }

  } catch (error) {
    console.error('Unified TTS function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Text-to-speech generation failed',
        message: error.message,
        available_providers: ['openai', 'gemini'],
        openai_voices: OPENAI_VOICES,
        gemini_voices: GEMINI_VOICES
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})