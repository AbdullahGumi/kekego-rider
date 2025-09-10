import type { Driver, LocationData, Message } from "@/types/home";
import type { BottomSheetFlatListMethods } from "@gorhom/bottom-sheet";
import { useState } from "react";
import MapView from "react-native-maps";
import { useChat } from "./useChat";
import { useLocation } from "./useLocation";
import { useMapRegionManager } from "./useMapRegionManager";
import { useMapState } from "./useMapState";
import { useNearbyDrivers } from "./useNearbyDrivers";
import { useRide } from "./useRide";
import { useRideData } from "./useRideData";
import { useRideStageManager } from "./useRideStageManager";
import { useSocket } from "./useSocket";
import { useStageActions } from "./useStageActions";

interface UseRideManagerParams {
  mapRef: React.RefObject<MapView>;
  bottomSheetRef: React.RefObject<{ snapToIndex: (index: number) => void; current?: any } | null>;
  flatListRef: React.RefObject<BottomSheetFlatListMethods | null>;
}

export const useRideManager = ({
  mapRef,
  bottomSheetRef,
  flatListRef,
}: UseRideManagerParams) => {
  // Local state declarations first
  const [driver, setDriver] = useState<Driver | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationData>({
    address: "",
    coords: { latitude: "", longitude: "" },
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [eta, setEta] = useState("");

  // Core state management
  const rideData = useRideData();

  // Map and UI state
  const mapState = useMapState();

  // Location functionality
  const {
    userLocation,
    pickupLocation,
    setPickupLocation,
    geocodingLoading,
  } = useLocation();

  const nearbyDrivers = useNearbyDrivers(userLocation);

  // Stage management
  const stageManager = useRideStageManager({
    eta,
    setDriver,
    setRideId: rideData.setRideId,
    setEta,
    setMessages,
    setDestinationLocation,
  });

  // Stage actions
  const stageActions = useStageActions({
    setPickupLocation,
    pickupLocation,
    destinationLocation,
    setDestinationLocation,
    bottomSheetRef: mapState.bottomSheetRef,
    geocodingLoading,
    currentStage: stageManager.currentStage,
    driver,
    eta,
  });

  // Inject the setStage function into stageActions
  stageActions.injectSetStage(stageManager.transitionToStage);

  // Chat functionality
  const chatResult = useChat(stageManager.currentStage, rideData.rideId, flatListRef);
  const {
    chatLoading,
    handleSendMessage,
  } = chatResult;

  // Override the messages state from useChat with our local state
  Object.assign(chatResult, { setMessages, messages }); // This is a bit hacky, but ensures we use our state

  // Socket connection (simplified for now)
  const socketRef = useSocket(
    rideData.rideId,
    stageManager.transitionToStage,
    setDriver,
    pickupLocation,
    setMessages,
    setEta,
    bottomSheetRef
  );

  // Ride operations
  const rideResult = useRide(
    pickupLocation,
    destinationLocation,
    stageManager.transitionToStage,
    rideData.setRideId,
    setMessages,
    setEta,
    bottomSheetRef,
    socketRef,
    rideData.destinationDistance,
    rideData.destinationDuration
  );
  const { bookingLoading, handleBookRide, handleCancelRide } = rideResult;

  // Map region management
  useMapRegionManager({
    stage: stageManager.currentStage,
    mapLoading: mapState.mapLoading,
    mapRef: mapState.mapRef,
    userLocation,
    pickupLocation,
    destinationLocation,
    driver,
  });

  return {
    // State
    userLocation,
    pickupLocation,
    destinationLocation,
    driver,
    messages,
    newMessage,

    // Loading states
    mapLoading: mapState.mapLoading,
    geocodingLoading,
    bookingLoading,
    chatLoading,

    // Actions
    setPickupLocation,
    setDestinationLocation,
    setDriver,
    setMessages,
    setNewMessage,
    handleSendMessage,

    // Stage management
    currentStage: stageManager.currentStage,
    transitionToStage: stageManager.transitionToStage,

    // Stage actions
    handleWhereTo: stageActions.handleWhereTo,
    handleSelectRecentDestination: stageActions.handleSelectRecentDestination,
    handleDestinationSelected: stageActions.handleDestinationSelected,
    handleBack: stageActions.handleBack,
    handleCall: stageActions.handleCall,
    handleOpenChat: stageActions.handleOpenChat,

    // Ride operations
    handleBookRide,
    handleCancelRide,

    // Map and UI
    nearbyDrivers,
    mapRef: mapState.mapRef,
    bottomSheetRef: mapState.bottomSheetRef,
    flatListRef: mapState.flatListRef,

    // Ride data
    fare: rideData.fare,
    tripDuration: rideData.tripDuration,
    setFare: rideData.setFare,
    setTripDuration: rideData.setTripDuration,
  };
};
