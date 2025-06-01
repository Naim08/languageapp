import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider } from './src/providers/AuthProvider';
import { AuthGate } from './src/navigation/AuthGate';
import { useAuth } from './src/hooks/useAuth';
import { TtsTestingDemo, SpeechRecognitionDemo, SpeechDebugger, WhisperManager } from './src/components/speech';
import VoiceTestWithLanguages from './src/components/speech/VoiceTestWithLanguages';
import VoiceTestComponent from './src/components/speech/VoiceTestComponent';
import TestingDashboard from './src/screens/testing/TestingDashboard';

type TestComponent = 'dashboard' | 'TtsTestingDemo' | 'SpeechRecognitionDemo' | 'VoiceTestWithLanguages' | 'VoiceTestComponent' | 'SpeechDebugger' | 'WhisperManager';

function AppContent() {
  const [activeTest, setActiveTest] = useState<TestComponent>('dashboard');
  const { theme } = useTheme();
  const { signOut, user } = useAuth();

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
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.bgCard }]}>
        {activeTest !== 'dashboard' && (
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleBackToDashboard}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.textDark }]}>
              ← Back to Dashboard
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.headerRight}>
          {user && (
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={signOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {renderTestComponent()}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>
            <AppContent />
          </AuthGate>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerRight: {
    marginLeft: 'auto',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
