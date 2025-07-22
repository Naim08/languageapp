import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';
import { SPEECH_CONFIG } from '@/constants/config';

const testPhrases = [
  { language: 'en', text: 'Hello, this is a test of English text to speech.' },
  { language: 'es', text: 'Hola, esta es una prueba de texto a voz en español.' },
  { language: 'fr', text: 'Bonjour, ceci est un test de synthèse vocale en français.' },
  { language: 'de', text: 'Hallo, das ist ein Test der deutschen Sprachsynthese.' },
  { language: 'it', text: 'Ciao, questo è un test di sintesi vocale italiana.' },
];

export const TtsTestingDemo: React.FC = () => {
  const { theme } = useTheme();
  const [customText, setCustomText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);

  const {
    speak,
    stop,
    isSpeaking,
    error,
    clearError,
  } = useTextToSpeech();

  const handleSpeak = async (text: string, voice: string = selectedVoice, speed: number = speechSpeed) => {
    try {
      console.log('🎤 TTS Demo: Starting to speak:', { text, voice, speed });
      clearError();
      await speak(text, {
        voice: voice as any,
        speed,
      });
      console.log('🎤 TTS Demo: Successfully spoke text');
    } catch (error) {
      console.error('🎤 TTS Demo Error:', error);
      Alert.alert('TTS Error', 'Failed to speak text');
    }
  };

  const handleStop = async () => {
    try {
      await stop();
    } catch (error) {
      console.error('Stop Error:', error);
    }
  };

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
            TTS Testing Demo
          </Text>
          <Text style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.body,
            textAlign: 'center'
          }}>
            Test OpenAI Text-to-Speech with different voices and languages
          </Text>
        </View>

        {/* Voice Selection */}
        <View style={{ padding: theme.spacing.lg }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Voice Selection
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ 
              flexDirection: 'row', 
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.sm
            }}>
              {SPEECH_CONFIG.OPENAI_VOICES.map((voice) => (
                <TouchableOpacity
                  key={voice}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: selectedVoice === voice ? theme.colors.primary : theme.colors.bgCard,
                    borderWidth: 1,
                    borderColor: selectedVoice === voice ? theme.colors.primary : theme.colors.bgCard,
                  }}
                  onPress={() => setSelectedVoice(voice)}
                >
                  <Text style={{
                    color: selectedVoice === voice ? theme.colors.textLight : theme.colors.textDark,
                    fontWeight: selectedVoice === voice ? '600' : 'normal',
                    textTransform: 'capitalize',
                  }}>
                    {voice}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Speed Control */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Speech Speed: {speechSpeed.toFixed(1)}x
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.lg
          }}>
            {[0.5, 1.0, 1.5, 2.0].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: speechSpeed === speed ? theme.colors.accent : theme.colors.bgCard,
                  borderWidth: 1,
                  borderColor: speechSpeed === speed ? theme.colors.accent : theme.colors.bgCard,
                }}
                onPress={() => setSpeechSpeed(speed)}
              >
                <Text style={{
                  color: speechSpeed === speed ? theme.colors.textLight : theme.colors.textDark,
                  fontWeight: speechSpeed === speed ? '600' : 'normal',
                }}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Phrases */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Quick Language Tests
          </Text>
          
          {testPhrases.map((phrase, index) => (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: theme.colors.bgCard,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.sm,
              }}
              onPress={() => handleSpeak(phrase.text)}
            >
              <Text style={{
                color: theme.colors.textDark,
                fontSize: theme.typography.body,
                fontWeight: '600',
                marginBottom: theme.spacing.xs,
                textTransform: 'uppercase',
              }}>
                {phrase.language.toUpperCase()}
              </Text>
              <Text style={{
                color: theme.colors.textMuted,
                fontSize: theme.typography.body,
              }}>
                {phrase.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Text */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Custom Text
          </Text>
          
          <TextInput
            style={{
              backgroundColor: theme.colors.bgCard,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.textDark,
              fontSize: theme.typography.body,
              textAlignVertical: 'top',
              minHeight: 100,
              marginBottom: theme.spacing.md,
            }}
            placeholder="Enter text to speak..."
            placeholderTextColor={theme.colors.textMuted}
            value={customText}
            onChangeText={setCustomText}
            multiline
          />
          
          <View style={{ 
            flexDirection: 'row', 
            gap: theme.spacing.sm,
          }}>
            <Button
              title="Speak Custom Text"
              onPress={() => customText.trim() && handleSpeak(customText)}
              disabled={!customText.trim() || isSpeaking}
              style={{ flex: 1 }}
            />
            <Button
              title="Stop"
              onPress={handleStop}
              disabled={!isSpeaking}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Status */}
        {(isSpeaking || error) && (
          <View style={{ 
            padding: theme.spacing.lg,
            marginTop: theme.spacing.md,
          }}>
            {isSpeaking && (
              <Text style={{ 
                color: theme.colors.success,
                fontSize: theme.typography.body,
                textAlign: 'center',
                marginBottom: theme.spacing.sm
              }}>
                🔊 Speaking...
              </Text>
            )}
            {error && (
              <Text style={{ 
                color: theme.colors.error,
                fontSize: theme.typography.body,
                textAlign: 'center',
                marginBottom: theme.spacing.sm
              }}>
                Error: {error.message || 'Unknown error'}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TtsTestingDemo;
