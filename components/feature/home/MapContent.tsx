import { useNearbyDrivers } from "@/hooks/home/useNearbyDrivers";
import { useAppStore } from "@/stores/useAppStore";
import { MapDirections } from "./MapDirections";
import { MapMarkers } from "./MapMarkers";

const MapContent = () => {
  const rideState = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const userLocation = useAppStore((state) => state.userLocation);
  const nearbyDrivers = useNearbyDrivers(userLocation);

  const {
    setDestinationDistance,
    setDestinationDuration,
    setFare,
    setTripDuration,
    setEta,
  } = useAppStore();

  const { stage, driver } = rideState;

  // Handler for direction calculations and fare calculation
  const handleDirectionReady = (result: any) => {
    if (result.estimatedFare !== undefined) {
      setFare(result.estimatedFare);
      setTripDuration(result.tripDuration);
    }
    if (result.eta !== undefined) {
      setEta(result.eta);
    }
    // Always update distance/duration
    if (result.distance !== undefined) {
      setDestinationDistance(result.distance);
      setDestinationDuration(result.duration);
    }
  };

  // Handler for direction errors
  const handleDirectionError = (error: any) => {
    // Error handled within MapDirections component
  };

  return (
    <>
      <MapDirections
        stage={stage}
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        driver={driver}
        onDirectionReady={handleDirectionReady}
        onDirectionError={handleDirectionError}
      />
      <MapMarkers
        stage={stage}
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        driver={driver}
        nearbyDrivers={nearbyDrivers}
      />
    </>
  );
};

export default MapContent;
