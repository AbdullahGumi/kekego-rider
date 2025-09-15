import CustomText from "@/components/common/CustomText";
import ContactButtons from "@/components/feature/home/ContactButtons";
import DriverInfo from "@/components/feature/home/DriverInfo";
import LocationCard from "@/components/feature/home/LocationCard";
import { useAppStore } from "@/stores/useAppStore";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface PairedArrivedStageProps {
  geocodingLoading: boolean;
  onCall: () => void;
  onChat: () => void;
}

const PairedArrivedStage: React.FC<PairedArrivedStageProps> = ({
  geocodingLoading,
  onCall,
  onChat,
}) => {
  const rideState = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);

  const { stage, driver } = rideState;
  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        {stage === "paired"
          ? "Your Keke Driver"
          : `${driver?.name} has Arrived`}
      </CustomText>
      <LocationCard
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        geocodingLoading={geocodingLoading}
      />
      <DriverInfo driver={driver!} stage={stage} />
      <ContactButtons onCall={onCall} onChat={onChat} />
    </Animated.View>
  );
};

export default PairedArrivedStage;
