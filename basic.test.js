// Simple test to verify Jest setup
test('Jest setup is working', () => {
  expect(1 + 1).toBe(2);
});

test('Basic TTS functionality mock', () => {
  const mockTTS = {
    speak: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  };

  mockTTS.speak('Hello world');
  expect(mockTTS.speak).toHaveBeenCalledWith('Hello world');
});
