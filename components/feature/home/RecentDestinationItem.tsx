import CustomText from "@/components/common/CustomText";
import { CONFIG } from "@/constants/home";
import { RecentDestination } from "@/types/home";
import React, { memo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { homeStyles } from "../../../styles/home-styles";

interface RecentDestinationItemProps {
  item: RecentDestination;
  onSelect: (destination: RecentDestination) => void;
}

const RecentDestinationItem = memo<RecentDestinationItemProps>(
  ({ item, onSelect }) => (
    <TouchableOpacity
      style={homeStyles.recentDestinationCard}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Animated.View entering={ZoomIn.delay(100 * Number(item.id))}>
        <View style={homeStyles.recentDestinationContent}>
          <Image
            source={{ uri: CONFIG.MARKER_ICONS.pin }}
            style={homeStyles.recentDestinationIcon}
          />
          <View>
            <CustomText
              fontWeight="Medium"
              style={homeStyles.recentDestinationText}
            >
              {item.address}
            </CustomText>
            <CustomText style={homeStyles.recentDestinationSubText}>
              Recent Trip
            </CustomText>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
);

RecentDestinationItem.displayName = "RecentDestinationItem";

export default RecentDestinationItem;
