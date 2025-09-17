import { useAppStore } from "@/stores/useAppStore";
import {
  getMapRegionConfig,
  logError,
  shouldUpdateMapRegion,
  updateMapRegion,
} from "@/utility";
import type { RefObject } from "react";
import { useEffect } from "react";
import { Alert } from "react-native";
import MapView from "react-native-maps";

export const useMapRegionManager = (mapRef: RefObject<MapView | null>) => {
  const rideState = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const userLocation = useAppStore((state) => state.userLocation);

  const { mapLoading, stage, driver } = rideState;
  useEffect(() => {
    if (mapLoading || !mapRef.current) return;

    const mapParams = {
      stage,
      userLocation,
      pickupLocation,
      destinationLocation,
      driver,
    };

    const config = getMapRegionConfig(stage);
    if (config && shouldUpdateMapRegion(config, mapParams)) {
      try {
        updateMapRegion(mapRef.current, config, mapParams);
      } catch (error) {
        logError(`Map Region Update ${stage}`, error);
        Alert.alert("Error", "Failed to update map view.");
      }
    }
  }, [
    stage,
    mapLoading,
    userLocation,
    pickupLocation,
    destinationLocation,
    driver,
    mapRef,
  ]);
};
