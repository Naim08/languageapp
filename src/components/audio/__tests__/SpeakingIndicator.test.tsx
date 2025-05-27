import React from 'react';
import { render } from '@testing-library/react-native';
import { SpeakingIndicator } from '../SpeakingIndicator';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Mock animated values
  const mockUseSharedValue = (value: any) => ({ value });
  const mockUseAnimatedStyle = (callback: () => any) => callback();
  const mockWithTiming = (value: any) => value;
  const mockWithRepeat = (animation: any) => animation;
  
  return {
    ...Reanimated,
    useSharedValue: mockUseSharedValue,
    useAnimatedStyle: mockUseAnimatedStyle,
    withTiming: mockWithTiming,
    withRepeat: mockWithRepeat,
    Easing: {
      sin: jest.fn(),
      inOut: jest.fn(),
    },
  };
});

describe('SpeakingIndicator', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<SpeakingIndicator isVisible={true} />);
    });

    it('should not render when not visible', () => {
      const { queryByTestId } = render(<SpeakingIndicator isVisible={false} />);
      
      expect(queryByTestId('speaking-indicator')).toBeNull();
    });

    it('should render when visible', () => {
      const { getByTestId } = render(<SpeakingIndicator isVisible={true} />);
      
      expect(getByTestId('speaking-indicator')).toBeTruthy();
    });
  });

  describe('Animation Types', () => {
    it('should render pulse animation by default', () => {
      const { getByTestId } = render(<SpeakingIndicator isVisible={true} />);
      
      const indicator = getByTestId('speaking-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should render wave animation when specified', () => {
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} animationType="wave" />
      );
      
      const indicator = getByTestId('speaking-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should render dots animation when specified', () => {
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} animationType="dots" />
      );
      
      const indicator = getByTestId('speaking-indicator');
      expect(indicator).toBeTruthy();
    });

    it('should render progress animation when specified', () => {
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} animationType="progress" />
      );
      
      const indicator = getByTestId('speaking-indicator');
      expect(indicator).toBeTruthy();
    });
  });

  describe('Text Display', () => {
    it('should display text when provided', () => {
      const text = 'Hello, world!';
      const { getByText } = render(
        <SpeakingIndicator isVisible={true} text={text} />
      );
      
      expect(getByText(text)).toBeTruthy();
    });

    it('should not display text when not provided', () => {
      const { queryByTestId } = render(<SpeakingIndicator isVisible={true} />);
      
      expect(queryByTestId('speaking-text')).toBeNull();
    });

    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated when displayed';
      const { getByText } = render(
        <SpeakingIndicator isVisible={true} text={longText} />
      );
      
      const textElement = getByText(longText);
      expect(textElement).toBeTruthy();
      expect(textElement.props.numberOfLines).toBe(2);
    });
  });

  describe('Styling', () => {
    it('should apply custom size', () => {
      const customSize = 80;
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} size={customSize} />
      );
      
      const indicator = getByTestId('speaking-indicator');
      expect(indicator.props.style).toEqual(
        expect.objectContaining({
          width: customSize,
          height: customSize,
        })
      );
    });

    it('should apply custom color', () => {
      const customColor = '#FF0000';
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} color={customColor} />
      );
      
      const indicator = getByTestId('speaking-indicator');
      // Check if color is applied to children elements
      expect(indicator).toBeTruthy();
    });

    it('should apply custom style', () => {
      const customStyle = { marginTop: 20 };
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} style={customStyle} />
      );
      
      const container = getByTestId('speaking-indicator-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });
  });

  describe('Progress Animation', () => {
    it('should display progress when progress animation is used', () => {
      const progress = 0.5; // 50%
      render(
        <SpeakingIndicator 
          isVisible={true} 
          animationType="progress" 
          progress={progress}
        />
      );
      
      // Progress animation should be rendered
      // This test verifies the component doesn't crash with progress props
    });

    it('should handle progress values correctly', () => {
      const testCases = [0, 0.25, 0.5, 0.75, 1];
      
      testCases.forEach(progress => {
        const { rerender } = render(
          <SpeakingIndicator 
            isVisible={true} 
            animationType="progress" 
            progress={progress}
          />
        );
        
        expect(() => {
          rerender(
            <SpeakingIndicator 
              isVisible={true} 
              animationType="progress" 
              progress={progress}
            />
          );
        }).not.toThrow();
      });
    });
  });

  describe('Wave Animation', () => {
    it('should render multiple wave bars', () => {
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} animationType="wave" />
      );
      
      // Should render wave container
      const indicator = getByTestId('speaking-indicator');
      expect(indicator).toBeTruthy();
    });
  });

  describe('Dots Animation', () => {
    it('should render dots animation', () => {
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} animationType="dots" />
      );
      
      const indicator = getByTestId('speaking-indicator');
      expect(indicator).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility label when speaking', () => {
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} />
      );
      
      const indicator = getByTestId('speaking-indicator-container');
      expect(indicator.props.accessibilityLabel).toBe('Speaking');
    });

    it('should have accessibility role', () => {
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} />
      );
      
      const indicator = getByTestId('speaking-indicator-container');
      expect(indicator.props.accessibilityRole).toBe('progressbar');
    });

    it('should include text in accessibility label when provided', () => {
      const text = 'Hello world';
      const { getByTestId } = render(
        <SpeakingIndicator isVisible={true} text={text} />
      );
      
      const indicator = getByTestId('speaking-indicator-container');
      expect(indicator.props.accessibilityLabel).toBe(`Speaking: ${text}`);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <SpeakingIndicator isVisible={true} />
      );
      
      // Multiple re-renders with same props should not cause issues
      rerender(<SpeakingIndicator isVisible={true} />);
      rerender(<SpeakingIndicator isVisible={true} />);
      rerender(<SpeakingIndicator isVisible={true} />);
      
      // Should not throw or cause performance issues
    });

    it('should handle rapid visibility changes', () => {
      const { rerender } = render(
        <SpeakingIndicator isVisible={false} />
      );
      
      // Rapid visibility toggles
      rerender(<SpeakingIndicator isVisible={true} />);
      rerender(<SpeakingIndicator isVisible={false} />);
      rerender(<SpeakingIndicator isVisible={true} />);
      rerender(<SpeakingIndicator isVisible={false} />);
      
      // Should handle gracefully
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined text gracefully', () => {
      expect(() => {
        render(<SpeakingIndicator isVisible={true} text={undefined} />);
      }).not.toThrow();
    });

    it('should handle empty text gracefully', () => {
      expect(() => {
        render(<SpeakingIndicator isVisible={true} text="" />);
      }).not.toThrow();
    });

    it('should handle invalid progress values', () => {
      const invalidValues = [-1, 2, NaN, Infinity];
      
      invalidValues.forEach(progress => {
        expect(() => {
          render(
            <SpeakingIndicator 
              isVisible={true} 
              animationType="progress" 
              progress={progress}
            />
          );
        }).not.toThrow();
      });
    });

    it('should handle zero size', () => {
      expect(() => {
        render(<SpeakingIndicator isVisible={true} size={0} />);
      }).not.toThrow();
    });

    it('should handle negative size', () => {
      expect(() => {
        render(<SpeakingIndicator isVisible={true} size={-10} />);
      }).not.toThrow();
    });
  });
});
