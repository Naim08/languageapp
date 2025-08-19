export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
    bgDark: string;
    bgLight: string;
    bgCard: string;
    textDark: string;
    textLight: string;
    textMuted: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typography: {
    headline: { size: number; lineHeight: number; weight: string };
    title: { size: number; lineHeight: number; weight: string };
    body: { size: number; lineHeight: number; weight: string };
    caption: { size: number; lineHeight: number; weight: string };
  };
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}
