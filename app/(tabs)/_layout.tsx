import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import { Storage } from "@/utility/asyncStorageHelper";
import { Ionicons } from "@expo/vector-icons";
import {
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { Image, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function DrawerLayout() {
  const { user } = useAppStore();

  const handleLogout = async () => {
    // TODO: add your logout logic here (clear tokens, reset store, etc.)
    await Storage.clear();
    await useAppStore.getState().resetStore();
    router.replace("/(auth)/phone");
  };

  const handleProfilePress = () => {
    router.push("/profile");
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
              {/* Profile Header */}
              <TouchableOpacity
                onPress={handleProfilePress}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingBottom: scale(20),
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.white,
                }}
              >
                {/* Profile Picture */}
                <View style={{ marginRight: scale(15) }}>
                  {user?.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
                      style={{
                        width: scale(75),
                        height: scale(75),
                        borderRadius: scale(100),
                        borderWidth: 2,
                        borderColor: COLORS.primary,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: scale(75),
                        height: scale(75),
                        borderRadius: scale(100),
                        backgroundColor: COLORS.white,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: COLORS.primary,
                      }}
                    >
                      <Ionicons
                        name="person"
                        size={scale(50)}
                        color={COLORS.secondaryText}
                      />
                    </View>
                  )}
                </View>

                {/* Driver Name */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: scaleText(18),
                      fontFamily: "Urbanist-SemiBold",
                      color: COLORS.text,
                      marginBottom: scale(2),
                    }}
                    numberOfLines={2}
                  >
                    {user?.name}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Drawer Navigation Items */}
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
                size={scale(22)}
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
            headerShown: false,
            drawerLabel: "Home",
            drawerIcon: ({ color }) => (
              <Ionicons name="home-outline" size={scale(24)} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="wallet"
          options={{
            drawerLabel: "Wallet",
            headerShown: false,
            drawerIcon: ({ color }) => (
              <Ionicons name="wallet-outline" size={scale(24)} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="ride-history"
          options={{
            headerShown: false,
            drawerLabel: "Ride History",
            drawerIcon: ({ color }) => (
              <Ionicons name="time-outline" size={scale(24)} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            headerShown: false,
            drawerLabel: "Settings",
            drawerIcon: ({ color }) => (
              <Ionicons name="settings-outline" size={scale(24)} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            headerShown: false,
            drawerLabel: "Profile",
            drawerIcon: ({ color }) => (
              <Ionicons name="person-outline" size={scale(24)} color={color} />
            ),
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
