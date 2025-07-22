import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AudioVisualizer } from '@/components/audio';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';
import { SpeechLanguage } from '@/services/speech/types';

const VoiceTestComponent: React.FC = () => {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<SpeechLanguage>('en-US');
  const [sessionCount, setSessionCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

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
      console.log('Basic voice test result:', result);
      if (result.trim()) {
        setSessionCount(prev => prev + 1);
        setTotalWords(prev => prev + result.trim().split(' ').length);
      }
    },
    onError: (error) => {
      console.error('Basic voice test error:', error);
      Alert.alert('Speech Recognition Error', error.message || 'Unknown error');
    },
  });

  const handleLanguageChange = async (language: SpeechLanguage) => {
    try {
      setSelectedLanguage(language);
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

  const resetStats = () => {
    setSessionCount(0);
    setTotalWords(0);
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
            Basic Voice Test
          </Text>
          <Text style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.body,
            textAlign: 'center'
          }}>
            Simple voice recognition testing component
          </Text>
        </View>

        {/* Stats Panel */}
        <View style={{ 
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.bgCard,
          margin: theme.spacing.lg,
          borderRadius: theme.borderRadius.md
        }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md,
            textAlign: 'center'
          }}>
            Session Statistics
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around',
            marginBottom: theme.spacing.md
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ 
                color: theme.colors.primary,
                fontSize: theme.typography.h2,
                fontWeight: 'bold'
              }}>
                {sessionCount}
              </Text>
              <Text style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.caption
              }}>
                Sessions
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ 
                color: theme.colors.accent,
                fontSize: theme.typography.h2,
                fontWeight: 'bold'
              }}>
                {totalWords}
              </Text>
              <Text style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.caption
              }}>
                Total Words
              </Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ 
                color: isListening ? theme.colors.success : theme.colors.textMuted,
                fontSize: theme.typography.h2,
                fontWeight: 'bold'
              }}>
                {audioLevel.toFixed(1)}
              </Text>
              <Text style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.caption
              }}>
                Audio Level
              </Text>
            </View>
          </View>

          <Button
            title="Reset Statistics"
            onPress={resetStats}
            variant="secondary"
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>

        {/* Language Selection */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Language: {currentLanguage}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ 
              flexDirection: 'row', 
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.sm
            }}>
              {(['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR'] as SpeechLanguage[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: selectedLanguage === lang ? theme.colors.primary : theme.colors.bgCard,
                    borderWidth: 1,
                    borderColor: selectedLanguage === lang ? theme.colors.primary : theme.colors.bgCard,
                  }}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <Text style={{
                    color: selectedLanguage === lang ? theme.colors.textLight : theme.colors.textDark,
                    fontWeight: selectedLanguage === lang ? '600' : 'normal',
                  }}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Voice Visualizer and Controls */}
        <View style={{ 
          padding: theme.spacing.lg,
          paddingTop: 0,
          alignItems: 'center'
        }}>
          <AudioVisualizer
            audioLevel={audioLevel}
            isListening={isListening}
            size={150}
            strokeWidth={4}
            showWaveform={true}
          />
          
          <View style={{ 
            flexDirection: 'row', 
            gap: theme.spacing.sm,
            marginTop: theme.spacing.lg,
            width: '100%'
          }}>
            <Button
              title={isListening ? "Stop Listening" : "Start Listening"}
              onPress={isListening ? handleStopListening : handleStartListening}
              style={{ flex: 1 }}
            />
            <Button
              title="Clear"
              onPress={clearTranscript}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>

          {isListening && (
            <Text style={{ 
              color: theme.colors.success,
              fontSize: theme.typography.body,
              marginTop: theme.spacing.md,
              textAlign: 'center'
            }}>
              🎤 Listening in {currentLanguage}...
            </Text>
          )}
        </View>

        {/* Transcript Display */}
        {(transcript || partialTranscript) && (
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
              Transcript
            </Text>
            
            <View style={{
              backgroundColor: theme.colors.bgCard,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              minHeight: 100,
            }}>
              {transcript && (
                <View style={{ marginBottom: theme.spacing.sm }}>
                  <Text style={{ 
                    color: theme.colors.success,
                    fontSize: theme.typography.caption,
                    fontWeight: '600',
                    marginBottom: theme.spacing.xs
                  }}>
                    FINAL RESULT:
                  </Text>
                  <Text style={{ 
                    color: theme.colors.textDark,
                    fontSize: theme.typography.body,
                    lineHeight: 24
                  }}>
                    {transcript}
                  </Text>
                </View>
              )}
              
              {partialTranscript && (
                <View>
                  <Text style={{ 
                    color: theme.colors.warning,
                    fontSize: theme.typography.caption,
                    fontWeight: '600',
                    marginBottom: theme.spacing.xs
                  }}>
                    PARTIAL RESULT:
                  </Text>
                  <Text style={{ 
                    color: theme.colors.textMuted,
                    fontSize: theme.typography.body,
                    fontStyle: 'italic',
                    lineHeight: 24
                  }}>
                    {partialTranscript}
                  </Text>
                </View>
              )}
              
              {!transcript && !partialTranscript && (
                <Text style={{ 
                  color: theme.colors.textMuted,
                  fontSize: theme.typography.body,
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}>
                  Start speaking to see your words appear here...
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Status Information */}
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
            Status
          </Text>
          
          <View style={{
            backgroundColor: theme.colors.bgCard,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
          }}>
            <View style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textMuted }}>Recognition Available:</Text>
                <Text style={{ 
                  color: isAvailable ? theme.colors.success : theme.colors.error,
                  fontWeight: '600'
                }}>
                  {isAvailable ? 'YES' : 'NO'}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textMuted }}>Currently Listening:</Text>
                <Text style={{ 
                  color: isListening ? theme.colors.success : theme.colors.textDark,
                  fontWeight: '600'
                }}>
                  {isListening ? 'YES' : 'NO'}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textMuted }}>Current Language:</Text>
                <Text style={{ 
                  color: theme.colors.textDark,
                  fontWeight: '600'
                }}>
                  {currentLanguage}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textMuted }}>Has Error:</Text>
                <Text style={{ 
                  color: error ? theme.colors.error : theme.colors.success,
                  fontWeight: '600'
                }}>
                  {error ? 'YES' : 'NO'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={{ 
            padding: theme.spacing.lg,
            paddingTop: 0
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
                Error Details
              </Text>
              <Text style={{ 
                color: theme.colors.error,
                fontSize: theme.typography.body
              }}>
                {error.message || 'Unknown error occurred'}
              </Text>
              
              <Button
                title="Clear Error"
                onPress={clearError}
                variant="secondary"
                style={{ marginTop: theme.spacing.md }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default VoiceTestComponent;
