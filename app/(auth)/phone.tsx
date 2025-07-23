import { LogoIcon } from "@/assets/svg";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomText from "@/components/CustomText";
import { COLORS } from "@/constants/Colors";
import { Layout, scale } from "@/constants/Layout";
import useApi from "@/hooks/useApi";
import { useAppStore } from "@/stores/useAppStore";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";

export default function PhoneNumberScreen() {
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const { loading, fetchData } = useApi();
  const router = useRouter();
  const { setUser } = useAppStore();

  const validatePhoneNumber = (number: string) => {
    // Normalize phone number to start with 0 for Nigerian numbers
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
      setErrors({}); // Clear errors on input change
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
      const checkResponse = await fetchData("post", "/auth/check-phone", {
        phone,
        role: "rider",
      });

      if (!checkResponse.data.isRegistered) {
        // If not registered, store this info for the registration flow
        setUser({ id: "", phone, role: "rider" }, null);
      }

      // Step 2: Request OTP
      const otpResponse = await fetchData("post", "/auth/request-otp", {
        phone,
      });
      if (otpResponse.data) {
        console.log("otp--->", otpResponse.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push({
          pathname: "/(auth)/otp",
          params: {
            phone,
            isRegistered: checkResponse.data.isRegistered ? "true" : "false",
          },
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to process request. Please try again.";
      console.log("errorMessage", errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
          placeholder="Enter Phone number (e.g., 08012345678)"
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
