import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import SpeakingIndicator from '@/components/audio/SpeakingIndicator';
import { SpeechLanguage, UserLevel, TTSError } from '@/services/speech/types';

interface LanguageOption {
  code: SpeechLanguage;
  name: string;
  flag: string;
  testText: string;
}

export const TtsTestingDemo: React.FC = () => {
  const [customText, setCustomText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SpeechLanguage>('en-US');
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>('intermediate');

  const {
    isAvailable,
    isSpeaking,
    isPaused,
    queueLength,
    error,
    isInitialized,
    speak,
    speakForLevel,
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
      Alert.alert('TTS Error', `${error.code}: ${error.message}`);
    },
  });

  // Language options - only confirmed supported languages
  // Removed: Bengali (bn-BD, bn), Japanese (ja-JP), Chinese (zh-CN) - not supported by expo-speech
  const languages: LanguageOption[] = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸', testText: 'Hello! This is a test of English text-to-speech.' },
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳', testText: 'नमस्ते! यह हिंदी में टेक्स्ट-टू-स्पीच का परीक्षण है।' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸', testText: '¡Hola! Esta es una prueba de texto a voz en español.' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷', testText: 'Bonjour! Ceci est un test de synthèse vocale en français.' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪', testText: 'Hallo! Dies ist ein Test der deutschen Text-zu-Sprache-Funktion.' },
  ];

  const userLevels: { code: UserLevel; name: string; description: string }[] = [
    { code: 'beginner', name: 'Beginner', description: 'Slower speech (0.8x)' },
    { code: 'intermediate', name: 'Intermediate', description: 'Normal speech (1.0x)' },
    { code: 'advanced', name: 'Advanced', description: 'Faster speech (1.2x)' },
  ];

  const handleTestLanguage = async (language: LanguageOption) => {
    setSelectedLanguage(language.code);
    setLanguage(language.code);
    
    try {
      await speak(language.testText, { language: language.code });
    } catch (error) {
      console.error('Error testing language:', error);
      Alert.alert('Error', `Failed to test ${language.name}. This language might not be available on your device.`);
    }
  };

  const handleSpeakCustom = async () => {
    if (!customText.trim()) {
      Alert.alert('Error', 'Please enter some text to speak');
      return;
    }

    try {
      await speak(customText, { language: selectedLanguage });
    } catch (error) {
      console.error('Error speaking custom text:', error);
      Alert.alert('Error', 'Failed to speak the custom text');
    }
  };

  const handleTestLevel = async (level: UserLevel) => {
    const text = `This is a ${level} level speech test. Notice the different speaking rate.`;
    try {
      await speakForLevel(text, level, selectedLanguage);
    } catch (error) {
      console.error('Error testing level:', error);
    }
  };

  const selectedLanguageInfo = languages.find(lang => lang.code === selectedLanguage);

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>TTS Testing Demo</Text>
          <Text style={styles.status}>Initializing Text-to-Speech...</Text>
          <TouchableOpacity style={styles.button} onPress={initialize}>
            <Text style={styles.buttonText}>Retry Initialization</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>TTS Testing Demo</Text>
          <Text style={styles.error}>Text-to-Speech is not available on this device</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>TTS Testing Demo</Text>
        
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <SpeakingIndicator
              isActive={isSpeaking}
              size={30}
              animationType="wave"
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
              <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
                <Text style={styles.clearErrorText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Current Language Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Language</Text>
          <View style={styles.currentLanguage}>
            <Text style={styles.flag}>{selectedLanguageInfo?.flag}</Text>
            <Text style={styles.languageName}>{selectedLanguageInfo?.name}</Text>
          </View>
        </View>

        {/* Quick Language Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Language Tests</Text>
          <Text style={styles.subtitle}>Test pre-configured phrases in different languages</Text>
          
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageButton,
                selectedLanguage === language.code && styles.selectedLanguageButton
              ]}
              onPress={() => handleTestLanguage(language)}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <View style={styles.languageInfo}>
                <Text style={styles.languageButtonName}>{language.name}</Text>
                <Text style={styles.testText} numberOfLines={1}>
                  {language.testText}
                </Text>
              </View>
              <Text style={styles.testButtonText}>Test</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Text Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Text</Text>
          <Text style={styles.subtitle}>Enter your own text to test</Text>
          
          <TextInput
            style={styles.textInput}
            value={customText}
            onChangeText={setCustomText}
            placeholder={`Enter text in ${selectedLanguageInfo?.name || 'selected language'}...`}
            multiline
            numberOfLines={3}
          />
          
          <TouchableOpacity
            style={[styles.button, !customText.trim() && styles.disabledButton]}
            onPress={handleSpeakCustom}
            disabled={!customText.trim()}
          >
            <Text style={styles.buttonText}>Speak Custom Text</Text>
          </TouchableOpacity>
        </View>

        {/* User Level Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speech Speed Levels</Text>
          <Text style={styles.subtitle}>Test different speech rates for learning</Text>
          
          {userLevels.map((level) => (
            <TouchableOpacity
              key={level.code}
              style={[
                styles.levelButton,
                selectedLevel === level.code && styles.selectedLevelButton
              ]}
              onPress={() => {
                setSelectedLevel(level.code);
                setUserLevel(level.code);
                handleTestLevel(level.code);
              }}
            >
              <Text style={styles.levelName}>{level.name}</Text>
              <Text style={styles.levelDescription}>{level.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Control Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback Controls</Text>
          
          <View style={styles.controlButtons}>
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
              style={[styles.controlButton, !isSpeaking && !queueLength && styles.disabledButton]}
              onPress={stop}
              disabled={!isSpeaking && !queueLength}
            >
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, !queueLength && styles.disabledButton]}
              onPress={clearQueue}
              disabled={!queueLength}
            >
              <Text style={styles.controlButtonText}>Clear Queue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Testing Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Language Testing Notes</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              ✅ Currently testing only confirmed supported languages: English, Hindi, Spanish, French, and German.
              Bengali and other Asian languages have been removed due to expo-speech compatibility issues.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    color: '#ff4444',
    marginBottom: 20,
  },
  statusSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#333',
  },
  queueText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    color: '#c62828',
    fontSize: 14,
  },
  clearErrorButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearErrorText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  currentLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedLanguageButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  languageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  languageButtonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  testText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  testButtonText: {
    color: '#2196f3',
    fontWeight: '600',
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  levelButton: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedLevelButton: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  levelDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  controlButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  specialTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  specialTestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f57c00',
    marginLeft: 12,
  },
  noteBox: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginTop: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#e65100',
    lineHeight: 20,
  },
});

export default TtsTestingDemo;
