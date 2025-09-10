import { useAppStore } from "@/stores/useAppStore";
import type { LocationData, RecentDestination } from "@/types/home";
import { logError } from "@/utility";
import { useCallback } from "react";
import { Alert } from "react-native";

interface UseRideFlowOptions {
  bottomSheetRef: React.RefObject<{ snapToIndex: (index: number) => void; current?: any } | null>;
}

export const useRideFlow = ({ bottomSheetRef }: UseRideFlowOptions) => {
  // Get store state and actions
  const {
    rideState,
    setRideStage,
    setDriver,
    setEta,
    setFare,
    setTripDuration,
    setRideId,
    setDestinationLocation, 
  } = useAppStore();

  // Extract values for easier access
  const stage = rideState.stage;
  const eta = rideState.eta;
  const driver = rideState.driver;

  // Stage transition handlers
  const handleWhereTo = useCallback(() => {
    try {
      setRideStage("input");
      bottomSheetRef.current?.snapToIndex(1);
    } catch (error) {
      logError("Handle Where To", error);
      Alert.alert("Error", "Failed to open destination input.");
    }
  }, [setRideStage, bottomSheetRef]);

  const handleSelectRecentDestination = useCallback(
    (destination: RecentDestination) => {
      try {
        setDestinationLocation(destination);
        setRideStage("confirm");
        bottomSheetRef.current?.snapToIndex(2);
      } catch (error) {
        logError("Select Recent Destination", error);
        Alert.alert("Error", "Failed to select destination.");
      }
    },
    [setDestinationLocation, setRideStage, bottomSheetRef]
  );

  const handleDestinationSelected = useCallback(
    (destination: LocationData) => {
      try {
        if (
          !destination.address ||
          !destination.coords.latitude ||
          !destination.coords.longitude
        ) {
          throw new Error("Invalid destination data");
        }
        setDestinationLocation(destination);
        setRideStage("confirm");
        bottomSheetRef.current?.snapToIndex(2);
      } catch (error) {
        logError("Destination Selected", error);
        Alert.alert("Error", "Invalid destination selected.");
      }
    },
    [setDestinationLocation, setRideStage, bottomSheetRef]
  );

  const handleBack = useCallback(
    (geocodingLoading: boolean = false) => {
      try {
        if (geocodingLoading) {
          // Don't allow navigation while geocoding is in progress
          return;
        }

        if (stage === "input") {
          setRideStage("initial");
          setDestinationLocation({
            address: "",
            coords: { latitude: "", longitude: "" },
          });
          bottomSheetRef.current?.snapToIndex(0);
        } else if (stage === "confirm") {
          setRideStage("input");
          bottomSheetRef.current?.snapToIndex(1);
        } else if (stage === "chat") {
          // Handle chat stage back navigation based on driver state and ETA
          setRideStage(driver ? (eta ? "trip" : "arrived") : "paired");
          bottomSheetRef.current?.snapToIndex(2);
        }
      } catch (error) {
        logError("Handle Back", error);
        Alert.alert("Error", "Failed to navigate back.");
      }
    },
    [stage, driver, eta, setRideStage, setDestinationLocation, bottomSheetRef]
  );

  const handleOpenChat = useCallback(() => {
    try {
      setRideStage("chat");
      bottomSheetRef.current?.snapToIndex(3);
    } catch (error) {
      logError("Handle Open Chat", error);
      Alert.alert("Error", "Failed to open chat.");
    }
  }, [setRideStage, bottomSheetRef]);

  const resetRideState = useCallback(() => {
    setRideStage("initial");
    setDestinationLocation({
      address: "",
      coords: { latitude: "", longitude: "" },
    });
    setDriver(null);
    setRideId(null);
    setEta("");
    setFare(null);
    setTripDuration(null);
  }, [
    setRideStage,
    setDestinationLocation,
    setDriver,
    setRideId,
    setEta,
    setFare,
    setTripDuration,
  ]);

  return {
    // Current state
    stage,
    eta,
    driver,

    // Actions
    handleWhereTo,
    handleSelectRecentDestination,
    handleDestinationSelected,
    handleBack,
    handleOpenChat,
    resetRideState,

    // Advanced stage control
    transitionToStage: setRideStage,
  };
};
