import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { riderApi } from "@/api/endpoints/rider";
import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import SafeAreaWrapper from "@/components/common/SafeAreaWrapper";
import { COLORS } from "@/constants/Colors";
import { useAppStore } from "@/stores/useAppStore";
import HideKeyboardOnTouch from "@/utility/HideKeyboardOnTouch";

const RatingScreen: React.FC = () => {
  const router = useRouter();
  const { rideState, resetRideState, setDestinationLocation, bottomSheetRef } =
    useAppStore();
  const { rideId, fare } = rideState;

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    router.back();
    setTimeout(() => {
      bottomSheetRef?.current?.snapToIndex(0);
      resetRideState();
    }, 500);
  };

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex + 1); // Since 0-based
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      //       return;
    }

    if (!rideId) {
      Alert.alert("Error", "No ride ID available");
      return;
    }

    setLoading(true);

    try {
      await riderApi.submitRating(rideId, rating, feedback);
      Toast.show({
        type: "success",
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
        type: "error",
        text1: "Submit Failed",
        text2: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <HideKeyboardOnTouch>
            <View>
              <TouchableOpacity
                style={{
                  padding: 16,
                  alignItems: "flex-start",
                }}
                onPress={resetState}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

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
                        size={40}
                        color={
                          index < rating ? "#FFD700" : COLORS.secondaryText
                        }
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
                  style={{ marginBottom: 24 }}
                >
                  {loading && <ActivityIndicator color={COLORS.white} />}
                </CustomButton>
              </View>
            </View>
          </HideKeyboardOnTouch>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

export default RatingScreen;
