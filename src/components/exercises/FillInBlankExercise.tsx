import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FillInBlankQuestion } from '@/types/exercise';
import { Theme } from '@/types/theme';

interface FillInBlankExerciseProps {
  question?: FillInBlankQuestion;
  onAnswer?: (answer: string) => void;
  theme?: Theme;
}

export const FillInBlankExercise: React.FC<FillInBlankExerciseProps> = ({
  question,
  onAnswer,
  theme
}) => {
  const [userInput, setUserInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (userInput.trim() && !isSubmitted) {
      setIsSubmitted(true);
      onAnswer?.(userInput.trim());
    }
  };

  // Return null if props not provided (will be injected by BaseExercise)
  if (!question || !onAnswer || !theme) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.instructions, { color: theme.colors.textMuted }]}>
        Fill in the blank:
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.colors.bgCard,
              color: theme.colors.textDark,
              borderColor: userInput.trim() 
                ? theme.colors.primary 
                : theme.colors.textMuted + '40',
            }
          ]}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Type your answer..."
          placeholderTextColor={theme.colors.textMuted}
          editable={!isSubmitted}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        
        {question.hint && (
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            💡 Hint: {question.hint}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          {
            backgroundColor: userInput.trim() && !isSubmitted
              ? theme.colors.primary
              : theme.colors.textMuted + '40',
          }
        ]}
        onPress={handleSubmit}
        disabled={!userInput.trim() || isSubmitted}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.submitButtonText,
          {
            color: userInput.trim() && !isSubmitted
              ? 'white'
              : theme.colors.textMuted,
          }
        ]}>
          {isSubmitted ? 'Submitted' : 'Submit Answer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  instructions: {
    fontSize: 14,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 56,
    textAlignVertical: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});