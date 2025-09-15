import CustomText from "@/components/common/CustomText";
import { CONFIG } from "@/constants/home";
import { Driver } from "@/stores/useAppStore";
import React, { memo } from "react";
import { Image, View } from "react-native";
import { homeStyles } from "../../../styles/home-styles";

interface DriverInfoProps {
  driver: Driver;
  stage: string;
}

const DriverInfo = memo<DriverInfoProps>(({ driver, stage }) => (
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
          <Image
            source={{ uri: CONFIG.MARKER_ICONS.star }}
            style={homeStyles.starIcon}
          />
          <CustomText style={homeStyles.rideOptionDescription}>
            {/* {driver?.rating?.toFixed(1) || "N/A"} */}5
          </CustomText>
        </View>
        <CustomText style={homeStyles.rideOptionDescription}>
          Plate number: {driver?.vehicle.plateNumber}
        </CustomText>
      </View>
    </View>
    <CustomText style={homeStyles.rideOptionDescription}>
      {stage === "paired"
        ? "Arriving in approximately 2-3 minutes"
        : "Your driver is at the pickup location"}
    </CustomText>
  </View>
));

DriverInfo.displayName = "DriverInfo";

export default DriverInfo;
