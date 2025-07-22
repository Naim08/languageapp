import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  handleCORSPreflight,
  parseRequestBody,
  getOpenAIApiKey,
  createOpenAIHeaders,
  createSuccessHeaders,
  createErrorResponse,
  createValidationError,
  createApiKeyError,
  createLanguageLearningPrompt,
  UserLevel
} from '../_shared/utils.ts'

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ConversationRequest {
  messages: ConversationMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  language?: string
  user_level?: UserLevel
  context?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { 
      messages, 
      model = 'gpt-4o-mini', 
      max_tokens = 1000,
      temperature = 0.7,
      language = 'English',
      user_level = 'intermediate',
      context
    } = await parseRequestBody<ConversationRequest>(req, ['messages'])

    // Get OpenAI API key
    let openaiApiKey: string
    try {
      openaiApiKey = getOpenAIApiKey()
    } catch (error) {
      return createApiKeyError('OpenAI')
    }

    // Create system prompt using shared utility
    const systemPrompt = createLanguageLearningPrompt(
      user_level,
      language,
      'conversation practice',
      context
    )

    // Prepare messages with system prompt
    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ]

    // Call OpenAI Chat API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: createOpenAIHeaders(openaiApiKey),
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        max_tokens,
        temperature,
        user: 'language-learner', // For OpenAI usage tracking
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI Chat API error:', errorData)
      return createErrorResponse(
        'Conversation generation failed',
        openaiResponse.status,
        errorData
      )
    }

    // Get the conversation result
    const result = await openaiResponse.json()
    
    // Return the conversation response
    return new Response(JSON.stringify(result), {
      headers: createSuccessHeaders('application/json', 'no-cache'),
    })

  } catch (error) {
    console.error('Conversation function error:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
