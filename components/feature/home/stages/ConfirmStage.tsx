import { KekeImage } from "@/assets/images/Index";
import CustomText from "@/components/common/CustomText";
import LocationCard from "@/components/feature/home/LocationCard";
import { COLORS } from "@/constants/Colors";
import { CONSTANTS } from "@/constants/constants";
import { useAppStore } from "@/stores/useAppStore";
import { formatDuration, numberWithCommas } from "@/utility";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface ConfirmStageProps {
  geocodingLoading: boolean;
  bookingLoading: boolean;
  handleBookRide: () => void;
}

const ConfirmStage: React.FC<ConfirmStageProps> = ({
  geocodingLoading,
  bookingLoading,
  handleBookRide,
}) => {
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const rideState = useAppStore((state) => state.rideState);
  const destinationLocation = useAppStore((state) => state.destinationLocation);

  const { fare, tripDuration } = rideState;

  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Confirm Your Ride
      </CustomText>
      <LocationCard
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        geocodingLoading={geocodingLoading}
      />
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
