import 'react-native-gesture-handler/jestSetup';

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([
    { identifier: 'com.apple.voice.compact.en-US.Samantha', name: 'Samantha', quality: 'Default', language: 'en-US' },
    { identifier: 'com.apple.voice.enhanced.en-US.Alex', name: 'Alex', quality: 'Enhanced', language: 'en-US' },
    { identifier: 'com.apple.voice.compact.es-ES.Monica', name: 'Monica', quality: 'Default', language: 'es-ES' },
    { identifier: 'com.apple.voice.enhanced.fr-FR.Thomas', name: 'Thomas', quality: 'Enhanced', language: 'fr-FR' },
  ])),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

// Mock @react-native-voice/voice
jest.mock('@react-native-voice/voice', () => ({
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    removeAllListeners: jest.fn(),
    isAvailable: jest.fn(() => Promise.resolve(true)),
    getSpeechRecognitionServices: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn((event, callback) => ({
        remove: jest.fn(),
      })),
      removeEventListener: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      Version: '15.0',
      select: jest.fn((obj) => obj.ios),
    },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Add any missing mocks
  Reanimated.default.call = () => {};
  
  return {
    ...Reanimated,
    Easing: {
      sin: jest.fn(),
      inOut: jest.fn(),
      out: jest.fn(),
      bezier: jest.fn(),
    },
  };
});

// Mock Animated from react-native
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const ActualAnimated = jest.requireActual('react-native/Libraries/Animated/Animated');
  return {
    ...ActualAnimated,
    timing: () => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
    }),
    loop: () => ({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    sequence: () => ({
      start: jest.fn((callback) => callback && callback({ finished: true })),
    }),
  };
});

// Mock expo modules
jest.mock('expo-constants', () => ({
  default: {
    executionEnvironment: 'standalone',
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress specific warnings during tests
  warn: jest.fn(),
  error: jest.fn(),
};
