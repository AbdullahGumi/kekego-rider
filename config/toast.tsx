import { ArrowIcon, WarningIcon } from "@/assets/svg";
import CustomText from "@/components/CustomText";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { Text, TouchableOpacity, View } from "react-native";
import Toast, {
  ToastConfig,
  ToastConfigParams,
} from "react-native-toast-message";

type ToastType = "Success" | "Info" | "Warning" | "Error";

const toastStyles = {
  Success: {
    backgroundColor: COLORS.primary,
    color: "white",
    Icon: WarningIcon,
  },
  Info: {
    backgroundColor: "#FFFFFF",
    color: "black",
    Icon: WarningIcon,
  },
  Warning: {
    backgroundColor: "#FFF7DB",
    color: "white",
    Icon: WarningIcon,
  },
  Error: {
    backgroundColor: COLORS.error,
    color: "white",
    Icon: WarningIcon,
  },
};

export const toastConfig: ToastConfig = {
  customToast: ({ text1 = "", text2, props }: ToastConfigParams<any>) => {
    const { backgroundColor, Icon, color } =
      toastStyles[props.type as ToastType];
    return (
      <View
        style={{
          width: "85%",
          backgroundColor,
          alignItems: "center",
          paddingHorizontal: scale(12),
          paddingVertical: scale(6),
          borderRadius: 50,
          flexDirection: "row",
        }}
      >
        <View
          style={{ width: scale(17), height: scale(17), marginRight: scale(8) }}
        >
          <Icon color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <CustomText
            fontWeight="Medium"
            style={{
              fontSize: scaleText(12),
              color: color,
            }}
          >
            {text1}
          </CustomText>
          {text2 && (
            <CustomText
              style={{
                fontSize: scaleText(8),
                color: color,
              }}
            >
              {text2}
            </CustomText>
          )}
        </View>
      </View>
    );
  },
};
