# AI Language Tutor - Copilot Instructions

This is a React Native Expo app for language learning with advanced speech recognition and text-to-speech capabilities.

## Architecture Overview

### Core Stack
- **Frontend**: React Native with Expo (v53+), TypeScript, NativeWind (Tailwind CSS)
- **Backend**: Supabase for auth/database + Edge Functions for AI services
- **AI Services**: OpenAI Whisper (speech-to-text), OpenAI/Gemini TTS via unified Edge Functions
- **Speech**: Expo AV for recording, custom hooks for speech recognition/TTS

### Key Directory Structure
- `src/services/`: Core business logic (ai/, speech/, storage/, subscription/)
- `src/hooks/`: React hooks for speech, auth, and unified functionality
- `src/providers/`: Context providers (AuthProvider, ThemeProvider)
- `supabase/functions/`: Edge Functions for AI services (unified-tts, openai-whisper, etc.)
- `src/types/`: TypeScript definitions for speech, Supabase, and core interfaces

## Speech Architecture Patterns

### Unified Speech System
The app uses a **unified speech system** combining multiple providers:
- Speech Recognition: OpenAI Whisper via Edge Functions + local Expo AV recording
- TTS: Unified Edge Function supporting OpenAI TTS and Gemini voices with automatic fallback
- Key hooks: `useSpeechRecognition`, `useTextToSpeech`, `useUnifiedSpeech`

### Audio Lifecycle Management
```typescript
// Recording pattern used throughout
const recording = new Audio.Recording();
await recording.prepareToRecordAsync(recordingOptions);
await recording.startAsync();
// ... record audio
await recording.stopAndUnloadAsync();
```

**Critical**: Always call `prepareToRecordAsync()` before `startAsync()` and `stopAndUnloadAsync()` before starting new recordings to avoid "Recorder does not exist" errors.

## Development Workflows

### Testing Speech Features
- Use `TestingDashboard` screen as entry point for speech component testing
- Navigate via `AppContent` component's test routing system
- Key test components: `SpeechDebugger`, `TtsTestingDemo`, `VoiceTestWithLanguages`

### Edge Function Development
- Located in `supabase/functions/`
- Deploy with: `supabase functions deploy <function-name>`
- Local development: `supabase start` then `supabase functions serve`

### Build Commands
- Development: `npm run start` (Expo development server)
- iOS: `npm run ios` (requires iOS simulator/device)
- Android: `npm run android` (requires Android emulator/device)
- Testing: `npm run test` (Jest with React Native Testing Library)

## Project-Specific Conventions

### Import Aliases
Use `@/` prefix for all src imports:
```typescript
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
```

### Type Definitions
- Speech types in `src/services/speech/types.ts` 
- Supabase types in `src/types/supabase.ts`
- Use specific types like `SpeechLanguage`, `TTSVoice`, `UserLevel` instead of strings

### Theme System
- NativeWind classes with custom theme in `tailwind.config.js`
- Theme context available via `useTheme()` hook
- Colors: `theme.colors.primary`, `theme.colors.bgDark`, etc.

### Auth Pattern
- Supabase auth with Apple Sign-In and magic links
- AuthProvider wraps app, AuthGate handles auth state
- Deep link handling for magic link authentication in `AuthProvider`

## Error Handling
- Use `ErrorHandlingService` for consistent error logging and user feedback
- Speech errors handled via callback patterns in hooks
- Edge Function errors returned as JSON with `error` field

## Key Integration Points
- **Supabase Client**: `src/lib/supabase.ts` - configured for React Native with AsyncStorage
- **Speech Services**: All speech functionality routed through Edge Functions, not direct API calls
- **Audio Recording**: Always use Expo AV with proper lifecycle management
- **State Management**: React Context for auth/theme, custom hooks for feature state
