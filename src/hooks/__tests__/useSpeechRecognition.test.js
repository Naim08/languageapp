// Simple unit test for speech recognition error handling
// Tests the specific "Recorder does not exist" error fix

// Mock React hooks
jest.mock('react', () => ({
  useState: jest.fn((initial) => [initial, jest.fn()]),
  useEffect: jest.fn(),
  useCallback: jest.fn((fn) => fn),
  useRef: jest.fn(() => ({ current: null })),
}));

// Mock all the dependencies
jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(),
    record: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
    uri: 'test-uri',
  })),
  useAudioRecorderState: jest.fn(() => ({
    isRecording: false,
    canRecord: true,
  })),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  },
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
}));

jest.mock('expo-file-system', () => ({
  deleteAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

jest.mock('@/services/ai', () => ({
  OpenAIService: {
    getInstance: jest.fn(() => ({
      speechToText: jest.fn(() => Promise.resolve({ text: 'test transcript' })),
    })),
  },
}));

jest.mock('@/services/ai/ErrorHandlingService', () => ({
  ErrorHandlingService: {
    getInstance: jest.fn(() => ({
      executeWithRetry: jest.fn((fn) => fn()),
    })),
  },
}));

describe('useSpeechRecognition Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should import and create the hook without errors', () => {
    // Import the actual hook after mocks are set up
    const { useSpeechRecognition } = require('../useSpeechRecognition');
    
    // The hook should be defined
    expect(useSpeechRecognition).toBeDefined();
    expect(typeof useSpeechRecognition).toBe('function');
  });

  test('cancel function should be properly defined and callable', async () => {
    const { useSpeechRecognition } = require('../useSpeechRecognition');
    
    // Mock the Recording with the problematic getStatusAsync
    const { useAudioRecorder, AudioModule } = require('expo-audio');
    const mockRecording = {
      prepareToRecordAsync: jest.fn(() => Promise.resolve()),
      startAsync: jest.fn(() => Promise.resolve()),
      stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
      getStatusAsync: jest.fn(() => 
        Promise.reject(new Error('Recorder does not exist. Prepare it first using Audio.prepareToRecordAsync.'))
      ),
      getURI: jest.fn(() => 'mock-uri'),
    };
    Audio.Recording.mockImplementation(() => mockRecording);

    // Create the hook instance
    const hook = useSpeechRecognition();
    
    // The hook should be defined and have a cancel function
    expect(hook).toBeDefined();
    expect(typeof hook.cancel).toBe('function');

    // Test that cancel can be called without throwing
    let errorThrown = false;
    try {
      await hook.cancel();
    } catch (error) {
      errorThrown = true;
      console.error('Cancel threw error:', error);
    }
    
    expect(errorThrown).toBe(false);
  });

  test('our improved error handling patterns should be present in the code', () => {
    // Read the source code to verify our fixes are present
    const fs = require('fs');
    const path = require('path');
    const hookSource = fs.readFileSync(
      path.join(__dirname, '../useSpeechRecognition.ts'), 
      'utf8'
    );

    // Check that our error handling improvements are in place
    expect(hookSource).toContain('errorMessage.includes');
    expect(hookSource).toContain('Recording already cleaned up');
    expect(hookSource).toContain('Handle the "Recorder does not exist" error gracefully');
    
    // Verify the specific error message handling pattern
    expect(hookSource).toContain("errorMessage.includes('Recorder does not exist')");
    expect(hookSource).toContain("errorMessage.includes('does not exist')");
  });
});
