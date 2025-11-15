import { riderApi } from "@/api/endpoints/rider";
import DrawerButton from "@/components/common/DrawerButton";
import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import {
  getMapRegionConfig,
  shouldUpdateMapRegion,
  updateMapRegion,
} from "@/utility";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { Alert, Linking, TouchableOpacity, View } from "react-native";

interface MapControlsProps {
  geocodingLoading: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  geocodingLoading,
}) => {
  const { stage, driver, eta, rideId } = useAppStore(
    (state) => state.rideState
  );
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const userLocation = useAppStore((state) => state.userLocation);
  const mapRef = useAppStore((state) => state.mapRef);
  const bottomSheetRef = useAppStore((state) => state.bottomSheetRef);

  const {
    setRideStage,
    setDestinationLocation,
    setFare,
    setDriver,
    setEta,
    setRideId,
  } = useAppStore();

  const centerMapOnUser = useCallback(() => {
    if (userLocation?.coords) {
      const mapParams = {
        stage: "initial", // Use initial stage to center on user
        userLocation,
        pickupLocation,
        destinationLocation,
        driver,
      };

      const config = getMapRegionConfig("initial");
      if (config && shouldUpdateMapRegion(config, mapParams)) {
        updateMapRegion(mapRef?.current, config, mapParams);
      } else {
        // Fallback manual centering
        mapRef?.current?.animateToRegion(
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000
        );
      }
    }
  }, [userLocation, destinationLocation, driver, pickupLocation]);

  const handleCancel = useCallback(async () => {
    try {
      // Cancel ride request and return to initial state
      const response = await riderApi.cancelRide(rideId!, "Rider cancelled");

      if (response?.data?.success) {
        setRideStage("initial");
        setDestinationLocation({
          address: "",
          coords: { latitude: "", longitude: "" },
        });
        setFare(null);
        setDriver(null);
        setEta("");
        setRideId(null);
        bottomSheetRef?.current?.snapToIndex(0);
      } else {
        console.warn("Ride cancellation failed:", response?.data);
      }
    } catch (error: any) {
      console.error("Error cancelling ride:", error.response.data.message);
    }
  }, [
    setRideStage,
    setDestinationLocation,
    setFare,
    setDriver,
    setEta,
    setRideId,
    rideId,
    bottomSheetRef,
  ]);

  const handleBack = useCallback(
    (geocodingLoading: boolean = false) => {
      if (geocodingLoading) {
        // Don't allow navigation while geocoding is in progress
        return;
      }

      if (stage === "input") {
        setRideStage("initial");
        setDestinationLocation({
          address: "",
          coords: { latitude: "", longitude: "" },
        });
        bottomSheetRef?.current?.snapToIndex(0);
      } else if (stage === "confirm") {
        setRideStage("input");
        bottomSheetRef?.current?.snapToIndex(1);
      } else if (stage === "chat") {
        // Handle chat stage back navigation based on driver state and ETA
        setRideStage(driver ? (eta ? "trip" : "arrived") : "paired");
        bottomSheetRef?.current?.snapToIndex(2);
      }
    },
    [stage, driver, eta, setRideStage, setDestinationLocation, bottomSheetRef]
  );

  const openGoogleMaps = useCallback(() => {
    try {
      if (!userLocation?.coords?.latitude || !userLocation?.coords?.longitude) {
        throw new Error("Your location not available");
      }

      if (
        !destinationLocation?.address ||
        !destinationLocation?.coords?.latitude ||
        !destinationLocation?.coords?.longitude
      ) {
        throw new Error("Destination location not available");
      }

      const originLat = userLocation.coords.latitude.toString();
      const originLng = userLocation.coords.longitude.toString();
      const destLat = destinationLocation.coords.latitude;
      const destLng = destinationLocation.coords.longitude;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving&dir_action=navigate`;
      Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Failed to open Google Maps directions.");
    }
  }, [userLocation, destinationLocation]);

  // Define common button styles
  const baseButtonStyle = {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(50),
    backgroundColor: "white",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  };

  const locationButtonStyle = {
    ...baseButtonStyle,
    borderWidth: 1,
    borderColor: COLORS.primary,
  };

  const actionButtonStyle = {
    ...baseButtonStyle,
  };

  // Render controls based on stage
  let leftButton = null;
  let rightButton = null;

  switch (stage) {
    case "initial":
      leftButton = <DrawerButton />;
      rightButton = (
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={[
            locationButtonStyle,
            {
              width: scale(50),
              height: scale(50),
            },
          ]}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      );
      break;

    case "input":
    case "confirm":
      leftButton = (
        <TouchableOpacity
          onPress={() => handleBack(geocodingLoading)}
          activeOpacity={0.7}
          style={actionButtonStyle}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
      );
      rightButton = (
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={[
            locationButtonStyle,
            {
              width: scale(50),
              height: scale(50),
            },
          ]}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      );
      break;

    case "search":
      leftButton = (
        <TouchableOpacity
          onPress={handleCancel}
          activeOpacity={0.7}
          style={actionButtonStyle}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      );
      rightButton = (
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={[
            locationButtonStyle,
            {
              width: scale(50),
              height: scale(50),
            },
          ]}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      );
      break;

    case "paired":
      leftButton = (
        <TouchableOpacity
          onPress={handleCancel}
          activeOpacity={0.7}
          style={actionButtonStyle}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      );
      rightButton = (
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={[
            locationButtonStyle,
            {
              width: scale(50),
              height: scale(50),
            },
          ]}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      );
      break;

    case "arrived":
      leftButton = <DrawerButton />;
      rightButton = (
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={[
            locationButtonStyle,
            {
              width: scale(50),
              height: scale(50),
            },
          ]}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      );
      break;

    case "trip":
      leftButton = <DrawerButton />;
      rightButton = (
        <View style={{ alignItems: "center", position: "relative" }}>
          <TouchableOpacity
            onPress={centerMapOnUser}
            activeOpacity={0.7}
            style={[
              locationButtonStyle,
              {
                width: scale(50),
                height: scale(50),
                marginBottom: scale(8),
              },
            ]}
          >
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openGoogleMaps}
            activeOpacity={0.7}
            style={[
              locationButtonStyle,
              {
                borderColor: "#4285F4",
                width: scale(50),
                height: scale(50),
                position: "absolute",
                bottom: -scale(50),
              },
            ]}
          >
            <Ionicons name="logo-google" size={24} color="#4285F4" />
          </TouchableOpacity>
        </View>
      );
      break;

    case "chat":
      leftButton = (
        <TouchableOpacity
          onPress={() => handleBack(geocodingLoading)}
          activeOpacity={0.7}
          style={actionButtonStyle}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
      );
      rightButton = (
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={[
            locationButtonStyle,
            {
              width: scale(50),
              height: scale(50),
            },
          ]}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      );
      break;

    default:
      return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      {leftButton}
      {rightButton}
    </View>
  );
};
