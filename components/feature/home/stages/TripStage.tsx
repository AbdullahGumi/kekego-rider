import CustomText from "@/components/common/CustomText";
import ContactButtons from "@/components/feature/home/ContactButtons";
import LocationCard from "@/components/feature/home/LocationCard";
import { CONSTANTS } from "@/constants/constants";
import { CONFIG } from "@/constants/home";
import type { Driver, LocationData } from "@/types/home";
import { numberWithCommas } from "@/utility";
import { Image, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface TripStageProps {
  driver: Driver;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  geocodingLoading: boolean;
  eta: string;
  fare: number | null;
  onCall: () => void;
  onChat: () => void;
}

const TripStage: React.FC<TripStageProps> = ({
  driver,
  pickupLocation,
  destinationLocation,
  geocodingLoading,
  eta,
  fare,
  onCall,
  onChat,
}) => {
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
            source={{ uri: driver.profilePicture }}
            style={homeStyles.driverPicture}
          />
          <View style={homeStyles.driverInfoContainer}>
            <CustomText fontWeight="Bold" style={homeStyles.rideOptionTitle}>
              {driver.name}
            </CustomText>
            <View style={homeStyles.ratingContainer}>
              <Image
                source={{ uri: CONFIG.MARKER_ICONS.star }}
                style={homeStyles.starIcon}
              />
              <CustomText style={homeStyles.rideOptionDescription}>
                {driver.rating?.toFixed(1)}
              </CustomText>
            </View>
            <CustomText style={homeStyles.rideOptionDescription}>
              {driver.vehicle} (Keke) • {driver.vehicleNumber}
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
      <ContactButtons onCall={onCall} onChat={onChat} />
    </Animated.View>
  );
};

export default TripStage;
