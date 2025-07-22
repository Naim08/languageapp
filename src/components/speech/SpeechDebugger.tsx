import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AudioVisualizer } from '@/components/audio';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';
import { SpeechLanguage } from '@/services/speech/types';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export const SpeechDebugger: React.FC = () => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SpeechLanguage>('en-US');

  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      data,
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

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
      addLog('info', 'Speech Recognition Result', { result, language: selectedLanguage });
    },
    onError: (error) => {
      addLog('error', 'Speech Recognition Error', error);
    },
  });

  useEffect(() => {
    addLog('info', 'Speech Debugger Initialized', { 
      isAvailable, 
      currentLanguage,
      supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR']
    });
  }, [isAvailable, currentLanguage]);

  useEffect(() => {
    if (isListening) {
      addLog('info', 'Started Listening', { language: selectedLanguage });
    } else {
      addLog('info', 'Stopped Listening');
    }
  }, [isListening, selectedLanguage]);

  useEffect(() => {
    if (transcript) {
      addLog('info', 'Transcript Updated', { transcript });
    }
  }, [transcript]);

  useEffect(() => {
    if (partialTranscript) {
      addLog('info', 'Partial Transcript', { partialTranscript });
    }
  }, [partialTranscript]);

  useEffect(() => {
    if (error) {
      addLog('error', 'Error Occurred', error);
    }
  }, [error]);

  const handleStartListening = async () => {
    try {
      addLog('info', 'Attempting to start listening...', { language: selectedLanguage });
      clearError();
      await start(selectedLanguage);
      addLog('info', 'Successfully started listening');
    } catch (error) {
      addLog('error', 'Failed to start listening', error);
    }
  };

  const handleStopListening = async () => {
    try {
      addLog('info', 'Attempting to stop listening...');
      await stop();
      addLog('info', 'Successfully stopped listening');
    } catch (error) {
      addLog('error', 'Failed to stop listening', error);
    }
  };

  const handleLanguageChange = async (language: SpeechLanguage) => {
    try {
      addLog('info', 'Attempting to switch language...', { from: selectedLanguage, to: language });
      setSelectedLanguage(language);
      await switchLanguage(language);
      addLog('info', 'Successfully switched language', { language });
    } catch (error) {
      addLog('error', 'Failed to switch language', error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const runDiagnostics = async () => {
    addLog('info', 'Running diagnostics...');
    
    // Basic diagnostics
    const diagnostics = {
      isAvailable,
      currentLanguage,
      isListening,
      hasError: !!error,
      transcriptLength: transcript.length,
      partialTranscriptLength: partialTranscript.length,
      audioLevel,
      timestamp: new Date().toISOString(),
    };
    
    addLog('info', 'Diagnostics completed', diagnostics);
    Alert.alert('Diagnostics', JSON.stringify(diagnostics, null, 2));
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.textMuted;
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
            Speech Debugger
          </Text>
          <Text style={{ 
            color: theme.colors.textMuted,
            fontSize: theme.typography.body,
            textAlign: 'center'
          }}>
            Debug speech recognition with detailed logs
          </Text>
        </View>

        {/* Status Panel */}
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
            marginBottom: theme.spacing.md
          }}>
            Status
          </Text>
          
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={{ color: theme.colors.textMuted }}>
              Available: <Text style={{ color: isAvailable ? theme.colors.success : theme.colors.error }}>
                {isAvailable ? 'Yes' : 'No'}
              </Text>
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>
              Listening: <Text style={{ color: isListening ? theme.colors.success : theme.colors.textDark }}>
                {isListening ? 'Yes' : 'No'}
              </Text>
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>
              Language: <Text style={{ color: theme.colors.textDark }}>{currentLanguage}</Text>
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>
              Audio Level: <Text style={{ color: theme.colors.textDark }}>{audioLevel.toFixed(2)}</Text>
            </Text>
          </View>

          {isListening && (
            <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
              <AudioVisualizer
                audioLevel={audioLevel}
                isListening={isListening}
                size={100}
                strokeWidth={3}
              />
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Controls
          </Text>
          
          <View style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button
                title={isListening ? "Stop Listening" : "Start Listening"}
                onPress={isListening ? handleStopListening : handleStartListening}
                disabled={!isAvailable}
                style={{ flex: 1 }}
              />
              <Button
                title="Run Diagnostics"
                onPress={runDiagnostics}
                variant="secondary"
                style={{ flex: 1 }}
              />
            </View>
            
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button
                title="Clear Transcript"
                onPress={clearTranscript}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Clear Logs"
                onPress={clearLogs}
                variant="secondary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>

        {/* Language Selection */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Language
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

        {/* Current Transcript */}
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
              Current Transcript
            </Text>
            
            <View style={{
              backgroundColor: theme.colors.bgCard,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
            }}>
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
          </View>
        )}

        {/* Debug Logs */}
        <View style={{ padding: theme.spacing.lg, paddingTop: 0 }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.h3,
            fontWeight: '600',
            marginBottom: theme.spacing.md
          }}>
            Debug Logs ({logs.length})
          </Text>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {logs.map((log) => (
              <View
                key={log.id}
                style={{
                  backgroundColor: theme.colors.bgCard,
                  padding: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  marginBottom: theme.spacing.xs,
                  borderLeftWidth: 3,
                  borderLeftColor: getLevelColor(log.level),
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
                  <Text style={{ 
                    color: getLevelColor(log.level),
                    fontSize: theme.typography.caption,
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {log.level}
                  </Text>
                  <Text style={{ 
                    color: theme.colors.textMuted,
                    fontSize: theme.typography.caption
                  }}>
                    {log.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={{ 
                  color: theme.colors.textDark,
                  fontSize: theme.typography.body,
                  marginBottom: log.data ? theme.spacing.xs : 0
                }}>
                  {log.message}
                </Text>
                {log.data && (
                  <Text style={{ 
                    color: theme.colors.textMuted,
                    fontSize: theme.typography.caption,
                    fontFamily: 'monospace'
                  }}>
                    {JSON.stringify(log.data, null, 2)}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
