import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme';
import VoiceTestWithLanguages from './src/components/speech/VoiceTestWithLanguages';
import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <VoiceTestWithLanguages />
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
