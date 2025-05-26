import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useTheme } from '@/theme';

export const ProgressScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgDark }}>
      <View style={{ 
        flex: 1, 
        padding: theme.spacing.md
      }}>
        <Text style={{ 
          color: theme.colors.textDark,
          fontSize: theme.typography.h2,
          fontWeight: 'bold',
          marginBottom: theme.spacing.lg
        }}>
          Your Progress
        </Text>
        
        <View style={{
          backgroundColor: theme.colors.bgCard,
          padding: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
          marginBottom: theme.spacing.md
        }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.body,
            marginBottom: theme.spacing.sm
          }}>
            Speaking Time Today
          </Text>
          <Text style={{ 
            color: theme.colors.accent,
            fontSize: theme.typography.h1,
            fontWeight: 'bold'
          }}>
            15 min
          </Text>
        </View>
        
        <View style={{
          backgroundColor: theme.colors.bgCard,
          padding: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg
        }}>
          <Text style={{ 
            color: theme.colors.textDark,
            fontSize: theme.typography.body,
            marginBottom: theme.spacing.sm
          }}>
            Current Streak
          </Text>
          <Text style={{ 
            color: theme.colors.success,
            fontSize: theme.typography.h1,
            fontWeight: 'bold'
          }}>
            5 days
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};
