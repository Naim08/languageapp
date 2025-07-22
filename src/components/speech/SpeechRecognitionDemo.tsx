import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
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
      Alert.alert('Speech Recognition Error', error.message);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20 
        }}>
          <Text style={{ 
            color: '#EF4444',
            fontSize: 20,
            textAlign: 'center',
            marginBottom: 20
          }}>
            Speech recognition is not available
          </Text>
          <Text style={{ 
            color: '#9CA3AF',
            fontSize: 16,
            textAlign: 'center'
          }}>
            Please check your device settings and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <Text style={{ 
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20
          }}>
            Speech Recognition Demo
          </Text>

          {/* Language Selection */}
          <Text style={{ 
            color: '#FFFFFF',
            fontSize: 18,
            marginBottom: 15
          }}>
            Select Language:
          </Text>
          <View style={{ 
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 20
          }}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: selectedLanguage === lang.code ? '#3B82F6' : '#374151',
                  borderWidth: 1,
                  borderColor: selectedLanguage === lang.code ? '#3B82F6' : '#6B7280',
                }}
              >
                <Text style={{
                  color: selectedLanguage === lang.code ? '#FFFFFF' : '#9CA3AF',
                  fontSize: 14,
                }}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Status */}
          <View style={{
            backgroundColor: '#374151',
            padding: 20,
            borderRadius: 12,
            marginBottom: 20
          }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              marginBottom: 8
            }}>
              Status: {isListening ? 'Listening...' : 'Ready'}
            </Text>
            <Text style={{
              color: isListening ? '#10B981' : '#9CA3AF',
              fontSize: 16
            }}>
              Audio Level: {Math.round(audioLevel * 100)}%
            </Text>
          </View>

          {/* Controls */}
          <View style={{ 
            flexDirection: 'row',
            gap: 10,
            marginBottom: 20
          }}>
            <TouchableOpacity
              onPress={isListening ? handleStopListening : handleStartListening}
              style={{
                flex: 1,
                backgroundColor: isListening ? '#EF4444' : '#10B981',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                {isListening ? 'Stop' : 'Start'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleClearTranscript}
              style={{
                backgroundColor: '#6B7280',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transcript */}
          <View style={{
            backgroundColor: '#374151',
            padding: 20,
            borderRadius: 12,
            marginBottom: 20
          }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              marginBottom: 10
            }}>
              Transcript:
            </Text>
            <Text style={{
              color: transcript ? '#FFFFFF' : '#9CA3AF',
              fontSize: 16,
              minHeight: 50
            }}>
              {transcript || 'No speech detected yet...'}
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={{
              margin: 20,
              padding: 20,
              backgroundColor: '#7F1D1D',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#EF4444',
            }}>
              <Text style={{
                color: '#EF4444',
                fontSize: 16,
                marginBottom: 8
              }}>
                Error: {error.message}
              </Text>
              <Text style={{
                color: '#EF4444',
                fontSize: 14,
                marginBottom: 15
              }}>
                Code: {error.code}
              </Text>
              <TouchableOpacity
                onPress={clearError}
                style={{
                  backgroundColor: '#EF4444',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};