import { fcmTokenService } from "@/services/fcmTokenService";
import { useEffect, useState } from "react";

export const useNotification = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      const token = await fcmTokenService.getToken();
      if (token) {
        console.log("FCM Token:", token);
        setFcmToken(token);
      }
    };

    initializeToken();
  }, []);

  return { fcmToken };
};

export default useNotification;
