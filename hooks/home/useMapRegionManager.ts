import { scale } from "@/constants/Layout";
import type { Driver, LocationData } from "@/types/home";
import { logError } from "@/utility";
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
  // Map region management for Initial and Input stages
  useEffect(() => {
    if (mapLoading || !mapRef.current) return;
    if ((stage === "initial" || stage === "input") && userLocation?.coords) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000
        );
      } catch (error) {
        logError("Map Region Update Initial/Input", error);
        Alert.alert("Error", "Failed to update map view.");
      }
    }
  }, [stage, userLocation, mapLoading]);

  // Map region management for Confirm and Search stages
  useEffect(() => {
    if (mapLoading || !mapRef.current) return;
    if (
      (stage === "confirm" || stage === "search") &&
      pickupLocation.coords.latitude &&
      destinationLocation.coords.latitude
    ) {
      try {
        mapRef.current.fitToCoordinates(
          [
            {
              latitude: Number(pickupLocation.coords.latitude),
              longitude: Number(pickupLocation.coords.longitude),
            },
            {
              latitude: Number(destinationLocation.coords.latitude),
              longitude: Number(destinationLocation.coords.longitude),
            },
          ],
          {
            edgePadding: {
              top: scale(100),
              right: scale(20),
              bottom: scale(200),
              left: scale(20),
            },
            animated: true,
          }
        );
      } catch (error) {
        logError("Map Region Update Confirm/Search", error);
        Alert.alert("Error", "Failed to update map view.");
      }
    }
  }, [stage, pickupLocation, destinationLocation, mapLoading]);

  // Map region management for Paired stage
  useEffect(() => {
    if (mapLoading || !mapRef.current) return;
    if (
      stage === "paired" &&
      driver?.coordinates &&
      pickupLocation.coords.latitude
    ) {
      try {
        mapRef.current.fitToCoordinates(
          [
            {
              latitude: driver.coordinates.latitude,
              longitude: driver.coordinates.longitude,
            },
            {
              latitude: Number(pickupLocation.coords.latitude),
              longitude: Number(pickupLocation.coords.longitude),
            },
          ],
          {
            edgePadding: {
              top: scale(100),
              right: scale(20),
              bottom: scale(200),
              left: scale(20),
            },
            animated: true,
          }
        );
      } catch (error) {
        logError("Map Region Update Paired", error);
        Alert.alert("Error", "Failed to update map view.");
      }
    }
  }, [stage, driver, pickupLocation, mapLoading]);

  // Map region management for Arrived stage
  useEffect(() => {
    if (mapLoading || !mapRef.current) return;
    if (
      stage === "arrived" &&
      driver?.coordinates &&
      pickupLocation.coords.latitude
    ) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude:
              (driver.coordinates.latitude +
                Number(pickupLocation.coords.latitude)) /
              2,
            longitude:
              (driver.coordinates.longitude +
                Number(pickupLocation.coords.longitude)) /
              2,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          },
          1000
        );
      } catch (error) {
        logError("Map Region Update Arrived", error);
        Alert.alert("Error", "Failed to update map view.");
      }
    }
  }, [stage, driver, pickupLocation, mapLoading]);

  // Map region management for Trip and Chat stages
  useEffect(() => {
    if (mapLoading || !mapRef.current) return;
    if (
      (stage === "trip" || stage === "chat") &&
      driver?.coordinates &&
      pickupLocation.coords.latitude &&
      destinationLocation.coords.latitude
    ) {
      try {
        mapRef.current.fitToCoordinates(
          [
            {
              latitude: driver.coordinates.latitude,
              longitude: driver.coordinates.longitude,
            },
            {
              latitude: Number(destinationLocation.coords.latitude),
              longitude: Number(destinationLocation.coords.longitude),
            },
          ],
          {
            edgePadding: {
              top: scale(100),
              right: scale(20),
              bottom: scale(200),
              left: scale(20),
            },
            animated: true,
          }
        );
      } catch (error) {
        logError("Map Region Update Trip/Chat", error);
        Alert.alert("Error", "Failed to update map view.");
      }
    }
  }, [stage, driver, pickupLocation, destinationLocation, mapLoading]);
};
