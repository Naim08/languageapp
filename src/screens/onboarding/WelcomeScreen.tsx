import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';

export const WelcomeScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgDark }}>
      <View style={{ 
        flex: 1, 
        padding: theme.spacing.lg,
        justifyContent: 'center'
      }}>
        <Text style={{ 
          color: theme.colors.textDark,
          fontSize: theme.typography.h1,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: theme.spacing.lg
        }}>
          Welcome to AI Language Tutor
        </Text>
        
        <Text style={{ 
          color: theme.colors.textMuted,
          fontSize: theme.typography.body,
          textAlign: 'center',
          marginBottom: theme.spacing.xxl
        }}>
          Practice speaking with an AI tutor that adapts to your level
        </Text>
        
        <Button
          title="Start 7-Day Free Trial"
          variant="primary"
          size="large"
          onPress={() => {}}
        />
      </View>
    </SafeAreaView>
  );
};
