import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  handleCORSPreflight,
  parseRequestBody,
  getGeminiApiKey,
  createSuccessHeaders,
  createErrorResponse,
  createApiKeyError,
  createLanguageLearningPrompt,
  GEMINI_SAFETY_SETTINGS,
  UserLevel
} from '../_shared/utils.ts'

interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

interface GeminiRequest {
  prompt: string
  context?: string
  language?: string
  user_level?: UserLevel
  task_type?: 'conversation' | 'grammar_check' | 'translation' | 'explanation'
  history?: GeminiMessage[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { 
      prompt, 
      context,
      language = 'English',
      user_level = 'intermediate',
      task_type = 'conversation',
      history = []
    } = await parseRequestBody<GeminiRequest>(req, ['prompt'])

    // Get Gemini API key
    let geminiApiKey: string
    try {
      geminiApiKey = getGeminiApiKey()
    } catch (error) {
      return createApiKeyError('Gemini')
    }

    // Create system instruction based on task type and user level
    let taskDescription = ''
    switch (task_type) {
      case 'conversation':
        taskDescription = 'conversation practice'
        break
      case 'grammar_check':
        taskDescription = 'grammar analysis and correction'
        break
      case 'translation':
        taskDescription = 'translation assistance'
        break
      case 'explanation':
        taskDescription = 'language concept explanation'
        break
    }
    
    const systemInstruction = createLanguageLearningPrompt(
      user_level,
      language,
      taskDescription,
      context
    )

    // Prepare the conversation history
    const contents = [
      ...history,
      {
        role: 'user' as const,
        parts: [{ text: prompt }]
      }
    ]

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: GEMINI_SAFETY_SETTINGS
      }),
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      return createErrorResponse(
        'Gemini conversation failed',
        geminiResponse.status,
        errorData
      )
    }

    // Get the conversation result
    const result = await geminiResponse.json()
    
    // Return the conversation response
    return new Response(JSON.stringify(result), {
      headers: createSuccessHeaders('application/json', 'no-cache'),
    })

  } catch (error) {
    console.error('Gemini conversation function error:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
