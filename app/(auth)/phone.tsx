import { authApi } from "@/api/endpoints/auth";
import { LogoIcon } from "@/assets/svg";
import CustomButton from "@/components/common/CustomButton";
import CustomInput from "@/components/common/CustomInput";
import CustomText from "@/components/common/CustomText";
import { COLORS } from "@/constants/Colors";
import { CONSTANTS } from "@/constants/constants";
import { Layout, scale } from "@/constants/Layout";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

export default function PhoneNumberScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const router = useRouter();

  const validatePhoneNumber = (number: string) => {
    let normalizedNumber = number.replace(/[^0-9]/g, "");
    if (normalizedNumber.startsWith("234")) {
      normalizedNumber = "0" + normalizedNumber.slice(3);
    } else if (normalizedNumber.startsWith("+234")) {
      normalizedNumber = "0" + normalizedNumber.slice(4);
    }

    const nigerianNumberPattern = /^(?:0)(70|71|80|81|90|91)\d{8}$/;

    if (!normalizedNumber) {
      return "Enter your phone number";
    }
    if (!nigerianNumberPattern.test(normalizedNumber)) {
      return "Enter a valid Nigerian phone number (e.g., 08012345678)";
    }
    return "";
  };

  const handlePhoneChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    if (numericText.length <= 11) {
      setPhone(numericText);
      setErrors({});
      if (numericText.length === 11) {
        Keyboard.dismiss();
      }
    }
  };

  const validateInputs = () => {
    const newErrors: { phone?: string } = {};
    const phoneError = validatePhoneNumber(phone);

    if (phoneError) {
      newErrors.phone = phoneError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateInputs()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      // Step 1: Check if phone number exists
      setLoading(true);
      const checkResponse = await authApi.checkPhone(
        phone,
        CONSTANTS.USER_ROLE
      );

      // Step 2: Request OTP
      const otpResponse = await authApi.requestOtp(phone);

      if (otpResponse.data.success) {
        setLoading(false);
        console.log("otp--->", otpResponse.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
          pathname: "/(auth)/otp",
          params: {
            phone,
            isRegistered: checkResponse.data.data.isRegistered,
          },
        });
      } else {
        setLoading(false);
        console.log({
          phone: otpResponse.data.message || "Failed to send OTP",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "customToast",
          text1: otpResponse.data.message || "Failed to send OTP",
          props: { type: "Error" },
        });
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage =
        err.response?.data.error ||
        "Failed to process request. Please try again.";
      console.log({ phone: errorMessage });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "customToast",
        text1: errorMessage,
        props: { type: "Error" },
      });
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          width: scale(150),
          height: scale(90),
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <LogoIcon />
      </View>
      <CustomText fontWeight="Bold" size={25}>
        Let&apos;s get you started
      </CustomText>
      <View style={{ width: "100%", marginTop: scale(50) }}>
        <CustomInput
          placeholder="Enter Phone number"
          placeholderTextColor={COLORS.secondaryText}
          label="Phone number"
          value={phone}
          onChangeText={handlePhoneChange}
          error={errors.phone}
          required
          isPhoneInput
          keyboardType="phone-pad"
          maxLength={11}
          style={{ width: "100%" }}
          autoFocus
        />
        <CustomButton
          title={"Continue"}
          style={{ marginTop: scale(20) }}
          onPress={handleSendOTP}
          disabled={loading || !!errors.phone}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: Layout.APP_PADDING,
    paddingTop: scale(20),
    alignItems: "center",
  },
});
