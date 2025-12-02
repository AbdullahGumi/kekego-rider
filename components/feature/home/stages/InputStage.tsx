import CustomText from "@/components/common/CustomText";
import LocationInput from "@/components/feature/home/LocationInput";
import { useAppStore } from "@/stores/useAppStore";
import { useCallback } from "react";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface InputStageProps {
  geocodingLoading: boolean;
}

const InputStage: React.FC<InputStageProps> = ({ geocodingLoading }) => {
  const { setPickupLocation, setDestinationLocation, setRideStage } =
    useAppStore();
  const bottomSheetRef = useAppStore((state) => state.bottomSheetRef);

  const pickupAddress = useAppStore((state) => state.pickupLocation.address);
  const destinationAddress = useAppStore(
    (state) => state.destinationLocation.address
  );

  const handleDestinationSelected = useCallback(
    (destination: any) => {
      if (
        !destination.address ||
        !destination.coords.latitude ||
        !destination.coords.longitude
      ) {
        throw new Error("Invalid destination data");
      }
      setDestinationLocation(destination);
      setRideStage("confirm");
      bottomSheetRef?.current?.snapToIndex(0);
    },
    [setDestinationLocation, setRideStage, bottomSheetRef]
  );

  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Where are you going?
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
