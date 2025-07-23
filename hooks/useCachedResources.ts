import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import {
  KronaOneRegular,
  UrbanistBold,
  UrbanistMedium, UrbanistMediumItalic, UrbanistRegular, UrbanistSemiBold,
} from "../assets/fonts";

const useCachedResources = () => {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    const loadResourcesAndDataAsync = async () => {
      try {
        // Keep the splash screen visible while we fetch resources
        SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          "Urbanist-Bold": UrbanistBold,
          Urbanist: UrbanistRegular,
          "Urbanist-SemiBold": UrbanistSemiBold,
          "Urbanist-Medium": UrbanistMedium,
          "Urbanist-Medium-Italic": UrbanistMediumItalic,
          KronaOne: KronaOneRegular
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    };

    loadResourcesAndDataAsync();
  }, []);

  return { isLoadingComplete };
};

export default useCachedResources;