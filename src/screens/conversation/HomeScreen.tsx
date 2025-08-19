import React from 'react';
import { View, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Card, Progress, Chip, Button } from '../../components/ui';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  const lessons = [
    { id: '1', title: 'Greetings', icon: '👋', progress: 0.7, color: '#FF4B4B' },
    { id: '2', title: 'Family', icon: '👨‍👩‍👧‍👦', progress: 0.4, color: '#1CB0F6' },
    { id: '3', title: 'Food', icon: '🍔', progress: 0.2, color: '#FFCC00' },
    { id: '4', title: 'Travel', icon: '✈️', progress: 0, color: '#CE82FF', locked: true },
  ];

  const streakDays = 5;
  const todayMinutes = 15;
  const dailyGoal = 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bgLight }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption" color="muted">Welcome back!</Text>
            <Text variant="headline" color="dark">Language Learner</Text>
          </View>
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text variant="title" color="primary">{streakDays}</Text>
          </View>
        </View>

        {/* Daily Progress Card */}
        <Card variant="elevated" style={styles.progressCard}>
          <Text variant="title" color="dark">Today's Goal</Text>
          <View style={styles.progressContainer}>
            <Progress 
              value={todayMinutes} 
              max={dailyGoal} 
              color="primary"
              showLabel={true}
              label={`${todayMinutes} / ${dailyGoal} minutes`}
            />
          </View>
        </Card>

        {/* Start Speaking Button */}
        <View style={styles.startButton}>
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth
            onPress={() => navigation.navigate('Conversation' as never)}
          >
            🎤 Start Speaking Practice
          </Button>
        </View>

        {/* Lessons */}
        <View style={styles.lessonsSection}>
          <Text variant="headline" color="dark" style={styles.sectionTitle}>Lessons</Text>
          <View style={styles.lessonsGrid}>
            {lessons.map((lesson) => (
              <Card 
                key={lesson.id}
                variant="elevated"
                style={[
                  styles.lessonCard,
                  lesson.locked && styles.lockedCard
                ]}
              >
                <TouchableOpacity
                  disabled={lesson.locked}
                  activeOpacity={0.9}
                  style={styles.lessonContent}
                >
                  <View style={[styles.lessonIconContainer, { backgroundColor: lesson.color + '20' }]}>
                    <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                  </View>
                  <Text variant="title" color="dark" style={styles.lessonTitle}>
                    {lesson.title}
                  </Text>
                  {!lesson.locked && lesson.progress > 0 && (
                    <View style={styles.lessonProgressContainer}>
                      <Progress 
                        value={lesson.progress * 100} 
                        variant="linear" 
                        size="sm"
                        color="primary"
                      />
                    </View>
                  )}
                  {lesson.locked && (
                    <Text style={styles.lockIcon}>🔒</Text>
                  )}
                </TouchableOpacity>
              </Card>
            ))}
          </View>

          {/* Temporary Test Button for Exercise System */}
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.colors.accent }]}
            onPress={() => navigation.navigate('Exercise' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.testButtonText}>🧪 Test Exercise System</Text>
          </TouchableOpacity>
          
          {/* Multiple Choice Questions with Images Button */}
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#9B59B6' }]}
            onPress={() => navigation.navigate('Exercise' as any, { imageOnly: true })}
            activeOpacity={0.8}
          >
            <Text style={styles.testButtonText}>🖼️ Multiple Choice (Images Only)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // space-16 (gutters)
    paddingTop: 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    paddingHorizontal: 12, // space-12
    paddingVertical: 8, // space-8
    borderRadius: 20,
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressCard: {
    marginHorizontal: 16, // space-16 (gutters)
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 12, // space-12
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '500',
  },
  startButton: {
    marginHorizontal: 16, // space-16 (gutters)
    marginBottom: 32, // space-32
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 30,
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lessonsSection: {
    paddingHorizontal: 16, // space-16 (gutters)
  },
  sectionTitle: {
    marginBottom: 16, // space-16
  },
  lessonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lessonCard: {
    width: '48%',
    marginBottom: 16, // space-16
    padding: 0, // Card component handles padding
  },
  lessonContent: {
    alignItems: 'center',
    padding: 16, // space-16
  },
  lockedCard: {
    opacity: 0.6,
  },
  lessonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lessonIcon: {
    fontSize: 32,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  lessonProgressContainer: {
    width: '100%',
    marginTop: 12, // space-12
  },
  lessonProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  lockIcon: {
    fontSize: 20,
    marginTop: 8,
  },
  testButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
