import { riderApi } from "@/api/endpoints/rider";
import CustomText from "@/components/common/CustomText";
import DrawerButton from "@/components/common/DrawerButton";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const SettingsScreen = () => {
  const router = useRouter();
  const { resetStore } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await riderApi.deleteProfile();
              if (response.data.success) {
                await resetStore();
                router.replace("/(auth)/phone" as any);
                Toast.show({
                  type: "customToast",
                  text1: "Account Deleted",
                  text2: "Your account has been successfully deleted.",
                });
              }
            } catch (error: any) {
              console.error("Failed to delete account:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  "Failed to delete account. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const legalItems = [
    {
      id: "terms",
      label: "Terms & Conditions",
      icon: "document-text-outline",
      url: "https://kekego.ng/terms/rider",
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      icon: "shield-checkmark-outline",
      url: "https://kekego.ng/privacy/rider",
    },
  ];

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: scale(16),
          paddingTop: scale(10),
        }}
      >
        <DrawerButton />
        <CustomText
          fontWeight="Bold"
          style={{
            fontSize: scaleText(20),
            color: COLORS.text,
            textAlign: "center",
            flex: 1,
            marginRight: scale(40), // Balance the DrawerButton width
          }}
        >
          Settings
        </CustomText>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: scale(20) }}
        contentContainerStyle={{ paddingHorizontal: scale(16) }}
      >
        <CustomText
          fontWeight="Bold"
          style={{
            fontSize: scaleText(16),
            color: COLORS.secondaryText,
            marginBottom: scale(10),
            marginLeft: scale(4),
          }}
        >
          Legal
        </CustomText>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: scale(12),
            overflow: "hidden",
            marginBottom: scale(20),
          }}
        >
          {legalItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: scale(16),
                borderBottomWidth: index < legalItems.length - 1 ? 1 : 0,
                borderBottomColor: COLORS.inputBackground,
              }}
              onPress={() => openLink(item.url)}
            >
              <View
                style={{
                  width: scale(40),
                  height: scale(40),
                  borderRadius: scale(20),
                  backgroundColor: COLORS.inputBackground,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: scale(12),
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={scale(20)}
                  color={COLORS.primary}
                />
              </View>
              <CustomText
                fontWeight="Medium"
                style={{ flex: 1, fontSize: scaleText(16) }}
              >
                {item.label}
              </CustomText>
              <Ionicons
                name="chevron-forward"
                size={scale(20)}
                color={COLORS.secondaryText}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={{
            marginTop: scale(20),
            paddingVertical: scale(15),
            alignItems: "center",
            backgroundColor: COLORS.white,
            borderRadius: scale(12),
          }}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <CustomText
              fontWeight="SemiBold"
              style={{ color: COLORS.error, fontSize: scaleText(16) }}
            >
              Delete Account
            </CustomText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
