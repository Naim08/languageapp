import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, TypographyVariant } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeProvider';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'dark' | 'light' | 'error' | 'success' | 'warning';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({ 
  variant = 'body', 
  color = 'dark',
  style,
  children,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const getTextColor = () => {
    switch (color) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'muted':
        return theme.colors.textMuted;
      case 'dark':
        return theme.colors.textDark;
      case 'light':
        return theme.colors.textLight;
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.textDark;
    }
  };

  const textStyle = [
    typography[variant],
    { color: getTextColor() },
    style
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});