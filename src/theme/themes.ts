import { Theme } from '@/types/theme';

export const lightTheme: Theme = {
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    bgDark: '#FFFFFF',
    bgLight: '#F9FAFB',
    bgCard: '#FFFFFF',
    textDark: '#111827',
    textLight: '#111827',
    textMuted: '#6B7280'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999
  },
  typography: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    caption: 14
  }
};

export const darkTheme: Theme = {
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    bgDark: '#1F2937',
    bgLight: '#111827',
    bgCard: '#374151',
    textDark: '#F3F4F6',
    textLight: '#F3F4F6',
    textMuted: '#9CA3AF'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999
  },
  typography: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    caption: 14
  }
};
