import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { Storage } from "@/utility/asyncStorageHelper";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function DrawerLayout() {
  const handleLogout = async () => {
    // TODO: add your logout logic here (clear tokens, reset store, etc.)
    await Storage.clear();
    router.replace("/(auth)/phone");
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerActiveTintColor: COLORS.primary,
          drawerInactiveTintColor: COLORS.secondaryText,
          drawerStyle: {
            backgroundColor: COLORS.background,
            width: scale(240),
          },
          drawerLabelStyle: {
            fontFamily: "Urbanist-Regular",
            fontSize: scaleText(16),
          },
          headerShown: false,
        }}
        drawerContent={(props) => (
          <View style={{ flex: 1 }}>
            <DrawerContentScrollView {...props}>
              <DrawerItemList {...props} />
            </DrawerContentScrollView>

            {/* Custom Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                // justifyContent: "center",
                margin: 15,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 12,
                backgroundColor: COLORS.error + "40", // light red background (20% opacity)
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={COLORS.error}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  fontSize: scaleText(16),
                  fontFamily: "Urbanist-SemiBold",
                  color: COLORS.error,
                  textTransform: "uppercase",
                }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        )}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Home",
            drawerIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="wallet"
          options={{
            drawerLabel: "Wallet",
            drawerIcon: ({ color }) => (
              <Ionicons name="wallet-outline" size={24} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="ride-history"
          options={{
            drawerLabel: "Ride History",
            drawerIcon: ({ color }) => (
              <Ionicons name="time-outline" size={24} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
