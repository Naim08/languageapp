import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useTheme } from '@/theme';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgDark }}>
      <View style={{ 
        flex: 1, 
        padding: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ 
          color: theme.colors.textDark,
          fontSize: theme.typography.h1,
          fontWeight: 'bold',
          marginBottom: theme.spacing.lg
        }}>
          AI Language Tutor
        </Text>
        <Text style={{ 
          color: theme.colors.textMuted,
          fontSize: theme.typography.body,
          textAlign: 'center'
        }}>
          Start practicing conversations with your AI tutor
        </Text>
      </View>
    </SafeAreaView>
  );
};
