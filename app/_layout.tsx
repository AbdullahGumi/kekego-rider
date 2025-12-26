import SafeAreaWrapper from "@/components/common/SafeAreaWrapper";
import { toastConfig } from "@/config/toast";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import useNotification from "@/hooks/useNotification";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaystackProvider } from "react-native-paystack-webview";
import Toast from "react-native-toast-message";
import {
  UrbanistBold,
  UrbanistMedium,
  UrbanistMediumItalic,
  UrbanistRegular,
  UrbanistSemiBold,
} from "../assets/fonts";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

function RootLayoutContent() {
  // Initialize notification handler at root level
  useNotification();

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    "Urbanist-Bold": UrbanistBold,
    Urbanist: UrbanistRegular,
    "Urbanist-SemiBold": UrbanistSemiBold,
    "Urbanist-Medium": UrbanistMedium,
    "Urbanist-Medium-Italic": UrbanistMediumItalic,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaWrapper>
      <GestureHandlerRootView>
        <PaystackProvider
          publicKey="pk_live_28b1aaac096dd1b4970c7710e14e5764de0b1468"
          defaultChannels={[
            "card",
            "bank",
            "ussd",
            "qr",
            "mobile_money",
            "bank_transfer",
          ]}
        >
          <RootLayoutContent />
          <Toast config={toastConfig} />
        </PaystackProvider>
      </GestureHandlerRootView>
    </SafeAreaWrapper>
  );
}
