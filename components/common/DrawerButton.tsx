import { MenuIcon } from "@/assets/svg";
import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { DrawerActions } from "@react-navigation/routers";
import { useNavigation } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

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
      <View style={{ width: scale(18), height: scale(14) }}>
        <MenuIcon />
      </View>
    </TouchableOpacity>
  );
};

export default DrawerButton;
