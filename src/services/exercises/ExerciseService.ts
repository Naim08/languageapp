import { 
  AnyExerciseQuestion, 
  ExerciseAnswer, 
  ExerciseResult, 
  ExerciseAttempt,
  ExerciseProgress,
  MultipleChoiceQuestion,
  FillInBlankQuestion,
  TranslationQuestion,
  PronunciationQuestion 
} from '@/types/exercise';
import StorageService from '@/services/storage/StorageService';
import { supabase } from '@/lib/supabase';

class ExerciseService {
  private static instance: ExerciseService;
  private storage = StorageService;
  private imagesByQuestion: Record<string, Record<string, string>> = {};
  private questionsWithCompleteImages: string[] = [];

  static getInstance(): ExerciseService {
    if (!ExerciseService.instance) {
      ExerciseService.instance = new ExerciseService();
    }
    return ExerciseService.instance;
  }

  /**
   * Score a user's answer to an exercise question
   */
  scoreAnswer(question: AnyExerciseQuestion, userAnswer: string | string[], timeSpent: number): ExerciseAnswer {
    const startTime = Date.now();
    let isCorrect = false;
    let score = 0;

    switch (question.type) {
      case 'multiple_choice':
        isCorrect = this.scoreMultipleChoice(question, userAnswer as string);
        score = isCorrect ? 100 : 0;
        break;

      case 'fill_in_blank':
        const blankResult = this.scoreFillInBlank(question, userAnswer as string);
        isCorrect = blankResult.isCorrect;
        score = blankResult.score;
        break;

      case 'translation':
        const translationResult = this.scoreTranslation(question, userAnswer as string);
        isCorrect = translationResult.isCorrect;
        score = translationResult.score;
        break;

      case 'pronunciation':
        // For now, return partial score. Real implementation would use speech recognition
        score = 75; // Placeholder - would integrate with speech service
        isCorrect = score >= question.minimumAccuracy;
        break;

      default:
        throw new Error(`Unsupported question type: ${(question as any).type}`);
    }

    return {
      questionId: question.id,
      userAnswer,
      isCorrect,
      score,
      timeSpent,
      timestamp: new Date()
    };
  }

  /**
   * Score multiple choice questions
   */
  private scoreMultipleChoice(question: MultipleChoiceQuestion, userAnswer: string): boolean {
    return question.options.some(option => 
      option.id === userAnswer && option.isCorrect
    );
  }

  /**
   * Score fill-in-the-blank questions with fuzzy matching
   */
  private scoreFillInBlank(question: FillInBlankQuestion, userAnswer: string): { isCorrect: boolean; score: number } {
    const normalizedUserAnswer = this.normalizeAnswer(userAnswer);
    
    // Check for exact matches first
    const exactMatch = question.correctAnswers.some(correct => 
      this.normalizeAnswer(correct) === normalizedUserAnswer
    );
    
    if (exactMatch) {
      return { isCorrect: true, score: 100 };
    }

    // Check for partial matches (typos, etc.)
    let bestScore = 0;
    for (const correctAnswer of question.correctAnswers) {
      const similarity = this.calculateSimilarity(normalizedUserAnswer, this.normalizeAnswer(correctAnswer));
      bestScore = Math.max(bestScore, similarity);
    }

    // Consider it correct if similarity is above 80%
    return {
      isCorrect: bestScore >= 0.8,
      score: Math.round(bestScore * 100)
    };
  }

  /**
   * Score translation questions
   */
  private scoreTranslation(question: TranslationQuestion, userAnswer: string): { isCorrect: boolean; score: number } {
    const normalizedUserAnswer = this.normalizeAnswer(userAnswer);
    
    let bestScore = 0;
    for (const acceptableTranslation of question.acceptableTranslations) {
      const similarity = this.calculateSimilarity(
        normalizedUserAnswer, 
        this.normalizeAnswer(acceptableTranslation)
      );
      bestScore = Math.max(bestScore, similarity);
    }

    return {
      isCorrect: bestScore >= 0.7, // More lenient for translations
      score: Math.round(bestScore * 100)
    };
  }

