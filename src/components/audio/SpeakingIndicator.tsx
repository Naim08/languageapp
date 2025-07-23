import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';

interface SpeakingIndicatorProps {
  isActive: boolean;
  size?: number;
  color?: string;
  animationType?: 'pulse' | 'wave' | 'dots' | 'bars' | 'progress';
  speed?: number;
  style?: ViewStyle;
  progress?: number; // 0-1 for progress bar mode
  showText?: boolean;
  text?: string;
}

export const SpeakingIndicator: React.FC<SpeakingIndicatorProps> = ({
  isActive,
  size = 40,
  color = '#007AFF',
  animationType = 'pulse',
  speed = 1000,
  style,
  progress = 0,
  showText = false,
  text = 'Speaking...',
}) => {
  const animationValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const animations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isActive) {
      startAnimations();
    } else {
      stopAnimations();
    }

    return () => {
      stopAnimations();
    };
  }, [isActive, animationType, speed]);

  const startAnimations = () => {
    stopAnimations();

    switch (animationType) {
      case 'pulse':
        startPulseAnimation();
        break;
      case 'wave':
        startWaveAnimation();
        break;
      case 'dots':
        startDotsAnimation();
        break;
      case 'bars':
        startBarsAnimation();
        break;
      case 'progress':
        startProgressAnimation();
        break;
    }
  };

  const stopAnimations = () => {
    animations.current.forEach(animation => animation.stop());
    animations.current = [];
    animationValues.forEach(value => value.setValue(0));
  };

  const startPulseAnimation = () => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animationValues[0], {
          toValue: 1,
          duration: speed / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animationValues[0], {
          toValue: 0,
          duration: speed / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animations.current.push(pulseAnimation);
    pulseAnimation.start();
  };

  const startWaveAnimation = () => {
    const waveAnimations = animationValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: speed / 3,
            delay: index * (speed / 6),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: speed / 3,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.current.push(...waveAnimations);
    waveAnimations.forEach(animation => animation.start());
  };

  const startDotsAnimation = () => {
    const dotAnimations = animationValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: speed / 4,
            delay: index * (speed / 8),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: speed / 4,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(speed / 4),
        ])
      )
    );

    animations.current.push(...dotAnimations);
    dotAnimations.forEach(animation => animation.start());
  };

  const startBarsAnimation = () => {
    const barAnimations = animationValues.map((value, index) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: speed / 2 + Math.random() * (speed / 4),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      )
    );

    animations.current.push(...barAnimations);
    barAnimations.forEach(animation => animation.start());
  };

  const startProgressAnimation = () => {
    // For progress mode, we use the progress prop directly
    Animated.timing(animationValues[0], {
      toValue: progress,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false, // Can't use native driver for width animations
    }).start();
  };

  // Update progress animation when progress prop changes
  useEffect(() => {
    if (animationType === 'progress' && isActive) {
      startProgressAnimation();
    }
  }, [progress, animationType, isActive]);

  const renderPulseIndicator = () => {
    const scale = animationValues[0].interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.2],
    });

    const opacity = animationValues[0].interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    });

    return (
      <Animated.View
        testID="speaking-indicator"
        style={[
          styles.pulseCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  const renderWaveIndicator = () => {
    return (
      <View testID="speaking-indicator" style={styles.waveContainer}>
        {animationValues.map((value, index) => {
          const scale = value.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.waveCircle,
                {
                  width: size / 3,
                  height: size / 3,
                  borderRadius: size / 6,
                  backgroundColor: color,
                  transform: [{ scale }],
                  marginHorizontal: size / 12,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderDotsIndicator = () => {
    return (
      <View testID="speaking-indicator" style={styles.dotsContainer}>
        {animationValues.map((value, index) => {
          const translateY = value.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -size / 4],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: size / 6,
                  height: size / 6,
                  borderRadius: size / 12,
                  backgroundColor: color,
                  transform: [{ translateY }],
                  marginHorizontal: size / 24,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderBarsIndicator = () => {
    return (
      <View testID="speaking-indicator" style={styles.barsContainer}>
        {animationValues.map((value, index) => {
          const height = value.interpolate({
            inputRange: [0, 1],
            outputRange: [size / 4, size],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  width: size / 8,
                  height,
                  backgroundColor: color,
                  marginHorizontal: size / 32,
                  borderRadius: size / 16,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderProgressIndicator = () => {
    const progressWidth = animationValues[0].interpolate({
      inputRange: [0, 1],
      outputRange: [0, size * 2], // Make it wider than other indicators
    });

    return (
      <View testID="speaking-indicator" style={[styles.progressContainer, { width: size * 2, height: size / 4 }]}>
        <View style={[styles.progressBackground, { backgroundColor: `${color}30` }]} />
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  };

  const renderIndicator = () => {
    switch (animationType) {
      case 'pulse':
        return renderPulseIndicator();
      case 'wave':
        return renderWaveIndicator();
      case 'dots':
        return renderDotsIndicator();
      case 'bars':
        return renderBarsIndicator();
      case 'progress':
        return renderProgressIndicator();
      default:
        return renderPulseIndicator();
    }
  };

  return (
    <View
      testID="speaking-indicator-container"
      style={[styles.container, { opacity: isActive ? 1 : 0.3 }, style]}
    >
      {renderIndicator()}
      {showText && isActive && (
        <Text style={[styles.speakingText, { color }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    // Styles applied dynamically
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveCircle: {
    // Styles applied dynamically
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40, // Ensure consistent height for translateY animation
  },
  dot: {
    // Styles applied dynamically
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40, // Ensure consistent height for bars
  },
  bar: {
    // Styles applied dynamically
  },
  progressContainer: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  speakingText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SpeakingIndicator;
