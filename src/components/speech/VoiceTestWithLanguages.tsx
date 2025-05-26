import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import speechService from '../../services/speech/SpeechRecognitionService';
import { SpeechLanguage, SpeechRecognitionError } from '../../services/speech/types';
import { SUPPORTED_LANGUAGES, LANGUAGE_BY_REGION, getLanguageInfo } from '../../services/speech/languages';

interface VoiceTestWithLanguagesProps {}

const VoiceTestWithLanguages: React.FC<VoiceTestWithLanguagesProps> = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechResults, setSpeechResults] = useState<string[]>([]);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<SpeechLanguage>('en-US');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeSpeechService();
    return () => {
      speechService.destroy();
    };
  }, []);

  const initializeSpeechService = async () => {
    try {
      const available = await speechService.initialize();
      console.log('Voice recognition available:', available ? 1 : 0);
      setIsInitialized(available);

      speechService.setCallbacks({
        onStart: () => {
          console.log('Speech started');
          setIsListening(true);
        },
        onEnd: () => {
          console.log('Speech ended');
          setIsListening(false);
        },
        onResult: (results: string[]) => {
          console.log('Speech results:', results);
          setSpeechResults(results);
        },
        onPartialResults: (results: string[]) => {
          console.log('Partial results:', results);
          setPartialResults(results);
        },
        onError: (error: SpeechRecognitionError) => {
          console.log('Speech error:', error);
          setIsListening(false);
          Alert.alert('Speech Error', error.message);
        },
        onVolumeChanged: (volume: number) => {
          // console.log('Volume:', volume);
        },
      });
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize speech recognition');
    }
  };

  const handleStartListening = async () => {
    try {
      await speechService.startWithLanguage(currentLanguage);
    } catch (error) {
      console.error('Start listening error:', error);
      Alert.alert('Error', 'Failed to start speech recognition');
    }
  };

  const handleStopListening = async () => {
    try {
      await speechService.stop();
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  };

  const handleLanguageChange = async (language: SpeechLanguage) => {
    setCurrentLanguage(language);
    setShowLanguageModal(false);
    
    // Clear previous results
    setSpeechResults([]);
    setPartialResults([]);
    
    // If currently listening, restart with new language
    if (isListening) {
      try {
        await speechService.startWithLanguage(language);
      } catch (error) {
        console.error('Language change error:', error);
        Alert.alert('Error', 'Failed to change language');
      }
    }
  };

  const renderLanguageItem = ({ item }: { item: typeof SUPPORTED_LANGUAGES[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        currentLanguage === item.code && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageChange(item.code)}
    >
      <Text style={styles.languageFlag}>{item.flag}</Text>
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{item.name}</Text>
        <Text style={styles.languageNative}>{item.nativeName}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRegionSection = (region: string, languages: typeof SUPPORTED_LANGUAGES) => (
    <View key={region} style={styles.regionSection}>
      <Text style={styles.regionTitle}>{region}</Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageItem,
            currentLanguage === lang.code && styles.selectedLanguageItem
          ]}
          onPress={() => handleLanguageChange(lang.code)}
        >
          <Text style={styles.languageFlag}>{lang.flag}</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{lang.name}</Text>
            <Text style={styles.languageNative}>{lang.nativeName}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const currentLanguageInfo = getLanguageInfo(currentLanguage);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Initializing speech recognition...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multi-Language Speech Test</Text>
      
      {/* Current Language Display */}
      <TouchableOpacity 
        style={styles.languageSelector}
        onPress={() => setShowLanguageModal(true)}
      >
        <Text style={styles.languageFlag}>{currentLanguageInfo?.flag}</Text>
        <View style={styles.languageInfo}>
          <Text style={styles.currentLanguageName}>{currentLanguageInfo?.name}</Text>
          <Text style={styles.currentLanguageNative}>{currentLanguageInfo?.nativeName}</Text>
        </View>
        <Text style={styles.changeText}>Tap to change</Text>
      </TouchableOpacity>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isListening ? styles.stopButton : styles.startButton]}
          onPress={isListening ? handleStopListening : handleStartListening}
        >
          <Text style={styles.buttonText}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <Text style={styles.statusText}>
        Status: {isListening ? 'Listening...' : 'Ready'}
      </Text>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        {partialResults.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Partial Results (Real-time):</Text>
            {partialResults.map((result, index) => (
              <Text key={index} style={styles.partialResult}>{result}</Text>
            ))}
          </View>
        )}

        {speechResults.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Final Results:</Text>
            {speechResults.map((result, index) => (
              <Text key={index} style={styles.finalResult}>{result}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.languageList}>
            {Object.entries(LANGUAGE_BY_REGION).map(([region, languages]) =>
              renderRegionSection(region, languages)
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  currentLanguageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentLanguageNative: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  resultsContainer: {
    flex: 1,
  },
  resultSection: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  partialResult: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  finalResult: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  languageList: {
    flex: 1,
  },
  regionSection: {
    marginBottom: 20,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguageItem: {
    backgroundColor: '#e8f4fd',
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageNative: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default VoiceTestWithLanguages;
