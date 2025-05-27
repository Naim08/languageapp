import React, { useEffect, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  interpolate,
  withRepeat,
  withSequence,
  useDerivedValue,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface AudioVisualizerProps {
  audioLevel: number;
  isListening: boolean;
  isProcessing?: boolean;
  size?: number;
  strokeWidth?: number;
  showWaveform?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevel = 0,
  isListening = false,
  isProcessing = false,
  size = 200,
  strokeWidth = 4,
  showWaveform = true,
  animationSpeed = 'normal',
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const waveOffset = useSharedValue(0);
  const audioLevelValue = useSharedValue(0);
  const processingProgress = useSharedValue(0);

  // Animation speed configuration
  const speedConfig = useMemo(() => {
    const configs = {
      slow: { duration: 2000, pulseSpeed: 1500 },
      normal: { duration: 1500, pulseSpeed: 1000 },
      fast: { duration: 1000, pulseSpeed: 700 },
    };
    return configs[animationSpeed];
  }, [animationSpeed]);

  // Center coordinates
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size - strokeWidth * 2) / 2;

  // Update audio level with smooth animation
  useEffect(() => {
    audioLevelValue.value = withSpring(audioLevel, {
      damping: 15,
      stiffness: 150,
    });
  }, [audioLevel]);

  // Listening state animations
  useEffect(() => {
    if (isListening) {
      // Pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 10 }),
          withSpring(1, { damping: 10 })
        ),
        -1,
        true
      );

      // Wave animation
      waveOffset.value = withRepeat(
        withTiming(360, {
          duration: speedConfig.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      pulseScale.value = withSpring(1);
      waveOffset.value = withTiming(0);
    }
  }, [isListening, speedConfig]);

  // Processing animation
  useEffect(() => {
    if (isProcessing) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: speedConfig.pulseSpeed,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      
      processingProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: speedConfig.pulseSpeed }),
          withTiming(0, { duration: speedConfig.pulseSpeed })
        ),
        -1,
        true
      );
    } else {
      rotation.value = withTiming(0);
      processingProgress.value = withTiming(0);
    }
  }, [isProcessing, speedConfig]);

  // Generate waveform path
  const generateWaveformPath = (level: number, offset: number): string => {
    'worklet';
    const waveRadius = radius * 0.8;
    const points = 60;
    const angleStep = (2 * Math.PI) / points;
    
    let path = '';
    
    for (let i = 0; i <= points; i++) {
      const angle = i * angleStep + (offset * Math.PI) / 180;
      const waveAmplitude = 5 + (level / 100) * 15;
      const noise = Math.sin(angle * 3 + offset / 10) * waveAmplitude * 0.3;
      const currentRadius = waveRadius + Math.sin(angle * 2 + offset / 20) * waveAmplitude + noise;
      
      const x = centerX + Math.cos(angle) * currentRadius;
      const y = centerY + Math.sin(angle) * currentRadius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    
    path += ' Z';
    return path;
  };

  // Animated props for main circle
  const animatedCircleProps = useAnimatedProps(() => {
    const scale = pulseScale.value;
    const currentRadius = radius * scale;
    
    return {
      r: currentRadius,
      transform: [{ scale }],
    };
  });

  // Animated props for audio level circle
  const audioLevelCircleProps = useAnimatedProps(() => {
    const level = audioLevelValue.value;
    const levelRadius = interpolate(level, [0, 100], [radius * 0.3, radius * 0.9]);
    
    return {
      r: levelRadius,
    };
  });

  // Animated props for waveform
  const waveformProps = useAnimatedProps(() => {
    const level = audioLevelValue.value;
    const offset = waveOffset.value;
    
    return {
      d: generateWaveformPath(level, offset),
    };
  });

  // Animated props for processing indicator
  const processingProps = useAnimatedProps(() => {
    const progress = processingProgress.value;
    const strokeDasharray = 2 * Math.PI * radius;
    const strokeDashoffset = strokeDasharray * (1 - progress);
    
    return {
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Color interpolation based on audio level
  const getAudioLevelColor = useMemo(() => {
    return (level: number) => {
      if (level < 30) return theme.colors.primary;
      if (level < 60) return theme.colors.accent;
      return theme.colors.success;
    };
  }, [theme]);

  const currentColor = useDerivedValue(() => {
    const level = audioLevelValue.value;
    if (level < 30) return theme.colors.primary;
    if (level < 60) return theme.colors.accent;
    return theme.colors.success;
  });

  return (
    <View style={{ 
      width: size, 
      height: size, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Gradient for active state */}
          <RadialGradient id="activeGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.8" />
            <Stop offset="70%" stopColor={theme.colors.primary} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.1" />
          </RadialGradient>
          
          {/* Gradient for audio level */}
          <RadialGradient id="audioGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={theme.colors.accent} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={theme.colors.accent} stopOpacity="0.1" />
          </RadialGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={theme.colors.bgCard}
          strokeWidth={strokeWidth / 2}
        />

        {/* Audio level indicator */}
        <AnimatedCircle
          cx={centerX}
          cy={centerY}
          fill="url(#audioGradient)"
          animatedProps={audioLevelCircleProps}
        />

        {/* Waveform visualization */}
        {showWaveform && isListening && (
          <AnimatedPath
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth={2}
            strokeOpacity={0.6}
            animatedProps={waveformProps}
          />
        )}

        {/* Main pulsing circle */}
        <AnimatedCircle
          cx={centerX}
          cy={centerY}
          fill={isListening ? "url(#activeGradient)" : "none"}
          stroke={isListening ? theme.colors.primary : theme.colors.textMuted}
          strokeWidth={strokeWidth}
          animatedProps={animatedCircleProps}
        />

        {/* Processing indicator */}
        {isProcessing && (
          <AnimatedCircle
            cx={centerX}
            cy={centerY}
            r={radius + strokeWidth}
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth={strokeWidth / 2}
            strokeLinecap="round"
            animatedProps={processingProps}
          />
        )}

        {/* Center dot */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={strokeWidth}
          fill={isListening ? theme.colors.primary : theme.colors.textMuted}
        />
      </Svg>
    </View>
  );
};
