import { LogoIcon } from "@/assets/svg";
import { scale } from "@/constants/Layout";
import React from "react";
import { View } from "react-native";
import BackButton from "./BackButton";

const Header = ({
  showBackButton = true,
  onBackPress,
}: {
  showBackButton?: boolean;
  onBackPress?: () => void;
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {showBackButton && <BackButton onBackPress={onBackPress} />}
      <View
        style={{ marginLeft: "auto", width: scale(100), height: scale(100) }}
      >
        <LogoIcon />
      </View>
    </View>
  );
};

export default Header;
