import CustomText from "@/components/common/CustomText";
import RecentDestinationItem from "@/components/feature/home/RecentDestinationItem";
import { CONFIG } from "@/constants/home";
import { useAppStore } from "@/stores/useAppStore";
import { useCallback } from "react";
import { FlatList, TouchableOpacity } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

const InitialStage = () => {
  const { setRideStage, setDestinationLocation } = useAppStore();
  const bottomSheetRef = useAppStore((state) => state.bottomSheetRef);

  const handleWhereTo = useCallback(() => {
    setRideStage("input");
    bottomSheetRef?.current?.snapToIndex(1);
  }, [setRideStage, bottomSheetRef]);

  const handleSelectRecentDestination = useCallback(
    (destination: any) => {
      setDestinationLocation(destination);
      setRideStage("confirm");
      bottomSheetRef?.current?.snapToIndex(0);
    },
    [setDestinationLocation, setRideStage, bottomSheetRef]
  );

  return (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Plan Your Ride
      </CustomText>
      <TouchableOpacity
        style={homeStyles.whereToButton}
        onPress={handleWhereTo}
        activeOpacity={0.7}
      >
        <CustomText fontWeight="Bold" style={homeStyles.whereToButtonText}>
          Where to?
        </CustomText>
      </TouchableOpacity>
      <CustomText fontWeight="Medium" style={homeStyles.sectionSubTitle}>
        Recent Destinations
      </CustomText>
      <FlatList
        data={CONFIG.RECENT_DESTINATIONS}
        renderItem={({ item }) => (
          <RecentDestinationItem
            item={item}
            onSelect={handleSelectRecentDestination}
          />
        )}
        keyExtractor={(item) => item.id}
        style={homeStyles.recentDestinationsList}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
};

export default InitialStage;
