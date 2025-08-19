import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components/common';
import { AudioVisualizer } from '@/components/audio';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { SpeechLanguage, SpeechRecognitionError } from '@/services/speech/types';

interface ConversationMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
}

const PRACTICE_LANGUAGES: { code: SpeechLanguage; name: string; flag: string }[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
];

export const ConversationScreen: React.FC = () => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your AI language tutor. Let's practice speaking together! What would you like to talk about?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState<SpeechLanguage>('en-US');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isListening,
    isAvailable,
    transcript,
    partialTranscript,
    error,
    audioLevel,
    start,
    stop,
    switchLanguage,
    clearTranscript,
    clearError,
  } = useSpeechRecognition({
    language: selectedLanguage,
    onResult: handleSpeechResult,
    onError: handleSpeechError,
  });

  function handleSpeechResult(result: string) {
    if (result.trim()) {
      addMessage(result, true);
      clearTranscript();
      // Simulate AI response after a delay
      simulateAIResponse(result);
    }
  }

  function handleSpeechError(error: SpeechRecognitionError) {
    Alert.alert(
      'Speech Recognition Error',
      error.message,
      [
        { text: 'OK', onPress: clearError }
      ]
    );
  }

  const addMessage = useCallback((text: string, isUser: boolean) => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      language: selectedLanguage,
    };
    setMessages(prev => [...prev, newMessage]);
  }, [selectedLanguage]);

  const simulateAIResponse = useCallback(async (userMessage: string) => {
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple AI response simulation
    const responses = [
      "That's interesting! Can you tell me more about that?",
      "Great! Your pronunciation is getting better. Let's continue practicing.",
      "I understand. How do you feel about this topic?",
      "Excellent! Try using more descriptive words in your next response.",
      "That's a good point. What's your opinion on this matter?",
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addMessage(randomResponse, false);
    setIsProcessing(false);
  }, [addMessage]);

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

  const handleLanguageChange = async (language: SpeechLanguage) => {
    setSelectedLanguage(language);
    try {
      await switchLanguage(language);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: "Conversation cleared! What would you like to talk about now?",
        isUser: false,
        timestamp: new Date(),
      }
    ]);
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
      <View style={{ flex: 1 }}>
        {/* Header with Language Selection */}
        <View style={{ 
          padding: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.bgCard
        }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: theme.spacing.sm
          }}>
            Practice Conversation
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ 
              flexDirection: 'row', 
              paddingHorizontal: theme.spacing.sm
            }}>
              {PRACTICE_LANGUAGES.map((lang, index) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: selectedLanguage === lang.code 
                      ? theme.colors.primary 
                      : theme.colors.bgCard,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: index < PRACTICE_LANGUAGES.length - 1 ? theme.spacing.sm : 0,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: theme.spacing.xs }}>{lang.flag}</Text>
                  <Text style={{
                    color: selectedLanguage === lang.code 
                      ? theme.colors.textDark 
                      : theme.colors.textMuted,
                    fontSize: theme.typography.caption,
                    fontWeight: '500'
                  }}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: theme.spacing.md,
            paddingBottom: theme.spacing.xl
          }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={{
                marginBottom: theme.spacing.md,
                alignSelf: message.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              <View
                style={{
                  backgroundColor: message.isUser 
                    ? theme.colors.primary 
                    : theme.colors.bgCard,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  borderBottomRightRadius: message.isUser ? theme.borderRadius.sm : theme.borderRadius.lg,
                  borderBottomLeftRadius: message.isUser ? theme.borderRadius.lg : theme.borderRadius.sm,
                }}
              >
                <Text style={{
                  color: theme.colors.textDark,
                  fontSize: theme.typography.body,
                }}>
                  {message.text}
                </Text>
                <Text style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.typography.caption,
                  marginTop: theme.spacing.xs,
                  alignSelf: 'flex-end'
                }}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
          ))}

          {/* Partial transcript display */}
          {partialTranscript && (
            <View style={{
              marginBottom: theme.spacing.md,
              alignSelf: 'flex-end',
              maxWidth: '80%',
            }}>
              <View style={{
                backgroundColor: theme.colors.primary + '60',
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.lg,
                borderBottomRightRadius: theme.borderRadius.sm,
                borderStyle: 'dashed',
                borderWidth: 1,
                borderColor: theme.colors.primary,
              }}>
                <Text style={{
                  color: theme.colors.textDark,
                  fontSize: theme.typography.body,
                  fontStyle: 'italic'
                }}>
                  {partialTranscript}
                </Text>
              </View>
            </View>
          )}

          {/* AI thinking indicator */}
          {isProcessing && (
            <View style={{
              marginBottom: theme.spacing.md,
              alignSelf: 'flex-start',
              maxWidth: '80%',
            }}>
              <View style={{
                backgroundColor: theme.colors.bgCard,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.lg,
                borderBottomLeftRadius: theme.borderRadius.sm,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  backgroundColor: theme.colors.accent,
                  borderRadius: 4,
                  marginRight: theme.spacing.xs,
                }} />
                <View style={{
                  width: 8,
                  height: 8,
                  backgroundColor: theme.colors.accent,
                  borderRadius: 4,
                  marginRight: theme.spacing.xs,
                }} />
                <View style={{
                  width: 8,
                  height: 8,
                  backgroundColor: theme.colors.accent,
                  borderRadius: 4,
                }} />
                <Text style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.typography.body,
                  fontStyle: 'italic',
                  marginLeft: theme.spacing.sm
                }}>
                  AI is thinking...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Speech Input Area */}
        <View style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: theme.colors.textMuted + '20'
        }}>
          {/* Audio Visualizer */}
          <View style={{
            alignItems: 'center',
            marginBottom: theme.spacing.md
          }}>
            <AudioVisualizer
              audioLevel={audioLevel}
              isListening={isListening}
              isProcessing={isProcessing}
              size={120}
              strokeWidth={3}
              showWaveform={true}
              animationSpeed="fast"
            />
          </View>

          {/* Status Text */}
          <Text style={{
            color: isListening ? theme.colors.success : theme.colors.textMuted,
            fontSize: theme.typography.body,
            textAlign: 'center',
            marginBottom: theme.spacing.md,
            fontWeight: '500'
          }}>
            {isListening 
              ? 'Listening... Speak now!' 
              : isProcessing 
                ? 'Processing your speech...'
                : 'Tap to start speaking'
            }
          </Text>

          {/* Controls */}
          <View style={{ 
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
              <Button
                title={isListening ? 'Stop Recording' : 'Start Speaking'}
                variant={isListening ? 'secondary' : 'primary'}
                size="large"
                onPress={isListening ? handleStopListening : handleStartListening}
                disabled={isProcessing}
              />
            </View>
            
            <TouchableOpacity
              onPress={clearConversation}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.bgDark,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Text style={{ 
                color: theme.colors.textMuted,
                fontSize: theme.typography.caption,
                fontWeight: '500'
              }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {error && (
            <View style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.error + '20',
              borderRadius: theme.borderRadius.md,
              borderWidth: 1,
              borderColor: theme.colors.error,
            }}>
              <Text style={{
                color: theme.colors.error,
                fontSize: theme.typography.body,
                fontWeight: '600',
                marginBottom: theme.spacing.xs
              }}>
                {error.code}
              </Text>
              <Text style={{
                color: theme.colors.error,
                fontSize: theme.typography.caption
              }}>
                {error.message}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
