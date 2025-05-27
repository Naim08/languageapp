import React from 'react';
import { TtsTestingDemo } from '@/components/speech';

/**
 * TTS Testing Screen
 * 
 * This screen provides a comprehensive interface for testing Text-to-Speech functionality,
 * with special focus on Bengali and Hindi language support.
 * 
 * Features:
 * - Quick language tests with predefined phrases
 * - Custom text input for any language
 * - Speech speed level testing (beginner, intermediate, advanced)
 * - Playback controls (pause, resume, stop, clear queue)
 * - Special focus section for Bengali and Hindi testing
 * - Real-time status indicators
 * 
 * Usage:
 * 1. The screen automatically initializes the TTS service
 * 2. Use "Quick Language Tests" to test predefined phrases in different languages
 * 3. Use "Custom Text" to enter your own text in any language
 * 4. Test different speech speeds with "Speech Speed Levels"
 * 5. Use playback controls to manage speech during playback
 * 6. Pay special attention to the Bengali & Hindi Focus section
 */
export const TtsTestingScreen: React.FC = () => {
  return <TtsTestingDemo />;
};

export default TtsTestingScreen;
