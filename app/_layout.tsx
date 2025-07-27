import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import SafeAreaWrapper from "@/components/common/SafeAreaWrapper";
import { toastConfig } from "@/config/toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
        <Stack screenOptions={{ headerShown: false }} />
        <Toast config={toastConfig} />
      </GestureHandlerRootView>
    </SafeAreaWrapper>
  );
}
