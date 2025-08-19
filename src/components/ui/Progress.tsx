import React from 'react';
import { View, StyleSheet, Animated, Text as RNText } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../theme/ThemeProvider';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'success';
  showLabel?: boolean;
  label?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'linear',
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
}) => {
  const { theme } = useTheme();
  
  const progress = Math.min(Math.max(value, 0), max) / max;

  const getColor = () => {
    switch (color) {
      case 'secondary':
        return theme.colors.secondary;
      case 'accent':
        return theme.colors.accent;
      case 'success':
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return variant === 'circular' ? 40 : 4;
      case 'lg':
        return variant === 'circular' ? 80 : 12;
      default: // md
        return variant === 'circular' ? 60 : 8;
    }
  };

  if (variant === 'circular') {
    const circleSize = getSize();
    const radius = circleSize / 2 - 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress * circumference);

    return (
      <View style={[styles.circularContainer, { width: circleSize, height: circleSize }]}>
        <View style={styles.circularProgress}>
          {/* Background circle */}
          <View
            style={[
              styles.circle,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                borderColor: theme.colors.textMuted + '20',
              }
            ]}
          />
          {/* Progress circle - would need react-native-svg for proper implementation */}
          <View
            style={[
              styles.circle,
              styles.progressCircle,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                borderColor: getColor(),
                transform: [{ rotate: '-90deg' }],
              }
            ]}
          />
        </View>
        {showLabel && (
          <View style={styles.circularLabel}>
            <Text variant="caption" color="dark" style={styles.labelText}>
              {label || `${Math.round(progress * 100)}%`}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Linear progress
  const height = getSize();

  return (
    <View style={styles.container}>
      {showLabel && label && (
        <Text variant="caption" color="muted" style={styles.labelText}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: theme.colors.textMuted + '20',
            borderRadius: height / 2,
          }
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              height,
              backgroundColor: getColor(),
              borderRadius: height / 2,
            }
          ]}
        />
      </View>
      {showLabel && !label && (
        <Text variant="caption" color="muted" style={styles.percentText}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgress: {
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderWidth: 4,
  },
  progressCircle: {
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  circularLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    marginBottom: 4,
  },
  percentText: {
    marginTop: 4,
    textAlign: 'right',
  },
});