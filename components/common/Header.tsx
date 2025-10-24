// import { LogoIcon } from "@/assets/svg";
import { scale } from "@/constants/Layout";
import React from "react";
import { View } from "react-native";
import BackButton from "./BackButton";
import DrawerButton from "./DrawerButton";

const Header = ({
  showBackButton = true,
  showDrawerButton = false,
  onBackPress,
}: {
  showBackButton?: boolean;
  showDrawerButton?: boolean;
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
      {showDrawerButton && <DrawerButton />}
      <View
        style={{ marginLeft: "auto", width: scale(100), height: scale(100) }}
      >
        {/* <LogoIcon /> */}
      </View>
    </View>
  );
};

export default Header;
