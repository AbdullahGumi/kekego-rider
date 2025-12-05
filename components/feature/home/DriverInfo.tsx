import CustomText from "@/components/common/CustomText";
import { CONFIG } from "@/constants/home";
import { scale } from "@/constants/Layout";
import { Driver } from "@/stores/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Image, View } from "react-native";
import { homeStyles } from "../../../styles/home-styles";

interface DriverInfoProps {
  driver: Driver;
  stage: string;
}

const DriverInfo = memo<DriverInfoProps>(({ driver, stage }) => {
  return (
    <View style={homeStyles.confirmCard}>
      <View style={homeStyles.rideOptionHeader}>
        <Image
          source={{ uri: driver?.profilePicture || CONFIG.MARKER_ICONS.user }}
          style={homeStyles.driverPicture}
        />
        <View style={homeStyles.driverInfoContainer}>
          <CustomText fontWeight="Bold" style={homeStyles.rideOptionTitle}>
            {driver?.name || "Unknown Driver"}
          </CustomText>
          <View style={homeStyles.ratingContainer}>
            <CustomText style={homeStyles.rideOptionDescription}>
              <Ionicons
                name="star"
                size={scale(16)}
                color="#FFD700"
                style={{ marginRight: 4 }}
              />
              {driver?.averageRating}
            </CustomText>
          </View>
          <CustomText style={homeStyles.rideOptionDescription}>
            Plate number: {driver?.vehicle.plateNumber}
          </CustomText>
        </View>
      </View>
      <CustomText style={homeStyles.rideOptionDescription}>
        {stage === "paired"
          ? "Your driver is on the way to the pickup location"
          : "Your driver is at the pickup location"}
      </CustomText>
    </View>
  );
});

DriverInfo.displayName = "DriverInfo";

export default DriverInfo;
