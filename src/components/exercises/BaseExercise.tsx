import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AnyExerciseQuestion, ExerciseAnswer } from '@/types/exercise';
import ExerciseService from '@/services/exercises/ExerciseService';

interface BaseExerciseProps {
  question: AnyExerciseQuestion;
  onAnswer: (answer: ExerciseAnswer) => void;
  children: React.ReactNode;
}

export const BaseExercise: React.FC<BaseExerciseProps> = ({ 
  question, 
  onAnswer, 
  children 
}) => {
  const { theme } = useTheme();
  const [startTime] = useState(Date.now());

  const handleAnswer = (userAnswer: string | string[]) => {
    const timeSpent = Date.now() - startTime;
    const scoredAnswer = ExerciseService.scoreAnswer(question, userAnswer, timeSpent);
    onAnswer(scoredAnswer);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.conceptBadge, { backgroundColor: '#1CB0F6' }]}>
            <Text style={styles.conceptText}>
              {question.concept.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: '#E5E7EB' }]}>
            <Text style={styles.difficultyText}>
              {question.difficulty}
            </Text>
          </View>
        </View>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, { backgroundColor: '#58CC02' }]} />
          <View style={[styles.progressDot, { backgroundColor: '#E5E7EB' }]} />
          <View style={[styles.progressDot, { backgroundColor: '#E5E7EB' }]} />
        </View>
      </View>

      {/* Premium Question Card */}
      <View style={[styles.questionContainer, { backgroundColor: 'white' }]}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionLabel}>Choose the correct translation for:</Text>
        </View>
        <View style={styles.questionContent}>
          <Text style={styles.questionText}>
            {question.text
              .replace('Choose the correct translation for: ', '')
              .replace(/^["']|["']$/g, '') // Remove quotes from start/end
            }
          </Text>
        </View>
      </View>

      {/* Exercise-specific content */}
      {(() => {
        console.log('🔄 BaseExercise passing props:', {
          questionType: question.type,
          questionText: question.text?.substring(0, 50),
          hasOptions: 'options' in question,
          optionsCount: (question as any).options?.length,
          firstOption: (question as any).options?.[0]
        });
        
        return React.cloneElement(children as React.ReactElement, { 
          question, 
          onAnswer: handleAnswer,
          theme 
        });
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conceptBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  conceptText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  progressIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  questionContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  questionHeader: {
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionContent: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
});