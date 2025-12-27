import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

import { riderApi } from "@/api/endpoints/rider";
import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import Header from "@/components/common/Header";
import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import HideKeyboardOnTouch from "@/utility/HideKeyboardOnTouch";

const RatingScreen: React.FC = () => {
  const router = useRouter();
  const { rideState, resetRideState, setDestinationLocation, bottomSheetRef } =
    useAppStore();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  if (!rideState.rideId) {
    return null;
  }

  const { rideId, fare } = rideState;

  const resetState = () => {
    router.replace("/(tabs)");
    setTimeout(() => {
      bottomSheetRef?.current?.snapToIndex(0);
      resetRideState();
    }, 500);
  };

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex + 1); // Since 0-based
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await riderApi.submitRating(rideId, rating, feedback);
      Toast.show({
        type: "customToast",
        text1: "Rating Submitted",
        text2: "Thank you for your feedback!",
      });
      setDestinationLocation({
        address: "",
        coords: { latitude: "", longitude: "" },
      });
      resetState();
    } catch (error: any) {
      console.log("error", error.response.data);
      Toast.show({
        type: "customToast",
        text1: "Submit Failed",
        text2: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Submit a 0 rating to indicate skip
      await riderApi.submitRating(rideId, 0, "Skipped");

      setDestinationLocation({
        address: "",
        coords: { latitude: "", longitude: "" },
      });
      resetState();
    } catch (error: any) {
      console.log("error", error.response?.data || error.message);
      Toast.show({
        type: "customToast",
        text1: "Failed to skip",
        text2: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView>
        <HideKeyboardOnTouch>
          <View>
            <View style={{ paddingHorizontal: 16 }}>
              <Header onBackPress={handleSkip} />
            </View>
            <View style={{ justifyContent: "center", paddingHorizontal: 24 }}>
              <CustomText
                fontWeight="Bold"
                style={{
                  fontSize: 28,
                  textAlign: "center",
                  marginBottom: 32,
                  color: COLORS.primary,
                }}
              >
                Rate Your Trip
              </CustomText>

              {fare !== undefined && (
                <CustomText
                  fontWeight="Bold"
                  style={{
                    fontSize: 20,
                    textAlign: "center",
                    marginBottom: 32,
                    color: COLORS.black,
                  }}
                >
                  Fare: ₦{fare?.toLocaleString()}
                </CustomText>
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginBottom: 40,
                }}
              >
                {[0, 1, 2, 3, 4].map((index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleStarPress(index)}
                    style={{ marginHorizontal: 8 }}
                  >
                    <Ionicons
                      name={index < rating ? "star" : "star-outline"}
                      size={scale(40)}
                      color={index < rating ? "#FFD700" : COLORS.secondaryText}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <CustomText
                  style={{
                    textAlign: "center",
                    marginBottom: 24,
                    color: COLORS.secondaryText,
                  }}
                >
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </CustomText>
              )}

              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Any additional feedback? (Optional)"
                placeholderTextColor={COLORS.secondaryText}
                multiline
                style={{
                  height: 120,
                  borderColor: COLORS.secondaryText,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  textAlignVertical: "top",
                  fontFamily: "Urbanist-Regular",
                  marginBottom: 32,
                }}
                maxLength={500}
              />

              <CustomButton
                title={"Submit Rating"}
                loading={loading}
                disabled={rating === 0 || loading}
                onPress={handleSubmit}
                style={{ marginBottom: 16 }}
              />

              <TouchableOpacity
                onPress={handleSkip}
                disabled={loading}
                style={{ padding: 12, alignItems: "center" }}
              >
                <CustomText
                  style={{
                    color: COLORS.secondaryText,
                    fontSize: 16,
                  }}
                >
                  Skip
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </HideKeyboardOnTouch>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RatingScreen;
