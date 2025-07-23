import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import React, { JSX } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import CustomText from "./CustomText";

type CustomButtonProps = TouchableOpacityProps & {
  title: string;
  textStyles?: TextStyle;
  prefix?: JSX.Element;
  suffix?: JSX.Element;
  disabled?: boolean;
  loading?: boolean;
  backgroundColor?: string;
};

const CustomButton = ({
  title,
  style,
  textStyles,
  prefix,
  suffix,
  disabled = false,
  loading = false,
  backgroundColor = "black",
  ...buttonProps
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        style,
        {
          backgroundColor: backgroundColor,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {prefix}
      {loading ? (
        <ActivityIndicator
          color={backgroundColor === "white" ? COLORS.primary : "white"}
        />
      ) : (
        <CustomText
          style={[
            {
              color: "white",
              fontSize: scaleText(16),
              fontFamily: "Urbanist-Bold",
            },
            textStyles,
          ]}
        >
          {title}
        </CustomText>
      )}
      {suffix}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: scale(50),
    borderRadius: 10,
  } as ViewStyle,
});

export default CustomButton;
