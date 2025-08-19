import { aiServices } from '@/services/ai';
import { supabase } from '@/lib/supabase';
import { AnyExerciseQuestion } from '@/types/exercise';

interface GenerationRequest {
  language: string;
  concept: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionType: 'multiple_choice' | 'fill_in_blank' | 'translation';
  count: number;
}

interface LanguageConcept {
  concept: string;
  description: string;
  priority: number; // 1 = essential, 5 = advanced
  questionTypes: string[];
}

// Core concepts for any language (expandable)
const UNIVERSAL_CONCEPTS: LanguageConcept[] = [
  // Priority 1: Essential basics
  { concept: 'numbers_1_10', description: 'Numbers 1-10', priority: 1, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'greetings', description: 'Basic greetings and introductions', priority: 1, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'family_members', description: 'Family vocabulary', priority: 1, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'colors', description: 'Basic colors', priority: 1, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'present_tense_basic', description: 'Present tense - most common verbs', priority: 1, questionTypes: ['fill_in_blank', 'multiple_choice'] },
  
  // Priority 2: Common everyday
  { concept: 'food_drinks', description: 'Food and drinks vocabulary', priority: 2, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'time_expressions', description: 'Telling time and time expressions', priority: 2, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'weather', description: 'Weather vocabulary and expressions', priority: 2, questionTypes: ['multiple_choice', 'translation'] },
  { concept: 'body_parts', description: 'Body parts vocabulary', priority: 2, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  
  // Priority 3: Grammar essentials
  { concept: 'articles', description: 'Definite and indefinite articles', priority: 3, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'plurals', description: 'Singular to plural forms', priority: 3, questionTypes: ['fill_in_blank', 'multiple_choice'] },
  { concept: 'past_tense_basic', description: 'Past tense - common verbs', priority: 3, questionTypes: ['fill_in_blank', 'multiple_choice'] },
  { concept: 'questions_basic', description: 'Forming basic questions', priority: 3, questionTypes: ['multiple_choice', 'translation'] },
  
  // Priority 4: Intermediate
  { concept: 'comparatives', description: 'Comparative and superlative forms', priority: 4, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  { concept: 'conditional', description: 'Conditional mood/tense', priority: 4, questionTypes: ['fill_in_blank', 'multiple_choice'] },
  { concept: 'prepositions', description: 'Common prepositions', priority: 4, questionTypes: ['multiple_choice', 'fill_in_blank'] },
  
  // Priority 5: Advanced
  { concept: 'subjunctive', description: 'Subjunctive mood', priority: 5, questionTypes: ['fill_in_blank', 'multiple_choice'] },
  { concept: 'idioms_common', description: 'Common idiomatic expressions', priority: 5, questionTypes: ['multiple_choice', 'translation'] },
];

// Most popular languages (start with these)
const PRIORITY_LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese', 'Korean', 
  'Chinese', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Polish', 'Turkish',
  'Vietnamese', 'Thai', 'Indonesian', 'Hebrew', 'Czech', 'Hungarian', 'Finnish', 'Greek'
];

class QuestionGenerationService {
  private static instance: QuestionGenerationService;

  static getInstance(): QuestionGenerationService {
    if (!QuestionGenerationService.instance) {
      QuestionGenerationService.instance = new QuestionGenerationService();
    }
    return QuestionGenerationService.instance;
  }

  /**
   * Generate a batch of questions for a specific language/concept
   */
  async generateQuestionBatch(request: GenerationRequest): Promise<AnyExerciseQuestion[]> {
    const prompt = this.createGenerationPrompt(request);
    
    try {
      console.log(`Generating ${request.count} ${request.questionType} questions for ${request.language} - ${request.concept}`);
      
      const response = await aiServices.chat(prompt, {
        language: request.language,
        user_level: request.difficulty,
        context: `Question generation for ${request.concept}`,
        provider: 'openai' // Use OpenAI for structured generation
      });

      const questions = this.parseGeneratedQuestions(response.data, request);
      console.log(`Generated ${questions.length} questions successfully`);
      
      return questions;

    } catch (error) {
      console.error('Failed to generate questions:', error);
      return [];
    }
  }

  /**
   * Batch generate questions for an entire language
   */
  async generateLanguageQuestionBank(
    language: string, 
    priorityLevel: number = 2, // 1=only essentials, 5=everything
    questionsPerConcept: number = 10
  ): Promise<void> {
    console.log(`🚀 Starting question bank generation for ${language} (priority ${priorityLevel})`);
    
    const concepts = UNIVERSAL_CONCEPTS.filter(c => c.priority <= priorityLevel);
    let totalGenerated = 0;

    for (const concept of concepts) {
      console.log(`📝 Generating questions for concept: ${concept.concept}`);
      
      for (const questionType of concept.questionTypes) {
        for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
          try {
            const questions = await this.generateQuestionBatch({
              language,
              concept: concept.concept,
              difficulty,
              questionType: questionType as any,
              count: questionsPerConcept
            });

            if (questions.length > 0) {
              await this.saveQuestionsToDatabase(questions);
              totalGenerated += questions.length;
              console.log(`✅ Saved ${questions.length} ${difficulty} ${questionType} questions for ${concept.concept}`);
            }

            // Rate limiting - wait between batches
            await new Promise(resolve => setTimeout(resolve, 2000));

          } catch (error) {
            console.error(`❌ Failed to generate ${concept.concept} - ${questionType} - ${difficulty}:`, error);
          }
        }
      }
    }

    console.log(`🎉 Language bank complete! Generated ${totalGenerated} questions for ${language}`);
  }

  /**
   * Generate question banks for all priority languages
   */
  async generateAllLanguageBanks(priorityLevel: number = 1): Promise<void> {
    console.log(`🌍 Starting question bank generation for ${PRIORITY_LANGUAGES.length} languages`);
    
    for (const language of PRIORITY_LANGUAGES) {
      try {
        await this.generateLanguageQuestionBank(language, priorityLevel, 8); // 8 questions per concept/type/difficulty
        console.log(`✅ Completed ${language}`);
        
        // Wait between languages to respect API limits
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`❌ Failed to generate question bank for ${language}:`, error);
      }
    }
    
    console.log(`🎊 All language banks generated!`);
  }

  /**
   * Check which languages need more questions
   */
  async analyzeQuestionCoverage(): Promise<{
    language: string;
    questionCount: number;
    concepts: { concept: string; count: number }[];
  }[]> {
    const { data, error } = await supabase
      .from('exercise_questions')
      .select('target_language, concept')
      .order('target_language');

    if (error) {
      console.error('Failed to analyze coverage:', error);
      return [];
    }

    // Group by language and concept
    const coverage = data.reduce((acc, q) => {
      if (!acc[q.target_language]) {
        acc[q.target_language] = { total: 0, concepts: {} };
      }
      acc[q.target_language].total++;
      acc[q.target_language].concepts[q.concept] = (acc[q.target_language].concepts[q.concept] || 0) + 1;
      return acc;
    }, {} as any);

    return Object.entries(coverage).map(([language, data]: [string, any]) => ({
      language,
      questionCount: data.total,
      concepts: Object.entries(data.concepts).map(([concept, count]) => ({ concept: concept as string, count: count as number }))
    }));
  }

  private createGenerationPrompt(request: GenerationRequest): string {
    const { language, concept, difficulty, questionType, count } = request;
    
    return `You are a language learning expert. Generate ${count} high-quality ${questionType} questions for ${language} learners.

Target: ${difficulty} level students learning "${concept.replace(/_/g, ' ')}"

Requirements:
1. Questions must be practical and commonly used
2. Use authentic ${language} expressions
3. Include cultural context when appropriate
4. Vary sentence structures and vocabulary
5. Make distractors plausible but clearly wrong

${questionType === 'multiple_choice' ? `
Format each question as JSON:
{
  "concept": "${concept}",
  "text": "Complete: '[sentence with blank]'",
  "correctAnswer": "correct_option_text",
  "options": [
    {"id": "a", "text": "option1", "isCorrect": false, "explanation": "why wrong"},
    {"id": "b", "text": "correct_answer", "isCorrect": true, "explanation": "why correct"},
    {"id": "c", "text": "option3", "isCorrect": false, "explanation": "why wrong"},
    {"id": "d", "text": "option4", "isCorrect": false, "explanation": "why wrong"}
  ]
}` : ''}

${questionType === 'fill_in_blank' ? `
Format each question as JSON:
{
  "concept": "${concept}",
  "text": "Complete: '[sentence with _____ blank]'",
  "correctAnswers": ["answer1", "answer2"], 
  "hint": "helpful hint for learners"
}` : ''}

${questionType === 'translation' ? `
Format each question as JSON:
{
  "concept": "${concept}",
  "text": "Translate to ${language}: '[English sentence]'",
  "acceptableTranslations": ["translation1", "translation2"],
  "sourceLanguage": "English"
}` : ''}

Return a JSON array of exactly ${count} questions. No additional text.`;
  }

  private parseGeneratedQuestions(response: any, request: GenerationRequest): AnyExerciseQuestion[] {
    try {
      let parsed;
      
      if (typeof response === 'string') {
        // Extract JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          console.error('No JSON array found in response');
          return [];
        }
      } else if (Array.isArray(response)) {
        parsed = response;
      } else {
        console.error('Unexpected response format');
        return [];
      }

      return parsed.map((q: any, index: number) => ({
        id: `generated_${Date.now()}_${index}`,
        type: request.questionType,
        text: q.text,
        targetLanguage: request.language,
        concept: request.concept,
        difficulty: request.difficulty,
        ...(request.questionType === 'multiple_choice' && {
          options: q.options || []
        }),
        ...(request.questionType === 'fill_in_blank' && {
          correctAnswers: q.correctAnswers || [q.correctAnswer],
          hint: q.hint
        }),
        ...(request.questionType === 'translation' && {
          sourceLanguage: q.sourceLanguage || 'English',
          acceptableTranslations: q.acceptableTranslations || [q.correctAnswer]
        })
      }));

    } catch (error) {
      console.error('Failed to parse generated questions:', error);
      return [];
    }
  }

  private async saveQuestionsToDatabase(questions: AnyExerciseQuestion[]): Promise<void> {
    const dbQuestions = questions.map(q => ({
      concept: q.concept,
      question_type: q.type,
      difficulty: q.difficulty,
      target_language: q.targetLanguage,
      question_text: q.text,
      correct_answer: q.type === 'multiple_choice' 
        ? (q as any).options?.find((opt: any) => opt.isCorrect)?.text
        : q.type === 'fill_in_blank' 
        ? (q as any).correctAnswers?.[0]
        : (q as any).acceptableTranslations?.[0],
      options: q.type === 'multiple_choice' ? (q as any).options : null,
      hints: q.type === 'fill_in_blank' ? (q as any).hint : null,
    }));

    const { error } = await supabase
      .from('exercise_questions')
      .insert(dbQuestions);

    if (error) {
      throw new Error(`Failed to save questions: ${error.message}`);
    }
  }
}

export default QuestionGenerationService.getInstance();