import { useAppStore } from "@/stores/useAppStore";
import { Storage } from "@/utility/asyncStorageHelper";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [status, setStatus] = useState<{
    loading: boolean;
    isAuthenticated: boolean;
  }>({
    loading: true,
    isAuthenticated: false,
  });

  const loadFromStorage = useAppStore((state) => state.loadFromStorage);

  useEffect(() => {
    const initialize = async () => {
      const token = await Storage.get("access_token");
      // await Storage.clear();
      await loadFromStorage();

      setStatus({
        loading: false,
        isAuthenticated: !!token,
      });
    };

    initialize();
  }, []);

  if (status.loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const redirectPath = status.isAuthenticated ? "/(tabs)" : "/(auth)/phone";

  return <Redirect href={redirectPath} />;
}
