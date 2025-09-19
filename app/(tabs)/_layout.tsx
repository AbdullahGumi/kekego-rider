import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function DrawerLayout() {
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
