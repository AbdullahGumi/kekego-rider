import type { Driver, LocationData, RideStage } from "@/types/home";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseRideStageManagerParams {
  eta: string;
  setDriver: (driver: Driver | null) => void;
  setRideId: (rideId: string | null) => void;
  setEta: (eta: string | ((prev: string) => string)) => void;
  setMessages: (messages: any[]) => void;
  setDestinationLocation: (location: LocationData) => void;
}

export const useRideStageManager = ({
  eta,
  setDriver,
  setRideId,
  setEta,
  setMessages,
  setDestinationLocation,
}: UseRideStageManagerParams) => {
  const [stage, setStage] = useState<RideStage>("initial");

  // Timer for trip stage
  useEffect(() => {
    let timer: number | null = null;
    if (stage === "trip" && eta) {
      timer = setInterval(() => {
        setEta((prev: string) => {
          const [minutes] = prev.split(" ").map(Number);
          if (minutes <= 1) {
            // Reset ride state when trip completes
            setStage("initial");
            setDestinationLocation({
              address: "",
              coords: { latitude: "", longitude: "" },
            });
            setDriver(null);
            setRideId(null);
            setEta("");
            setMessages([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return "";
          }
          return `${minutes - 1} min`;
        });
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [stage, eta, setDriver, setRideId, setEta, setMessages, setDestinationLocation]);

  const transitionToStage = useCallback((newStage: RideStage) => {
    setStage(newStage);
  }, []);

  const handleBack = useCallback((currentStage: RideStage, isDriverPresent?: boolean) => {
    try {
      if (currentStage === "input") {
        setStage("initial");
        setDestinationLocation({
          address: "",
          coords: { latitude: "", longitude: "" },
        });
      } else if (currentStage === "confirm") {
        setStage("input");
      } else if (currentStage === "chat") {
        setStage(isDriverPresent ? "trip" : "paired");
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Handle back error:", error);
    }
  }, [setDestinationLocation]);

  const handleSelectRecentDestination = useCallback((destination: LocationData) => {
    try {
      setDestinationLocation(destination);
      setStage("confirm");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Select recent destination error:", error);
    }
  }, [setDestinationLocation]);

  const handleDestinationSelected = useCallback((destination: LocationData) => {
    try {
      if (!destination.address || !destination.coords.latitude || !destination.coords.longitude) {
        throw new Error("Invalid destination data");
      }
      setDestinationLocation(destination);
      setStage("confirm");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Destination selected error:", error);
    }
  }, [setDestinationLocation]);

  const handleWhereTo = useCallback(() => {
    try {
      setStage("input");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Handle where to error:", error);
    }
  }, []);

  const handleOpenChat = useCallback(() => {
    setStage("chat");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const currentStage = useMemo(() => stage, [stage]);

  return {
    currentStage,
    transitionToStage,
    handleBack,
    handleSelectRecentDestination,
    handleDestinationSelected,
    handleWhereTo,
    handleOpenChat,
  };
};
