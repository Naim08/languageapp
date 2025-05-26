import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/theme';
import { Theme } from '@/types/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: keyof Theme['spacing'];
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const cardStyle = {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[padding as keyof typeof theme.spacing],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
};
