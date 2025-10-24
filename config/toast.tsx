import { LogoIcon } from "@/assets/svg";
import CustomText from "@/components/common/CustomText";
import { scale, scaleText } from "@/constants/Layout";
import { View } from "react-native";
import { ToastConfig, ToastConfigParams } from "react-native-toast-message";

export const toastConfig: ToastConfig = {
  customToast: ({ text1 = "", text2 }: ToastConfigParams<any>) => {
    return (
      <View
        style={{
          width: "90%",
          backgroundColor: "#ffffffff",
          borderRadius: scale(12),
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: scale(14),
          paddingVertical: scale(12),
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <View style={{ flex: 1 }}>
          <CustomText
            fontWeight="SemiBold"
            style={{
              fontSize: scaleText(13),
              color: "#000",
            }}
          >
            {text1}
          </CustomText>

          {text2 && (
            <CustomText
              style={{
                fontSize: scaleText(11),
                color: "#8f8f8fff",
                marginTop: scale(2),
              }}
            >
              {text2}
            </CustomText>
          )}
        </View>
        <View
          style={{
            width: scale(50),
            height: scale(50),
            marginRight: scale(10),
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LogoIcon />
        </View>
      </View>
    );
  },
};
