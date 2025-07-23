// storage/asyncStorageHelper.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredItem<T> = {
  value: T;
  expiresAt?: number; // timestamp in milliseconds
};

export const Storage = {
  async set<T>(key: string, value: T, ttlInSeconds?: number) {
    try {
      const data: StoredItem<T> = {
        value,
        expiresAt: ttlInSeconds ? Date.now() + ttlInSeconds * 1000 : undefined,
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error setting ${key} in AsyncStorage`, e);
    }
  },

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (!jsonValue) return null;

      const data: StoredItem<T> = JSON.parse(jsonValue);

      if (data.expiresAt && Date.now() > data.expiresAt) {
        // Expired
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data.value;
    } catch (e) {
      console.error(`Error getting ${key} from AsyncStorage`, e);
      return null;
    }
  },

  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key} from AsyncStorage`, e);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error("Error clearing AsyncStorage", e);
    }
  },
};
