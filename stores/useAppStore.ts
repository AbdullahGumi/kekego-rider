import { Storage } from '@/utility/asyncStorageHelper';
import { create } from 'zustand';

type User = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  role: string;
};

type AppState = {
  user: User | null;
  token: string | null;
};

type AppActions = {
  setUser: (user: User | null, token?: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  resetStore: () => Promise<void>;
};

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  token: null,

  setUser: async (user, token) => {
    try {
      if (user && token) {
        await Storage.set('user', JSON.stringify(user));
        await Storage.set('access_token', token);
        set({ user, token });
      } else {
        await Storage.remove('user');
        await Storage.remove('access_token');
        set({ user: null, token: null });
      }
    } catch (err) {
      console.error('Failed to set user', err);
    }
  },

  loadFromStorage: async () => {
    try {
      const user = await Storage.get<string>('user');
      const token = await Storage.get<string>('access_token');
      set({
        user: user ? JSON.parse(user) : null,
        token: token || null
      });
    } catch (err) {
      console.error('Failed to load from storage', err);
    }
  },

  resetStore: async () => {
    try {
      await Promise.all([
        Storage.remove('user'),
        Storage.remove('access_token')
      ]);
      set({ user: null, token: null });
    } catch (err) {
      console.error('Failed to reset store', err);
    }
  }
}));
