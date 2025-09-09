import { CONFIG } from "@/constants/home";
import { LocationData } from "@/types/home";
import { logError } from "@/utility";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

export const useLocation = () => {
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationData>({
    address: "",
    coords: CONFIG.DEFAULT_COORDS,
  });
  const [geocodingLoading, setGeocodingLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (!location?.coords) {
        throw new Error("Invalid location data");
      }
      setUserLocation(location);
      setPickupLocation((prev) => ({
        ...prev,
        coords: {
          latitude: String(location.coords.latitude),
          longitude: String(location.coords.longitude),
        },
      }));
    } catch (error) {
      logError("Fetch Location", error);
      setLocationError("Failed to fetch location. Using default location.");
      setPickupLocation({ address: "", coords: CONFIG.DEFAULT_COORDS });
    } finally {
      setGeocodingLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      setGeocodingLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`
        );
        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.status !== "OK") {
          throw new Error(`Geocoding failed: ${data.status}`);
        }
        setPickupLocation({
          address: data.results?.[0]?.formatted_address || "Unknown Location",
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });
      } catch (error) {
        logError("Reverse Geocode", error);
        setPickupLocation({
          address: "Unable to fetch address",
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });
      } finally {
        setGeocodingLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (userLocation?.coords) {
      reverseGeocode(
        userLocation.coords.latitude,
        userLocation.coords.longitude
      );
    }
  }, [userLocation?.coords, reverseGeocode]);

  return {
    userLocation,
    pickupLocation,
    setPickupLocation,
    geocodingLoading,
    locationError,
  };
};
