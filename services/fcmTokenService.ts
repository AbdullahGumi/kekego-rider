import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  requestPermission,
} from "@react-native-firebase/messaging";

export const fcmTokenService = {
  async getToken(): Promise<string | null> {
    try {
      const app = getApp();
      const messaging = getMessaging(app);

      // Request user permission for notifications
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn("FCM permission not granted");
        return null;
      }

      // Get the FCM token
      const token = await getToken(messaging);
      return token;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  },
};
