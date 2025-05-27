# Text-to-Speech (TTS) Service Documentation

This document provides comprehensive information about the Text-to-Speech service implementation for the language learning app.

## Overview

The TTS service provides natural-sounding voice synthesis with features specifically designed for language learning:

- **Queue Management**: Handle multiple utterances in sequence
- **Voice Selection**: Automatic selection of best available voices per language
- **Speed Control**: Adaptive speech rates based on user proficiency level
- **Visual Feedback**: Speaking indicators with various animation styles
- **Multi-language Support**: Extensive language and locale support
- **Error Handling**: Robust error management and recovery

## Architecture

### Core Components

1. **TextToSpeechService**: Main service class managing TTS operations
2. **VoiceManager**: Handles voice selection and language fallbacks
3. **useTextToSpeech**: React hook for easy TTS integration
4. **SpeakingIndicator**: Visual component showing speech activity

### Service Layer

```typescript
// Service singleton pattern
const ttsService = TextToSpeechService.getInstance();

// Initialize the service
await ttsService.initialize();

// Basic speech
await ttsService.speak("Hello, world!");

// Advanced speech with options
await ttsService.speak("Bonjour!", {
  language: 'fr-FR',
  userLevel: 'beginner',
  rate: 0.8,
  onDone: () => console.log('Speech completed')
});
```

### React Hook Usage

```typescript
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const MyComponent = () => {
  const {
    isAvailable,
    isSpeaking,
    speak,
    speakForLevel,
    pause,
    resume,
    stop
  } = useTextToSpeech({
    language: 'en-US',
    userLevel: 'intermediate',
    onStart: (id) => console.log('Started:', id),
    onDone: (id) => console.log('Finished:', id),
    onError: (error) => console.error('Error:', error)
  });

  const handleSpeak = async () => {
    try {
      await speak("This is a test");
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  };

  return (
    <View>
      <Button title="Speak" onPress={handleSpeak} disabled={!isAvailable} />
      {isSpeaking && <Text>Speaking...</Text>}
    </View>
  );
};
```

## Features

### 1. Level-Based Speech Control

The system automatically adjusts speech parameters based on user proficiency:

- **Beginner**: 0.8x speed (slower for comprehension)
- **Intermediate**: 1.0x speed (normal rate)
- **Advanced**: 1.2x speed (faster for challenge)

```typescript
// Speak at beginner level
await speakForLevel("Slow speech for beginners", 'beginner');

// Speak at advanced level
await speakForLevel("Fast speech for advanced users", 'advanced');
```

### 2. Queue Management

Multiple utterances are automatically queued and played in sequence:

```typescript
// Queue multiple utterances
await speak("First sentence");
await speak("Second sentence");
await speak("Third sentence");

// Or use the convenience method
await speakSentences([
  "First sentence",
  "Second sentence", 
  "Third sentence"
], {
  pauseBetween: 1000 // 1 second pause between sentences
});
```

### 3. Voice Selection

The VoiceManager automatically selects the best available voice for each language:

```typescript
// Get voices for a specific language
const voices = await getVoicesForLanguage('fr-FR');

// System automatically selects best voice
await speak("Bonjour", { language: 'fr-FR' });

// Or specify a particular voice
await speak("Hello", { 
  language: 'en-US',
  voice: 'com.apple.ttsbundle.Samantha-compact'
});
```

### 4. Visual Feedback

The SpeakingIndicator component provides various animation styles:

```typescript
import SpeakingIndicator from '@/components/audio/SpeakingIndicator';

<SpeakingIndicator
  isActive={isSpeaking}
  size={40}
  color="#007AFF"
  animationType="bars" // 'pulse', 'wave', 'dots', 'bars'
  speed={1000}
/>
```

### 5. Error Handling

Comprehensive error handling with specific error codes:

```typescript
const { error, clearError } = useTextToSpeech({
  onError: (error: TTSError) => {
    switch (error.code) {
      case 'SPEECH_ERROR':
        // Handle speech synthesis errors
        break;
      case 'INIT_ERROR':
        // Handle initialization errors
        break;
      case 'SENTENCE_ERROR':
        // Handle multi-sentence errors
        break;
    }
  }
});
```

## Supported Languages

The system supports a wide range of languages with automatic fallbacks:

