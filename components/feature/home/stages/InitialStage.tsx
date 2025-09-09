import CustomText from "@/components/common/CustomText";
import RecentDestinationItem from "@/components/feature/home/RecentDestinationItem";
import { CONFIG } from "@/constants/home";
import type { RecentDestination } from "@/types/home";
import { FlatList, TouchableOpacity } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { homeStyles } from "../../../../styles/home-styles";

interface InitialStageProps {
  handleWhereTo: () => void;
  handleSelectRecentDestination: (destination: RecentDestination) => void;
}

const InitialStage: React.FC<InitialStageProps> = ({
  handleWhereTo,
  handleSelectRecentDestination,
}) => {
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
