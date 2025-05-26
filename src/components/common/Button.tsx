import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    const sizeStyles = {
      small: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
      medium: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
      large: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg },
    };

    const variantStyles = {
      primary: { backgroundColor: theme.colors.primary },
      secondary: { backgroundColor: theme.colors.secondary },
      ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant]];
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontSize: theme.typography.body,
      fontWeight: '600' as const,
    };

    const variantTextStyles = {
      primary: { color: theme.colors.textDark },
      secondary: { color: theme.colors.textDark },
      ghost: { color: theme.colors.primary },
    };

    return [baseTextStyle, variantTextStyles[variant]];
  };

  return (
    <TouchableOpacity style={[getButtonStyle(), style]} {...props}>
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};
