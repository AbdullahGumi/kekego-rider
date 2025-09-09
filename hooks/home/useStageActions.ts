import type { LocationData, RecentDestination, RideStage } from "@/types/home";
import { logError } from "@/utility";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Alert } from "react-native";

interface UseStageActionsParams {
  setPickupLocation: (location: LocationData) => void;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  setDestinationLocation: (location: LocationData) => void;
  bottomSheetRef: React.RefObject<{ snapToIndex: (index: number) => void; current?: any } | null>;
  geocodingLoading: boolean;
  currentStage?: RideStage;
  driver?: { coordinates?: { latitude: number; longitude: number } } | null;
  eta?: string;
}

interface StageActions {
  handleWhereTo: () => void;
  handleSelectRecentDestination: (destination: RecentDestination) => void;
  handleDestinationSelected: (destination: LocationData) => void;
  handleBack: () => void;
  centerMapOnUser: (userLocation: any) => void;
  handleCall: () => void;
  handleOpenChat: () => void;
  setStage: (stage: RideStage) => void;
  injectSetStage: (stageSetter: (stage: RideStage) => void) => void;
}

export const useStageActions = ({
  setPickupLocation,
  pickupLocation,
  destinationLocation,
  setDestinationLocation,
  bottomSheetRef,
  geocodingLoading,
  currentStage = "initial",
  driver,
  eta = "",
}: UseStageActionsParams): StageActions => {
  // This will be set by the parent component
  let setStage: (stage: RideStage) => void = () => {};

  // Method to inject setStage from parent component
  const injectSetStage = (stageSetter: (stage: RideStage) => void) => {
    setStage = stageSetter;
  };

  const handleWhereTo = useCallback(() => {
    try {
      setStage("input");
      bottomSheetRef.current?.snapToIndex(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      logError("Handle Where To", error);
      Alert.alert("Error", "Failed to open destination input.");
    }
  }, [bottomSheetRef]);

  const handleSelectRecentDestination = useCallback(
    (destination: RecentDestination) => {
      try {
        setDestinationLocation(destination);
        setStage("confirm");
        bottomSheetRef.current?.snapToIndex(2);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        logError("Select Recent Destination", error);
        Alert.alert("Error", "Failed to select destination.");
      }
    },
    [setDestinationLocation, bottomSheetRef]
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
        setStage("confirm");
        bottomSheetRef.current?.snapToIndex(2);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        logError("Destination Selected", error);
        Alert.alert("Error", "Invalid destination selected.");
      }
    },
    [setDestinationLocation, bottomSheetRef]
  );

  const handleBack = useCallback(() => {
    try {
      if (geocodingLoading) {
        // Don't allow navigation while geocoding is in progress
        return;
      }

      if (currentStage === "input") {
        setStage("initial");
        setDestinationLocation({
          address: "",
          coords: { latitude: "", longitude: "" },
        });
        bottomSheetRef.current?.snapToIndex(0);
      } else if (currentStage === "confirm") {
        setStage("input");
        bottomSheetRef.current?.snapToIndex(1);
      } else if (currentStage === "chat") {
        // Handle chat stage back navigation based on driver state and ETA
        setStage(driver ? (eta ? "trip" : "arrived") : "paired");
        bottomSheetRef.current?.snapToIndex(2);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      logError("Handle Back", error);
      Alert.alert("Error", "Failed to navigate back.");
    }
  }, [setDestinationLocation, bottomSheetRef, geocodingLoading, currentStage, driver, eta]);

  const centerMapOnUser = useCallback((userLocation: any) => {
    try {
      if (!userLocation?.coords) {
        throw new Error("User location unavailable");
      }
      // Map center logic would be handled by parent component
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      logError("Center Map On User", error);
      Alert.alert("Error", "Failed to center map on your location.");
    }
  }, []);

  const handleCall = useCallback(() => {
    Alert.alert("Call", "Calling driver is not implemented yet.");
  }, []);

  const handleOpenChat = useCallback(() => {
    setStage("chat");
    bottomSheetRef.current?.snapToIndex(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [bottomSheetRef]);

  return {
    handleWhereTo,
    handleSelectRecentDestination,
    handleDestinationSelected,
    handleBack,
    centerMapOnUser,
    handleCall,
    handleOpenChat,
    setStage: (stage: RideStage) => setStage(stage), // Expose setStage to parent
    injectSetStage,
  };
};
