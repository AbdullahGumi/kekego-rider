import { COLORS } from "@/constants/Colors";
import { usePathname } from "expo-router";
import React, { Fragment } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SafeAreaWrapperProps {
  children: React.ReactNode;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <Fragment>
      {/* Top safe area with custom color (only rendered if not on home) */}
      {!isHome && (
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: COLORS.background }}
        />
      )}

      {/* Main content area with bottom, left, right insets */}
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        style={{ flex: 1, backgroundColor: COLORS.background }}
      >
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    </Fragment>
  );
};

export default SafeAreaWrapper;
