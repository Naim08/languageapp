import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { SpeechLanguage } from '../../services/speech/types';
import { SUPPORTED_LANGUAGES, LANGUAGE_BY_REGION, getLanguageInfo } from '../../services/speech/languages';

interface LanguagePickerProps {
  visible: boolean;
  currentLanguage: SpeechLanguage;
  onLanguageSelect: (language: SpeechLanguage) => void;
  onClose: () => void;
  title?: string;
  showRegions?: boolean;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  visible,
  currentLanguage,
  onLanguageSelect,
  onClose,
  title = 'Select Language',
  showRegions = true,
}) => {
  const renderLanguageItem = (language: typeof SUPPORTED_LANGUAGES[0]) => (
    <TouchableOpacity
      key={language.code}
      style={[
        styles.languageItem,
        currentLanguage === language.code && styles.selectedLanguageItem
      ]}
      onPress={() => {
        onLanguageSelect(language.code);
        onClose();
      }}
    >
      <Text style={styles.languageFlag}>{language.flag}</Text>
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{language.name}</Text>
        <Text style={styles.languageNative}>{language.nativeName}</Text>
      </View>
      {currentLanguage === language.code && (
        <Text style={styles.selectedIndicator}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderRegionSection = (region: string, languages: typeof SUPPORTED_LANGUAGES) => (
    <View key={region} style={styles.regionSection}>
      <Text style={styles.regionTitle}>{region}</Text>
      {languages.map(renderLanguageItem)}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {showRegions ? (
            Object.entries(LANGUAGE_BY_REGION).map(([region, languages]) =>
              renderRegionSection(region, languages)
            )
          ) : (
            <View style={styles.flatList}>
              {SUPPORTED_LANGUAGES.map(renderLanguageItem)}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

interface LanguageButtonProps {
  currentLanguage: SpeechLanguage;
  onPress: () => void;
  style?: any;
  showLabel?: boolean;
}

export const LanguageButton: React.FC<LanguageButtonProps> = ({
  currentLanguage,
  onPress,
  style,
  showLabel = true,
}) => {
  const languageInfo = getLanguageInfo(currentLanguage);

  return (
    <TouchableOpacity style={[styles.languageButton, style]} onPress={onPress}>
      <Text style={styles.languageFlag}>{languageInfo?.flag || '🌐'}</Text>
      {showLabel && (
        <View style={styles.languageButtonInfo}>
          <Text style={styles.languageButtonName} numberOfLines={1}>
            {languageInfo?.name || currentLanguage}
          </Text>
          <Text style={styles.changeText}>Tap to change</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  regionSection: {
    marginBottom: 10,
  },
  regionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  flatList: {
    paddingBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguageItem: {
    backgroundColor: '#e8f4fd',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  languageNative: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedIndicator: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  languageButtonInfo: {
    flex: 1,
    marginLeft: 8,
  },
  languageButtonName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  changeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default LanguagePicker;
