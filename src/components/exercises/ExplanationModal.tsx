import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { CustomModal } from '@/components/common';
import { useTheme } from '@/theme';
import { AnyExerciseQuestion, ExerciseAnswer } from '@/types/exercise';
import ExplanationService from '@/services/exercises/ExplanationService';

interface ExplanationModalProps {
  visible: boolean;
  question: AnyExerciseQuestion;
  answer: ExerciseAnswer;
  onClose: () => void;
  onDeepDive?: (topic: string) => void;
}

interface ExplanationData {
  explanation: string;
  correctAnswer?: string;
  keyPoints: string[];
  examples: Array<{
    correct: string;
    incorrect?: string;
    note: string;
  }>;
  grammarRule?: string;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  visible,
  question,
  answer,
  onClose,
  onDeepDive
}) => {
  const { theme } = useTheme();
  const [explanationData, setExplanationData] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !explanationData) {
      generateExplanation();
    }
  }, [visible]);

  const generateExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ExplanationService.generateExplanation({
        question,
        answer,
        requestType: 'basic'
      });

      setExplanationData(response);

    } catch (err) {
      console.error('Failed to generate explanation:', err);
      setError('Failed to generate explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepDive = async (topic: string) => {
    // Use the ExplanationService for deep dive requests
    setLoading(true);
    
    try {
      let requestType: 'grammar_rules' | 'more_examples' = 'grammar_rules';
      if (topic === 'more_examples') {
        requestType = 'more_examples';
      }

      const response = await ExplanationService.generateExplanation({
        question,
        answer,
        requestType
      });

      setExplanationData(response);
    } catch (err) {
      console.error('Failed to generate deep dive content:', err);
    } finally {
      setLoading(false);
    }
    
    // Also notify parent component
    onDeepDive?.(topic);
  };

  return (
    <CustomModal visible={visible} onClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.bgCard }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textDark }]}>
            💡 Why is it "{question.concept.replace(/_/g, ' ')}"?
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                Generating explanation...
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {explanationData && !loading && (
            <>
              {/* Main Explanation */}
              <View style={[styles.explanationCard, { backgroundColor: theme.colors.primary + '10' }]}>
                <Text style={[styles.explanationText, { color: theme.colors.textDark }]}>
                  {explanationData.explanation}
                </Text>
              </View>

              {/* Key Points */}
              {explanationData.keyPoints.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textDark }]}>
                    Key Points:
                  </Text>
                  {explanationData.keyPoints.map((point, index) => (
                    <View key={index} style={styles.bulletPoint}>
                      <Text style={[styles.bullet, { color: theme.colors.primary }]}>•</Text>
                      <Text style={[styles.bulletText, { color: theme.colors.textDark }]}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Examples */}
              {explanationData.examples.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textDark }]}>
                    Examples:
                  </Text>
                  {explanationData.examples.map((example, index) => (
                    <View key={index} style={[styles.exampleCard, { backgroundColor: theme.colors.success + '10' }]}>
                      <Text style={[styles.exampleText, { color: theme.colors.success }]}>
                        ✓ {example.correct}
                      </Text>
                      {example.incorrect && (
                        <Text style={[styles.exampleText, { color: theme.colors.error }]}>
                          ✗ {example.incorrect}
                        </Text>
                      )}
                      <Text style={[styles.exampleNote, { color: theme.colors.textMuted }]}>
                        {example.note}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Deep Dive Options */}
              <View style={styles.deepDiveSection}>
                <TouchableOpacity
                  style={[styles.deepDiveButton, { backgroundColor: theme.colors.accent }]}
                  onPress={() => handleDeepDive('grammar_rules')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deepDiveText}>Show Grammar Rules</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.deepDiveButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => handleDeepDive('more_examples')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deepDiveText}>More Examples</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    maxHeight: '80%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  explanationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    marginRight: 8,
    fontSize: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  exampleCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  exampleNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  deepDiveSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  deepDiveButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deepDiveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});