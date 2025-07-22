import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AudioVisualizer } from '@/components/audio';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';
import { SpeechLanguage } from '@/services/speech/types';

const testLanguages: { code: SpeechLanguage; name: string; flag: string; testPhrase: string }[] = [
  { 
    code: 'en-US', 
    name: 'English (US)', 
    flag: '🇺🇸', 
    testPhrase: 'Hello, this is a test in English.' 
  },
  { 
    code: 'es-ES', 
    name: 'Spanish', 
    flag: '🇪🇸', 
    testPhrase: 'Hola, esta es una prueba en español.' 
  },
  { 
    code: 'fr-FR', 
    name: 'French', 
    flag: '🇫🇷', 
    testPhrase: 'Bonjour, ceci est un test en français.' 
  },
  { 
    code: 'de-DE', 
    name: 'German', 
    flag: '🇩🇪', 
    testPhrase: 'Hallo, das ist ein Test auf Deutsch.' 
  },
  { 
    code: 'it-IT', 
    name: 'Italian', 
    flag: '🇮🇹', 
    testPhrase: 'Ciao, questo è un test in italiano.' 
  },
  { 
    code: 'pt-BR', 
    name: 'Portuguese', 
    flag: '🇧🇷', 
    testPhrase: 'Olá, este é um teste em português.' 
  },
];

