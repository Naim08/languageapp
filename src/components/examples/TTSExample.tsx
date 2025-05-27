import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import SpeakingIndicator from '@/components/audio/SpeakingIndicator';
import { SpeechLanguage, UserLevel, TTSError } from '@/services/speech/types';

interface TTSExampleProps {
  defaultLanguage?: SpeechLanguage;
  defaultUserLevel?: UserLevel;
}

export const TTSExample: React.FC<TTSExampleProps> = ({
  defaultLanguage = 'en-US',
  defaultUserLevel = 'intermediate',
}) => {
  const [customText, setCustomText] = useState('Hello! This is a test of the text-to-speech functionality.');
  const [selectedLanguage, setSelectedLanguage] = useState<SpeechLanguage>(defaultLanguage);
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>(defaultUserLevel);

  const {
    isAvailable,
    isSpeaking,
    isPaused,
    queueLength,
    error,
    isInitialized,
    speak,
    speakForLevel,
    speakSentences,
    pause,
    resume,
    stop,
    clearQueue,
    initialize,
    clearError,
    setLanguage,
    setUserLevel,
  } = useTextToSpeech({
    language: selectedLanguage,
    userLevel: selectedLevel,
    onStart: (utteranceId) => {
      console.log('Started speaking:', utteranceId);
    },
    onDone: (utteranceId) => {
      console.log('Finished speaking:', utteranceId);
    },
    onError: (error: TTSError) => {
      console.error('TTS Error:', error);
      Alert.alert('TTS Error', error.message);
    },
  });

  const handleSpeak = async () => {
    if (!customText.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }

    try {
      await speak(customText);
    } catch (error) {
      console.error('Error speaking:', error);
    }
  };

  const handleSpeakForLevel = async (level: UserLevel) => {
    const text = `This is a ${level} level speech test. Notice the different speaking rate.`;
    try {
      await speakForLevel(text, level);
    } catch (error) {
      console.error('Error speaking for level:', error);
    }
  };

  const handleSpeakSentences = async () => {
    const sentences = [
      'First sentence with a normal pace.',
      'Second sentence following the first.',
      'Third and final sentence to complete the demonstration.',
    ];

    try {
      await speakSentences(sentences, {
        pauseBetween: 1000,
      });
    } catch (error) {
      console.error('Error speaking sentences:', error);
    }
  };

  const handleLanguageChange = (language: SpeechLanguage) => {
    setSelectedLanguage(language);
    setLanguage(language);
  };

  const handleLevelChange = (level: UserLevel) => {
    setSelectedLevel(level);
    setUserLevel(level);
  };

  const languages: { code: SpeechLanguage; name: string }[] = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
  ];

  const levels: { code: UserLevel; name: string; description: string }[] = [
    { code: 'beginner', name: 'Beginner', description: 'Slower speech (0.8x)' },
    { code: 'intermediate', name: 'Intermediate', description: 'Normal speech (1.0x)' },
    { code: 'advanced', name: 'Advanced', description: 'Faster speech (1.2x)' },
  ];

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Text-to-Speech Example</Text>
        <Text style={styles.status}>Initializing TTS...</Text>
        <TouchableOpacity style={styles.button} onPress={initialize}>
          <Text style={styles.buttonText}>Retry Initialization</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Text-to-Speech Example</Text>
        <Text style={styles.error}>Text-to-Speech is not available on this device</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Text-to-Speech Example</Text>
      
      {/* Status Section */}
      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <SpeakingIndicator
            isActive={isSpeaking}
            size={30}
            animationType="bars"
            color="#007AFF"
          />
          <Text style={styles.statusText}>
            {isSpeaking ? (isPaused ? 'Paused' : 'Speaking') : 'Ready'}
          </Text>
        </View>
        
        {queueLength > 0 && (
          <Text style={styles.queueText}>Queue: {queueLength} items</Text>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error.message}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.clearErrorText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                selectedLanguage === lang.code && styles.selectedLanguageButton,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === lang.code && styles.selectedLanguageButtonText,
                ]}
              >
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Level Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Level</Text>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.code}
            style={[
              styles.levelButton,
              selectedLevel === level.code && styles.selectedLevelButton,
            ]}
            onPress={() => handleLevelChange(level.code)}
          >
            <Text
              style={[
                styles.levelButtonText,
                selectedLevel === level.code && styles.selectedLevelButtonText,
              ]}
            >
              {level.name} - {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Text Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Text</Text>
        <TextInput
          style={styles.textInput}
          value={customText}
          onChangeText={setCustomText}
          placeholder="Enter text to speak..."
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.button, !customText.trim() && styles.disabledButton]}
          onPress={handleSpeak}
          disabled={!customText.trim()}
        >
          <Text style={styles.buttonText}>Speak Custom Text</Text>
        </TouchableOpacity>
      </View>

      {/* Level Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Different Levels</Text>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.code}
            style={styles.button}
            onPress={() => handleSpeakForLevel(level.code)}
          >
            <Text style={styles.buttonText}>Test {level.name} Level</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sentence Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multi-Sentence Test</Text>
        <TouchableOpacity style={styles.button} onPress={handleSpeakSentences}>
          <Text style={styles.buttonText}>Speak Multiple Sentences</Text>
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlButton, !isSpeaking && styles.disabledButton]}
            onPress={pause}
            disabled={!isSpeaking || isPaused}
          >
            <Text style={styles.controlButtonText}>Pause</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, !isPaused && styles.disabledButton]}
            onPress={resume}
            disabled={!isPaused}
          >
            <Text style={styles.controlButtonText}>Resume</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, !isSpeaking && styles.disabledButton]}
            onPress={stop}
            disabled={!isSpeaking}
          >
            <Text style={styles.controlButtonText}>Stop</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, queueLength === 0 && styles.disabledButton]}
            onPress={clearQueue}
            disabled={queueLength === 0}
          >
            <Text style={styles.controlButtonText}>Clear Queue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#007AFF',
  },
  queueText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  errorText: {
    color: '#d32f2f',
    flex: 1,
  },
  clearErrorText: {
    color: '#d32f2f',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  languageButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedLanguageButton: {
    backgroundColor: '#007AFF',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedLanguageButtonText: {
    color: 'white',
  },
  levelButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLevelButton: {
    backgroundColor: '#007AFF',
  },
  levelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLevelButtonText: {
    color: 'white',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    color: '#d32f2f',
    marginBottom: 20,
  },
});

export default TTSExample;
