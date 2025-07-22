import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  handleCORSPreflight,
  parseRequestBody,
  getGeminiApiKey,
  createSuccessHeaders,
  createErrorResponse,
  createApiKeyError,
  GEMINI_SAFETY_SETTINGS,
  UserLevel
} from '../_shared/utils.ts'

interface TranslationRequest {
  text: string
  source_language: string
  target_language: string
  user_level?: UserLevel
  include_explanation?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { 
      text, 
      source_language,
      target_language,
      user_level = 'intermediate',
      include_explanation = false
    } = await parseRequestBody<TranslationRequest>(req, ['text', 'source_language', 'target_language'])

    // Get Gemini API key
    let geminiApiKey: string
    try {
      geminiApiKey = getGeminiApiKey()
    } catch (error) {
      return createApiKeyError('Gemini')
    }

    // Create prompt based on user requirements
    let prompt = `Translate the following text from ${source_language} to ${target_language}:\n\n"${text}"\n\n`
    
    if (include_explanation) {
      prompt += `For a ${user_level} level language learner, please provide:
1. The translation
2. A brief explanation of any notable grammar, idioms, or cultural references
3. Alternative translations if applicable

Format your response as JSON with the following structure:
{
  "translation": "the translated text",
  "explanation": "explanation for language learners",
  "alternatives": ["alternative translation 1", "alternative translation 2"]
}`
    } else {
      prompt += `Provide only the translation.`
    }

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent translations
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: GEMINI_SAFETY_SETTINGS
      }),
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini Translation API error:', errorData)
      return createErrorResponse(
        'Translation failed',
        geminiResponse.status,
        errorData
      )
    }

    // Get the translation result
    const result = await geminiResponse.json()
    
    // Return the translation response
    return new Response(JSON.stringify({
      original_text: text,
      source_language,
      target_language,
      user_level,
      result
    }), {
      headers: createSuccessHeaders('application/json', 'public, max-age=1800'),
    })

  } catch (error) {
    console.error('Translation function error:', error)
    return createErrorResponse('Internal server error', 500, error.message)
  }
})
