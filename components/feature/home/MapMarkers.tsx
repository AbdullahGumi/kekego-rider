import { KekeImage } from "@/assets/images/Index";
import { CONFIG } from "@/constants/home";
import { homeStyles } from "@/styles/home-styles";
import { Driver, LocationData } from "@/types/home";
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
              latitude: nearbyDriver.coordinates.latitude,
              longitude: nearbyDriver.coordinates.longitude,
            }}
            title={nearbyDriver.name}
            description={`${nearbyDriver.vehicle} • ${nearbyDriver.vehicleNumber}`}
          >
            <Image source={KekeImage} style={homeStyles.tricycleMarker} />
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
        driver?.coordinates &&
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

      {/* Trip markers (arrived/trip/chat stages) */}
      {(stage === "arrived" || stage === "trip" || stage === "chat") &&
        driver?.coordinates &&
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
    </>
  );
};
