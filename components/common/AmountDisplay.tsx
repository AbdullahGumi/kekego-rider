import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import CustomText from "./CustomText";

interface AmountDisplayProps {
  value: string;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  focused?: boolean;
}

const AmountDisplay: React.FC<AmountDisplayProps> = ({
  value,
  placeholder = "0",
  onFocus,
  onBlur,
  containerStyle,
  maxLength = 10,
  focused = false,
}) => {
  const formatNumberWithCommas = (num: string) => {
    // Remove any existing commas and format
    const cleanNum = num.replace(/,/g, "");
    if (cleanNum === "" || cleanNum === "0") return "";
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formattedValue = formatNumberWithCommas(value) || placeholder;
  const isEmpty = !value || value === "0";

  return (
    <View style={[containerStyle]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderColor: focused ? COLORS.primary : "#D1D5DB",
          borderWidth: 1,
          borderRadius: scale(12),
          paddingHorizontal: scale(16),
          paddingVertical: scale(12),
          backgroundColor: COLORS.white,
          minHeight: scale(48),
        }}
      >
        <CustomText
          fontWeight="Regular"
          style={{
            fontSize: scaleText(16),
            color: isEmpty ? COLORS.secondaryText : COLORS.text,
            marginRight: scale(8),
          }}
        >
          ₦
        </CustomText>
        <CustomText
          fontWeight="Medium"
          style={{
            fontSize: scaleText(18),
            color: isEmpty ? COLORS.secondaryText : COLORS.text,
            flex: 1,
          }}
        >
          {formattedValue}
        </CustomText>
      </View>
    </View>
  );
};

export default AmountDisplay;
