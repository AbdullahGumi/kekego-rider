import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import {
  getMapRegionConfig,
  shouldUpdateMapRegion,
  updateMapRegion,
} from "@/utility";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";

interface MapControlsProps {
  geocodingLoading: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  geocodingLoading,
}) => {
  const { stage, driver, eta } = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const userLocation = useAppStore((state) => state.userLocation);
  const mapRef = useAppStore((state) => state.mapRef);
  const bottomSheetRef = useAppStore((state) => state.bottomSheetRef);

  const { setRideStage, setDestinationLocation } = useAppStore();

  const navigation = useNavigation<any>();

  const handleDrawer = () => navigation.toggleDrawer();

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

  if (stage === "initial") {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={handleDrawer}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            marginLeft: scale(16),
          }}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            borderWidth: 1,
            borderColor: COLORS.primary,
            marginRight: scale(16),
          }}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  if (["input", "confirm", "chat"].includes(stage)) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => handleBack(geocodingLoading)}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            marginLeft: scale(16),
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={centerMapOnUser}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            borderWidth: 1,
            borderColor: COLORS.primary,
            marginRight: scale(16),
          }}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  // Return null for other stages - they handle their own controls
  return null;
};
