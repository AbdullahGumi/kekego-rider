import {
  AsteriskIcon,
  EyeIcon,
  EyesOffIcon,
  NigerianFlagIcon,
  WarningIcon,
} from "@/assets/svg";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import React, { JSX, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import CustomText from "./CustomText";

type CustomInputProps = TextInputProps & {
  label: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  containerStyle?: ViewStyle;
  required?: boolean;
  isPhoneInput?: boolean;
  prefix?: JSX.Element;
  suffix?: JSX.Element;
  isFocusable?: boolean;
};

const CustomInput = ({
  label,
  error,
  loading,
  containerStyle,
  secureTextEntry,
  required,
  isPhoneInput,
  prefix,
  suffix,
  onBlur,
  isFocusable = true,
  ...textInputProps
}: CustomInputProps) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={containerStyle}>
      <View style={styles.labelWrapper}>
        <Text style={styles.label}>{label}</Text>
        {required && (
          <View style={{ marginLeft: scale(4) }}>
            <AsteriskIcon />
          </View>
        )}
      </View>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: "white",
            borderColor: isFocused ? "#FF5A1F" : error ? COLORS.error : "#000",
            borderWidth: 1,
          },
        ]}
      >
        {isPhoneInput && (
          <View
            style={{
              backgroundColor: "#FFFFF0",
              height: "100%",
              justifyContent: "center",
              padding: 11,
              maxWidth: scale(46),
            }}
          >
            <View
              style={{
                width: scale(24),
                height: scale(19),
              }}
            >
              <NigerianFlagIcon />
            </View>
          </View>
        )}
        {prefix}
        <TextInput
          {...textInputProps}
          secureTextEntry={isSecure}
          style={[styles.input, textInputProps.style] as any}
          onFocus={() => (isFocusable ? setIsFocused(true) : {})}
          onBlur={handleBlur}
        />
        {suffix}

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.prefix}
            onPress={() => setIsSecure((prev) => !prev)}
          >
            {isSecure ? <EyeIcon /> : <EyesOffIcon />}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: scale(8),
          }}
        >
          <View style={{ width: scale(16), height: scale(16) }}>
            <WarningIcon />
          </View>
          <CustomText style={styles.error}>{error}</CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: "Urbanist-Medium",
    fontSize: scaleText(16),
  },
  labelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  error: {
    fontSize: scaleText(12),
    color: COLORS.error,
    marginLeft: scale(6),
  },
  inputWrapper: {
    borderRadius: 10,
    height: scale(41),
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    height: "100%",
    paddingHorizontal: 10,
    fontFamily: "Urbanist-Medium",
    fontSize: Platform.OS === "web" ? 16 : scaleText(14), // 16px on web prevents screen from zooming when input field is focused
    flex: 1,
    ...(Platform.OS === "web" && {
      outlineStyle: "none",
    }),
  },
  prefix: {
    position: "absolute",
    right: 20,
    width: scale(24),
    height: scale(24),
  },
});

export default CustomInput;
