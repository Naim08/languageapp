import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

export const ProgressScreen: React.FC = () => {
  const { theme } = useTheme();
  
  const weeklyData = [
    { day: 'M', minutes: 20, goal: 20 },
    { day: 'T', minutes: 15, goal: 20 },
    { day: 'W', minutes: 25, goal: 20 },
    { day: 'T', minutes: 18, goal: 20 },
    { day: 'F', minutes: 22, goal: 20 },
    { day: 'S', minutes: 12, goal: 20 },
    { day: 'S', minutes: 15, goal: 20 },
  ];

  const achievements = [
    { title: 'First Conversation', emoji: '🎯', unlocked: true },
    { title: 'Week Warrior', emoji: '🔥', unlocked: true },
    { title: 'Perfect Pronunciation', emoji: '🎤', unlocked: false },
    { title: 'Grammar Master', emoji: '📚', unlocked: false },
  ];

  const totalMinutes = 127;
  const streakDays = 5;
  const level = 3;
  const xpToNext = 420;
  const currentXp = 280;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bgLight }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textDark }]}>Your Progress</Text>
        </View>

        {/* Level Card */}
        <View style={[styles.levelCard, { backgroundColor: theme.colors.bgCard }]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.levelBadge}
          >
            <Text style={styles.levelText}>LVL {level}</Text>
          </LinearGradient>
          <View style={styles.levelInfo}>
            <Text style={[styles.levelTitle, { color: theme.colors.textDark }]}>Level {level}</Text>
            <View style={styles.xpContainer}>
              <View style={[styles.xpBarBg, { backgroundColor: theme.colors.bgLight }]}>
                <LinearGradient
                  colors={[theme.colors.primary, '#45A302']}
                  style={[styles.xpBarFill, { width: `${(currentXp / xpToNext) * 100}%` }]}
                />
              </View>
              <Text style={[styles.xpText, { color: theme.colors.textMuted }]}>
                {currentXp} / {xpToNext} XP
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.bgCard }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statNumber, { color: theme.colors.accent }]}>{streakDays}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Day streak</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.colors.bgCard }]}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>{totalMinutes}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Total minutes</Text>
          </View>
        </View>

        {/* Weekly Activity */}
        <View style={[styles.weeklyCard, { backgroundColor: theme.colors.bgCard }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textDark }]}>This Week</Text>
          <View style={styles.weeklyChart}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <View style={styles.barContainer}>
                  <View style={[styles.barBg, { backgroundColor: theme.colors.bgLight }]}>
                    <LinearGradient
                      colors={[theme.colors.primary, '#45A302']}
                      style={[
                        styles.barFill, 
                        { height: `${Math.min((day.minutes / day.goal) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                  {day.minutes >= day.goal && (
                    <Text style={styles.goalMet}>✨</Text>
                  )}
                </View>
                <Text style={[styles.dayLabel, { color: theme.colors.textMuted }]}>{day.day}</Text>
                <Text style={[styles.minutesLabel, { color: theme.colors.textDark }]}>{day.minutes}m</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={[styles.achievementsCard, { backgroundColor: theme.colors.bgCard }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textDark }]}>Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement, index) => (
              <View key={index} style={[
                styles.achievementItem,
                !achievement.unlocked && styles.lockedAchievement
              ]}>
                <Text style={[
                  styles.achievementEmoji,
                  !achievement.unlocked && styles.grayscale
                ]}>
                  {achievement.emoji}
                </Text>
                <Text style={[
                  styles.achievementTitle,
                  { color: achievement.unlocked ? theme.colors.textDark : theme.colors.textMuted }
                ]}>
                  {achievement.title}
                </Text>
                {achievement.unlocked && (
                  <Text style={styles.checkmark}>✅</Text>
                )}
              </View>
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  xpContainer: {
    width: '100%',
  },
  xpBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  weeklyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  barBg: {
    width: 20,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  goalMet: {
    position: 'absolute',
    top: -12,
    fontSize: 12,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  minutesLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  achievementsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lockedAchievement: {
    opacity: 0.6,
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  grayscale: {
    opacity: 0.3,
  },
  achievementTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
  },
});