### Primary Languages
- English: `en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, `en-ZA`
- Spanish: `es-ES`, `es-MX`, `es-AR`, `es-CO`, `es-PE`, `es-VE`
- French: `fr-FR`, `fr-CA`, `fr-BE`, `fr-CH`
- German: `de-DE`, `de-AT`, `de-CH`
- Italian: `it-IT`
- Portuguese: `pt-BR`, `pt-PT`

### Asian Languages
- Japanese: `ja-JP`
- Korean: `ko-KR`
- Chinese: `zh-CN`, `zh-TW`, `zh-HK`

### Other Languages
- Arabic: `ar-SA`
- Hebrew: `he-IL`
- Hindi: `hi-IN`
- Russian: `ru-RU`
- Dutch: `nl-NL`
- Swedish: `sv-SE`
- And many more...

## Configuration

### Service Configuration

```typescript
ttsService.setConfig({
  defaultRate: 1.0,
  defaultPitch: 1.0,
  defaultVolume: 1.0,
  queueMode: 'add', // 'add' or 'replace'
  autoLanguageDetection: true
});
```

### Level Configuration

```typescript
ttsService.setLevelConfig({
  rate: {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.2
  },
  pitch: {
    beginner: 1.0,
    intermediate: 1.0,
    advanced: 1.0
  },
  volume: {
    beginner: 1.0,
    intermediate: 1.0,
    advanced: 1.0
  }
});
```

## Platform Considerations

### iOS
- Full pause/resume support
- High-quality compact voices available
- Voice selection via `iosVoiceId`

### Android
- No native pause/resume (falls back to stop)
- Uses Android TTS engine
- Voice selection via `androidParams`

### Web
- Browser-dependent voice availability
- May require user interaction to initialize

## Best Practices

### 1. Error Handling
Always handle TTS errors gracefully:

```typescript
try {
  await speak(text);
} catch (error) {
  // Provide fallback or user feedback
  Alert.alert('Speech Error', 'Unable to speak text');
}
```

### 2. Text Validation
Check text length and content before speaking:

```typescript
if (text.length > Speech.maxSpeechInputLength) {
  // Split text or show error
  console.error('Text too long for TTS');
}
```

### 3. User Experience
- Provide visual feedback during speech
- Allow users to control speech (pause/stop)
- Show queue status for multiple utterances
- Handle interruptions gracefully

### 4. Performance
- Initialize TTS service early in app lifecycle
- Cache voice lists to avoid repeated API calls
- Use appropriate speech rates for content type

## Common Use Cases

### Language Learning Scenarios

```typescript
// Pronunciation practice
await speak(word, { 
  language: targetLanguage,
  userLevel: studentLevel,
  rate: 0.8 // Slower for pronunciation
});

// Conversation practice
await speakSentences(dialogueParts, {
  language: targetLanguage,
  pauseBetween: 2000 // 2 seconds between parts
});

// Vocabulary introduction
await speak(`The word is: ${word}`, { language: 'en-US' });
await speak(word, { language: targetLanguage, userLevel: 'beginner' });
await speak(`Meaning: ${meaning}`, { language: 'en-US' });
```

### Reading Assistance

```typescript
// Read article with user-appropriate speed
await speak(articleText, {
  language: contentLanguage,
  userLevel: userProficiency
});

// Read with visual highlighting
const sentences = splitIntoSentences(text);
await speakSentences(sentences, {
  onSentenceStart: (index, sentence) => {
    highlightSentence(index);
  },
  onSentenceDone: (index) => {
    removeHighlight(index);
  }
});
```

## Troubleshooting

### Common Issues

1. **TTS Not Available**
   - Check device TTS settings
   - Ensure internet connection (Android)
   - Verify app permissions

2. **Voice Not Found**
   - Use fallback language
   - Check available voices
   - Implement graceful degradation

3. **Pause/Resume Not Working**
   - Check platform (Android limitation)
   - Use stop/restart as fallback

4. **Queue Not Processing**
   - Check for errors in utterances
   - Verify service initialization
   - Monitor queue state

### Debugging

Enable detailed logging:

```typescript
// Add debug callbacks
const { speak } = useTextToSpeech({
  onStart: (id) => console.log(`Started: ${id}`),
  onDone: (id) => console.log(`Completed: ${id}`),
  onError: (error) => console.error(`Error: ${error.code} - ${error.message}`),
});
```

## Testing

The TTSExample component provides a comprehensive test interface:

```typescript
import TTSExample from '@/components/examples/TTSExample';

// Use in development/testing
<TTSExample defaultLanguage="en-US" defaultUserLevel="intermediate" />
```

This covers all major features and provides interactive testing capabilities for development and debugging.
