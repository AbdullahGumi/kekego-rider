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

// Configuration object for different map region strategies per stage
const STAGE_CONFIGS: Record<string, {
  condition: (params: any) => boolean,
  action: (mapView: MapView, params: any) => void,
}> = {
  initial: {
    condition: ({ userLocation }) => !!(userLocation?.coords?.latitude && userLocation?.coords?.longitude),
    action: (mapView: MapView, { userLocation }) => {
      mapView.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  },
  input: {
    condition: ({ userLocation }) => !!(userLocation?.coords?.latitude && userLocation?.coords?.longitude),
    action: (mapView: MapView, { userLocation }) => {
      mapView.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  },
  confirm: {
    condition: ({ pickupLocation, destinationLocation }) =>
      !!(pickupLocation.coords.latitude && destinationLocation.coords.latitude),
    action: (mapView: MapView, { pickupLocation, destinationLocation }) => {
      mapView.fitToCoordinates(
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
    }
  },
  search: {
    condition: ({ pickupLocation, destinationLocation }) =>
      !!(pickupLocation.coords.latitude && destinationLocation.coords.latitude),
    action: (mapView: MapView, { pickupLocation, destinationLocation }) => {
      mapView.fitToCoordinates(
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
    }
  },
  paired: {
    condition: ({ driver, pickupLocation }) =>
      !!(driver?.coordinates && pickupLocation.coords.latitude),
    action: (mapView: MapView, { driver, pickupLocation }) => {
      mapView.fitToCoordinates(
        [
          {
            latitude: driver!.coordinates.latitude,
            longitude: driver!.coordinates.longitude,
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
    }
  },
  arrived: {
    condition: ({ driver, pickupLocation }) =>
      !!(driver?.coordinates && pickupLocation.coords.latitude),
    action: (mapView: MapView, { driver, pickupLocation }) => {
      const pickupLat = Number(pickupLocation.coords.latitude);
      const pickupLng = Number(pickupLocation.coords.longitude);
      const driverLat = driver!.coordinates.latitude;
      const driverLng = driver!.coordinates.longitude;

      mapView.animateToRegion(
        {
          latitude: (driverLat + pickupLat) / 2,
          longitude: (driverLng + pickupLng) / 2,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000
      );
    }
  },
  trip: {
    condition: ({ driver, pickupLocation, destinationLocation }) =>
      !!(driver?.coordinates && pickupLocation.coords.latitude && destinationLocation.coords.latitude),
    action: (mapView: MapView, { driver, destinationLocation }) => {
      mapView.fitToCoordinates(
        [
          {
            latitude: driver!.coordinates.latitude,
            longitude: driver!.coordinates.longitude,
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
    }
  },
  chat: {
    condition: ({ driver, pickupLocation, destinationLocation }) =>
      !!(driver?.coordinates && pickupLocation.coords.latitude && destinationLocation.coords.latitude),
    action: (mapView: MapView, { driver, destinationLocation }) => {
      mapView.fitToCoordinates(
        [
          {
            latitude: driver!.coordinates.latitude,
            longitude: driver!.coordinates.longitude,
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
    }
  }
};

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

    const stageConfig = STAGE_CONFIGS[stage];
    if (stageConfig && stageConfig.condition({
      driver,
      pickupLocation,
      destinationLocation,
      userLocation
    })) {
      try {
        stageConfig.action(mapRef.current, {
          driver,
          pickupLocation,
          destinationLocation,
          userLocation,
        });
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
  ]);
};
