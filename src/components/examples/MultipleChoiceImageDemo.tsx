import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MultipleChoiceQuestion } from '@/types/exercise';
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise';
import { useTheme } from '@/theme';

export const MultipleChoiceImageDemo: React.FC = () => {
  const { theme } = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Sample question with images
  const sampleQuestion: MultipleChoiceQuestion = {
    id: 'demo-1',
    type: 'multiple_choice',
    text: 'What animal is this?',
    targetLanguage: 'Spanish',
    concept: 'animals',
    difficulty: 'beginner',
    options: [
      {
        id: 'a',
        text: 'perro',
        isCorrect: true,
        imageUrl: 'https://images.unsplash.com/photo-1547407139-3c921d66010c?w=200&h=200&fit=crop',
        imageAlt: 'A dog'
      },
      {
        id: 'b',
        text: 'gato',
        isCorrect: false,
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop',
        imageAlt: 'A cat'
      },
      {
        id: 'c',
        text: 'pájaro',
        isCorrect: false,
        imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=200&h=200&fit=crop',
        imageAlt: 'A bird'
      },
      {
        id: 'd',
        text: 'pez',
        isCorrect: false,
        imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&h=200&fit=crop',
        imageAlt: 'A fish'
      }
    ]
  };

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    console.log('Selected answer:', answer);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Multiple Choice with Images Demo
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Duolingo-style questions with images for each option
        </Text>
      </View>

      <View style={styles.demoContainer}>
        <MultipleChoiceExercise
          question={sampleQuestion}
          onAnswer={handleAnswer}
          theme={theme}
        />
      </View>

      {selectedAnswer && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: theme.colors.text }]}>
            Selected: {selectedAnswer}
          </Text>
          <Text style={[styles.resultText, { color: theme.colors.textMuted }]}>
            Correct answer: perro (a)
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          Features:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
          • Images load with loading indicators{'\n'}
          • Error handling with fallback placeholders{'\n'}
          • Accessibility support with alt text{'\n'}
          • Responsive sizing (small, medium, large){'\n'}
          • Smooth animations and transitions{'\n'}
          • Duolingo-style visual design
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  demoContainer: {
    marginBottom: 30,
  },
  resultContainer: {
    padding: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 30,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 4,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 