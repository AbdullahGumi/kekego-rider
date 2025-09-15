import { riderApi } from "@/api/endpoints/rider";
import { CONFIG } from "@/constants/home";
import { Driver } from "@/stores/useAppStore";
import { logError } from "@/utility";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const useNearbyDrivers = (
  userLocation: Location.LocationObject | null
) => {
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (!userLocation?.coords) return;
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
          name: driver.name || "Unknown Driver",
          vehicle: driver.vehicle?.model || "Tricycle",
          vehicleNumber: driver.vehicle?.plateNumber || "N/A",
          coordinates: {
            latitude:
              driver.coordinates?.latitude ||
              Number(CONFIG.DEFAULT_COORDS.latitude),
            longitude:
              driver.coordinates?.longitude ||
              Number(CONFIG.DEFAULT_COORDS.longitude),
          },
          profilePicture: driver.profilePicture || CONFIG.MARKER_ICONS.user,
          rating: driver.rating || 4.5,
          phone: driver.phone || "",
        }));
        setNearbyDrivers(drivers);
      } catch (error) {
        logError("Fetch Nearby Drivers", error);
        setNearbyDrivers([]);
      }
    };
    fetchNearbyDrivers();
  }, [userLocation?.coords]);

  return nearbyDrivers;
};
