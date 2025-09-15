import CustomText from "@/components/common/CustomText";
import MapContent from "@/components/feature/home/MapContent";
import { MapControls } from "@/components/feature/home/MapControls";
import ConfirmStage from "@/components/feature/home/stages/ConfirmStage";
import InitialStage from "@/components/feature/home/stages/InitialStage";
import InputStage from "@/components/feature/home/stages/InputStage";
import PairedArrivedStage from "@/components/feature/home/stages/PairedArrivedStage";
import SearchStage from "@/components/feature/home/stages/SearchStage";
import TripStage from "@/components/feature/home/stages/TripStage";
import { COLORS } from "@/constants/Colors";
import { CONFIG } from "@/constants/home";
import { useLocation } from "@/hooks/home/useLocation";
import { useMapRegionManager } from "@/hooks/home/useMapRegionManager";
import { useNearbyDrivers } from "@/hooks/home/useNearbyDrivers";
import { useAppStore } from "@/stores/useAppStore";
import { homeStyles } from "@/styles/home-styles";
import {
  getMapRegionConfig,
  shouldUpdateMapRegion,
  updateMapRegion,
} from "@/utility";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Keyboard, View } from "react-native";
import MapView from "react-native-maps";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const HomeScreen = () => {
  const rideState = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const userLocation = useAppStore((state) => state.userLocation);
  const nearbyDrivers = useNearbyDrivers(userLocation);

  const {
    setMapLoading,
    setDestinationDistance,
    setDestinationDuration,
    setFare,
    setTripDuration,
    setEta,
    setRideStage,
    setDestinationLocation,
  } = useAppStore();

  const { mapLoading, stage, driver, eta } = rideState;

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%", "70%", "80%", "90%"], []);

  const { geocodingLoading } = useLocation();

  useMapRegionManager(mapRef);

  // const socketRef = useSocket(bottomSheetRef);

  const centerMapOnUser = useCallback(() => {
    if (userLocation?.coords) {
      const mapParams = {
        stage: "initial", // Use initial stage to center on user
        userLocation,
        pickupLocation,
        destinationLocation,
        driver,
      };

      const config = getMapRegionConfig("initial");
      if (config && shouldUpdateMapRegion(config, mapParams)) {
        updateMapRegion(mapRef.current, config, mapParams);
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
    }
  }, [userLocation, destinationLocation, driver, pickupLocation]);

  useEffect(() => {
    if (userLocation?.coords) {
      setMapLoading(false);
    }
  }, [userLocation, setMapLoading]);

  const handleBack = useCallback(
    (geocodingLoading: boolean = false) => {
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
    },
    [stage, driver, eta, setRideStage, setDestinationLocation, bottomSheetRef]
  );

  const handleOpenChat = useCallback(() => {
    setRideStage("chat");
    bottomSheetRef.current?.snapToIndex(3);
  }, [setRideStage, bottomSheetRef]);

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
            Loading your map...
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

      <Animated.View
        entering={FadeIn.delay(200)}
        style={homeStyles.buttonContainer}
      >
        <MapControls
          stage={stage}
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
            <InitialStage bottomSheetRef={bottomSheetRef} />
          )}

          {stage === "input" && (
            <InputStage
              bottomSheetRef={bottomSheetRef}
              geocodingLoading={geocodingLoading}
            />
          )}

          {stage === "confirm" && (
            <ConfirmStage
              geocodingLoading={geocodingLoading}
              bookingLoading={false}
              handleBookRide={() => {}}
            />
          )}

          {stage === "search" && (
            <SearchStage geocodingLoading={geocodingLoading} />
          )}

          {(stage === "paired" || stage === "arrived") && driver && (
            <PairedArrivedStage
              geocodingLoading={geocodingLoading}
              onCall={() => {}}
              onChat={handleOpenChat}
            />
          )}

          {stage === "trip" && driver && (
            <TripStage
              geocodingLoading={geocodingLoading}
              onCall={() => {}}
              onChat={handleOpenChat}
            />
          )}

          {/* {stage === "chat" && driver && (
            <ChatStage
              driver={driver}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              chatLoading={chatLoading}
              handleSendMessage={handleSendMessage}
            />
          )} */}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default HomeScreen;
