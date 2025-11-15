import { riderApi } from "@/api/endpoints/rider";
import { COLORS } from "@/constants/Colors";
import { Driver, useAppStore } from "@/stores/useAppStore";
import { LocationData } from "@/types/home";
import { logError } from "@/utility";
import { Alert, Platform } from "react-native";
import { Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

interface MapDirectionsProps {
  stage: string;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  driver: Driver | null;
  onDirectionReady: (result: any) => void;
  onDirectionError: (error: any) => void;
}

// Geographic utility functions for route trimming algorithm
const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const projectPointOntoSegment = (
  driverLat: number,
  driverLng: number,
  segmentStartLat: number,
  segmentStartLng: number,
  segmentEndLat: number,
  segmentEndLng: number
): [number, number] => {
  const x1 = segmentStartLat;
  const y1 = segmentStartLng;
  const x2 = segmentEndLat;
  const y2 = segmentEndLng;
  const x0 = driverLat;
  const y0 = driverLng;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Handle zero-length segments
  if (dx === 0 && dy === 0) {
    return [x1, y1];
  }

  const t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
  const t_clamped = Math.max(0, Math.min(1, t));

  const closestLat = x1 + t_clamped * dx;
  const closestLng = y1 + t_clamped * dy;

  return [closestLat, closestLng];
};

const getRemainingRoute = (
  driverLat: number,
  driverLng: number,
  routeCoordinates: { latitude: number; longitude: number }[]
): { latitude: number; longitude: number }[] => {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return [{ latitude: driverLat, longitude: driverLng }];
  }

  let closestDistance = Infinity;
  let closestSegmentIndex = 0;
  let projectionPoint: [number, number] = [driverLat, driverLng];

  // Find the closest segment to the driver
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segmentStart = routeCoordinates[i];
    const segmentEnd = routeCoordinates[i + 1];

    const [projLat, projLng] = projectPointOntoSegment(
      driverLat,
      driverLng,
      segmentStart.latitude,
      segmentStart.longitude,
      segmentEnd.latitude,
      segmentEnd.longitude
    );

    const distance = haversineDistance(driverLat, driverLng, projLat, projLng);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSegmentIndex = i;
      projectionPoint = [projLat, projLng];
    }
  }

  // Find the best insertion point (closest segment endpoint towards destination)
  const remainingCoordinates = routeCoordinates.slice(closestSegmentIndex);

  // Start from projection point on route for smooth visuals (not raw GPS)
  const result = [
    {
      latitude: projectionPoint[0],
      longitude: projectionPoint[1],
    },
  ];

  // Add remaining route coordinates from correct segment onward
  for (const coord of remainingCoordinates) {
    result.push({
      latitude: coord.latitude,
      longitude: coord.longitude,
    });
  }

  return result;
};

export const MapDirections: React.FC<MapDirectionsProps> = ({
  stage,
  pickupLocation,
  destinationLocation,
  driver,
  onDirectionReady,
  onDirectionError,
}) => {
  const { pickupDirections, destinationDirections } = useAppStore();
  // Route from pickup to destination (confirm/search stages)
  if (
    ["confirm", "search"].includes(stage) &&
    pickupLocation.coords.latitude &&
    destinationLocation.coords.latitude
  ) {
    return (
      <MapViewDirections
        origin={{
          latitude: Number(pickupLocation.coords.latitude),
          longitude: Number(pickupLocation.coords.longitude),
        }}
        destination={{
          latitude: Number(destinationLocation.coords.latitude),
          longitude: Number(destinationLocation.coords.longitude),
        }}
        apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        strokeWidth={Platform.OS === "android" ? 3 : 4}
        strokeColor={COLORS.primary}
        onReady={async (result) => {
          try {
            onDirectionReady(result);
            // Calculate fare for pickup to destination route
            const response = await riderApi.calculateFare({
              distanceInKm: result.distance,
              durationInMinutes: result.duration,
            });
            if (
              !response.data?.data.estimatedFare ||
              !response.data?.data.durationInMinutes
            ) {
              throw new Error("Invalid fare response");
            }
            onDirectionReady({
              ...result,
              estimatedFare: response.data.data.estimatedFare,
              tripDuration: response.data.data.durationInMinutes,
            });
          } catch (error) {
            logError("MapViewDirections onReady", error);
            Alert.alert("Error", "Unable to calculate fare. Please try again.");
            onDirectionReady(result);
          }
        }}
        onError={(error) => {
          logError("MapViewDirections", error);
          Alert.alert("Error", "Failed to load directions.");
          onDirectionError(error);
        }}
      />
    );
  }

  // Route from driver to pickup (paired stage)
  if (
    stage === "paired" &&
    driver?.location?.latitude &&
    driver?.location?.longitude &&
    pickupDirections
  ) {
    return (
      <Polyline
        coordinates={getRemainingRoute(
          driver.location.latitude,
          driver.location.longitude,
          pickupDirections.coordinates
        )}
        strokeWidth={3}
        strokeColor={COLORS.primary}
      />
    );
  }

  // Route from driver to destination (arrived/trip/chat stages)
  if (
    (stage === "arrived" || stage === "trip" || stage === "chat") &&
    driver?.location?.latitude &&
    driver?.location?.longitude &&
    destinationDirections
  ) {
    return (
      <Polyline
        coordinates={getRemainingRoute(
          driver.location.latitude,
          driver.location.longitude,
          destinationDirections.coordinates
        )}
        strokeWidth={3}
        strokeColor={COLORS.primary}
      />
    );
  }

  return null;
};
