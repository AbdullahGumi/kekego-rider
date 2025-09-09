import CustomText from "@/components/common/CustomText";
import ContactButtons from "@/components/feature/home/ContactButtons";
import DriverInfo from "@/components/feature/home/DriverInfo";
import LocationCard from "@/components/feature/home/LocationCard";
import type { Driver, LocationData } from "@/types/home";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface PairedArrivedStageProps {
  driver: Driver;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  geocodingLoading: boolean;
  stage: "paired" | "arrived";
  onCall: () => void;
  onChat: () => void;
}

const PairedArrivedStage: React.FC<PairedArrivedStageProps> = ({
  driver,
  pickupLocation,
  destinationLocation,
  geocodingLoading,
  stage,
  onCall,
  onChat,
}) => {
  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        {stage === "paired" ? "Your Keke Driver" : "Keke Driver Arrived"}
      </CustomText>
      <LocationCard
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        geocodingLoading={geocodingLoading}
      />
      <DriverInfo driver={driver} stage={stage} />
      <ContactButtons onCall={onCall} onChat={onChat} />
    </Animated.View>
  );
};

export default PairedArrivedStage;
