import { Theme } from '@/types/theme';

export const lightTheme: Theme = {
  colors: {
    primary: '#3B82F6',      // Modern blue primary
    secondary: '#1CB0F6',    // Bright blue
    accent: '#7C8BFF',       // Purple accent
    success: '#4CAF50',      // Green success
    error: '#FF4081',        // Pink error/alert
    warning: '#FFCC00',      // Yellow warning
    bgDark: '#FFFFFF',       // Pure white
    bgLight: '#F8F9FA',      // Light gray background
    bgCard: '#FFFFFF',       // Card white
    textDark: '#212121',     // Dark text for readability
    textLight: '#212121',    // Same for consistency
    textMuted: '#757575'     // Muted gray
  },
  spacing: {
    xs: 4,    // space-4
    sm: 8,    // space-8  
    md: 12,   // space-12
    lg: 16,   // space-16 (gutters)
    xl: 24,   // space-24
    xxl: 32,  // space-32
    xxxl: 48  // space-48
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999
  },
  typography: {
    headline: { size: 24, lineHeight: 28, weight: '700' },  // Headline (24/28, 700)
    title: { size: 20, lineHeight: 24, weight: '600' },     // Title (20/24, 600)
    body: { size: 16, lineHeight: 22, weight: '400' },      // Body (16/22, 400)
    caption: { size: 13, lineHeight: 18, weight: '400' }    // Caption (13/18, 400)
  }
};

export const darkTheme: Theme = {
  colors: {
    primary: '#3B82F6',      // Modern blue primary (consistent)
    secondary: '#1CB0F6',    // Bright blue
    accent: '#7C8BFF',       // Purple accent
    success: '#4CAF50',      // Green success
    error: '#FF4081',        // Pink error/alert
    warning: '#FFCC00',      // Yellow warning
    bgDark: '#0B0F13',       // Dark background as specified
    bgLight: '#1A1E23',      // Slightly lighter dark
    bgCard: '#232931',       // Card background
    textDark: '#FFFFFF',     // White text
    textLight: '#F8F9FA',    // Light text
    textMuted: '#9CA3AF'     // Muted gray
  },
  spacing: {
    xs: 4,    // space-4
    sm: 8,    // space-8  
    md: 12,   // space-12
    lg: 16,   // space-16 (gutters)
    xl: 24,   // space-24
    xxl: 32,  // space-32
    xxxl: 48  // space-48
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999
  },
  typography: {
    headline: { size: 24, lineHeight: 28, weight: '700' },  // Headline (24/28, 700)
    title: { size: 20, lineHeight: 24, weight: '600' },     // Title (20/24, 600)
    body: { size: 16, lineHeight: 22, weight: '400' },      // Body (16/22, 400)
    caption: { size: 13, lineHeight: 18, weight: '400' }    // Caption (13/18, 400)
  }
};
