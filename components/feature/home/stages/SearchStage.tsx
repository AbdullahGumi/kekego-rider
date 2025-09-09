import CustomText from "@/components/common/CustomText";
import LocationCard from "@/components/feature/home/LocationCard";
import { COLORS } from "@/constants/Colors";
import type { LocationData } from "@/types/home";
import { ActivityIndicator } from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface SearchStageProps {
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  geocodingLoading: boolean;
}

const SearchStage: React.FC<SearchStageProps> = ({
  pickupLocation,
  destinationLocation,
  geocodingLoading,
}) => {
  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Finding Your Keke...
      </CustomText>
      <LocationCard
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        geocodingLoading={geocodingLoading}
      />
      <Animated.View entering={ZoomIn} style={homeStyles.searchAnimation}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <CustomText style={homeStyles.searchText}>
          Searching for nearby drivers...
        </CustomText>
      </Animated.View>
    </Animated.View>
  );
};

export default SearchStage;
