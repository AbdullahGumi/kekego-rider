import { TouchableOpacity, View } from "react-native";
import React from "react";
import { ArrowIcon } from "@/assets/svg";
import { scale } from "@/constants/Layout";
import { useRouter } from "expo-router";

const BackButton = ({ onBackPress }: { onBackPress?: () => void }) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: "#E2E2E2",
        borderRadius: 50,
        width: scale(34),
        height: scale(34),
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={handleBackPress}
    >
      <View style={{ width: scale(15), height: scale(15) }}>
        <ArrowIcon />
      </View>
    </TouchableOpacity>
  );
};

export default BackButton;
