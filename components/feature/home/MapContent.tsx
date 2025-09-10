import { Driver, LocationData } from "@/types/home";
import { MapDirections } from "./MapDirections";
import { MapMarkers } from "./MapMarkers";

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
