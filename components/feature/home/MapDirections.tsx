import { riderApi } from "@/api/endpoints/rider";
import { COLORS } from "@/constants/Colors";
import { CONFIG } from "@/constants/home";
import { Driver } from "@/stores/useAppStore";
import { LocationData } from "@/types/home";
import { logError } from "@/utility";
import { Alert, Platform } from "react-native";
import MapViewDirections from "react-native-maps-directions";

interface MapDirectionsProps {
  stage: string;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  driver: Driver | null;
  onDirectionReady: (result: any) => void;
  onDirectionError: (error: any) => void;
}

export const MapDirections: React.FC<MapDirectionsProps> = ({
  stage,
  pickupLocation,
  destinationLocation,
  driver,
  onDirectionReady,
  onDirectionError,
}) => {
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
        apikey={CONFIG.GOOGLE_MAPS_API_KEY}
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
    driver?.location &&
    pickupLocation.coords.latitude
  ) {
    return (
      <MapViewDirections
        origin={{
          latitude: driver.location.latitude,
          longitude: driver.location.longitude,
        }}
        destination={{
          latitude: Number(pickupLocation.coords.latitude),
          longitude: Number(pickupLocation.coords.longitude),
        }}
        apikey={CONFIG.GOOGLE_MAPS_API_KEY}
        strokeWidth={Platform.OS === "android" ? 3 : 4}
        strokeColor={COLORS.primary}
        onReady={(result) => {
          onDirectionReady({
            ...result,
            eta: `${Math.ceil(result.duration)} min`,
          });
        }}
        onError={(error) => {
          logError("MapViewDirections Paired", error);
          Alert.alert("Error", "Failed to load driver directions.");
          onDirectionError(error);
        }}
      />
    );
  }

  // Route from driver to destination (arrived/trip/chat stages)
  if (
    (stage === "arrived" || stage === "trip" || stage === "chat") &&
    driver?.location &&
    pickupLocation.coords.latitude &&
    destinationLocation.coords.latitude
  ) {
    return (
      <MapViewDirections
        origin={{
          latitude: driver.location.latitude,
          longitude: driver.location.longitude,
        }}
        destination={{
          latitude: Number(destinationLocation.coords.latitude),
          longitude: Number(destinationLocation.coords.longitude),
        }}
        apikey={CONFIG.GOOGLE_MAPS_API_KEY}
        strokeWidth={Platform.OS === "android" ? 3 : 4}
        strokeColor={COLORS.primary}
        onReady={(result) => {
          if (stage !== "arrived") {
            onDirectionReady({
              ...result,
              eta: `${Math.ceil(result.duration)} min`,
            });
          } else {
            onDirectionReady(result);
          }
        }}
        onError={(error) => {
          console.log("error", error);
          // logError("MapViewDirections Trip", error);
          Alert.alert("Error", "Failed to load trip directions.");
          onDirectionError(error);
        }}
      />
    );
  }

  return null;
};
