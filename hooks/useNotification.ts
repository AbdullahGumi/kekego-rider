import { NOTIFICATION_TYPES } from "@/constants/constants";
import { useAppStore } from "@/stores/useAppStore";
import { getApp } from "@react-native-firebase/app";
import messaging, {
    AuthorizationStatus,
    getMessaging,
    getToken,
    requestPermission,
    setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";
import { useCallback, useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import Toast from "react-native-toast-message";

// Helper function to parse FCM serialized data
const parseFCMData = (data: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value === "string") {
      // Try to parse JSON strings back to objects/arrays
      if (
        (value.startsWith("{") && value.endsWith("}")) ||
        (value.startsWith("[") && value.endsWith("]"))
      ) {
        try {
          result[key] = JSON.parse(value);
        } catch (error) {
          console.warn(`Failed to parse JSON for key "${key}":`, error);
          result[key] = value; // Keep original string if parsing fails
        }
      }
      // Try to convert numbers that were stringified
      else if (
        !isNaN(Number(value)) &&
        value.trim() !== "" &&
        value !== "true" &&
        value !== "false"
      ) {
        const num = Number(value);
        if (!isNaN(num)) {
          result[key] = num;
        } else {
          result[key] = value;
        }
      }
      // Handle boolean strings
      else if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
};

// --- Background Message Handler (updated to show notifications) ---
const app = getApp();
const messagingInstance = getMessaging(app);

setBackgroundMessageHandler(messagingInstance, async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);

  // Extract notification data
  const { notification, data } = remoteMessage;
  console.log("notification", notification);
  const title = notification?.title;
  const body = notification?.body;

  // For Android, we can use react-native-push-notification or similar to show local notifications
  // For now, we'll store the notification data to be processed when app resumes

  // You could also implement logic here to:
  // - Update persistent storage
  // - Make API calls
  // - Show immediate local notifications

  // Note: When app is fully killed, this handler won't run
  // That's why you need notification payload in FCM messages

  return Promise.resolve();
});

// --- FCM Notification Service ---
const fcmNotificationService = {
  // Process notification payload and return structured data for app to handle
  handleNotificationPayload: (remoteMessage: any) => {
    const { notification, data } = remoteMessage;

    console.log("Processing notification, raw data:", { notification, data });

    // Parse FCM serialized data back to proper types
    const parsedData = parseFCMData(data || {});
    console.log("Parsed notification data:", parsedData);

    const result = {
      type: parsedData.type,
      title: notification?.title || "",
      body: notification?.body || "",
      data: parsedData,
      actions: [] as string[],
      shouldAlert: false,
      rideId: parsedData.rideId,
    };

    // Process notification based on type
    switch (parsedData.type) {
      case NOTIFICATION_TYPES.RIDE_REQUEST:
        console.log("Ride request notification received");
        result.actions.push("showRideRequest");
        result.shouldAlert = true;
        break;

      case NOTIFICATION_TYPES.RIDE_ACCEPTED:
        console.log("Ride accepted notification received");
        result.actions.push("updateRideStatus", "setDriver");
        result.shouldAlert = true;
        break;

      case NOTIFICATION_TYPES.DRIVER_ARRIVED:
        console.log("Driver arrived notification received");
        result.actions.push("updateRideStatus");
        result.shouldAlert = true;
        break;

      case NOTIFICATION_TYPES.RIDE_STARTED:
        console.log("Ride started notification received");
        result.actions.push("updateRideStatus");
        result.shouldAlert = true;
        break;

      case NOTIFICATION_TYPES.RIDE_COMPLETED:
        console.log("Ride completed notification received");
        result.actions.push("updateRideStatus", "navigateToRating");
        result.shouldAlert = true;
        break;

      case NOTIFICATION_TYPES.RIDE_CANCELLED:
        console.log("Ride cancelled notification received");
        result.actions.push("cancelRide");
        result.shouldAlert = true;
        break;

      default:
        console.log("Unknown notification type:", parsedData.type);
        result.shouldAlert = !!notification;
    }

    return result;
  },

  // Check if app was launched from notification
  checkInitialNotification: async () => {
    const initialNotification =
      await messagingInstance.getInitialNotification();
    if (initialNotification) {
      console.log("App launched from notification:", initialNotification);
      // Process the notification that launched the app and return processed data
      const processedNotification =
        fcmNotificationService.handleNotificationPayload(initialNotification);
      return processedNotification;
    }
    return null;
  },

  // Send local notification (useful for background processing)
  showLocalNotification: (title: string, body: string, data?: any) => {
    console.log("Showing local notification:", { title, body, data });
    // You'd implement this with react-native-push-notification or similar
    // Example:
    // PushNotification.localNotification({
    //   title,
    //   message: body,
    //   userInfo: data,
    // });
  },
};

