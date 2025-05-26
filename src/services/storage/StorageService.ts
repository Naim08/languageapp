import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants';

class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Storage setItem error:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  // Convenience methods for common storage operations
  async getUserProfile() {
    return this.getItem(STORAGE_KEYS.USER_PROFILE);
  }

  async setUserProfile(profile: any) {
    return this.setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  async getConversationHistory() {
    return this.getItem(STORAGE_KEYS.CONVERSATION_HISTORY);
  }

  async setConversationHistory(history: any) {
    return this.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, history);
  }
}

export default StorageService.getInstance();
