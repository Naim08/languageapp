import { TextStyle } from 'react-native';

/**
 * Typography styles based on Inter font family specification:
 * - Headline (24/28, 700)
 * - Title (20/24, 600) 
 * - Body (16/22, 400)
 * - Caption (13/18, 400)
 * - JetBrains Mono for transcripts
 */

export const fontFamily = {
  inter: {
    light: 'Inter-Light',
    regular: 'Inter-Regular', 
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  mono: {
    regular: 'JetBrainsMono-Regular',
    medium: 'JetBrainsMono-Medium',
  }
};

// Use system fonts with Inter-like characteristics
// iOS uses San Francisco, Android uses Roboto - both are high-quality alternatives
export const typography = {
  headline: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: 'System', // Uses system font which is high quality
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: 'System',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: 'System',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: 'System',
  },
  transcript: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: 'Courier', // Monospace for transcripts
  }
};

export type TypographyVariant = keyof typeof typography;