import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MultipleChoiceQuestion } from '@/types/exercise';
import { Theme } from '@/types/theme';
import { OptionImage } from '@/components/ui/OptionImage';

interface MultipleChoiceExerciseProps {
  question?: MultipleChoiceQuestion;
  onAnswer?: (answer: string) => void;
  theme?: Theme;
}

export const MultipleChoiceExercise: React.FC<MultipleChoiceExerciseProps> = ({
  question,
  onAnswer,
  theme
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    // Give user a moment to see their selection, then submit
    setTimeout(() => onAnswer?.(optionId), 300);
  };

  // Return null if props not provided (will be injected by BaseExercise)
  if (!question || !onAnswer || !theme) {
    return null;
  }

  // Debug: Log question and options
  console.log('📱 DEBUG: MultipleChoice Rendering:', {
    questionText: question.question_text?.substring(0, 50),
    optionsCount: question.options?.length,
    options: question.options?.map(opt => ({
      id: opt.id,
      text: opt.text.substring(0, 30),
      hasImage: !!opt.imageUrl,
      imageUrlType: typeof opt.imageUrl,
      imageUrlLength: opt.imageUrl?.length,
      imageUrl: opt.imageUrl?.substring(0, 100)
    }))
  });
  
  // Extra debug for first option
  if (question.options?.length > 0) {
    const firstOpt = question.options[0];
    console.log('🔍 DEBUG: First option full details:', {
      allKeys: Object.keys(firstOpt),
      fullOption: JSON.stringify(firstOpt),
      imageUrlExactValue: firstOpt.imageUrl,
      truthyCheck: !!firstOpt.imageUrl
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        Select the correct answer:
      </Text>
      
      <View style={styles.gridContainer}>
        {question.options
          .sort((a, b) => a.id.localeCompare(b.id)) // Sort by ID: a, b, c, d
          .map((option, index) => {
          const isSelected = selectedOption === option.id;
          const letter = option.id.toUpperCase(); // Use actual option ID (a->A, b->B, etc.)
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.gridOption,
                { 
                  backgroundColor: isSelected 
                    ? '#58CC02' + '15' 
                    : 'white',
                  borderColor: isSelected 
                    ? '#58CC02' 
                    : '#E5E7EB',
                  borderWidth: isSelected ? 2.5 : 2,
                },
              ]}
              onPress={() => handleOptionSelect(option.id)}
              disabled={selectedOption !== null}
              activeOpacity={0.8}
            >
              {/* Image Section */}
              <View style={styles.imageSection}>
                {(() => {
                  // Debug logging for each option's image
                  console.log(`🖼️ DEBUG: Option ${letter} image check:`, {
                    hasImageUrl: !!option.imageUrl,
                    imageUrl: option.imageUrl,
                    willShowImage: !!option.imageUrl
                  });
                  
                  if (option.imageUrl) {
                    return (
                      <OptionImage
                        imageUrl={option.imageUrl}
                        alt={option.imageAlt || `Option ${letter}`}
                        size="large"
                        theme={theme}
                        style={styles.gridImage}
                      />
                    );
                  } else {
                    return (
                      <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderEmoji}>🌍</Text>
                      </View>
                    );
                  }
                })()}
              </View>
              
              {/* Letter Badge */}
              <View style={[
                styles.letterBadge,
                { 
                  backgroundColor: isSelected 
                    ? '#58CC02' 
                    : '#F3F4F6',
                }
              ]}>
                <Text style={[
                  styles.letterBadgeText,
                  { 
                    color: isSelected 
                      ? 'white' 
                      : '#6B7280',
                  }
                ]}>
                  {letter}
                </Text>
              </View>
              
              {/* Text Section */}
              <View style={styles.textSection}>
                <Text style={[
                  styles.gridOptionText,
                  { 
                    color: isSelected 
                      ? '#58CC02' 
                      : '#1F2937',
                  }
                ]} numberOfLines={2}>
                  {option.text}
                </Text>
              </View>
              
              {/* Checkmark for selected */}
              {isSelected && (
                <View style={styles.selectedCheckmark}>
                  <Text style={styles.checkmarkSymbol}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  instructions: {
    fontSize: 16,
    marginBottom: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#6B7280',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  gridOption: {
    width: '48%',
    aspectRatio: 0.9,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  placeholderImage: {
    width: '80%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  letterBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  letterBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  textSection: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    alignItems: 'center',
  },
  gridOptionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  checkmarkSymbol: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});