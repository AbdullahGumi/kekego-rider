import { riderApi } from "@/api/endpoints/rider";
import { KekeOptionImage } from "@/assets/images/Index";
import CustomText from "@/components/common/CustomText";
import { COLORS } from "@/constants/Colors";
import { CONSTANTS } from "@/constants/constants";
import { useAppStore } from "@/stores/useAppStore";
import { formatDuration, numberWithCommas } from "@/utility";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

type PaymentMethod = "cash" | "wallet";

const ConfirmStage = () => {
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const rideState = useAppStore((state) => state.rideState);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const { setRideId, setRideStage } = useAppStore();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const bottomSheetRef = useAppStore((state) => state.bottomSheetRef);

  const { fare, tripDuration, destinationDistance, destinationDuration } =
    rideState;

  const handleBookRide = useCallback(async () => {
    if (
      !pickupLocation.coords.latitude ||
      !destinationLocation.coords.latitude
    ) {
      Alert.alert(
        "Error",
        "Please select valid pickup and destination locations."
      );
      return;
    }
    setBookingLoading(true);
    try {
      const response = await riderApi.requestRide({
        pickupLocation: {
          address: pickupLocation.address,
          coords: {
            latitude: Number(pickupLocation.coords.latitude),
            longitude: Number(pickupLocation.coords.longitude),
          },
        },
        dropoffLocation: {
          address: destinationLocation.address,
          coords: {
            latitude: Number(destinationLocation.coords.latitude),
            longitude: Number(destinationLocation.coords.longitude),
          },
        },
        distanceInKm: Number(destinationDistance),
        durationInMinutes: Number(destinationDuration),
        paymentMethod: paymentMethod,
      });
      if (response.data.data.ride.status === "requested") {
        const responseRideId = response.data.data.ride.id;
        setRideId(responseRideId);
        setRideStage("search");
        bottomSheetRef?.current?.snapToIndex(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response.data.message || "Failed to book ride."
      );
    } finally {
      setBookingLoading(false);
    }
  }, [
    destinationLocation,
    pickupLocation,
    destinationDistance,
    destinationDuration,
    paymentMethod,
    setRideStage,
    setRideId,
  ]);

  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
  }, []);
  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Confirm Your Ride
      </CustomText>

      <View style={homeStyles.confirmCard}>
        <View style={homeStyles.rideOptionHeader}>
          <Image source={KekeOptionImage} style={homeStyles.rideOptionIcon} />
          <View>
            <CustomText fontWeight="Bold" style={homeStyles.rideOptionTitle}>
              Standard Keke
            </CustomText>
            <CustomText style={homeStyles.rideOptionDescription}>
              Fast & Reliable
            </CustomText>
          </View>
        </View>
        <View style={homeStyles.rideOptionDetails}>
          {fare === null || tripDuration === null ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <CustomText fontWeight="Bold" style={homeStyles.rideOptionPrice}>
                {CONSTANTS.NAIRA_UNICODE}
                {numberWithCommas(fare)}
              </CustomText>
              <CustomText style={homeStyles.rideOptionDuration}>
                {formatDuration(tripDuration)}
              </CustomText>
            </>
          )}
        </View>
      </View>

      {/* Payment Method Selector */}
      <View style={homeStyles.paymentMethodContainer}>
        <CustomText fontWeight="SemiBold" style={homeStyles.paymentMethodTitle}>
          Payment Method
        </CustomText>
        <View style={homeStyles.paymentMethodOptions}>
          <TouchableOpacity
            style={[
              homeStyles.paymentMethodOption,
              paymentMethod === "cash"
                ? homeStyles.paymentMethodOptionSelected
                : {},
              {
                flexDirection: "row",
                justifyContent: "center",
              },
            ]}
            onPress={() => handlePaymentMethodChange("cash")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="cash-outline"
              size={20}
              style={{ marginRight: 6 }}
              color={
                paymentMethod === "cash" ? COLORS.background : COLORS.black
              }
            />
            <CustomText
              style={[
                homeStyles.paymentMethodOptionText,
                paymentMethod === "cash"
                  ? homeStyles.paymentMethodOptionTextSelected
                  : {},
              ]}
            >
              Cash
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              homeStyles.paymentMethodOption,
              paymentMethod === "wallet"
                ? homeStyles.paymentMethodOptionSelected
                : {},
              {
                flexDirection: "row",
                justifyContent: "center",
              },
            ]}
            onPress={() => handlePaymentMethodChange("wallet")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="wallet-outline"
              size={20}
              style={{ marginRight: 6 }}
              color={
                paymentMethod === "wallet" ? COLORS.background : COLORS.black
              }
            />
            <CustomText
              style={[
                homeStyles.paymentMethodOptionText,
                paymentMethod === "wallet"
                  ? homeStyles.paymentMethodOptionTextSelected
                  : {},
              ]}
            >
              Wallet
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          homeStyles.bookButton,
          bookingLoading && homeStyles.bookButtonDisabled,
        ]}
        onPress={handleBookRide}
        disabled={bookingLoading}
        activeOpacity={0.7}
      >
        <Animated.View entering={FadeIn}>
          {bookingLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <CustomText fontWeight="Bold" style={homeStyles.bookButtonText}>
              Book Ride
            </CustomText>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ConfirmStage;