  /**
   * Normalize answer for consistent comparison
   */
  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Safely parse options JSON string to array
   */
  private parseOptions(optionsString: string | null): any[] {
    console.log('🔍 parseOptions input:', {
      type: typeof optionsString,
      isNull: optionsString === null,
      length: optionsString?.length,
      sample: optionsString?.substring(0, 100)
    });
    
    if (!optionsString) return [];
    
    try {
      const parsed = JSON.parse(optionsString);
      console.log('✅ parseOptions parsed:', {
        isArray: Array.isArray(parsed),
        length: parsed?.length,
        firstOption: parsed?.[0]
      });
      
      if (!Array.isArray(parsed)) return [];
      
      // Ensure each option has the required fields and optional image fields
      const mappedOptions = parsed.map((option: any, index: number) => ({
        id: option.id || String.fromCharCode(97 + index), // a, b, c, d...
        text: option.text || '',
        isCorrect: option.isCorrect || false,
        explanation: option.explanation,
        imageUrl: option.imageUrl,
        imageAlt: option.imageAlt,
      }));
      
      console.log('🎯 parseOptions final output:', mappedOptions.map(opt => ({
        id: opt.id,
        hasImageUrl: !!opt.imageUrl,
        imageUrl: opt.imageUrl?.substring(0, 80)
      })));
      
      return mappedOptions;
    } catch (error) {
      console.error('Failed to parse question options JSON:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Store exercise attempt for analytics and progress tracking
   */
  async storeExerciseAttempt(question: AnyExerciseQuestion, answer: ExerciseAnswer): Promise<string | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for storing exercise attempt');
        return null;
      }

      // Store in Supabase
      const { data, error } = await supabase
        .from('exercise_attempts')
        .insert({
          user_id: user.id,
          question_id: question.id,
          question_text: question.text,
          question_type: question.type,
          concept: question.concept,
          difficulty: question.difficulty,
          target_language: question.targetLanguage,
          user_answer: Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer,
          is_correct: answer.isCorrect,
          score: answer.score,
          time_spent_ms: answer.timeSpent
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to store exercise attempt in Supabase:', error);
        
        // Fallback to local storage
        await this.storeAttemptLocally(question, answer);
        return null;
      }

      console.log('Exercise attempt stored successfully:', data.id);
      return data.id;

    } catch (error) {
      console.error('Failed to store exercise attempt:', error);
      
      // Fallback to local storage
      await this.storeAttemptLocally(question, answer);
      return null;
    }
  }

  /**
   * Fallback method to store attempts locally
   */
  private async storeAttemptLocally(question: AnyExerciseQuestion, answer: ExerciseAnswer): Promise<void> {
    try {
      const attempt: ExerciseAttempt = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionId: question.id,
        userId: 'local_user',
        answer,
        needsExplanation: false
      };

      const existingAttempts = await this.storage.getItem<ExerciseAttempt[]>('exercise_attempts') || [];
      existingAttempts.push(attempt);
      await this.storage.setItem('exercise_attempts', existingAttempts);
    } catch (error) {
      console.error('Failed to store attempt locally:', error);
    }
  }

  /**
   * Track explanation request
   */
  async trackExplanationRequest(attemptId: string, requestType: 'basic' | 'grammar_rules' | 'more_examples'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for tracking explanation request');
        return;
      }

      const { error } = await supabase
        .from('explanation_requests')
        .insert({
          user_id: user.id,
          attempt_id: attemptId,
          request_type: requestType,
          explanation_generated: true
        });

