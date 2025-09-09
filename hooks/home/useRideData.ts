import { useCallback, useState } from "react";

interface RideData {
  destinationDistance: number;
  destinationDuration: number;
  fare: number | null;
  tripDuration: number | null;
}

export const useRideData = () => {
  const [destinationDistance, setDestinationDistance] = useState(0);
  const [destinationDuration, setDestinationDuration] = useState(0);
  const [fare, setFare] = useState<number | null>(null);
  const [tripDuration, setTripDuration] = useState<number | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);

  const updateRideData = useCallback((updates: Partial<RideData>) => {
    if (updates.destinationDistance !== undefined) {
      setDestinationDistance(updates.destinationDistance);
    }
    if (updates.destinationDuration !== undefined) {
      setDestinationDuration(updates.destinationDuration);
    }
    if (updates.fare !== undefined) {
      setFare(updates.fare);
    }
    if (updates.tripDuration !== undefined) {
      setTripDuration(updates.tripDuration);
    }
  }, []);

  const resetRideData = useCallback(() => {
    setDestinationDistance(0);
    setDestinationDuration(0);
    setFare(null);
    setTripDuration(null);
    setRideId(null);
  }, []);

  return {
    destinationDistance,
    setDestinationDistance,
    destinationDuration,
    setDestinationDuration,
    fare,
    setFare,
    tripDuration,
    setTripDuration,
    rideId,
    setRideId,
    updateRideData,
    resetRideData,
  };
};
