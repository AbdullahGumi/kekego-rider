import { KekeImage } from "@/assets/images/Index";
import { CONFIG } from "@/constants/home";
import { Driver } from "@/stores/useAppStore";
import { homeStyles } from "@/styles/home-styles";
import { LocationData } from "@/types/home";
import { Image } from "react-native";
import { Marker } from "react-native-maps";

interface MapMarkersProps {
  stage: string;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  driver: Driver | null;
  nearbyDrivers: Driver[];
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  stage,
  pickupLocation,
  destinationLocation,
  driver,
  nearbyDrivers,
}) => {
  return (
    <>
      {/* Nearby drivers markers (initial/input stages) */}
      {["initial", "input"].includes(stage) &&
        nearbyDrivers.map((nearbyDriver) => (
          <Marker
            key={nearbyDriver.id}
            coordinate={{
              latitude: nearbyDriver.location.latitude,
              longitude: nearbyDriver.location.longitude,
            }}
            title={nearbyDriver.name}
            description={`${nearbyDriver.vehicle.plateNumber}`}
            anchor={{ x: 0.5, y: 0 }}
          >
            <Image source={KekeImage} />
          </Marker>
        ))}

      {/* Pickup to destination markers (confirm/search stages) */}
      {["confirm", "search"].includes(stage) &&
        pickupLocation.coords.latitude &&
        destinationLocation.coords.latitude && (
          <>
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

      {/* Driver to pickup markers (paired stage) */}
      {stage === "paired" &&
        driver?.location &&
        pickupLocation.coords.latitude && (
          <>
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
                latitude: driver.location.latitude,
                longitude: driver.location.longitude,
              }}
              title={driver.name}
              description={`${driver.vehicle.plateNumber}`}
              rotation={driver.location.heading ?? 0}
              anchor={{ x: 0.5, y: 0 }}
            >
              <Image source={KekeImage} />
            </Marker>
          </>
        )}

      {/* Trip markers (arrived/trip/chat stages) */}
      {(stage === "arrived" || stage === "trip" || stage === "chat") &&
        driver?.location &&
        pickupLocation.coords.latitude &&
        destinationLocation.coords.latitude && (
          <>
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
                latitude: driver.location.latitude,
                longitude: driver.location.longitude,
              }}
              title={driver.name}
              description={`${driver.vehicle.plateNumber}`}
              rotation={driver.location.heading ?? 0}
              anchor={{ x: 0.5, y: 0 }}
            >
              <Image source={KekeImage} />
            </Marker>
          </>
        )}
    </>
  );
};
