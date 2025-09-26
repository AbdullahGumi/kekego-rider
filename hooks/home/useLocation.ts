import { CONFIG } from "@/constants/home";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAppStore } from "@/stores/useAppStore";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

export const useLocation = () => {
  const [geocodingLoading, setGeocodingLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { handleApiError, handleLocationError, clearError } = useErrorHandler();

  // Use global state instead of local state
  const userLocation = useAppStore((state) => state.userLocation);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const setPickupLocation = useAppStore((state) => state.setPickupLocation);

  const fetchLocation = useCallback(async () => {
    try {
      clearError("LOCATION_ERROR");
      setLocationError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        handleLocationError(new Error("Location permission denied"), {
          permissionStatus: status,
        });
        setLocationError(
          "Location access denied. Please enable location services to use the app."
        );
        setPickupLocation({
          address: "Location access required",
          coords: CONFIG.DEFAULT_COORDS,
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (!location?.coords) {
        throw new Error("Unable to get valid location coords");
      }

      setUserLocation(location);
      setPickupLocation({
        ...pickupLocation,
        coords: {
          latitude: String(location.coords.latitude),
          longitude: String(location.coords.longitude),
        },
      });

      clearError("LOCATION_ERROR");
    } catch (error: any) {
      handleLocationError(error, {
        retryCount,
        action: "fetchLocation",
      });

      const fallbackMessage =
        "Using default location. You can try again by restarting the app.";
      setLocationError(
        `${
          error?.message || "Location service unavailable"
        }. ${fallbackMessage}`
      );

      setPickupLocation({
        address: "Location unavailable - using default",
        coords: CONFIG.DEFAULT_COORDS,
      });

      // Increment retry count for potential retry logic
      setRetryCount((prev) => prev + 1);
    } finally {
      setGeocodingLoading(false);
    }
  }, [handleLocationError, clearError, retryCount]);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      setGeocodingLoading(true);
      try {
        // Check if API key is available
        if (!CONFIG.GOOGLE_MAPS_API_KEY) {
          throw new Error("Google Maps API key not configured");
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== "OK") {
          throw new Error(`Geocoding failed: ${data.status}`);
        }

        if (!data.results || data.results.length === 0) {
          throw new Error("No address found for these coords");
        }

        setPickupLocation({
          address: data.results[0].formatted_address || "Unknown Location",
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });

        clearError("API_ERROR");
      } catch (error: any) {
        // Handle different types of API errors
        handleApiError(error, {
          latitude,
          longitude,
          action: "reverseGeocode",
          retryCount,
          apiKeyConfigured: !!CONFIG.GOOGLE_MAPS_API_KEY,
        });

        let errorMessage = "Unable to fetch address";

        if (error?.message?.includes("REQUEST_DENIED")) {
          errorMessage =
            "Google Maps API access denied. Please check your API key configuration.";
        } else if (error?.message?.includes("OVER_QUERY_LIMIT")) {
          errorMessage = "API request limit exceeded. Please try again later.";
        } else if (error?.message?.includes("ZERO_RESULTS")) {
          errorMessage = "Address not found for your location.";
        } else if (error?.message?.includes("API key not configured")) {
          errorMessage =
            "Google Maps API key missing. Please configure your environment variables.";
        }

        setPickupLocation({
          address: errorMessage,
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });
      } finally {
        setGeocodingLoading(false);
      }
    },
    [handleApiError, clearError, retryCount]
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
