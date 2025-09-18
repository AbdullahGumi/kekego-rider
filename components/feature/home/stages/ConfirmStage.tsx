import { riderApi } from "@/api/endpoints/rider";
import { KekeImage } from "@/assets/images/Index";
import CustomText from "@/components/common/CustomText";
import { COLORS } from "@/constants/Colors";
import { CONSTANTS } from "@/constants/constants";
import { useAppStore } from "@/stores/useAppStore";
import { formatDuration, numberWithCommas } from "@/utility";
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

const ConfirmStage = () => {
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const rideState = useAppStore((state) => state.rideState);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const { setRideId, setRideStage } = useAppStore();
  const [bookingLoading, setBookingLoading] = useState(false);

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
        paymentMethod: "cash",
      });
      if (response.data.data.ride.status === "requested") {
        const responseRideId = response.data.data.ride.id;
        setRideId(responseRideId);
        setRideStage("search");
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
    setRideStage,
    setRideId,
  ]);

  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Confirm Your Ride
      </CustomText>
      <View style={homeStyles.confirmCard}>
        <View style={homeStyles.rideOptionHeader}>
          <Image source={KekeImage} style={homeStyles.rideOptionIcon} />
          <View>
            <CustomText fontWeight="Bold" style={homeStyles.rideOptionTitle}>
              Tricycle
            </CustomText>
            <CustomText style={homeStyles.rideOptionDescription}>
              Local tricycle (Keke)
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
              Book Keke Ride
            </CustomText>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ConfirmStage;
