import CustomText from "@/components/common/CustomText";
import ContactButtons from "@/components/feature/home/ContactButtons";
import DriverInfo from "@/components/feature/home/DriverInfo";
import { useAppStore } from "@/stores/useAppStore";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

const PairedArrivedStage = () => {
  const rideState = useAppStore((state) => state.rideState);

  const { stage, driver } = rideState;
  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        {stage === "paired"
          ? "Your Keke Driver"
          : `${driver?.name} has Arrived`}
      </CustomText>
      <DriverInfo driver={driver!} stage={stage} />
      <ContactButtons />
    </Animated.View>
  );
};

export default PairedArrivedStage;
