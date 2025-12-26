import { CONFIG } from "@/constants/home";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAppStore } from "@/stores/useAppStore";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

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

  // Use ref to prevent dependency issues
  const isReverseGeocodingRef = useRef(false);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      // Prevent concurrent reverse geocoding calls
      if (isReverseGeocodingRef.current) return;

      isReverseGeocodingRef.current = true;
      setGeocodingLoading(true);
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (addresses.length > 0) {
          const address = addresses[0];
          // Create a formatted address from available components
          const formattedAddress =
            [
              address.streetNumber && address.street
                ? `${address.streetNumber} ${address.street}`
                : address.street,
              address.city,
              address.region,
              address.country,
            ]
              .filter(Boolean)
              .join(", ") || "Unknown Location";

          setPickupLocation({
            address: formattedAddress,
            coords: {
              latitude: String(latitude),
              longitude: String(longitude),
            },
          });

          clearError("LOCATION_ERROR");
        } else {
          throw new Error("No address found for these coordinates");
        }
      } catch (error: any) {
        handleLocationError(error, {
          latitude,
          longitude,
          action: "reverseGeocode",
          retryCount,
        });

        let errorMessage = "Unable to fetch address";

        if (error?.message?.includes("Location permission not granted")) {
          errorMessage =
            "Location services permission needed for address lookup.";
        } else if (error?.message?.includes("Network")) {
          errorMessage =
            "Network error while getting address. Please check connection.";
        } else if (error?.message?.includes("No address found")) {
          errorMessage = "Address not found for your location.";
        }

        setPickupLocation({
          address: errorMessage,
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });
      } finally {
        setGeocodingLoading(false);
        isReverseGeocodingRef.current = false;
      }
    },
    [handleLocationError, clearError, retryCount, setPickupLocation]
  );

  // Main effect to watch location
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startWatchingLocation = async () => {
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
          setGeocodingLoading(false);
          return;
        }

        // Start watching position with continuous updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or when moved 10 meters
          },
          (location) => {
            if (location?.coords) {
              setUserLocation(location);

              // Update pickup location coordinates immediately
              setPickupLocation({
                address: pickupLocation.address || "Fetching address...",
                coords: {
                  latitude: String(location.coords.latitude),
                  longitude: String(location.coords.longitude),
                },
              });

              // Reverse geocode to get updated address
              reverseGeocode(
                location.coords.latitude,
                location.coords.longitude
              );
            }
          }
        );

        clearError("LOCATION_ERROR");
      } catch (error: any) {
        handleLocationError(error, {
          retryCount,
          action: "watchLocation",
        });

        const fallbackMessage =
          "Using default location. You can try again by restarting the app.";
        setLocationError(
          `${error?.message || "Location service unavailable"
          }. ${fallbackMessage}`
        );

        setPickupLocation({
          address: "Location unavailable - using default",
          coords: CONFIG.DEFAULT_COORDS,
        });

        setRetryCount((prev) => prev + 1);
        setGeocodingLoading(false);
      }
    };

    startWatchingLocation();

    // Cleanup: stop watching location on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [handleLocationError, clearError, setUserLocation, setPickupLocation, reverseGeocode, retryCount]);

  return {
    userLocation,
    pickupLocation,
    setPickupLocation,
    geocodingLoading,
    locationError,
  };
};
