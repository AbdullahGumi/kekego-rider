import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondaryText,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 0,
          height: scale(70),
          paddingBottom: scale(10),
          paddingTop: scale(5),
        },
        tabBarLabelStyle: {
          fontFamily: "Urbanist-Regular",
          fontSize: scaleText(12),
          marginBottom: scale(4),
        },
        tabBarIconStyle: {
          marginTop: scale(4),
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={scale(28)} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
