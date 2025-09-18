import CustomText from "@/components/common/CustomText";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { homeStyles } from "../../../styles/home-styles";

const ContactButtons = () => (
  <View style={homeStyles.contactButtonContainer}>
    <TouchableOpacity
      style={[homeStyles.contactButton, { marginRight: 8 }]}
      activeOpacity={0.7}
    >
      <Ionicons
        name="call"
        size={23}
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
        size={23}
        color="white"
        style={{ marginRight: 8 }}
      />
      <CustomText fontWeight="Bold" style={homeStyles.contactButtonText}>
        Chat
      </CustomText>
    </TouchableOpacity>
  </View>
);

ContactButtons.displayName = "ContactButtons";

export default ContactButtons;
