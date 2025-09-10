import { scaleText } from "@/constants/Layout";
import React from "react";
import { Text, TextProps, TextStyle } from "react-native";

type FontWeight = "Bold" | "SemiBold" | "Medium" | "MediumItalic" | "Regular";

const fontVariants: Record<FontWeight, string> = {
  Bold: "Urbanist-Bold",
  SemiBold: "Urbanist-SemiBold",
  Medium: "Urbanist-Medium",
  MediumItalic: "Urbanist-Medium-Italic",
  Regular: "Urbanist",
};

interface CustomTextProps extends TextProps {
  fontFamily?: string;
  fontWeight?: FontWeight;
  size?: number;
  style?: TextStyle | TextStyle[];
}

const DEFAULT_SIZE = 14;

const CustomText: React.FC<CustomTextProps> = ({
  fontFamily = "Urbanist",
  fontWeight = "Regular",
  size,
  style,
  children,
  ...props
}) => {
  // make size optional and safe
  const resolvedSize =
    typeof size === "number" && !isNaN(size) ? size : DEFAULT_SIZE;
  const combinedStyle: TextStyle = {
    fontFamily: fontVariants[fontWeight] || fontFamily,
    fontSize: scaleText(resolvedSize),
  };

  return (
    <Text style={[combinedStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default CustomText;
