import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from '@/components/common';

export const ConversationScreen: React.FC = () => {
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
          Practice Conversation
        </Text>
        
        <View style={{ 
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Button
            title="Hold to Speak"
            variant="primary"
            size="large"
            onPress={() => {}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};
