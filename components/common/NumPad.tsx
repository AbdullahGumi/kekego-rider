import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { Ionicons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, impactAsync } from "expo-haptics";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import CustomText from "./CustomText";

interface NumPadProps {
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}

const NumPad: React.FC<NumPadProps> = ({ onKeyPress, disabled = false }) => {
  const triggerFeedback = async () => {
    try {
      await impactAsync(ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleKeyPress = async (key: string) => {
    await triggerFeedback();
    onKeyPress(key);
  };

  const KeyButton = ({
    keyValue,
    children,
    onPress,
  }: {
    keyValue: string;
    children: React.ReactNode;
    onPress?: () => void;
  }) => {
    return (
      <TouchableOpacity
        style={{
          width: scale(60),
          height: scale(60),
          borderRadius: scale(16),
          backgroundColor: disabled ? COLORS.inputBackground : COLORS.white,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: COLORS.text,
          shadowOffset: { width: 0, height: scale(1) },
          shadowOpacity: 0.1,
          shadowRadius: scale(2),
          elevation: 2,
        }}
        onPress={() => {
          if (onPress) onPress();
          else handleKeyPress(keyValue);
        }}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ];

  return (
    <View
      style={{
        paddingHorizontal: scale(16),
        paddingVertical: scale(16),
        backgroundColor: "#F9FAFB",
        borderRadius: scale(16),
      }}
    >
      {keys.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: rowIndex < keys.length - 1 ? scale(12) : 0,
          }}
        >
          {row.map((key) => (
            <KeyButton key={key} keyValue={key}>
              {key === "⌫" ? (
                <Ionicons name="backspace" size={30} color={COLORS.text} />
              ) : key === "C" ? (
                <Ionicons name="close" size={30} color={COLORS.error} />
              ) : (
                <CustomText
                  fontWeight="Medium"
                  style={{
                    fontSize: scaleText(30),
                    color: COLORS.text,
                  }}
                >
                  {key}
                </CustomText>
              )}
            </KeyButton>
          ))}
        </View>
      ))}
    </View>
  );
};

export default NumPad;
