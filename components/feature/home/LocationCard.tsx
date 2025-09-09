import CustomText from "@/components/common/CustomText";
import { COLORS } from "@/constants/Colors";
import { CONFIG } from "@/constants/home";
import { LocationData } from "@/types/home";
import React, { memo } from "react";
import { ActivityIndicator, Image, View } from "react-native";
import { homeStyles } from "../../../styles/home-styles";

interface LocationCardProps {
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  geocodingLoading: boolean;
}

const LocationCard = memo<LocationCardProps>(
  ({ pickupLocation, destinationLocation, geocodingLoading }) => (
    <View style={homeStyles.locationCard}>
      <View style={homeStyles.locationRow}>
        <Image
          source={{ uri: CONFIG.MARKER_ICONS.pickup }}
          style={homeStyles.locationIcon}
        />
        <CustomText style={homeStyles.locationText}>
          {pickupLocation.address || "Current Location"}
        </CustomText>
        {geocodingLoading && (
          <ActivityIndicator size="small" color={COLORS.primary} />
        )}
      </View>
      <View style={homeStyles.locationDivider} />
      <View style={homeStyles.locationRow}>
        <Image
          source={{ uri: CONFIG.MARKER_ICONS.destination }}
          style={homeStyles.locationIcon}
        />
        <CustomText style={homeStyles.locationText}>
          {destinationLocation.address || "Select Destination"}
        </CustomText>
      </View>
    </View>
  )
);

LocationCard.displayName = "LocationCard";

export default LocationCard;
