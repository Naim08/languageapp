import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import SpeechRecognitionService from '@/services/speech/SpeechRecognitionService';
import { useTheme } from '@/theme';

export const SpeechDebugger: React.FC = () => {
  const { theme } = useTheme();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
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
    clearTranscript,
    clearError,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      addLog(`✅ Result: "${transcript}"`);
    },
    onError: (error) => {
      addLog(`❌ Error: ${error.code} - ${error.message}`);
    },
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const runDiagnostics = async () => {
    try {
      const result = await SpeechRecognitionService.runDiagnostics();
      setDiagnostics(result);
      addLog('🔍 Diagnostics completed');
    } catch (error) {
      addLog(`❌ Diagnostics failed: ${error}`);
    }
  };

  const handleStart = async () => {
    try {
      addLog('🚀 Starting speech recognition...');
      await start();
    } catch (error) {
      addLog(`❌ Start failed: ${error}`);
    }
  };

  const handleStop = async () => {
    try {
      addLog('🛑 Stopping speech recognition...');
      await stop();
    } catch (error) {
      addLog(`❌ Stop failed: ${error}`);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  useEffect(() => {
    if (isListening) {
      addLog('🎤 Speech recognition is listening...');
    } else {
      addLog('🔇 Speech recognition stopped listening');
    }
  }, [isListening]);

  useEffect(() => {
    if (partialTranscript) {
      addLog(`📝 Partial: "${partialTranscript}"`);
    }
  }, [partialTranscript]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bgPrimary }}>
      <View style={{ padding: 20 }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: theme.colors.textPrimary,
          marginBottom: 20 
        }}>
          Speech Recognition Debugger
        </Text>

        {/* Status */}
        <View style={{ 
          backgroundColor: theme.colors.bgCard, 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 20 
        }}>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold', marginBottom: 10 }}>
            Status
          </Text>
          <Text style={{ color: theme.colors.textSecondary }}>
            Available: {isAvailable ? '✅' : '❌'}
          </Text>
          <Text style={{ color: theme.colors.textSecondary }}>
            Listening: {isListening ? '🎤' : '🔇'}
          </Text>
          <Text style={{ color: theme.colors.textSecondary }}>
            Language: {currentLanguage}
          </Text>
          <Text style={{ color: theme.colors.textSecondary }}>
            Audio Level: {audioLevel.toFixed(1)}
          </Text>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleStart}
            disabled={isListening}
            style={{
              backgroundColor: isListening ? theme.colors.textMuted : theme.colors.primary,
              padding: 15,
              borderRadius: 8,
              flex: 1,
            }}
          >
            <Text style={{ 
              color: theme.colors.textInverse, 
              textAlign: 'center', 
              fontWeight: 'bold' 
            }}>
              Start
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStop}
            disabled={!isListening}
            style={{
              backgroundColor: !isListening ? theme.colors.textMuted : theme.colors.error,
              padding: 15,
              borderRadius: 8,
              flex: 1,
            }}
          >
            <Text style={{ 
              color: theme.colors.textInverse, 
              textAlign: 'center', 
              fontWeight: 'bold' 
            }}>
              Stop
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={runDiagnostics}
          style={{
            backgroundColor: theme.colors.accent,
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <Text style={{ 
            color: theme.colors.textInverse, 
            textAlign: 'center', 
            fontWeight: 'bold' 
          }}>
            Run Diagnostics
          </Text>
        </TouchableOpacity>

        {/* Current Results */}
        {(transcript || partialTranscript || error) && (
          <View style={{ 
            backgroundColor: theme.colors.bgCard, 
            padding: 15, 
            borderRadius: 10, 
            marginBottom: 20 
          }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold', marginBottom: 10 }}>
              Current Results
            </Text>
            {transcript && (
              <Text style={{ color: theme.colors.success, marginBottom: 5 }}>
                Final: "{transcript}"
              </Text>
            )}
            {partialTranscript && (
              <Text style={{ color: theme.colors.accent, marginBottom: 5 }}>
                Partial: "{partialTranscript}"
              </Text>
            )}
            {error && (
              <Text style={{ color: theme.colors.error, marginBottom: 5 }}>
                Error: {error.code} - {error.message}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                clearTranscript();
                clearError();
              }}
              style={{
                backgroundColor: theme.colors.textMuted,
                padding: 8,
                borderRadius: 5,
                marginTop: 10,
              }}
            >
              <Text style={{ color: theme.colors.textInverse, textAlign: 'center' }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Diagnostics */}
        {diagnostics && (
          <View style={{ 
            backgroundColor: theme.colors.bgCard, 
            padding: 15, 
            borderRadius: 10, 
            marginBottom: 20 
          }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold', marginBottom: 10 }}>
              Diagnostics
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: 'monospace' }}>
              {JSON.stringify(diagnostics, null, 2)}
            </Text>
          </View>
        )}

        {/* Logs */}
        <View style={{ 
          backgroundColor: theme.colors.bgCard, 
          padding: 15, 
          borderRadius: 10 
        }}>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold', marginBottom: 10 }}>
            Debug Logs
          </Text>
          {logs.map((log, index) => (
            <Text 
              key={index} 
              style={{ 
                color: theme.colors.textSecondary, 
                fontSize: 12, 
                fontFamily: 'monospace',
                marginBottom: 2 
              }}
            >
              {log}
            </Text>
          ))}
          {logs.length === 0 && (
            <Text style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>
              No logs yet...
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};