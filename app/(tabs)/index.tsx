import CustomText from "@/components/common/CustomText";
import MapContent from "@/components/feature/home/MapContent";
import { MapControls } from "@/components/feature/home/MapControls";
import ChatStage from "@/components/feature/home/stages/ChatStage";
import ConfirmStage from "@/components/feature/home/stages/ConfirmStage";
import InitialStage from "@/components/feature/home/stages/InitialStage";
import InputStage from "@/components/feature/home/stages/InputStage";
import PairedArrivedStage from "@/components/feature/home/stages/PairedArrivedStage";
import SearchStage from "@/components/feature/home/stages/SearchStage";
import TripStage from "@/components/feature/home/stages/TripStage";
import { COLORS } from "@/constants/Colors";
import { CONFIG } from "@/constants/home";
import { useCallHandler } from "@/hooks/home/useCallHandler";
import { useChat } from "@/hooks/home/useChat";
import { useLocation } from "@/hooks/home/useLocation";
import { useMapRegionManager } from "@/hooks/home/useMapRegionManager";
import { useNearbyDrivers } from "@/hooks/home/useNearbyDrivers";
import { useRide } from "@/hooks/home/useRide";
import { useRideFlow } from "@/hooks/home/useRideFlow";
import { useSocket } from "@/hooks/home/useSocket";
import { useAppStore } from "@/stores/useAppStore";
import { logError } from "@/utility";
import {
  getMapRegionConfig,
  shouldUpdateMapRegion,
  updateMapRegion,
} from "@/utility/mapRegionService";
import BottomSheet, {
  BottomSheetFlatListMethods,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Alert, Keyboard, View } from "react-native";
import MapView from "react-native-maps";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { homeStyles } from "../../styles/home-styles";

