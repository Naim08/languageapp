import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useUnifiedSpeech } from '@/hooks/useUnifiedSpeech';
import { useTheme } from '@/theme';
import { WhisperModel } from '@/services/speech/types';

export const WhisperManager: React.FC = () => {
  const { theme } = useTheme();
  const [availableModels, setAvailableModels] = useState<WhisperModel[]>([]);
  const [modelDownloadStatus, setModelDownloadStatus] = useState<Record<string, { downloaded: boolean; downloading: boolean; progress: number }>>({});
  const [selectedModel, setSelectedModel] = useState<WhisperModel>('tiny.en');
  const [storageInfo, setStorageInfo] = useState<{ totalSize: number; downloadedModels: any[] } | null>(null);

  const {
    isListening,
    isAvailable,
    transcript,
    partialTranscript,
    error,
    audioLevel,
    currentEngine,
    start,
    stop,
    switchEngine,
    clearTranscript,
    clearError,
    downloadModel,
    getAvailableModels,
    isModelDownloaded,
    getModelInfo,
    runDiagnostics,
  } = useUnifiedSpeech({
    engine: 'whisper',
    whisperModel: selectedModel,
    onResult: (transcript) => {
      console.log('🤖 Whisper result:', transcript);
    },
    onError: (error) => {
      console.error('🤖 Whisper error:', error);
    },
    onEngineSwitch: (engine) => {
      console.log('🔄 Engine switched to:', engine);
    },
  });

  useEffect(() => {
    loadAvailableModels();
    loadStorageInfo();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const models = await getAvailableModels();
      setAvailableModels(models);
      
      // Check download status for each model
      const status: Record<string, any> = {};
      for (const model of models) {
        const downloaded = await isModelDownloaded(model);
        status[model] = { downloaded, downloading: false, progress: 0 };
      }
      setModelDownloadStatus(status);
    } catch (error) {
      console.error('Failed to load available models:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      // This will work once we add getModelStorageInfo to the hook
      console.log('Loading storage info...');
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const handleDownloadModel = async (model: WhisperModel) => {
    try {
      setModelDownloadStatus(prev => ({
        ...prev,
        [model]: { ...prev[model], downloading: true, progress: 0 }
      }));

      const modelPath = await downloadModel(model, (progress) => {
        setModelDownloadStatus(prev => ({
          ...prev,
          [model]: { ...prev[model], progress }
        }));
      });

      setModelDownloadStatus(prev => ({
        ...prev,
        [model]: { downloaded: true, downloading: false, progress: 100 }
      }));

      Alert.alert('Success', `Model ${model} downloaded successfully!`);
    } catch (error) {
      setModelDownloadStatus(prev => ({
        ...prev,
        [model]: { ...prev[model], downloading: false, progress: 0 }
      }));

      Alert.alert('Error', `Failed to download model ${model}: ${(error as Error).message}`);
    }
  };

  const handleSwitchToWhisper = async (model: WhisperModel) => {
    try {
      const modelStatus = modelDownloadStatus[model];
      if (!modelStatus?.downloaded) {
        Alert.alert(
          'Model Not Downloaded',
          `Model ${model} is not downloaded. Download it first?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Download', onPress: () => handleDownloadModel(model) }
          ]
        );
        return;
      }

      setSelectedModel(model);
      await switchEngine('whisper', model);
    } catch (error) {
      Alert.alert('Error', `Failed to switch to Whisper: ${(error as Error).message}`);
    }
  };

  const handleSwitchToNative = async () => {
    try {
      await switchEngine('native');
    } catch (error) {
      Alert.alert('Error', `Failed to switch to native: ${(error as Error).message}`);
    }
  };

  const handleStart = async () => {
    try {
      clearError();
      await start();
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stop();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      const diagnostics = await runDiagnostics();
      Alert.alert('Diagnostics', JSON.stringify(diagnostics, null, 2));
    } catch (error) {
      Alert.alert('Error', `Failed to run diagnostics: ${(error as Error).message}`);
    }
  };

  const renderModelCard = (model: WhisperModel) => {
    const modelInfo = getModelInfo(model);
    const status = modelDownloadStatus[model] || { downloaded: false, downloading: false, progress: 0 };

    return (
      <View key={model} style={{
        backgroundColor: theme.colors.bgCard,
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: selectedModel === model ? 2 : 1,
        borderColor: selectedModel === model ? theme.colors.primary : theme.colors.textMuted,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: theme.colors.textDark, fontWeight: 'bold', fontSize: 16 }}>
            {modelInfo.name}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {modelInfo.size}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            Speed: {modelInfo.speed}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            Accuracy: {modelInfo.accuracy}
          </Text>
        </View>

        <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 15 }}>
          Languages: {modelInfo.languages}
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {status.downloaded && (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ color: theme.colors.success, fontSize: 16 }}>✅</Text>
              <Text style={{ color: theme.colors.success, fontSize: 12 }}>Downloaded</Text>
            </View>
          )}
          {!status.downloaded && !status.downloading && (
            <TouchableOpacity
              onPress={() => handleDownloadModel(model)}
              style={{
                backgroundColor: theme.colors.primary,
                padding: 10,
                borderRadius: 5,
                flex: 1,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
                Download
              </Text>
            </TouchableOpacity>
          )}

          {status.downloading && (
            <View style={{
              backgroundColor: theme.colors.textMuted,
              padding: 10,
              borderRadius: 5,
              flex: 1,
            }}>
              <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
                Downloading... {status.progress}%
              </Text>
            </View>
          )}

          {status.downloaded && (
            <TouchableOpacity
              onPress={() => handleSwitchToWhisper(model)}
              disabled={selectedModel === model && currentEngine === 'whisper'}
              style={{
                backgroundColor: selectedModel === model && currentEngine === 'whisper' 
                  ? theme.colors.success 
                  : theme.colors.accent,
                padding: 10,
                borderRadius: 5,
                flex: 1,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
                {selectedModel === model && currentEngine === 'whisper' ? 'Active' : 'Use'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bgDark }}>
      <View style={{ padding: 20 }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: theme.colors.textDark,
          marginBottom: 20 
        }}>
          Whisper Speech Recognition
        </Text>

        {/* Engine Status */}
        <View style={{ 
          backgroundColor: theme.colors.bgCard, 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 20 
        }}>
          <Text style={{ color: theme.colors.textDark, fontWeight: 'bold', marginBottom: 10 }}>
            Current Engine Status
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            Engine: {currentEngine} {currentEngine === 'whisper' ? `(${selectedModel})` : ''}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            Available: {isAvailable ? '✅' : '❌'}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            Listening: {isListening ? '🎤' : '🔇'}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            Audio Level: {audioLevel.toFixed(1)}
          </Text>
        </View>

        {/* Storage Info */}
        <View style={{ 
          backgroundColor: theme.colors.bgCard, 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 20 
        }}>
          <Text style={{ color: theme.colors.textDark, fontWeight: 'bold', marginBottom: 10 }}>
            Model Storage
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            Downloaded Models: {Object.values(modelDownloadStatus).filter(s => s.downloaded).length} / {availableModels.length}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            Storage Path: ~/Documents/whisper-models/
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 5 }}>
            💡 Models persist across app restarts
          </Text>
        </View>

        {/* Engine Controls */}
        <View style={{ 
          backgroundColor: theme.colors.bgCard, 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 20 
        }}>
          <Text style={{ color: theme.colors.textDark, fontWeight: 'bold', marginBottom: 15 }}>
            Engine Controls
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <TouchableOpacity
              onPress={handleSwitchToNative}
              style={{
                backgroundColor: currentEngine === 'native' ? theme.colors.success : theme.colors.textMuted,
                padding: 12,
                borderRadius: 8,
                flex: 1,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                Native Engine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRunDiagnostics}
              style={{
                backgroundColor: theme.colors.accent,
                padding: 12,
                borderRadius: 8,
                flex: 1,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                Diagnostics
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={handleStart}
              disabled={isListening}
              style={{
                backgroundColor: isListening ? theme.colors.textMuted : theme.colors.primary,
                padding: 15,
                borderRadius: 8,
                flex: 1,
              }}
            >
              <Text style={{ 
                color: 'white', 
                textAlign: 'center', 
                fontWeight: 'bold' 
              }}>
                Start
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStop}
              disabled={!isListening}
              style={{
                backgroundColor: !isListening ? theme.colors.textMuted : theme.colors.error,
                padding: 15,
                borderRadius: 8,
                flex: 1,
              }}
            >
              <Text style={{ 
                color: 'white', 
                textAlign: 'center', 
                fontWeight: 'bold' 
              }}>
                Stop
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {(transcript || partialTranscript || error) && (
          <View style={{ 
            backgroundColor: theme.colors.bgCard, 
            padding: 15, 
            borderRadius: 10, 
            marginBottom: 20 
          }}>
            <Text style={{ color: theme.colors.textDark, fontWeight: 'bold', marginBottom: 10 }}>
              Recognition Results
            </Text>
            {transcript && (
              <Text style={{ color: theme.colors.success, marginBottom: 5 }}>
                Final: "{transcript}"
              </Text>
            )}
            {partialTranscript && (
              <Text style={{ color: theme.colors.accent, marginBottom: 5 }}>
                Partial: "{partialTranscript}"
              </Text>
            )}
            {error && (
              <Text style={{ color: theme.colors.error, marginBottom: 5 }}>
                Error: {error.code} - {error.message}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                clearTranscript();
                clearError();
              }}
              style={{
                backgroundColor: theme.colors.textMuted,
                padding: 8,
                borderRadius: 5,
                marginTop: 10,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Available Models */}
        <View style={{ 
          backgroundColor: theme.colors.bgCard, 
          padding: 15, 
          borderRadius: 10 
        }}>
          <Text style={{ color: theme.colors.textDark, fontWeight: 'bold', marginBottom: 15 }}>
            Available Whisper Models
          </Text>
          {availableModels.map(renderModelCard)}
        </View>
      </View>
    </ScrollView>
  );
};