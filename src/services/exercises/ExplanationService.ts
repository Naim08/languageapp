import { aiServices } from '@/services/ai';
import { AnyExerciseQuestion, ExerciseAnswer } from '@/types/exercise';

interface ExplanationRequest {
  question: AnyExerciseQuestion;
  answer: ExerciseAnswer;
  requestType: 'basic' | 'grammar_rules' | 'more_examples';
}

interface ExplanationResponse {
  explanation: string;
  keyPoints: string[];
  examples: Array<{
    correct: string;
    incorrect?: string;
    note: string;
  }>;
  grammarRule?: string;
  relatedConcepts?: string[];
}

class ExplanationService {
  private static instance: ExplanationService;

  static getInstance(): ExplanationService {
    if (!ExplanationService.instance) {
      ExplanationService.instance = new ExplanationService();
    }
    return ExplanationService.instance;
  }

  /**
   * Generate a plain-English explanation for an exercise answer
   */
  async generateExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
    try {
      const prompt = this.createPrompt(request);
      
      const response = await aiServices.chat(prompt, {
        language: request.question.targetLanguage,
        user_level: request.question.difficulty,
        context: `Exercise explanation for concept: ${request.question.concept}`,
        provider: 'openai' // Use OpenAI for now since Gemini has API issues
      });

      return this.parseResponse(response.data, request);
    } catch (error) {
      console.error('Failed to generate AI explanation:', error);
      
      // Return fallback explanation
      return this.createFallbackExplanation(request);
    }
  }

  /**
   * Create context-aware prompt for different types of explanations
   */
  private createPrompt(request: ExplanationRequest): string {
    const { question, answer, requestType } = request;
    const userAnswer = Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer;
    const conceptDisplay = question.concept.replace(/_/g, ' ');

    const baseContext = `You are an encouraging language tutor. A ${question.difficulty} level student answered this ${question.targetLanguage} question:

Question: "${question.text}"
Student's answer: "${userAnswer}"
Result: ${answer.isCorrect ? 'Correct' : 'Incorrect'} (Score: ${answer.score}%)
Grammar concept: ${conceptDisplay}`;

    switch (requestType) {
      case 'basic':
        return `${baseContext}

Provide a warm, encouraging explanation (max 90 words) that:
1. Acknowledges their effort
2. Explains why the answer is correct/incorrect in simple terms
3. Teaches the key grammar concept
4. Gives 1-2 clear examples

Format as JSON:
{
  "explanation": "encouraging explanation in plain English",
  "keyPoints": ["main learning point 1", "main learning point 2"],
  "examples": [{"correct": "example sentence", "note": "why this works"}],
  "grammarRule": "simple rule if needed"
}`;

      case 'grammar_rules':
        return `${baseContext}

Provide detailed grammar rules for the concept "${conceptDisplay}":
1. The complete rule in simple terms
2. When to use it
3. Common exceptions
4. 3-4 varied examples

Format as JSON with detailed grammarRule and examples fields.`;

      case 'more_examples':
        return `${baseContext}

Provide 5-6 diverse examples for the concept "${conceptDisplay}":
1. Mix of correct and incorrect examples
2. Different contexts and situations
3. Clear explanations for each
4. Increasing difficulty

Format as JSON with expanded examples array.`;

      default:
        return this.createPrompt({ ...request, requestType: 'basic' });
    }
  }

  /**
   * Parse AI response into structured explanation data
   */
  private parseResponse(aiResponse: any, request: ExplanationRequest): ExplanationResponse {
    console.log('AI Response:', aiResponse); // Debug log
    
    try {
      let parsed;
      
      if (typeof aiResponse === 'string') {
        // Extract JSON from response if wrapped in markdown or text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('JSON parse failed, using text response');
            // If JSON parsing fails, create basic structure from text
            return {
              explanation: aiResponse.substring(0, 300),
              keyPoints: [],
              examples: [],
            };
          }
        } else {
          console.log('No JSON found, creating structure from text');
          // If no JSON found, create structure from text
          return {
            explanation: aiResponse.substring(0, 300),
            keyPoints: [],
            examples: [],
          };
        }
      } else if (aiResponse && typeof aiResponse === 'object') {
        parsed = aiResponse;
      } else {
        console.log('Unexpected response format:', typeof aiResponse);
        return this.createFallbackExplanation(request);
      }

      // Validate and clean the response
      return {
        explanation: this.cleanText(parsed.explanation || parsed.response || parsed.text || 'Here\'s an explanation of this concept.'),
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(this.cleanText) : [],
        examples: this.validateExamples(parsed.examples || []),
        grammarRule: parsed.grammarRule ? this.cleanText(parsed.grammarRule) : undefined,
        relatedConcepts: Array.isArray(parsed.relatedConcepts) ? parsed.relatedConcepts : undefined,
      };

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Using fallback explanation');
      return this.createFallbackExplanation(request);
    }
  }

  /**
   * Create fallback explanation when AI fails
   */
  private createFallbackExplanation(request: ExplanationRequest): ExplanationResponse {
    const { question, answer } = request;
    const isCorrect = answer.isCorrect;
    const concept = question.concept.replace(/_/g, ' ');

    let explanation = isCorrect 
      ? `Great work! You correctly understood the ${concept} concept.`
      : `Not quite right, but that's how we learn! Let's look at the ${concept} concept.`;

    // Add specific feedback for multiple choice questions
    if (question.type === 'multiple_choice' && question.options) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption?.explanation) {
        explanation += ` ${correctOption.explanation}`;
      }
    }

    return {
      explanation,
      keyPoints: [
        `Focus on the ${concept} grammar pattern`,
        'Practice with similar examples',
      ],
      examples: [],
    };
  }

  /**
   * Clean and validate text content
   */
  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/^\s*["']|["']\s*$/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 500); // Reasonable length limit
  }

  /**
   * Validate and structure examples
   */
  private validateExamples(examples: any[]): Array<{ correct: string; incorrect?: string; note: string }> {
    if (!Array.isArray(examples)) return [];

    return examples
      .filter(ex => ex && typeof ex === 'object')
      .map(ex => ({
        correct: this.cleanText(ex.correct || ''),
        incorrect: ex.incorrect ? this.cleanText(ex.incorrect) : undefined,
        note: this.cleanText(ex.note || ex.explanation || ''),
      }))
      .filter(ex => ex.correct && ex.note) // Must have correct example and note
      .slice(0, 6); // Limit to 6 examples
  }

  /**
   * Get explanation for a specific grammar concept
   */
  async getConceptExplanation(concept: string, language: string, userLevel: string): Promise<ExplanationResponse> {
    const prompt = `Explain the ${language} grammar concept "${concept.replace(/_/g, ' ')}" to a ${userLevel} level learner.

Provide:
1. Clear definition in simple terms
2. When and how to use it
3. 3-4 practical examples
4. Common mistakes to avoid

Format as JSON with explanation, keyPoints, examples, and grammarRule fields.`;

    try {
      const response = await aiServices.chat(prompt, {
        language,
        user_level: userLevel,
        context: `Grammar concept explanation: ${concept}`,
        provider: 'openai'
      });

      return this.parseResponse(response.data, {
        question: {
          concept,
          targetLanguage: language,
          difficulty: userLevel
        } as any,
        answer: {} as any,
        requestType: 'grammar_rules'
      });

    } catch (error) {
      console.error('Failed to get concept explanation:', error);
      return {
        explanation: `The ${concept.replace(/_/g, ' ')} concept is an important part of ${language} grammar.`,
        keyPoints: ['Study the basic rules', 'Practice with examples'],
        examples: [],
      };
    }
  }
}

export default ExplanationService.getInstance();