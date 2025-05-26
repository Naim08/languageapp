import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { AudioVisualizer } from '@/components/audio';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';
import { SpeechLanguage, SpeechRecognitionError } from '@/services/speech/types';

const languages: { code: SpeechLanguage; name: string }[] = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
];

export const SpeechRecognitionDemo: React.FC = () => {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<SpeechLanguage>('en-US');
  
  const {
    isListening,
    isAvailable,
    transcript,
    partialTranscript,
    error,
    audioLevel,
    currentLanguage,
    start,
    stop,
    cancel,
    switchLanguage,
    clearTranscript,
    clearError,
  } = useSpeechRecognition({
    language: selectedLanguage,
    onResult: (result) => {
      console.log('Speech result:', result);
    },
    onError: (error: SpeechRecognitionError) => {
      console.error('Speech recognition error:', error);
      Alert.alert('Speech Recognition Error', error.description);
    },
  });

  const handleLanguageChange = async (language: SpeechLanguage) => {
    setSelectedLanguage(language);
    try {
      await switchLanguage(language);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  const handleStartListening = async () => {
    try {
      clearError();
      await start(selectedLanguage);
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  };

  const handleStopListening = async () => {
    try {
      await stop();
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  };

  const handleClearTranscript = () => {
    clearTranscript();
  };

  if (!isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgDark }}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: theme.spacing.lg 
        }}>
          <Text style={{ 
            color: theme.colors.error,
            fontSize: theme.typography.h3,
            textAlign: 'center',
            marginBottom: theme.spacing.lg
          }}>
            Speech recognition is not available
          </Text>
          <Text style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.body,
            textAlign: 'center'
          }}>
            Please check your device settings and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgDark }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ 
          padding: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.bgCard
        }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h2,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: theme.spacing.md
          }}>
            Speech Recognition Demo
          </Text>
          <Text style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.body,
            textAlign: 'center'
          }}>
            Test speech recognition with different languages
          </Text>
        </View>

        <View style={{ padding: theme.spacing.lg }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Select Language
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ 
              flexDirection: 'row', 
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.sm
            }}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  style={{
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: selectedLanguage === lang.code 
                      ? theme.colors.primary 
                      : theme.colors.bgCard,
                    borderWidth: 1,
                    borderColor: selectedLanguage === lang.code 
                      ? theme.colors.primary 
                      : theme.colors.textMuted + '30',
                  }}
                >
                  <Text style={{
                    color: selectedLanguage === lang.code 
                      ? theme.colors.textDark 
                      : theme.colors.textMuted,
                    fontSize: theme.typography.caption,
                    fontWeight: '500',
                    textAlign: 'center'
                  }}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={{
          alignItems: 'center',
          padding: theme.spacing.lg
        }}>
          <AudioVisualizer
            audioLevel={audioLevel}
            isListening={isListening}
            isProcessing={false}
            size={150}
            strokeWidth={3}
            showWaveform={true}
            animationSpeed="normal"
          />
        </View>

        <View style={{ 
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg
        }}>
          <View style={{
            backgroundColor: theme.colors.bgCard,
            padding: theme.spacing.lg,
            borderRadius: theme.borderRadius.lg,
            marginBottom: theme.spacing.md
          }}>
            <Text style={{ 
              color: theme.colors.textDark,
              fontSize: theme.typography.body,
              fontWeight: '600',
              marginBottom: theme.spacing.sm
            }}>
              Status
            </Text>
            <Text style={{ 
              color: isListening ? theme.colors.success : theme.colors.textMuted,
              fontSize: theme.typography.body
            }}>
              {isListening ? 'Listening...' : 'Ready to listen'}
            </Text>
            <Text style={{ 
              color: theme.colors.textMuted,
              fontSize: theme.typography.caption,
              marginTop: theme.spacing.xs
            }}>
              Language: {currentLanguage} | Audio Level: {Math.round(audioLevel)}%
            </Text>
          </View>

          {partialTranscript && (
            <View style={{
              backgroundColor: theme.colors.accent + '20',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              borderWidth: 1,
              borderColor: theme.colors.accent,
              marginBottom: theme.spacing.md
            }}>
              <Text style={{ 
                color: theme.colors.textDark,
                fontSize: theme.typography.caption,
                fontWeight: '600',
                marginBottom: theme.spacing.xs
              }}>
                Partial Result:
              </Text>
              <Text style={{ 
                color: theme.colors.textDark,
                fontSize: theme.typography.body,
                fontStyle: 'italic'
              }}>
                {partialTranscript}
              </Text>
            </View>
          )}

          <View style={{
            backgroundColor: theme.colors.bgCard,
            padding: theme.spacing.lg,
            borderRadius: theme.borderRadius.lg,
            minHeight: 120
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.md
            }}>
              <Text style={{ 
                color: theme.colors.textDark,
                fontSize: theme.typography.body,
                fontWeight: '600'
              }}>
                Transcript
              </Text>
              {transcript && (
                <TouchableOpacity onPress={handleClearTranscript}>
                  <Text style={{ 
                    color: theme.colors.accent,
                    fontSize: theme.typography.caption,
                    fontWeight: '500'
                  }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={{ maxHeight: 100 }}>
              <Text style={{ 
                color: transcript ? theme.colors.textDark : theme.colors.textMuted,
                fontSize: theme.typography.body,
                lineHeight: 24
              }}>
                {transcript || 'Your speech will appear here...'}
              </Text>
            </ScrollView>
          </View>
        </View>

        <View style={{ 
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md
        }}>
          <Button
            title={isListening ? 'Stop Listening' : 'Start Listening'}
            variant={isListening ? 'secondary' : 'primary'}
            size="large"
            onPress={isListening ? handleStopListening : handleStartListening}
          />
          
          <Button
            title="Cancel"
            variant="ghost"
            size="medium"
            onPress={cancel}
            disabled={!isListening}
          />
        </View>

        {error && (
          <View style={{
            margin: theme.spacing.lg,
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.error + '20',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.error,
          }}>
            <Text style={{
              color: theme.colors.error,
              fontSize: theme.typography.body,
              fontWeight: '600',
              marginBottom: theme.spacing.sm
            }}>
              Error: {error.code}
            </Text>
            <Text style={{
              color: theme.colors.error,
              fontSize: theme.typography.caption,
              marginBottom: theme.spacing.md
            }}>
              {error.description}
            </Text>
            <Button
              title="Dismiss Error"
              variant="ghost"
              size="small"
              onPress={clearError}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
