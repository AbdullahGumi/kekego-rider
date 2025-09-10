import type { Driver, LocationData } from "@/types/home";
import { getMapRegionConfig, logError, shouldUpdateMapRegion, updateMapRegion } from "@/utility";
import type { RefObject } from "react";
import { useEffect } from "react";
import { Alert } from "react-native";
import MapView from "react-native-maps";

interface UseMapRegionManagerParams {
  stage: string;
  mapLoading: boolean;
  mapRef: RefObject<MapView | null>;
  userLocation: any;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  driver: Driver | null;
}

export const useMapRegionManager = ({
  stage,
  mapLoading,
  mapRef,
  userLocation,
  pickupLocation,
  destinationLocation,
  driver,
}: UseMapRegionManagerParams) => {
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
