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

const CustomText: React.FC<CustomTextProps> = ({
  fontFamily = "Urbanist",
  fontWeight = "Regular",
  size,
  style,
  children,
  ...props
}) => {
  const combinedStyle: TextStyle = {
    fontFamily: fontVariants[fontWeight] || fontFamily,
    fontSize: scaleText(size!),
  };

  return (
    <Text style={[combinedStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default CustomText;
