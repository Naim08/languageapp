import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';

export const SubscriptionScreen: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgDark }}>
      <View style={{ 
        flex: 1, 
        padding: theme.spacing.lg
      }}>
        <Text style={{ 
          color: theme.colors.textDark,
          fontSize: theme.typography.h2,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: theme.spacing.lg
        }}>
          Continue Learning
        </Text>
        
        <Text style={{ 
          color: theme.colors.textMuted,
          fontSize: theme.typography.body,
          textAlign: 'center',
          marginBottom: theme.spacing.xxl
        }}>
          Your trial has ended. Subscribe to continue practicing with your AI tutor.
        </Text>
        
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Button
            title="Monthly - $9.99"
            variant="primary"
            size="large"
            onPress={() => {}}
          />
        </View>
        
        <Button
          title="Yearly - $59.99 (Save 40%)"
          variant="secondary"
          size="large"
          onPress={() => {}}
        />
      </View>
    </SafeAreaView>
  );
};
