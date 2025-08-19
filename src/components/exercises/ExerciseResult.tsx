import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/theme';
import { ExerciseAnswer, AnyExerciseQuestion } from '@/types/exercise';

interface ExerciseResultProps {
  question: AnyExerciseQuestion;
  answer: ExerciseAnswer;
  onExplain: () => void;
  onNext?: () => void;
}

export const ExerciseResult: React.FC<ExerciseResultProps> = ({
  question,
  answer,
  onExplain,
  onNext
}) => {
  const { theme } = useTheme();
  const [showingExplanation, setShowingExplanation] = useState(false);

  const getResultColor = () => {
    return answer.isCorrect ? '#58CC02' : '#FF4B4B';
  };

  const getResultIcon = () => {
    return answer.isCorrect ? '🎉' : '💡';
  };

  const getResultMessage = () => {
    if (answer.isCorrect) {
      if (answer.score === 100) {
        return 'Perfect! 🎉';
      } else {
        return `Great job! (${answer.score}%)`;
      }
    } else {
      return `Keep practicing! (${answer.score}%)`;
    }
  };

  const getResultSubtitle = () => {
    if (answer.isCorrect) {
      return 'You\'re mastering this concept!';
    } else {
      return 'Let\'s learn from this together';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCard }]}>
      {/* Beautiful Result Header */}
      <View style={styles.header}>
        <View style={styles.resultInfo}>
          <View style={[
            styles.resultIconContainer, 
            { backgroundColor: answer.isCorrect ? '#58CC02' : '#FF4B4B' }
          ]}>
            <Text style={styles.resultIcon}>{getResultIcon()}</Text>
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={[styles.resultText, { color: getResultColor() }]}>
              {getResultMessage()}
            </Text>
            <Text style={[styles.resultSubtitle, { color: theme.colors.textMuted }]}>
              {getResultSubtitle()}
            </Text>
          </View>
        </View>
      </View>

      {/* Answer Display with Modern Cards */}
      <View style={styles.answerSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
          Your Answer
        </Text>
        <View style={[
          styles.answerCard, 
          { 
            backgroundColor: answer.isCorrect ? '#E8F5E8' : '#FFE8E8',
            borderColor: answer.isCorrect ? '#58CC02' : '#FF4B4B'
          }
        ]}>
          <Text style={[styles.answerText, { color: theme.colors.textDark }]}>
            {Array.isArray(answer.userAnswer) 
              ? answer.userAnswer.map(a => a.toUpperCase()).join(', ') 
              : typeof answer.userAnswer === 'string' && answer.userAnswer.length === 1
                ? answer.userAnswer.toUpperCase()
                : answer.userAnswer}
          </Text>
        </View>
      </View>

      {/* Correct Answer (if wrong) */}
      {!answer.isCorrect && question.type === 'multiple_choice' && (
        <View style={styles.correctAnswerSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
            Correct Answer
          </Text>
          <View style={[styles.correctAnswerCard, { backgroundColor: '#E8F5E8', borderColor: '#58CC02' }]}>
            <Text style={[styles.correctAnswerText, { color: '#58CC02' }]}>
              {question.options?.find(opt => opt.isCorrect)?.text || 'N/A'}
            </Text>
          </View>
        </View>
      )}

      {/* Modern Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.explainButton, { backgroundColor: '#1CB0F6' }]}
          onPress={onExplain}
          activeOpacity={0.8}
        >
          <Text style={styles.explainButtonText}>💡 Learn More</Text>
        </TouchableOpacity>

        {onNext && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: '#58CC02' }]}
            onPress={onNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next Question →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Time Spent with Modern Design */}
      <View style={styles.timeSection}>
        <View style={[styles.timeContainer, { backgroundColor: theme.colors.bgLight }]}>
          <Text style={styles.timeIcon}>⏱️</Text>
          <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
            {Math.round(answer.timeSpent / 1000)}s
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: 24,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  resultIcon: {
    fontSize: 28,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  answerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  correctAnswerSection: {
    marginBottom: 20,
  },
  correctAnswerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  explainButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  explainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  timeSection: {
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timeIcon: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});