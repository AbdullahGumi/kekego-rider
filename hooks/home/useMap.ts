import { useAppStore } from "@/stores/useAppStore";
import { logError } from "@/utility";
import {
    getMapRegionConfig,
    type MapRegionParams,
    shouldUpdateMapRegion,
    updateMapRegion,
} from "@/utility/mapRegionService";
import { BottomSheetFlatListMethods } from "@gorhom/bottom-sheet";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import MapView from "react-native-maps";

export interface UseMapOptions {
  mapLoading?: boolean;
}

export const useMap = (options: UseMapOptions = {}) => {
  const {
    rideState,
    userLocation,
    pickupLocation,
    destinationLocation,
    setMapLoading,
  } = useAppStore();

  // Refs for map and UI elements
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<{ snapToIndex: (index: number) => void; current?: any } | null>(null);
  const flatListRef = useRef<BottomSheetFlatListMethods | null>(null);

  const stage = rideState.stage;
  const driver = rideState.driver;

  // Auto-stop loading when user location is available
  useEffect(() => {
    if (options.mapLoading && userLocation?.coords) {
      setMapLoading(false);
    }
  }, [options.mapLoading, userLocation, setMapLoading]);

  // Map region management using the external service
  useEffect(() => {
    const mapLoading = options.mapLoading;
    if (mapLoading || !mapRef.current) return;

    const config = getMapRegionConfig(stage);
    if (!config) return;

    const params: MapRegionParams = {
      stage,
      userLocation,
      pickupLocation,
      destinationLocation,
      driver,
    };

    if (shouldUpdateMapRegion(config, params)) {
      try {
        updateMapRegion(mapRef.current, config, params);
      } catch (error) {
        logError(`Map Region Update ${stage}`, error);
        Alert.alert("Error", "Failed to update map view.");
      }
    }
  }, [
    stage,
    options.mapLoading,
    userLocation,
    pickupLocation,
    destinationLocation,
    driver,
  ]);

  // Center map on user's location
  const centerOnUser = () => {
    if (!userLocation?.coords) {
      logError("Center Map On User", new Error("User location unavailable"));
      Alert.alert("Error", "Failed to center map on your location.");
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000
    );
  };

  return {
    // Refs
    mapRef,
    bottomSheetRef,
    flatListRef,

    // State
    stage,
    driver,

    // Actions
    centerOnUser,

    // Values for convenience
    userLocation,
    pickupLocation,
    destinationLocation,
  };
};
