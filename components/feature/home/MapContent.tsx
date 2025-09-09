import { riderApi } from "@/api/endpoints/rider";
import { KekeImage } from "@/assets/images/Index";
import { COLORS } from "@/constants/Colors";
import { CONFIG } from "@/constants/home";
import { homeStyles } from "@/styles/home-styles";
import { Driver, LocationData } from "@/types/home";
import { logError } from "@/utility";
import { Alert, Image, Platform } from "react-native";
import { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

interface MapContentProps {
  stage: string;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  driver: Driver | null;
  nearbyDrivers: Driver[];
  setDestinationDistance: (distance: number) => void;
  setDestinationDuration: (duration: number) => void;
  setFare: (fare: number | null) => void;
  setTripDuration: (duration: number | null) => void;
  setEta: (eta: string) => void;
}

const MapContent: React.FC<MapContentProps> = ({
  stage,
  pickupLocation,
  destinationLocation,
  driver,
  nearbyDrivers,
  setDestinationDistance,
  setDestinationDuration,
  setFare,
  setTripDuration,
  setEta,
}) => {
  return (
    <>
      {["confirm", "search"].includes(stage) &&
        pickupLocation.coords.latitude &&
        destinationLocation.coords.latitude && (
          <>
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
                  setDestinationDistance(result.distance);
                  setDestinationDuration(result.duration);
                  const response = await riderApi.calculateFare({
                    distanceInKm: result.distance,
                    durationInMinutes: result.duration,
                    promoCode: "",
                  });
                  if (
                    !response.data?.estimatedFare ||
                    !response.data?.durationInMinutes
                  ) {
                    throw new Error("Invalid fare response");
                  }
                  setFare(response.data.estimatedFare);
                  setTripDuration(response.data.durationInMinutes);
                } catch (error) {
                  logError("MapViewDirections onReady", error);
                  Alert.alert(
                    "Error",
                    "Unable to calculate fare. Please try again."
                  );
                  setFare(null);
                  setTripDuration(null);
                }
              }}
              onError={(error) => {
                logError("MapViewDirections", error);
                Alert.alert("Error", "Failed to load directions.");
              }}
            />
            <Marker
              coordinate={{
                latitude: Number(pickupLocation.coords.latitude),
                longitude: Number(pickupLocation.coords.longitude),
              }}
              title="Pickup Location"
            >
              <Image
                source={{ uri: CONFIG.MARKER_ICONS.pickup }}
                style={homeStyles.markerIcon}
              />
            </Marker>
            <Marker
              coordinate={{
                latitude: Number(destinationLocation.coords.latitude),
                longitude: Number(destinationLocation.coords.longitude),
              }}
              title="Destination"
            >
              <Image
                source={{ uri: CONFIG.MARKER_ICONS.destination }}
                style={homeStyles.markerIcon}
              />
            </Marker>
          </>
        )}

      {stage === "paired" &&
        driver?.coordinates &&
        pickupLocation.coords.latitude && (
          <>
            <MapViewDirections
              origin={{
                latitude: driver.coordinates.latitude,
                longitude: driver.coordinates.longitude,
              }}
              destination={{
                latitude: Number(pickupLocation.coords.latitude),
                longitude: Number(pickupLocation.coords.longitude),
              }}
              apikey={CONFIG.GOOGLE_MAPS_API_KEY}
              strokeWidth={Platform.OS === "android" ? 3 : 4}
              strokeColor={COLORS.primary}
              onReady={(result) => {
                setEta(`${Math.ceil(result.duration)} min`);
              }}
              onError={(error) => {
                logError("MapViewDirections Paired", error);
                Alert.alert("Error", "Failed to load driver directions.");
              }}
            />
            <Marker
              coordinate={{
                latitude: Number(pickupLocation.coords.latitude),
                longitude: Number(pickupLocation.coords.longitude),
              }}
              title="Pickup Location"
            >
              <Image
                source={{ uri: CONFIG.MARKER_ICONS.pickup }}
                style={homeStyles.markerIcon}
              />
            </Marker>
            <Marker
              coordinate={{
                latitude: driver.coordinates.latitude,
                longitude: driver.coordinates.longitude,
              }}
              title={driver.name}
              description={`${driver.vehicle} • ${driver.vehicleNumber}`}
            >
              <Image source={KekeImage} style={homeStyles.tricycleMarker} />
            </Marker>
          </>
        )}

      {(stage === "arrived" || stage === "trip" || stage === "chat") &&
        driver?.coordinates &&
        pickupLocation.coords.latitude &&
        destinationLocation.coords.latitude && (
          <>
            <MapViewDirections
              origin={{
                latitude: driver.coordinates.latitude,
                longitude: driver.coordinates.longitude,
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
                  setEta(`${Math.ceil(result.duration)} min`);
                }
              }}
              onError={(error) => {
                logError("MapViewDirections Trip", error);
                Alert.alert("Error", "Failed to load trip directions.");
              }}
            />
            <Marker
              coordinate={{
                latitude: Number(pickupLocation.coords.latitude),
                longitude: Number(pickupLocation.coords.longitude),
              }}
              title="Pickup Location"
            >
              <Image
                source={{ uri: CONFIG.MARKER_ICONS.pickup }}
                style={homeStyles.markerIcon}
              />
            </Marker>
            <Marker
              coordinate={{
                latitude: Number(destinationLocation.coords.latitude),
                longitude: Number(destinationLocation.coords.longitude),
              }}
              title="Destination"
            >
              <Image
                source={{ uri: CONFIG.MARKER_ICONS.destination }}
                style={homeStyles.markerIcon}
              />
            </Marker>
            <Marker
              coordinate={{
                latitude: driver.coordinates.latitude,
                longitude: driver.coordinates.longitude,
              }}
              title={driver.name}
              description={`${driver.vehicle} • ${driver.vehicleNumber}`}
            >
              <Image source={KekeImage} style={homeStyles.tricycleMarker} />
            </Marker>
          </>
        )}

      {["initial", "input"].includes(stage) &&
        nearbyDrivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={{
              latitude: driver.coordinates.latitude,
              longitude: driver.coordinates.longitude,
            }}
            title={driver.name}
            description={`${driver.vehicle} • ${driver.vehicleNumber}`}
          >
            <Image source={KekeImage} style={homeStyles.tricycleMarker} />
          </Marker>
        ))}
    </>
  );
};

export default MapContent;
