import React from 'react';
import { View, SafeAreaView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/ui/Text';
import { useTheme } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  
  return (
    <LinearGradient
      colors={[theme.colors.primary, '#2563EB']} // Modern blue gradient
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.mascotContainer}>
              <Text style={styles.mascot}>🦉</Text>
            </View>
            <Text variant="headline" style={styles.title}>
              Learn languages{'\n'}with AI
            </Text>
            <Text variant="body" style={styles.subtitle}>
              Fun, personalized, and effective
            </Text>
          </View>
          
          <View style={styles.features}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🎯</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="title" color="dark" style={styles.featureTitle}>Personalized lessons</Text>
                <Text variant="body" color="muted" style={styles.featureText}>AI adapts to your learning style</Text>
              </View>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🗣️</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="title" color="dark" style={styles.featureTitle}>Practice speaking</Text>
                <Text variant="body" color="muted" style={styles.featureText}>Get instant pronunciation feedback</Text>
              </View>
            </View>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🔥</Text>
              </View>
              <View style={styles.featureContent}>
                <Text variant="title" color="dark" style={styles.featureTitle}>Stay motivated</Text>
                <Text variant="body" color="muted" style={styles.featureText}>Track streaks and earn rewards</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.bgCard }]} onPress={onComplete} activeOpacity={0.9}>
              <Text variant="title" style={[styles.buttonText, { color: theme.colors.primary }]}>GET STARTED</Text>
            </TouchableOpacity>
            
            <Text variant="caption" style={styles.disclaimer}>
              Free to start • No credit card required
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // space-16 (gutters)
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 48, // space-48
  },
  mascotContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24, // space-24
  },
  mascot: {
    fontSize: 64,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 12, // space-12
    lineHeight: 48,
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  features: {
    marginVertical: 32, // space-32
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16, // space-16
    marginBottom: 16, // space-16
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#F7F7FB',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 15,
    color: '#777777',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#58CC02',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});
