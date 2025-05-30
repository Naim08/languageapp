import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/theme';

interface TestingDashboardProps {
  onNavigateToTest: (testComponent: string) => void;
}

const TestingDashboard: React.FC<TestingDashboardProps> = ({ onNavigateToTest }) => {
  const { theme } = useTheme();

  const testScreens = [
    {
      id: 'TtsTestingDemo',
      title: 'TTS Testing',
      description: 'Test Text-to-Speech functionality with multiple languages',
      icon: '🔊',
      color: theme.colors.primary,
    },
    {
      id: 'SpeechRecognitionDemo',
      title: 'Speech Recognition Demo',
      description: 'Test speech recognition with language switching',
      icon: '🎤',
      color: theme.colors.accent,
    },
    {
      id: 'SpeechDebugger',
      title: 'Speech Debugger',
      description: 'Debug speech recognition with detailed logs and diagnostics',
      icon: '🔍',
      color: theme.colors.warning,
    },
    {
      id: 'WhisperManager',
      title: 'Whisper AI Engine',
      description: 'Local offline speech recognition with Whisper AI models',
      icon: '🤖',
      color: '#8B5CF6',
    },
    {
      id: 'VoiceTestWithLanguages',
      title: 'Multi-Language Voice Test',
      description: 'Advanced voice testing with comprehensive language support',
      icon: '🌍',
      color: '#FF6B35',
    },
    {
      id: 'VoiceTestComponent',
      title: 'Basic Voice Test',
      description: 'Simple voice recognition testing component',
      icon: '🎙️',
      color: '#4ECDC4',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bgDark }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textDark }]}>
            Testing Dashboard
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Choose a test screen to explore speech and voice features
          </Text>
        </View>

        {/* Test Cards */}
        <View style={styles.cardsContainer}>
          {testScreens.map((screen, index) => (
            <TouchableOpacity
              key={screen.id}
              style={[
                styles.card,
                { backgroundColor: theme.colors.bgCard },
                index === testScreens.length - 1 && styles.lastCard
              ]}
              onPress={() => onNavigateToTest(screen.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: screen.color + '20' }]}>
                <Text style={styles.cardIcon}>{screen.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.textDark }]}>
                  {screen.title}
                </Text>
                <Text style={[styles.cardDescription, { color: theme.colors.textMuted }]}>
                  {screen.description}
                </Text>
              </View>
              <View style={[styles.cardArrow, { backgroundColor: screen.color }]}>
                <Text style={styles.cardArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.colors.bgCard }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.textDark }]}>
            ℹ️ Testing Information
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
            • <Text style={{ fontWeight: '600' }}>TTS Testing:</Text> Supports English, Hindi, Spanish, French, German{'\n'}
            • <Text style={{ fontWeight: '600' }}>Speech Recognition:</Text> Requires microphone permissions{'\n'}
            • <Text style={{ fontWeight: '600' }}>Speech Debugger:</Text> Real-time logging and diagnostics for troubleshooting{'\n'}
            • <Text style={{ fontWeight: '600' }}>Whisper AI:</Text> Local offline speech recognition with downloadable models{'\n'}
            • <Text style={{ fontWeight: '600' }}>Best Results:</Text> Test in a quiet environment with clear speech
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lastCard: {
    marginBottom: 24,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardArrowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TestingDashboard;
