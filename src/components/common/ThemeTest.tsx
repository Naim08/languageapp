import { useTheme } from '@/theme';
import { Text, View } from 'react-native';

export const ThemeTest = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.bgDark, padding: theme.spacing.md }}>
      <Text style={{ color: theme.colors.textDark, fontSize: theme.typography.h2 }}>
        Theme Test: {isDark ? 'Dark' : 'Light'} Mode
      </Text>
    </View>
  );
};