      if (error) {
        console.error('Failed to track explanation request:', error);
      } else {
        console.log('Explanation request tracked:', requestType);
      }

    } catch (error) {
      console.error('Failed to track explanation request:', error);
    }
  }

  /**
   * Calculate exercise result from multiple answers
   */
  calculateExerciseResult(
    exerciseId: string, 
    userId: string, 
    answers: ExerciseAnswer[]
  ): ExerciseResult {
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const averageScore = totalScore / answers.length;
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const accuracy = (correctAnswers / answers.length) * 100;
    const totalTimeSpent = answers.reduce((sum, answer) => sum + answer.timeSpent, 0);

    // Determine concepts mastered (score >= 80) vs need review (score < 60)
    const conceptScores = new Map<string, number[]>();
    
    // For now, we'll use placeholder concept analysis
    // In real implementation, this would analyze answer patterns
    const conceptsMastered: string[] = [];
    const conceptsToReview: string[] = [];

    return {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exerciseId,
      userId,
      answers,
      totalScore: averageScore,
      accuracy,
      timeSpent: totalTimeSpent,
      completedAt: new Date(),
      conceptsMastered,
      conceptsToReview
    };
  }

  /**
   * Get user's progress on a specific concept
   */
  async getConceptProgress(concept: string, targetLanguage: string): Promise<ExerciseProgress | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for getting concept progress');
        return null;
      }

      const { data, error } = await supabase
        .from('concept_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('concept', concept)
        .eq('target_language', targetLanguage)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Failed to get concept progress:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        concept: data.concept,
        attempts: data.total_attempts,
        correctAnswers: data.correct_attempts,
        averageScore: parseFloat(data.average_score),
        lastAttempt: new Date(data.last_attempt_at),
        masteryLevel: parseFloat(data.mastery_level),
        needsReview: data.needs_review
      };

    } catch (error) {
      console.error('Failed to get concept progress:', error);
      return null;
    }
  }

  /**
   * Get all concepts that need review for a user
   */
  async getConceptsNeedingReview(targetLanguage: string): Promise<ExerciseProgress[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for getting concepts needing review');
        return [];
      }

      const { data, error } = await supabase
        .from('concept_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_language', targetLanguage)
        .eq('needs_review', true)
        .order('last_attempt_at', { ascending: true });

      if (error) {
        console.error('Failed to get concepts needing review:', error);
        return [];
      }

      return data.map(item => ({
        concept: item.concept,
        attempts: item.total_attempts,
        correctAnswers: item.correct_attempts,
        averageScore: parseFloat(item.average_score),
        lastAttempt: new Date(item.last_attempt_at),
        masteryLevel: parseFloat(item.mastery_level),
        needsReview: item.needs_review
      }));

    } catch (error) {
      console.error('Failed to get concepts needing review:', error);
      return [];
    }
  }

  /**
   * Get next question WITH IMAGES ONLY
   * Only returns multiple choice questions where ALL options have images
   */
  async getNextQuestionWithImages(targetLanguage: string = 'Spanish', difficulty?: string): Promise<AnyExerciseQuestion | null> {
    console.log('🔍 DEBUG: getNextQuestionWithImages called', { targetLanguage, difficulty });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ DEBUG: No authenticated user for getting next question');
        return null;
      }
      console.log('✅ DEBUG: User authenticated:', user.id);
      
      // FIRST: Get all available images from generated_images table
      const { data: availableImages, error: imgError } = await supabase
        .from('generated_images')
        .select('image_url')
        .eq('language', targetLanguage)
        .eq('category', 'option');
      
      if (imgError) {
        console.error('❌ DEBUG: Failed to fetch generated_images:', imgError);
      } else {
        console.log(`📸 DEBUG: Found ${availableImages?.length || 0} images in generated_images for ${targetLanguage}`);
        
        // Parse question IDs from URLs
        const questionIdsWithImages = new Set();
        const imagesByQuestion = {};
        
        availableImages?.forEach(img => {
          // Extract question ID and option from URL pattern: q{questionId}-opt{optionId}
          const match = img.image_url.match(/q([0-9a-f]+)-opt([a-d])/);
          if (match) {
            const qId = match[1];
            const optId = match[2];
            
            if (!imagesByQuestion[qId]) {
              imagesByQuestion[qId] = {};
            }
            imagesByQuestion[qId][optId] = img.image_url;
            
            // Check if this question has all 4 options
            if (Object.keys(imagesByQuestion[qId]).length >= 4) {
              questionIdsWithImages.add(qId);
            }
          }
        });
        
        console.log(`✅ DEBUG: Found ${questionIdsWithImages.size} questions with complete images`);
        
        if (questionIdsWithImages.size > 0) {
          // Try to find these questions in exercise_questions
          const qIds = Array.from(questionIdsWithImages);
          console.log(`🔍 DEBUG: Looking for questions with IDs starting with:`, qIds.slice(0, 3));
          
          // Store for later use
          this.imagesByQuestion = imagesByQuestion;
          this.questionsWithCompleteImages = qIds;
        }
      }

      // Get a random question that has images
      const { data, error } = await supabase
        .rpc('get_next_question_with_images', {
          p_user_id: user.id,
          p_target_language: targetLanguage,
          p_difficulty: difficulty
        })
        .single();

      if (error) {
        // Fallback: manually find questions with images
        console.log('⚠️ DEBUG: RPC not found, using manual query. Error:', error.message);
        
        // First try the requested language
        // If we have questions with complete images from generated_images, prioritize those
        let { data: questions, error: queryError } = await supabase
          .from('exercise_questions')
          .select('*')
          .eq('question_type', 'multiple_choice')
          .eq('target_language', targetLanguage)
          .limit(1000);  // Increased from 200 to find more with images
        
        if (queryError) {
          console.error('❌ DEBUG: Failed to query exercise_questions:', queryError);
          return null;
        }
        
        console.log(`📊 DEBUG: Found ${questions?.length || 0} ${targetLanguage} questions`);
        
        // Debug first question structure
        if (questions && questions.length > 0) {
          console.log('🔍 DEBUG: First question structure:', {
            id: questions[0].id?.substring(0, 8),
            hasOptions: 'options' in questions[0],
            optionsType: typeof questions[0].options,
            optionsValue: questions[0].options
          });
        }
        
        // INJECT IMAGES FROM generated_images TABLE
        if (this.imagesByQuestion && questions) {
          console.log('💉 DEBUG: Injecting images from generated_images table...');
          
          questions = questions.map(q => {
            const questionIdPrefix = q.id?.substring(0, 8);
            const images = this.imagesByQuestion[questionIdPrefix];
            
            if (images && Object.keys(images).length >= 4) {
              // Parse options and inject image URLs
              let options;
              if (typeof q.options === 'string') {
                options = JSON.parse(q.options || '[]');
              } else if (Array.isArray(q.options)) {
                options = q.options;
              } else {
                options = [];
              }
              
              // Inject images into options
              const updatedOptions = options.map((opt: any) => {
                const imageUrl = images[opt.id];
                if (imageUrl) {
                  return { ...opt, imageUrl };
                }
                return opt;
              });
              
              // Return question with updated options
              return { ...q, options: updatedOptions };
            }
            
            return q;
          });
          
          console.log('✅ DEBUG: Image injection complete');
        }
        
        // Filter for questions where ALL options have images
        let questionsWithImages = (questions || []).filter(q => {
          try {
            // Handle both JSON string and already-parsed object
            let options;
            if (typeof q.options === 'string') {
              options = JSON.parse(q.options || '[]');
            } else if (Array.isArray(q.options)) {
              options = q.options;
            } else if (q.options && typeof q.options === 'object') {
              // Might be a Postgres JSON object
              options = Array.isArray(q.options) ? q.options : [];
            } else {
              options = [];
            }
            
            const hasAllImages = options.length > 0 && options.every((opt: any) => 
              opt && opt.imageUrl && opt.imageUrl.length > 0
            );
            
            // Log first few with images for debugging
            if (hasAllImages && questionsWithImages && questionsWithImages.length < 5) {
              console.log('📸 DEBUG: Question with images:', {
                id: q.id?.substring(0, 8),
                text: q.question_text?.substring(0, 40),
                optionCount: options.length,
                firstImageUrl: options[0]?.imageUrl?.substring(0, 80)
              });
            }
            
            return hasAllImages;
          } catch (error) {
            console.error('❌ DEBUG: Error parsing options for question', q.id?.substring(0, 8), error);
            return false;
          }
        });
        
        console.log(`🖼️ DEBUG: ${questionsWithImages.length} ${targetLanguage} questions have ALL options with images`);
        
        // If no questions with ALL options having images in requested language, try ANY language
        if (questionsWithImages.length === 0) {
          console.log(`⚠️ DEBUG: No questions with complete images in ${targetLanguage}, trying all languages...`);
          
          const { data: allQuestions, error: allError } = await supabase
            .from('exercise_questions')
            .select('*')
            .eq('question_type', 'multiple_choice')
            .limit(1000);  // Get all to find the 75 with images
          
          if (allError) {
            console.error('❌ DEBUG: Failed to query all questions:', allError);
            return null;
          }
          
          console.log(`📊 DEBUG: Found ${allQuestions?.length || 0} total questions across all languages`);
          
          questionsWithImages = (allQuestions || []).filter(q => {
            try {
              // Handle both JSON string and already-parsed object
              let options;
              if (typeof q.options === 'string') {
                options = JSON.parse(q.options || '[]');
              } else if (Array.isArray(q.options)) {
                options = q.options;
              } else if (q.options && typeof q.options === 'object') {
                options = Array.isArray(q.options) ? q.options : [];
              } else {
                options = [];
              }
              
              // Check that ALL options have images
              return options.length > 0 && options.every((opt: any) => 
                opt && opt.imageUrl && opt.imageUrl.length > 0
              );
            } catch (error) {
              console.error('❌ DEBUG: Error parsing options in all languages', q.id?.substring(0, 8), error);
              return false;
            }
          });
          
          if (questionsWithImages.length > 0) {
            console.log(`✅ DEBUG: Found ${questionsWithImages.length} questions with ALL options having images in other languages`);
            
            // Show language distribution
            const langCounts: Record<string, number> = {};
            questionsWithImages.forEach(q => {
              langCounts[q.target_language] = (langCounts[q.target_language] || 0) + 1;
            });
            console.log('🌍 DEBUG: Language distribution:', langCounts);
          }
        }
        
        if (questionsWithImages.length === 0) {
          console.log('❌ DEBUG: No questions found where ALL options have images');
          return null;
        }
        
        // Pick a random one
        const randomIndex = Math.floor(Math.random() * questionsWithImages.length);
        const selectedQuestion = questionsWithImages[randomIndex];
        
        console.log('🎯 DEBUG: Selected question:', {
          id: selectedQuestion.id?.substring(0, 8),
          language: selectedQuestion.target_language,
          text: selectedQuestion.question_text?.substring(0, 40)
        });
        
        return this.convertToExerciseQuestion(selectedQuestion);
      }

      if (!data) {
        console.log('❌ DEBUG: No more questions with images available from RPC');
        return null;
      }

      console.log('✅ DEBUG: Got question from RPC');
      return this.convertToExerciseQuestion(data);

    } catch (error) {
      console.error('❌ DEBUG: Failed to get next question with images:', error);
      return null;
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Convert database row to AnyExerciseQuestion format
   */
  private convertToExerciseQuestion(data: any): AnyExerciseQuestion {
    console.log('🗄️ Raw data from database:', {
      question_id: data.question_id || data.id,
      question_type: data.question_type,
      question_text: data.question_text?.substring(0, 50),
      options_type: typeof data.options,
      options_length: data.options?.length,
      options_sample: data.options ? 
        (typeof data.options === 'string' ? data.options.substring(0, 200) : data.options) 
        : null
    });

    // Convert database format to AnyExerciseQuestion
    let parsedOptions = this.parseOptions(data.options);
    
    // SHUFFLE OPTIONS to randomize correct answer position
    if (data.question_type === 'multiple_choice' && parsedOptions.length > 0) {
      console.log('🔀 DEBUG: Shuffling options to randomize correct answer position');
      
      // Log before shuffle
      const correctBefore = parsedOptions.find(opt => opt.isCorrect);
      console.log(`  Before shuffle: Correct answer is option ${correctBefore?.id}`);
      
      // Shuffle the options
      parsedOptions = this.shuffleArray(parsedOptions);
      
      // Reassign IDs based on new position
      parsedOptions = parsedOptions.map((opt, index) => ({
        ...opt,
        id: String.fromCharCode(97 + index) // a, b, c, d
      }));
      
      // Log after shuffle
      const correctAfter = parsedOptions.find(opt => opt.isCorrect);
      const correctIndex = parsedOptions.findIndex(opt => opt.isCorrect);
      console.log(`  After shuffle: Correct answer is now option ${String.fromCharCode(97 + correctIndex)}`);
    }
    
    console.log('📋 Parsed options with images:', parsedOptions.map(opt => ({
      id: opt.id,
      text: opt.text?.substring(0, 20),
      hasImageUrl: !!opt.imageUrl,
      imageUrl: opt.imageUrl?.substring(0, 80)
    })));

    const question: AnyExerciseQuestion = {
      id: data.question_id || data.id,
      type: data.question_type as any,
      text: data.question_text,
      targetLanguage: data.target_language,
      concept: data.concept || 'vocabulary',
      difficulty: data.difficulty as any || 'beginner',
      audioUrl: data.audio_url,
      imageUrl: data.image_url,
      ...(data.question_type === 'multiple_choice' && {
        options: parsedOptions
      }),
      ...(data.question_type === 'fill_in_blank' && {
        correctAnswers: [data.correct_answer],
        hint: data.hints
      }),
      ...(data.question_type === 'translation' && {
        sourceLanguage: 'English',
        acceptableTranslations: [data.correct_answer]
      }),
      ...(data.question_type === 'pronunciation' && {
        minimumAccuracy: 70
      })
    };

    // Track that user has seen this question
    this.markQuestionAsSeen(data.question_id || data.id);

    return question;
  }

  /**
   * Get next question for user - OPTIMIZED for 1M+ questions
   * Uses lightning-fast selection with minimal database overhead
   */
  async getNextQuestion(targetLanguage: string = 'Spanish', difficulty?: string): Promise<AnyExerciseQuestion | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for getting next question');
        return null;
      }

      // Use lightning-fast question selection (optimized for 1M+ questions)
      const { data, error } = await supabase
        .rpc('get_next_question_lightning', {
          p_user_id: user.id,
          p_target_language: targetLanguage,
          p_difficulty: difficulty
        })
        .single();

      if (error) {
        console.error('Failed to get next question:', error);
        return null;
      }

      if (!data) {
        console.log('No more questions available');
        return null;
      }

      return this.convertToExerciseQuestion(data);

    } catch (error) {
      console.error('Failed to get next question:', error);
      return null;
    }
  }

  /**
   * Mark question as seen by user for smart rotation
   */
  private async markQuestionAsSeen(questionId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_question_history')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          last_seen_at: new Date().toISOString(),
          times_seen: 1
        }, {
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false
        });

    } catch (error) {
      console.error('Failed to mark question as seen:', error);
    }
  }

  /**
   * Get analytics data for dashboard
   */
  async getAnalytics(targetLanguage: string, days: number = 30): Promise<{
    totalAttempts: number;
    averageScore: number;
    conceptsMastered: number;
    conceptsNeedingReview: number;
    recentActivity: Array<{ date: string; attempts: number; averageScore: number }>;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for getting analytics');
        return {
          totalAttempts: 0,
          averageScore: 0,
          conceptsMastered: 0,
          conceptsNeedingReview: 0,
          recentActivity: []
        };
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);

      // Get recent attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('exercise_attempts')
        .select('score, created_at')
        .eq('user_id', user.id)
        .eq('target_language', targetLanguage)
        .gte('created_at', daysAgo.toISOString());

      // Get concept progress
      const { data: concepts, error: conceptsError } = await supabase
        .from('concept_progress')
        .select('mastery_level, needs_review')
        .eq('user_id', user.id)
        .eq('target_language', targetLanguage);

      if (attemptsError || conceptsError) {
        console.error('Failed to get analytics:', attemptsError || conceptsError);
      }

      const totalAttempts = attempts?.length || 0;
      const averageScore = totalAttempts > 0 
        ? attempts!.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts 
        : 0;

      const conceptsMastered = concepts?.filter(c => parseFloat(c.mastery_level) >= 80).length || 0;
      const conceptsNeedingReview = concepts?.filter(c => c.needs_review).length || 0;

      // Group attempts by date for activity chart
      const activityMap = new Map<string, { attempts: number; totalScore: number }>();
      attempts?.forEach(attempt => {
        const date = new Date(attempt.created_at).toISOString().split('T')[0];
        const existing = activityMap.get(date) || { attempts: 0, totalScore: 0 };
        activityMap.set(date, {
          attempts: existing.attempts + 1,
          totalScore: existing.totalScore + attempt.score
        });
      });

      const recentActivity = Array.from(activityMap.entries()).map(([date, data]) => ({
        date,
        attempts: data.attempts,
        averageScore: data.totalScore / data.attempts
      }));

      return {
        totalAttempts,
        averageScore,
        conceptsMastered,
        conceptsNeedingReview,
        recentActivity
      };

    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalAttempts: 0,
        averageScore: 0,
        conceptsMastered: 0,
        conceptsNeedingReview: 0,
        recentActivity: []
      };
    }
  }
}

export default ExerciseService.getInstance();