const VoiceTestWithLanguages: React.FC = () => {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<SpeechLanguage>('en-US');
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; transcript: string; timestamp: Date }>>({});

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
    switchLanguage,
    clearTranscript,
    clearError,
  } = useSpeechRecognition({
    language: selectedLanguage,
    onResult: (result) => {
      console.log('Voice test result:', result);
      handleTestResult(result);
    },
    onError: (error) => {
      console.error('Voice test error:', error);
      Alert.alert('Speech Recognition Error', error.message || 'Unknown error');
    },
  });

  const handleTestResult = (result: string) => {
    const testLanguage = testLanguages.find(lang => lang.code === selectedLanguage);
    if (testLanguage && result.trim()) {
      const success = result.toLowerCase().includes(testLanguage.testPhrase.split(' ')[0].toLowerCase());
      setTestResults(prev => ({
        ...prev,
        [selectedLanguage]: {
          success,
          transcript: result,
          timestamp: new Date(),
        }
      }));
      clearTranscript();
    }
  };

  const handleLanguageChange = async (language: SpeechLanguage) => {
    try {
      setSelectedLanguage(language);
      await switchLanguage(language);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  const handleStartTest = async () => {
    try {
      clearError();
      clearTranscript();
      await start(selectedLanguage);
    } catch (error) {
      console.error('Failed to start test:', error);
    }
  };

  const handleStopTest = async () => {
    try {
      await stop();
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const clearAllResults = () => {
    setTestResults({});
  };

  const getCurrentTestPhrase = () => {
    const testLanguage = testLanguages.find(lang => lang.code === selectedLanguage);
    return testLanguage?.testPhrase || '';
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
            Multi-Language Voice Test
          </Text>
          <Text style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.body,
            textAlign: 'center'
          }}>
            Test speech recognition across different languages
          </Text>
        </View>

        {/* Language Selection */}
        <View style={{ padding: theme.spacing.lg }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Select Test Language
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ 
              flexDirection: 'row', 
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.sm
            }}>
              {testLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: selectedLanguage === lang.code ? theme.colors.primary : theme.colors.bgCard,
                    borderWidth: 1,
                    borderColor: selectedLanguage === lang.code ? theme.colors.primary : theme.colors.bgCard,
                    alignItems: 'center',
                    minWidth: 120,
                  }}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={{ fontSize: 24, marginBottom: theme.spacing.xs }}>
                    {lang.flag}
                  </Text>
                  <Text style={{
                    color: selectedLanguage === lang.code ? theme.colors.textLight : theme.colors.textDark,
                    fontWeight: selectedLanguage === lang.code ? '600' : 'normal',
                    textAlign: 'center',
                    fontSize: theme.typography.caption,
                  }}>
                    {lang.name}
                  </Text>
                  <Text style={{
                    color: selectedLanguage === lang.code ? theme.colors.textLight : theme.colors.textMuted,
                    fontSize: theme.typography.caption,
                    textAlign: 'center',
                    marginTop: theme.spacing.xs,
                  }}>
                    {lang.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Test Instructions */}
        <View style={{ 
          padding: theme.spacing.lg,
          paddingTop: 0
        }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Test Instructions
          </Text>
          
          <View style={{
            backgroundColor: theme.colors.bgCard,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.md,
          }}>
            <Text style={{ 
              color: theme.colors.textDark,
              fontSize: theme.typography.body,
              fontWeight: '600',
              marginBottom: theme.spacing.sm
            }}>
              Please say this phrase:
            </Text>
            <Text style={{ 
              color: theme.colors.primary,
              fontSize: theme.typography.body,
              fontStyle: 'italic'
            }}>
              "{getCurrentTestPhrase()}"
            </Text>
          </View>

          <View style={{ 
            flexDirection: 'row', 
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.md
          }}>
            <Button
              title={isListening ? "Stop Test" : "Start Test"}
              onPress={isListening ? handleStopTest : handleStartTest}
              style={{ flex: 1 }}
            />
            <Button
              title="Clear Results"
              onPress={clearAllResults}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>

          {isListening && (
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
              <AudioVisualizer
                audioLevel={audioLevel}
                isListening={isListening}
                size={120}
                strokeWidth={3}
              />
              <Text style={{ 
                color: theme.colors.primary,
                fontSize: theme.typography.body,
                marginTop: theme.spacing.sm,
                textAlign: 'center'
              }}>
                🎤 Listening... ({currentLanguage})
              </Text>
            </View>
          )}

          {/* Current Transcript */}
          {(transcript || partialTranscript) && (
            <View style={{
              backgroundColor: theme.colors.bgCard,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
            }}>
              <Text style={{ 
                color: theme.colors.textDark,
                fontSize: theme.typography.body,
                fontWeight: '600',
                marginBottom: theme.spacing.sm
              }}>
                Current Transcript:
              </Text>
              {transcript && (
                <Text style={{ 
                  color: theme.colors.textDark,
                  fontSize: theme.typography.body,
                  marginBottom: theme.spacing.sm
                }}>
                  <Text style={{ fontWeight: '600' }}>Final:</Text> {transcript}
                </Text>
              )}
              {partialTranscript && (
                <Text style={{ 
                  color: theme.colors.textMuted,
                  fontSize: theme.typography.body,
                  fontStyle: 'italic'
                }}>
                  <Text style={{ fontWeight: '600' }}>Partial:</Text> {partialTranscript}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Test Results */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Test Results ({Object.keys(testResults).length}/{testLanguages.length})
          </Text>
          
          {testLanguages.map((lang) => {
            const result = testResults[lang.code];
            return (
              <View
                key={lang.code}
                style={{
                  backgroundColor: theme.colors.bgCard,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.sm,
                  borderLeftWidth: 4,
                  borderLeftColor: result 
                    ? (result.success ? theme.colors.success : theme.colors.warning)
                    : theme.colors.textMuted,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                  <Text style={{ fontSize: 20, marginRight: theme.spacing.sm }}>
                    {lang.flag}
                  </Text>
                  <Text style={{ 
                    color: theme.colors.textDark,
                    fontSize: theme.typography.body,
                    fontWeight: '600',
                    flex: 1
                  }}>
                    {lang.name}
                  </Text>
                  {result && (
                    <Text style={{ 
                      color: result.success ? theme.colors.success : theme.colors.warning,
                      fontSize: theme.typography.caption,
                      fontWeight: '600'
                    }}>
                      {result.success ? '✅ PASS' : '⚠️ PARTIAL'}
                    </Text>
                  )}
                </View>
                
                <Text style={{ 
                  color: theme.colors.textMuted,
                  fontSize: theme.typography.caption,
                  marginBottom: theme.spacing.xs
                }}>
                  Expected: "{lang.testPhrase}"
                </Text>
                
                {result ? (
                  <View>
                    <Text style={{ 
                      color: theme.colors.textDark,
                      fontSize: theme.typography.caption
                    }}>
                      Recognized: "{result.transcript}"
                    </Text>
                    <Text style={{ 
                      color: theme.colors.textMuted,
                      fontSize: theme.typography.caption,
                      marginTop: theme.spacing.xs
                    }}>
                      Tested: {result.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ 
                    color: theme.colors.textMuted,
                    fontSize: theme.typography.caption,
                    fontStyle: 'italic'
                  }}>
                    Not tested yet
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Error Display */}
        {error && (
          <View style={{ 
            padding: theme.spacing.lg,
            marginTop: theme.spacing.md,
          }}>
            <View style={{
              backgroundColor: theme.colors.error + '20',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.error,
            }}>
              <Text style={{ 
                color: theme.colors.error,
                fontSize: theme.typography.body,
                fontWeight: '600',
                marginBottom: theme.spacing.sm
              }}>
                Error
              </Text>
              <Text style={{ 
                color: theme.colors.error,
                fontSize: theme.typography.body
              }}>
                {error.message || 'Unknown error occurred'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default VoiceTestWithLanguages;
