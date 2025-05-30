import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '@/theme';
import { TtsTestingDemo, SpeechRecognitionDemo, SpeechDebugger, WhisperManager } from './src/components/speech';
import VoiceTestWithLanguages from './src/components/speech/VoiceTestWithLanguages';
import VoiceTestComponent from './src/components/speech/VoiceTestComponent';
import TestingDashboard from './src/screens/testing/TestingDashboard';
import './global.css';

type TestComponent = 'dashboard' | 'TtsTestingDemo' | 'SpeechRecognitionDemo' | 'VoiceTestWithLanguages' | 'VoiceTestComponent' | 'SpeechDebugger' | 'WhisperManager';

function AppContent() {
  const [activeTest, setActiveTest] = useState<TestComponent>('dashboard');
  const { theme } = useTheme();

  const handleNavigateToTest = (testComponent: string) => {
    setActiveTest(testComponent as TestComponent);
  };

  const handleBackToDashboard = () => {
    setActiveTest('dashboard');
  };

  const renderTestComponent = () => {
    switch (activeTest) {
      case 'TtsTestingDemo':
        return <TtsTestingDemo />;
      case 'SpeechRecognitionDemo':
        return <SpeechRecognitionDemo />;
      case 'VoiceTestWithLanguages':
        return <VoiceTestWithLanguages />;
      case 'VoiceTestComponent':
        return <VoiceTestComponent />;
      case 'SpeechDebugger':
        return <SpeechDebugger />;
      case 'WhisperManager':
        return <WhisperManager />;
      default:
        return <TestingDashboard onNavigateToTest={handleNavigateToTest} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {activeTest !== 'dashboard' && (
        <View style={[styles.backButtonContainer, { backgroundColor: theme.colors.bgCard }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleBackToDashboard}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.textDark }]}>
              ← Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {renderTestComponent()}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
