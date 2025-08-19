import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Exercise, ExerciseResult, ExplanationModal } from '@/components/exercises';
import { AnyExerciseQuestion, ExerciseAnswer } from '@/types/exercise';
import ExerciseService from '@/services/exercises/ExerciseService';
import { useTheme } from '@/theme';
import { useRoute } from '@react-navigation/native';
import { ImageLoadTest } from '@/components/examples/ImageLoadTest';

export const ExerciseScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute();
  const imageOnly = (route.params as any)?.imageOnly || false;
  const [currentExercise, setCurrentExercise] = useState<AnyExerciseQuestion | null>(null);
  const [exerciseResult, setExerciseResult] = useState<ExerciseAnswer | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load first question on mount
  useEffect(() => {
    loadNextQuestion();
  }, []);

  const loadNextQuestion = async () => {
    setLoading(true);
    setError(null);
    setExerciseResult(null);
    setShowExplanation(false);
    setAttemptId(null);

    try {
      // ALWAYS use image mode for multiple choice questions
      const nextQuestion = await ExerciseService.getNextQuestionWithImages('Spanish');
      
      // Fallback to regular questions if no images available
      // const nextQuestion = imageOnly ? 
      //   await ExerciseService.getNextQuestionWithImages('Spanish') :
      //   await ExerciseService.getNextQuestion('Spanish');
        
      console.log('📚 Loaded question from database:', {
        imageOnlyMode: imageOnly,
        type: nextQuestion?.type,
        text: nextQuestion?.text?.substring(0, 50),
        hasOptions: nextQuestion && 'options' in nextQuestion,
        options: nextQuestion && 'options' in nextQuestion ? 
          (nextQuestion as any).options?.map((opt: any) => ({
            id: opt.id,
            text: opt.text?.substring(0, 30),
            hasImageUrl: !!opt.imageUrl,
            imageUrl: opt.imageUrl?.substring(0, 80)
          })) : null
      });
      
      if (nextQuestion) {
        setCurrentExercise(nextQuestion);
      } else {
        setError('Only 75 questions have complete images currently. More images are being generated! Try Chinese or Arabic language for now.');
      }
    } catch (err) {
      console.error('Failed to load next question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: ExerciseAnswer) => {
    if (!currentExercise) return;
    
    setExerciseResult(answer);
    console.log('Exercise Answer:', answer);
    
    // Store the attempt in the database
    try {
      const storedAttemptId = await ExerciseService.storeExerciseAttempt(currentExercise, answer);
      setAttemptId(storedAttemptId);
      console.log('Exercise attempt stored with ID:', storedAttemptId);
    } catch (error) {
      console.error('Failed to store exercise attempt:', error);
    }
  };

  const handleExplain = async () => {
    setShowExplanation(true);
    
    // Track explanation request
    if (attemptId) {
      try {
        await ExerciseService.trackExplanationRequest(attemptId, 'basic');
        console.log('Explanation request tracked');
      } catch (error) {
        console.error('Failed to track explanation request:', error);
      }
    }
  };

  const handleNext = async () => {
    console.log('Loading next exercise...');
    await loadNextQuestion();
  };

  const handleDeepDive = async (topic: string) => {
    console.log('Deep dive into:', topic);
    
    // Track deep dive request
    if (attemptId) {
      try {
        const requestType = topic === 'more_examples' ? 'more_examples' : 'grammar_rules';
        await ExerciseService.trackExplanationRequest(attemptId, requestType);
        console.log('Deep dive request tracked:', requestType);
      } catch (error) {
        console.error('Failed to track deep dive request:', error);
      }
    }
  };

  // TEMPORARY: Test if images can load
  if (false) {
    return (
      <SafeAreaView style={styles.container}>
        <ImageLoadTest />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Loading State */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
              Loading your next question...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadNextQuestion}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show exercise if no result yet */}
        {currentExercise && !exerciseResult && !loading && !error && (
          <Exercise 
            question={currentExercise}
            onAnswer={handleAnswer}
          />
        )}
        
        {/* Show result with lightbulb feedback */}
        {currentExercise && exerciseResult && !loading && (
          <ExerciseResult
            question={currentExercise}
            answer={exerciseResult}
            onExplain={handleExplain}
            onNext={handleNext}
          />
        )}
        
        {/* Explanation Modal */}
        {currentExercise && exerciseResult && (
          <ExplanationModal
            visible={showExplanation}
            question={currentExercise}
            answer={exerciseResult}
            onClose={() => setShowExplanation(false)}
            onDeepDive={handleDeepDive}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});