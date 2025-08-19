import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../theme/ThemeProvider';

interface ChipProps extends TouchableOpacityProps {
  variant?: 'default' | 'concept' | 'pill' | 'selected' | 'asr';
  size?: 'sm' | 'md';
  selected?: boolean;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  variant = 'default',
  size = 'md',
  selected = false,
  style,
  children,
  disabled,
  ...props
}) => {
  const { theme } = useTheme();

  const getChipStyle = () => {
    const baseStyle = {
      paddingHorizontal: size === 'sm' ? theme.spacing.sm : theme.spacing.md,
      paddingVertical: size === 'sm' ? theme.spacing.xs : theme.spacing.sm,
      borderRadius: size === 'sm' ? 12 : 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 32, // Minimum touch target
    };

    switch (variant) {
      case 'concept':
        return {
          ...baseStyle,
          backgroundColor: selected ? theme.colors.primary : theme.colors.bgLight,
          borderWidth: 1,
          borderColor: selected ? theme.colors.primary : theme.colors.textMuted + '40',
        };
      case 'pill':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.accent + '20',
          borderRadius: 20,
        };
      case 'selected':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
        };
      case 'asr':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.secondary + '20',
          borderWidth: 1,
          borderColor: theme.colors.secondary + '40',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: selected ? theme.colors.primary : theme.colors.bgLight,
        };
    }
  };

  const getTextColor = () => {
    if (selected || variant === 'selected') {
      return 'light';
    }
    
    switch (variant) {
      case 'concept':
        return selected ? 'light' : 'dark';
      case 'pill':
        return 'primary';
      case 'asr':
        return 'secondary';
      default:
        return 'dark';
    }
  };

  const getTextVariant = () => {
    return size === 'sm' ? 'caption' : 'body';
  };

  return (
    <TouchableOpacity
      style={[getChipStyle(), style]}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <Text 
        variant={getTextVariant()} 
        color={getTextColor()}
        style={styles.chipText}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chipText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});