const HomeScreen = () => {
  // Use unified state management from store
  const rideState = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const userLocation = useAppStore((state) => state.userLocation);
  const nearbyDrivers = useNearbyDrivers(userLocation);
  console.log("nearbyDrivers", nearbyDrivers);

  // Extract store actions directly
  const {
    setMapLoading,
    setPickupLocation,
    setDestinationDistance,
    setDestinationDuration,
    setFare,
    setTripDuration,
    setEta,
    setDriver,
    setRideStage,
  } = useAppStore();

  // Map refs
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<BottomSheetFlatListMethods | null>(null);
  const snapPoints = useMemo(() => ["55%", "70%", "80%", "90%"], []);

  // Single useRideFlow hook replaces all duplicate handlers
  const {
    stage,
    driver,
    eta,
    handleWhereTo,
    handleSelectRecentDestination,
    handleDestinationSelected,
    handleBack,
    handleOpenChat,
  } = useRideFlow({ bottomSheetRef });

  // Get remaining store values directly
  const {
    fare,
    tripDuration,
    rideId,
    mapLoading,
    destinationDistance,
    destinationDuration,
  } = rideState;

  // Core dependencies only
  const { geocodingLoading, locationError } = useLocation();
  const {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    chatLoading,
    handleSendMessage,
  } = useChat(stage, rideId || "", flatListRef);

  const socketRef = useSocket(
    rideId,
    (newStage) => setRideStage(newStage), // Access setStage from useRideFlow store
    (driver) => setDriver(driver), // Access setDriver from useRideFlow store
    pickupLocation,
    setMessages,
    setEta,
    bottomSheetRef
  );

  // Minimal booking functionality from original useRide
  const { bookingLoading, handleBookRide } = useRide(
    pickupLocation,
    destinationLocation,
    setRideStage,
    () => {}, // setRideIdWrapper - already handled
    setMessages,
    () => {}, // setEtaWrapper - already handled
    bottomSheetRef,
    socketRef, // Use the socket ref I created
    destinationDistance || 0, // Use actual distance from store
    destinationDuration || 0 // Use actual duration from store
  );

  // Auto-stop loading when user location available
  useEffect(() => {
    if (userLocation?.coords) {
      setMapLoading(false);
    }
  }, [userLocation, setMapLoading]);

  // Use the existing dedicated map region management hook
  useMapRegionManager({
    stage,
    mapLoading,
    mapRef,
    userLocation,
    pickupLocation,
    destinationLocation,
    driver,
  });

  // Use centralized call handler hook
  const { handleCall } = useCallHandler();

  // Handle manual map centering via dedicated hook functionality
  const centerMapOnUser = useCallback(() => {
    if (userLocation?.coords) {
      // Use the existing map region manager for consistent behavior
      const mapParams = {
        stage: "initial", // Use initial stage to center on user
        userLocation,
        pickupLocation,
        destinationLocation,
        driver,
      };

      const config = getMapRegionConfig("initial");
      if (config && shouldUpdateMapRegion(config, mapParams)) {
        try {
          updateMapRegion(mapRef.current, config, mapParams);
        } catch (error) {
          logError("Center Map On User", error);
          Alert.alert("Error", "Failed to center map on your location.");
        }
      } else {
        // Fallback manual centering
        mapRef.current?.animateToRegion(
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000
        );
      }
    } else {
      Alert.alert("Error", "User location unavailable.");
    }
  }, [userLocation, destinationLocation, driver, pickupLocation]);

  return (
    <View style={homeStyles.container}>
      {mapLoading ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={homeStyles.loadingContainer}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <CustomText fontWeight="Medium" style={homeStyles.loadingText}>
            Loading your ride...
          </CustomText>
        </Animated.View>
      ) : (
        <MapView
          ref={mapRef}
          provider="google"
          onPress={Keyboard.dismiss}
          initialRegion={
            userLocation?.coords
              ? {
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }
              : CONFIG.INITIAL_REGION
          }
          showsUserLocation={stage === "initial" || stage === "input"}
          style={homeStyles.map}
        >
          <MapContent
            stage={stage}
            pickupLocation={pickupLocation}
            destinationLocation={destinationLocation}
            driver={driver}
            nearbyDrivers={nearbyDrivers}
            setDestinationDistance={setDestinationDistance}
            setDestinationDuration={setDestinationDuration}
            setFare={setFare}
            setTripDuration={setTripDuration}
            setEta={setEta}
          />
        </MapView>
      )}

      {locationError && (
        <Animated.View entering={FadeIn} style={homeStyles.errorContainer}>
          <CustomText style={homeStyles.errorText}>{locationError}</CustomText>
        </Animated.View>
      )}

      <Animated.View
        entering={FadeIn.delay(200)}
        style={homeStyles.buttonContainer}
      >
        <MapControls
          stage={stage}
          onWhereTo={handleWhereTo}
          onSelectRecentDestination={handleSelectRecentDestination}
          onBack={handleBack}
          onCenterMap={centerMapOnUser}
          geocodingLoading={geocodingLoading}
        />
      </Animated.View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={homeStyles.bottomSheetBackground}
        handleIndicatorStyle={homeStyles.bottomSheetHandle}
        enablePanDownToClose={false}
        enableDynamicSizing
        style={homeStyles.bottomSheet}
        keyboardBehavior="extend"
        animateOnMount
      >
        <BottomSheetView style={homeStyles.bottomSheetContent}>
          {stage === "initial" && (
            <InitialStage
              handleWhereTo={handleWhereTo}
              handleSelectRecentDestination={handleSelectRecentDestination}
            />
          )}

          {stage === "input" && (
            <InputStage
              setPickupLocation={setPickupLocation}
              handleDestinationSelected={handleDestinationSelected}
              pickupAddress={pickupLocation.address}
              destinationAddress={destinationLocation.address}
              geocodingLoading={geocodingLoading}
            />
          )}

          {stage === "confirm" && (
            <ConfirmStage
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              geocodingLoading={geocodingLoading}
              fare={fare}
              tripDuration={tripDuration}
              bookingLoading={bookingLoading}
              handleBookRide={handleBookRide}
            />
          )}

          {stage === "search" && (
            <SearchStage
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              geocodingLoading={geocodingLoading}
            />
          )}

          {(stage === "paired" || stage === "arrived") && driver && (
            <PairedArrivedStage
              driver={driver}
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              geocodingLoading={geocodingLoading}
              stage={stage}
              onCall={handleCall}
              onChat={handleOpenChat}
            />
          )}

          {stage === "trip" && driver && (
            <TripStage
              driver={driver}
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              geocodingLoading={geocodingLoading}
              eta={eta}
              fare={fare}
              onCall={handleCall}
              onChat={handleOpenChat}
            />
          )}

          {stage === "chat" && driver && (
            <ChatStage
              driver={driver}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              chatLoading={chatLoading}
              handleSendMessage={handleSendMessage}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default memo(HomeScreen);
