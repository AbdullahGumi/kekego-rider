import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/routers";
import { useNavigation } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

const DrawerButton = () => {
  const navigation = useNavigation();

  const handleOpenDrawer = () => {
    (navigation as any).openDrawer?.() ||
      navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: COLORS.primary,
        borderRadius: 50,
        width: scale(50),
        height: scale(50),
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={handleOpenDrawer}
    >
      <Ionicons name="menu" size={scale(24)} color={"white"} />
    </TouchableOpacity>
  );
};

export default DrawerButton;
