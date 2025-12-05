import CustomText from "@/components/common/CustomText";
import { scale } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, TouchableOpacity, View } from "react-native";
import { homeStyles } from "../../../styles/home-styles";

const ContactButtons = () => {
  const {
    rideState: { driver },
  } = useAppStore();

  const handleCallDriver = () => {
    if (driver?.phone) {
      const phoneNumber = `tel:${driver.phone}`;
      Linking.openURL(phoneNumber).catch((err) => {
        console.error("Failed to open dialer:", err);
        Alert.alert("Error", "Unable to open phone dialer.");
      });
    } else {
      Alert.alert("No Number", "Driver's phone number is not available.");
    }
  };

  return (
    <View style={homeStyles.contactButtonContainer}>
      <TouchableOpacity
        style={[homeStyles.contactButton, { marginRight: 8 }]}
        activeOpacity={0.7}
        onPress={handleCallDriver}
      >
        <Ionicons
          name="call"
          size={scale(23)}
          color="white"
          style={{ marginRight: 8 }}
        />
        <CustomText fontWeight="Bold" style={homeStyles.contactButtonText}>
          Call
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/chat")}
        style={homeStyles.contactButton}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chatbubble"
          size={scale(23)}
          color="white"
          style={{ marginRight: 8 }}
        />
        <CustomText fontWeight="Bold" style={homeStyles.contactButtonText}>
          Chat
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

ContactButtons.displayName = "ContactButtons";

export default ContactButtons;
