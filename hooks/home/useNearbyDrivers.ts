import { riderApi } from "@/api/endpoints/rider";
import { Driver, useAppStore } from "@/stores/useAppStore";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useNearbyDrivers = (
  userLocation: Location.LocationObject | null
) => {
  const { stage } = useAppStore((state) => state.rideState);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (!userLocation?.coords || stage !== "initial") return;
    const fetchNearbyDrivers = async () => {
      try {
        const res = await riderApi.getNearbyDrivers({
          coords: {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          },
        });
        const drivers: Driver[] = res.data.data.drivers.map((driver: any) => ({
          id: driver.id || `driver-${Math.random()}`,
          location: {
            latitude: driver.coords?.latitude,
            longitude: driver.coords?.longitude,
          }, 
        }));
        setNearbyDrivers(drivers);
      } catch (error: any) {
        console.log("Fetch Nearby Drivers", error.response?.data);
        setNearbyDrivers([]);
      }
    };
    fetchNearbyDrivers();
    const interval = setInterval(() => fetchNearbyDrivers(), 30000);
    return () => clearInterval(interval);
  }, [userLocation?.coords, stage]);

  return nearbyDrivers;
};
