import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme';
import { Navigation } from '@/navigation';
import './global.css';

export default function App() {
  return (
    <ThemeProvider>
      <Navigation />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
