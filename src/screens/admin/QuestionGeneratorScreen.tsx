import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/theme';
import QuestionGenerationService from '@/services/exercises/QuestionGenerationService';

export const QuestionGeneratorScreen: React.FC = () => {
  const { theme } = useTheme();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const handleGenerateLanguage = async (language: string) => {
    Alert.alert(
      'Generate Question Bank',
      `Generate questions for ${language}? This will take 5-10 minutes and use AI credits.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGenerating(true);
            setProgress(`Generating ${language} questions...`);
            
            try {
              await QuestionGenerationService.generateLanguageQuestionBank(language, 2, 5); // Priority 2, 5 questions each
              setProgress(`✅ ${language} complete!`);
              Alert.alert('Success', `Question bank for ${language} generated successfully!`);
            } catch (error) {
              console.error('Generation failed:', error);
              Alert.alert('Error', `Failed to generate ${language} questions. Check console for details.`);
            } finally {
              setGenerating(false);
              setTimeout(() => setProgress(''), 3000);
            }
          }
        }
      ]
    );
  };

  const handleGenerateAllPriority = async () => {
    Alert.alert(
      'Generate All Priority Languages',
      'This will generate questions for 24 popular languages. This is a long process (2-3 hours) and will use significant AI credits. Only run when needed!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Generation',
          style: 'destructive',
          onPress: async () => {
            setGenerating(true);
            setProgress('Starting bulk generation...');
            
            try {
              await QuestionGenerationService.generateAllLanguageBanks(1); // Only essentials
              setProgress('✅ All languages complete!');
              Alert.alert('Success', 'All priority language banks generated!');
            } catch (error) {
              console.error('Bulk generation failed:', error);
              Alert.alert('Error', 'Bulk generation failed. Check console for details.');
            } finally {
              setGenerating(false);
              setTimeout(() => setProgress(''), 5000);
            }
          }
        }
      ]
    );
  };

  const popularLanguages = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 'Dutch'
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bgLight }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textDark }]}>
            🏭 Question Bank Generator
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Generate AI-powered question banks for any language
          </Text>
        </View>

        {progress ? (
          <View style={[styles.progressCard, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.progressText, { color: theme.colors.primary }]}>
              {progress}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textDark }]}>
            Individual Languages
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
            Generate ~120 questions per language (essentials + common concepts)
          </Text>

          <View style={styles.languageGrid}>
            {popularLanguages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageButton,
                  { 
                    backgroundColor: theme.colors.bgCard,
                    borderColor: theme.colors.primary + '40'
                  }
                ]}
                onPress={() => handleGenerateLanguage(language)}
                disabled={generating}
                activeOpacity={0.7}
              >
                <Text style={[styles.languageButtonText, { color: theme.colors.textDark }]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textDark }]}>
            Bulk Generation
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
            Generate essential questions for all 24 priority languages
          </Text>

          <TouchableOpacity
            style={[
              styles.bulkButton,
              { 
                backgroundColor: generating ? theme.colors.textMuted + '40' : theme.colors.accent,
              }
            ]}
            onPress={handleGenerateAllPriority}
            disabled={generating}
            activeOpacity={0.8}
          >
            <Text style={styles.bulkButtonText}>
              {generating ? '⏳ Generating...' : '🚀 Generate All Priority Languages'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.warningCard, { backgroundColor: theme.colors.warning + '20' }]}>
          <Text style={[styles.warningTitle, { color: theme.colors.warning }]}>
            ⚠️ Important Notes
          </Text>
          <Text style={[styles.warningText, { color: theme.colors.textDark }]}>
            • Each language takes 5-10 minutes to generate{'\n'}
            • Uses OpenAI API credits (~$0.50-2.00 per language){'\n'}
            • Questions are automatically saved to database{'\n'}
            • Only run when you need new content{'\n'}
            • Generated questions may need quality review
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bulkButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  bulkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
});