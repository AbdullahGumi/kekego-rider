import CustomButton from "@/components/CustomButton";
import CustomText from "@/components/CustomText";
import Header from "@/components/Header";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import useApi from "@/hooks/useApi";
import { Storage } from "@/utility/asyncStorageHelper";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import Toast from "react-native-toast-message";

const OTPScreen = () => {
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { fetchData, loading } = useApi();

  const sendCode = async () => {
    try {
      const { status, data } = await fetchData(
        "post",
        "/auth/reset-password/request-otp",
        {
          phone,
        }
      );

      if (status === 200) {
        setResendTimer(30);
        Toast.show({
          type: "customToast",
          text1: data.status,
          props: {
            type: "Success",
          },
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "customToast",
        text1: err.response.data.detail || "An error occurred",
        props: {
          type: "Error",
        },
      });
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const verifyOtp = async () => {
    try {
      const { status, data } = await fetchData("post", "/auth//verify-otp", {
        phone,
        otp,
      });

      if (data?.token) {
        // TODOs
        // if user is registered
        await Storage.set("access_token", data.access_token);
        router.push("/(tabs)");

        // if user is not registered
        //     router.push({ pathname: "/(auth)/register", params: { phone } });
      }
    } catch (err: any) {
      Toast.show({
        type: "customToast",
        text1: err.response.data.detail || "An error occurred",
        props: {
          type: "Error",
        },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ paddingHorizontal: scale(16) }}>
        <Header />
      </View>

      <View
        style={{
          paddingHorizontal: scale(16),
        }}
      >
        <View style={{ paddingVertical: scale(12) }}>
          <CustomText
            fontWeight="Medium"
            style={{
              fontSize: scaleText(30),
              color: COLORS.text,
              marginBottom: scale(16),
            }}
          >
            Phone Verification
          </CustomText>
          <CustomText
            fontWeight="Medium"
            style={{
              fontSize: scaleText(14),
              color: COLORS.secondaryText,
            }}
          >
            We sent a verification code to your phone number{" "}
            <CustomText style={{ color: COLORS.primary }}>{phone}</CustomText>
          </CustomText>
        </View>

        <OtpInput
          numberOfDigits={6}
          blurOnFilled={true}
          type="numeric"
          hideStick={true}
          onTextChange={(t) => setOtp(t)}
          focusColor="transparent"
          theme={{
            pinCodeTextStyle: {
              fontFamily: "WorkSans-SemiBold",
              fontSize: scaleText(18),
              color: COLORS.text,
            },
            pinCodeContainerStyle: {
              backgroundColor: "white",
              width: scale(46),
              height: scale(44),
            },
            focusedPinCodeContainerStyle: {
              borderWidth: 1,
              borderColor: COLORS.primary,
            },
          }}
        />

        <View style={{ marginTop: scale(96), alignItems: "center" }}>
          {resendTimer > 0 ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <CustomText
                fontWeight="Medium"
                style={{
                  fontSize: scaleText(12),
                  color: COLORS.secondaryText,
                  marginRight: scale(5),
                }}
              >
                Ask for a new code within
              </CustomText>

              <CustomText
                style={{ fontSize: scaleText(12), color: COLORS.primary }}
              >
                {`${Math.floor(resendTimer / 60)}:${String(
                  resendTimer % 60
                ).padStart(2, "0")}`}
              </CustomText>
            </View>
          ) : (
            <CustomText
              fontWeight="Medium"
              style={{
                fontSize: scaleText(12),
                color: COLORS.secondaryText,
              }}
            >
              Didn’t get the code?
            </CustomText>
          )}
          <CustomButton
            title="Resend code"
            disabled={resendTimer > 0}
            onPress={sendCode}
            backgroundColor="#FF450012"
            textStyles={{ color: resendTimer > 0 ? "#757575" : COLORS.primary }}
            style={{
              height: scale(30),
              width: scale(177),
              marginTop: scale(16),
            }}
          />
        </View>
      </View>
      <View
        style={{
          backgroundColor: "white",
          paddingVertical: scale(16),
          paddingHorizontal: scale(21),
          marginTop: "auto",
        }}
      >
        <CustomButton
          title="Verify"
          onPress={verifyOtp}
          loading={loading}
          disabled={loading || otp.length < 6}
        />
      </View>
    </SafeAreaView>
  );
};

export default OTPScreen;
