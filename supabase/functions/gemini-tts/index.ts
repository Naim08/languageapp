import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface GeminiTTSRequest {
  text: string
  voice?: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Leda' | 'Orus' | 'Aoede' | 'Callirrhoe' | 'Autonoe' | 
         'Enceladus' | 'Iapetus' | 'Umbriel' | 'Algieba' | 'Despina' | 'Erinome' | 'Algenib' | 'Rasalgethi' | 
         'Laomedeia' | 'Achernar' | 'Alnilam' | 'Schedar' | 'Gacrux' | 'Pulcherrima' | 'Achird' | 
         'Zubenelgenubi' | 'Vindemiatrix' | 'Sadachbia' | 'Sadaltager' | 'Sulafat'
  model?: 'gemini-2.5-flash-tts' | 'gemini-2.5-pro-tts'
  language?: string
  user_level?: 'beginner' | 'intermediate' | 'advanced'
  style_prompt?: string
}

// Voice characteristics mapping for better user experience
const VOICE_CHARACTERISTICS = {
  'Zephyr': 'Bright',
  'Puck': 'Upbeat', 
  'Charon': 'Informative',
  'Kore': 'Firm',
  'Fenrir': 'Excitable',
  'Leda': 'Youthful',
  'Orus': 'Firm',
  'Aoede': 'Breezy',
  'Callirrhoe': 'Easy-going',
  'Autonoe': 'Bright',
  'Enceladus': 'Breathy',
  'Iapetus': 'Clear',
  'Umbriel': 'Easy-going',
  'Algieba': 'Smooth',
  'Despina': 'Smooth',
  'Erinome': 'Clear',
  'Algenib': 'Gravelly',
  'Rasalgethi': 'Informative',
  'Laomedeia': 'Upbeat',
  'Achernar': 'Soft',
  'Alnilam': 'Firm',
  'Schedar': 'Even',
  'Gacrux': 'Mature',
  'Pulcherrima': 'Forward',
  'Achird': 'Friendly',
  'Zubenelgenubi': 'Casual',
  'Vindemiatrix': 'Gentle',
  'Sadachbia': 'Lively',
  'Sadaltager': 'Knowledgeable',
  'Sulafat': 'Warm'
} as const

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      text, 
      voice = 'Puck', 
      model = 'gemini-2.5-flash-tts', 
      language = 'en',
      user_level = 'intermediate',
      style_prompt 
    } = await req.json() as GeminiTTSRequest

    // Validate required fields
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create style prompt based on user level
    let adaptedStylePrompt = style_prompt || ''
    if (!style_prompt) {
      switch (user_level) {
        case 'beginner':
          adaptedStylePrompt = 'Speak slowly and clearly, with simple pronunciation for language learners'
          break
        case 'advanced':
          adaptedStylePrompt = 'Speak naturally with normal pace and natural expressions'
          break
        case 'intermediate':
        default:
          adaptedStylePrompt = 'Speak at a moderate pace with clear pronunciation'
          break
      }
    }

    // Prepare the request body for Gemini API
    const requestBody = {
      model: model,
      contents: [{
        parts: [{
          text: text
        }]
      }],
      generationConfig: {
        responseMimeType: "audio/wav",
        speechConfig: {
          voiceConfig: {
            name: voice
          }
        }
      }
    }

    // Add style prompt if provided
    if (adaptedStylePrompt) {
      requestBody.generationConfig.speechConfig.stylePrompt = adaptedStylePrompt
    }

    // Call Gemini TTS API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      return new Response(
        JSON.stringify({ 
          error: 'Text-to-speech generation failed',
          details: errorData,
          voice_used: voice,
          voice_characteristic: VOICE_CHARACTERISTICS[voice]
        }),
        { 
          status: geminiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the response and extract audio data
    const result = await geminiResponse.json()
    
    // Gemini returns base64 encoded audio in the response
    if (!result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      return new Response(
        JSON.stringify({ 
          error: 'No audio data received from Gemini',
          response: result 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Decode base64 audio data
    const base64Audio = result.candidates[0].content.parts[0].inlineData.data
    const audioBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
    
    // Return the audio with appropriate headers
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Voice-Used': voice,
        'X-Voice-Characteristic': VOICE_CHARACTERISTICS[voice],
        'X-Model-Used': model,
      },
    })

  } catch (error) {
    console.error('Gemini TTS function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})