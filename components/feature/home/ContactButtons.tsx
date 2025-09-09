import CustomText from "@/components/common/CustomText";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { homeStyles } from "../../../styles/home-styles";

interface ContactButtonsProps {
  onCall: () => void;
  onChat: () => void;
}

const ContactButtons = memo<ContactButtonsProps>(({ onCall, onChat }) => (
  <View style={homeStyles.contactButtonContainer}>
    <TouchableOpacity
      style={[homeStyles.contactButton, { marginRight: 8 }]}
      activeOpacity={0.7}
      onPress={onCall}
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
      style={homeStyles.contactButton}
      activeOpacity={0.7}
      onPress={onChat}
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
));

ContactButtons.displayName = "ContactButtons";

export default ContactButtons;
