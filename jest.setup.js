import 'react-native-gesture-handler/jestSetup';

// Set global variables required by React Native
global.__DEV__ = true;
// Prevent errors when React Native internals expect the batched bridge config
// to be present.
global.__fbBatchedBridgeConfig = {};

// Mock expo-speech (commented out temporarily - package may not be installed)
/*
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
*/

// Mock removed native speech services
// No longer needed since we use AI-based speech services

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
      getCurrentAppState: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      Version: '15.0',
      select: jest.fn((obj) => obj.ios),
    },
    NativeModules: {
      PlatformConstants: { forceTouchAvailable: false, osVersion: '15.0' },
      Dimensions: {
        get: jest.fn(() => ({
          window: { width: 320, height: 640, scale: 2, fontScale: 2 },
          screen: { width: 320, height: 640, scale: 2, fontScale: 2 },
        })),
        set: jest.fn(),
      },
    },
  };
});

// Mock TurboModuleRegistry used to fetch native constants
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: () => ({
    getConstants: () => ({
      forceTouchAvailable: false,
      osVersion: '15.0',
      systemName: 'iOS',
      interfaceIdiom: 'test',
      Dimensions: {
        window: { width: 320, height: 640, scale: 2, fontScale: 2 },
        screen: { width: 320, height: 640, scale: 2, fontScale: 2 },
      },
    }),
  }),
  get: () => ({
    getConstants: () => ({
      Dimensions: {
        window: { width: 320, height: 640, scale: 2, fontScale: 2 },
        screen: { width: 320, height: 640, scale: 2, fontScale: 2 },
      },
    }),
  }),
}));

// Mock the native AppState module used by React Native
jest.mock('react-native/Libraries/AppState/NativeAppState', () => ({
  getConstants: () => ({ initialAppState: 'active' }),
  getCurrentAppState: (cb) => cb({ app_state: 'active' }),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}));


// AccessibilityInfo pulls in native modules that rely on platform specific
// resolution. Mock it to avoid resolving deep react-native internals.
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
}));

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