// --- FCM Token Service ---
const fcmTokenService = {
  async getToken(): Promise<string | null> {
    try {
      // Request Android notification permission (API 33+)
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn("Android POST_NOTIFICATIONS permission not granted");
          return null;
        }
      }

      // Request user permission for notifications
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn("FCM permission not granted");
        return null;
      }

      // Retrieve FCM token
      const token = await getToken(messagingInstance);
      return token;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  },
};

interface UseNotificationProps {
  onTokenUpdate?: (token: string | null) => void;
}

export const useNotification = ({
  onTokenUpdate,
}: UseNotificationProps = {}) => {
  const { fcmToken, setFcmToken, setRideStage, setDriver, resetRideState } =
    useAppStore();
  const pathname = usePathname();

  // Handle notification actions based on processed notification data
  const handleNotificationAction = useCallback(
    async (notificationData: any) => {
      const { actions, title, body, data } = notificationData;

      console.log("Handling notification actions:", actions);

      for (const action of actions) {
        switch (action) {
          case "showRideRequest":
            // For drivers: show new ride request alert
            console.log("Showing ride request alert");
            break;

          case "updateRideStatus":
            // For riders: update ride stage based on notification type
            if (data.type === NOTIFICATION_TYPES.RIDE_ACCEPTED) {
              setRideStage("paired");
            } else if (data.type === NOTIFICATION_TYPES.DRIVER_ARRIVED) {
              setRideStage("arrived");
            } else if (data.type === NOTIFICATION_TYPES.RIDE_STARTED) {
              setRideStage("trip");
            } else if (data.type === NOTIFICATION_TYPES.RIDE_COMPLETED) {
              // Handled by navigateToRating
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;

          case "setDriver":
            if (data.driver) {
              setDriver(data.driver);
            }
            break;

          case "navigateToRating":
            if (pathname !== "/rating") {
              router.push("/rating");
            }
            break;

          case "cancelRide":
            resetRideState();
            Toast.show({
              type: "customToast",
              text1: "Ride Cancelled",
              text2: data.reason || "Ride has been cancelled",
              props: { type: "Error" },
            });
            break;
        }
      }

      // Show toast for notifications that require user attention
      if (notificationData.shouldAlert) {
        Toast.show({
          type: "customToast",
          text1: title || "Notification",
          text2: body,
        });
      }
    },
    [setRideStage, setDriver, resetRideState, pathname]
  );

  useEffect(() => {
    const initializeNotifications = async () => {
      // Get FCM token
      const token = await fcmTokenService.getToken();
      if (token) {
        console.log("FCM Token:", token);
        setFcmToken(token);
        onTokenUpdate?.(token);
      }

      // Set up foreground message handler
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log("Received message in foreground:", remoteMessage);

        const notificationData =
          fcmNotificationService.handleNotificationPayload(remoteMessage);
        await handleNotificationAction(notificationData);
      });

      // Check for initial notification (app launched from notification)
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log("App launched from notification:", initialNotification);

        const notificationData =
          fcmNotificationService.handleNotificationPayload(initialNotification);
        await handleNotificationAction(notificationData);
      }

      return unsubscribe;
    };

    const subscription = initializeNotifications();

    return () => {
      subscription.then((unsubscribe) => unsubscribe?.());
    };
  }, [handleNotificationAction]);

  return { fcmToken };
};

export default useNotification;
