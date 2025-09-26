import { scale } from "@/constants/Layout";
import { Driver } from "@/stores/useAppStore";
import type { LocationData } from "@/types/home";

export interface MapRegionConfiguration {
  condition: (params: any) => boolean;
  action: (mapView: any, params: any) => void;
}

export interface MapRegionParams {
  stage: string;
  userLocation: any;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  driver: Driver | null;
}

// Configuration object for different map region strategies per stage
export const STAGE_CONFIGS: Record<string, MapRegionConfiguration> = {
  initial: {
    condition: ({ userLocation }) =>
      !!(userLocation?.coords?.latitude && userLocation?.coords?.longitude),
    action: (mapView: any, { userLocation }) => {
      mapView.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    },
  },
  input: {
    condition: ({ userLocation }) =>
      !!(userLocation?.coords?.latitude && userLocation?.coords?.longitude),
    action: (mapView: any, { userLocation }) => {
      mapView.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    },
  },
  confirm: {
    condition: ({ pickupLocation, destinationLocation }) =>
      !!(pickupLocation.coords.latitude && destinationLocation.coords.latitude),
    action: (mapView: any, { pickupLocation, destinationLocation }) => {
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
    },
  },
  search: {
    condition: ({ pickupLocation, destinationLocation }) =>
      !!(pickupLocation.coords.latitude && destinationLocation.coords.latitude),
    action: (mapView: any, { pickupLocation, destinationLocation }) => {
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
    },
  },
  paired: {
    condition: ({ driver, pickupLocation }) =>
      !!(driver?.location && pickupLocation.coords.latitude),
    action: (mapView: any, { driver, pickupLocation }) => {
      mapView.fitToCoordinates(
        [
          {
            latitude: driver!.location.latitude,
            longitude: driver!.location.longitude,
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
    },
  },
  arrived: {
    condition: ({ driver, pickupLocation }) =>
      !!(driver?.coords && pickupLocation.coords.latitude),
    action: (mapView: any, { driver, pickupLocation }) => {
      const pickupLat = Number(pickupLocation.coords.latitude);
      const pickupLng = Number(pickupLocation.coords.longitude);
      const driverLat = driver!.location.latitude;
      const driverLng = driver!.location.longitude;

      mapView.animateToRegion(
        {
          latitude: (driverLat + pickupLat) / 2,
          longitude: (driverLng + pickupLng) / 2,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000
      );
    },
  },
  trip: {
    condition: ({ driver, pickupLocation, destinationLocation }) =>
      !!(
        driver?.location &&
        pickupLocation.coords.latitude &&
        destinationLocation.coords.latitude
      ),
    action: (mapView: any, { driver, destinationLocation }) => {
      mapView.fitToCoordinates(
        [
          {
            latitude: driver!.location.latitude,
            longitude: driver!.location.longitude,
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
    },
  },
  chat: {
    condition: ({ driver, pickupLocation, destinationLocation }) =>
      !!(
        driver?.location &&
        pickupLocation.coords.latitude &&
        destinationLocation.coords.latitude
      ),
    action: (mapView: any, { driver, destinationLocation }) => {
      mapView.fitToCoordinates(
        [
          {
            latitude: driver!.location.latitude,
            longitude: driver!.location.longitude,
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
    },
  },
};

/**
 * Get the appropriate map region configuration for a given stage
 */
export const getMapRegionConfig = (
  stage: string
): MapRegionConfiguration | null => {
  return STAGE_CONFIGS[stage] || null;
};

/**
 * Check if a map region should be updated for the given parameters
 */
export const shouldUpdateMapRegion = (
  config: MapRegionConfiguration,
  params: MapRegionParams
): boolean => {
  return config.condition(params);
};

/**
 * Apply map region update for the given stage and parameters
 */
export const updateMapRegion = (
  mapView: any,
  config: MapRegionConfiguration,
  params: MapRegionParams
): void => {
  config.action(mapView, params);
};
