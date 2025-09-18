import CustomText from "@/components/common/CustomText";
import LocationCard from "@/components/feature/home/LocationCard";
import { CONSTANTS } from "@/constants/constants";
import { CONFIG } from "@/constants/home";
import { useAppStore } from "@/stores/useAppStore";
import { numberWithCommas } from "@/utility";
import { Image, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface TripStageProps {
  geocodingLoading: boolean;
  onCall: () => void;
}

const TripStage: React.FC<TripStageProps> = ({ geocodingLoading, onCall }) => {
  const rideState = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);

  const { fare, driver, eta } = rideState;
  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Trip started
      </CustomText>
      <LocationCard
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        geocodingLoading={geocodingLoading}
      />
      <View style={homeStyles.tripCard}>
        <View style={homeStyles.driverHeader}>
          <Image
            source={{ uri: driver?.profilePicture }}
            style={homeStyles.driverPicture}
          />
          <View style={homeStyles.driverInfoContainer}>
            <CustomText fontWeight="Bold" style={homeStyles.rideOptionTitle}>
              {driver?.name}
            </CustomText>
            <View style={homeStyles.ratingContainer}>
              <Image
                source={{ uri: CONFIG.MARKER_ICONS.star }}
                style={homeStyles.starIcon}
              />
              <CustomText style={homeStyles.rideOptionDescription}>
                {/* {driver?.rating?.toFixed(1) || "N/A"} */}5
              </CustomText>
            </View>
            <CustomText style={homeStyles.rideOptionDescription}>
              Plate number: {driver?.vehicle.plateNumber}
            </CustomText>
          </View>
        </View>
        <View style={homeStyles.tripInfoContainer}>
          <View style={homeStyles.tripInfoItem}>
            <CustomText style={homeStyles.tripInfoLabel}>
              Time of Arrival
            </CustomText>
            <CustomText fontWeight="Bold" style={homeStyles.tripInfoValue}>
              {eta}
            </CustomText>
          </View>
          <View style={homeStyles.tripInfoDivider} />
          <View style={homeStyles.tripInfoItem}>
            <CustomText style={homeStyles.tripInfoLabel}>Price</CustomText>
            <CustomText fontWeight="Bold" style={homeStyles.tripInfoValue}>
              {CONSTANTS.NAIRA_UNICODE}
              {numberWithCommas(fare)}
            </CustomText>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default TripStage;
