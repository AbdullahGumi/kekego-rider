import CustomText from "@/components/common/CustomText";
import LocationInput from "@/components/feature/home/LocationInput";
import type { LocationData } from "@/types/home";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface InputStageProps {
  setPickupLocation: (location: LocationData) => void;
  handleDestinationSelected: (location: LocationData) => void;
  pickupAddress: string;
  destinationAddress: string;
  geocodingLoading: boolean;
}

const InputStage: React.FC<InputStageProps> = ({
  setPickupLocation,
  handleDestinationSelected,
  pickupAddress,
  destinationAddress,
  geocodingLoading,
}) => {
  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Enter Your Destination
      </CustomText>
      <LocationInput
        setPickupLocation={setPickupLocation}
        setDestinationLocation={handleDestinationSelected}
        initialPickup={pickupAddress}
        initialDestination={destinationAddress}
        isPickupLoading={geocodingLoading}
      />
    </Animated.View>
  );
};

export default InputStage;
