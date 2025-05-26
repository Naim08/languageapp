import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Voice from '@react-native-voice/voice';

const VoiceTestComponent: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Initialize Voice
    const initializeVoice = async () => {
      try {
        const available = await Voice.isAvailable();
        setIsAvailable(!!available);
        console.log('Voice recognition available:', available);
      } catch (e) {
        console.error('Voice initialization error:', e);
        setError('Voice recognition not available');
      }
    };

    // Set up voice event handlers
    Voice.onSpeechStart = () => {
      console.log('Speech started');
      setIsListening(true);
    };

    Voice.onSpeechEnd = () => {
      console.log('Speech ended');
      setIsListening(false);
    };

    Voice.onSpeechResults = (e) => {
      console.log('Speech results:', e.value);
      setResults(e.value || []);
    };

    Voice.onSpeechPartialResults = (e) => {
      console.log('Partial results:', e.value);
      setPartialResults(e.value || []);
    };

    Voice.onSpeechError = (e) => {
      console.error('Speech error:', e.error);
      setError(e.error?.message || 'Speech recognition error');
      setIsListening(false);
    };

    initializeVoice();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setError('');
      setResults([]);
      setPartialResults([]);
      await Voice.start('en-US');
    } catch (e) {
      console.error('Start listening error:', e);
      setError('Failed to start listening');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Stop listening error:', e);
    }
  };

  const clearResults = () => {
    setResults([]);
    setPartialResults([]);
    setError('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>React Native Voice Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusText, isAvailable ? styles.available : styles.unavailable]}>
          {isAvailable ? 'Available' : 'Not Available'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isListening ? styles.stopButton : styles.startButton]}
          onPress={isListening ? stopListening : startListening}
          disabled={!isAvailable}
        >
          <Text style={styles.buttonText}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {isListening && (
        <View style={styles.listeningIndicator}>
          <Text style={styles.listeningText}>🎤 Listening...</Text>
        </View>
      )}

      {partialResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Partial Results:</Text>
          {partialResults.map((result, index) => (
            <Text key={index} style={styles.partialResult}>
              {result}
            </Text>
          ))}
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Final Results:</Text>
          {results.map((result, index) => (
            <Text key={index} style={styles.result}>
              {result}
            </Text>
          ))}
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  available: {
    color: '#4CAF50',
  },
  unavailable: {
    color: '#F44336',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  clearButton: {
    backgroundColor: '#2196F3',
    padding: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listeningIndicator: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  listeningText: {
    fontSize: 18,
    color: '#856404',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  result: {
    fontSize: 16,
    padding: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 4,
    marginBottom: 5,
    color: '#2E7D32',
  },
  partialResult: {
    fontSize: 16,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
    marginBottom: 5,
    color: '#F57C00',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
  },
});

export default VoiceTestComponent;
