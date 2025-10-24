import { riderApi } from "@/api/endpoints/rider";
import { generateReference } from "@/utility";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePaystack } from "react-native-paystack-webview";

import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import Header from "@/components/common/Header";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

const TopupScreen = () => {
  const [topUpAmount, setTopUpAmount] = useState("");
  const { popup } = usePaystack();

  const handleTopUp = async () => {
    if (!topUpAmount || isNaN(Number(topUpAmount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const reference = generateReference();

    popup.checkout({
      email: "jane.doe@example.com",
      amount: Number(topUpAmount),
      reference,
      onSuccess: async (res) => {
        try {
          await riderApi.walletTopUp(
            res.reference,
            Number(topUpAmount),
            res.status
          );
          setTopUpAmount("");
          router.back();
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Wallet topped up successfully",
          });
        } catch (err: any) {
          console.log(err.response?.data);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to top up wallet",
          });
        }
      },
      onCancel: () => {
        console.log("User cancelled");
        Toast.show({
          type: "info",
          text1: "Cancelled",
          text2: "Top-up cancelled",
        });
      },
      // onLoad: (res) => console.log("WebVew Loaded:", res),
      onError: (err) => {
        console.log("Paystack Error:", err);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Payment error occurred",
        });
      },
    });
  };

  const quickAmounts = [500, 1000, 2000];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ paddingHorizontal: scale(16) }}>
        <Header />
      </View>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          padding: scale(16),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: scale(20),
          }}
        >
          <CustomText
            fontWeight="Medium"
            style={{
              fontSize: scaleText(24),
              color: COLORS.text,
            }}
          >
            Top Up Wallet
          </CustomText>
        </View>
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: scale(12),
            padding: scale(24),
            width: "100%",
            shadowColor: COLORS.text,
            shadowOffset: { width: 0, height: scale(2) },
            shadowOpacity: 0.1,
            shadowRadius: scale(4),
            elevation: 3,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: scale(20),
              borderColor: COLORS.secondaryText,
              borderWidth: 1,
              borderRadius: scale(8),
            }}
          >
            <CustomText
              fontWeight="Regular"
              style={{
                fontSize: scaleText(16),
                color: COLORS.text,
                paddingHorizontal: scale(12),
                paddingVertical: scale(12),
              }}
            >
              ₦
            </CustomText>
            <TextInput
              placeholder="Enter amount"
              placeholderTextColor={COLORS.secondaryText}
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="numeric"
              style={{
                flex: 1,
                fontSize: scaleText(16),
                color: COLORS.text,
                paddingVertical: scale(12),
                paddingRight: scale(12),
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: scale(20),
            }}
          >
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => setTopUpAmount(amount.toString())}
                style={{
                  backgroundColor: COLORS.inputBackground,
                  borderRadius: scale(8),
                  paddingVertical: scale(8),
                  paddingHorizontal: scale(12),
                  flex: 1,
                  marginHorizontal: scale(2),
                }}
              >
                <CustomText
                  fontWeight="Medium"
                  style={{
                    fontSize: scaleText(14),
                    color: COLORS.secondaryText,
                    textAlign: "center",
                  }}
                >
                  ₦{amount}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
          <CustomButton
            onPress={handleTopUp}
            title="Pay"
            backgroundColor={COLORS.primary}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default TopupScreen;
