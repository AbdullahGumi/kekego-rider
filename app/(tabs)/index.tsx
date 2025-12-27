import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useEffect, useMemo, useRef } from "react";
import { Keyboard, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Animated, { FadeIn } from "react-native-reanimated";
import { Socket } from "socket.io-client";

import { CONFIG } from "@/constants/home";
import { homeStyles } from "@/styles/home-styles";

import MapContent from "@/components/feature/home/MapContent";
import { MapControls } from "@/components/feature/home/MapControls";

// Stages
import ConfirmStage from "@/components/feature/home/stages/ConfirmStage";
import InitialStage from "@/components/feature/home/stages/InitialStage";
import InputStage from "@/components/feature/home/stages/InputStage";
import PairedArrivedStage from "@/components/feature/home/stages/PairedArrivedStage";
import SearchStage from "@/components/feature/home/stages/SearchStage";
import TripStage from "@/components/feature/home/stages/TripStage";

import { useLocation } from "@/hooks/home/useLocation";
import { useMapRegionManager } from "@/hooks/home/useMapRegionManager";
import { useSocket } from "@/hooks/home/useSocket";
import { useAppStore } from "@/stores/useAppStore";
import HideKeyboardOnTouch from "@/utility/HideKeyboardOnTouch";

const HomeScreen = () => {
  const rideState = useAppStore((state) => state.rideState);
  const userLocation = useAppStore((state) => state.userLocation);
  const { setMapLoading, setActiveRide } = useAppStore();
  const { stage, driver } = rideState;

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const socketRef = useRef<Socket | null>(null);

  const setMapRef = useAppStore((state) => state.setMapRef);
  const setBottomSheetRef = useAppStore((state) => state.setBottomSheetRef);
  const setSocketRef = useAppStore((state) => state.setSocketRef);

  const { geocodingLoading } = useLocation();
  const snapPoints = useMemo(() => ["55%", "70%", "85%", "90%"], []);

  useEffect(() => {
    if (!bottomSheetRef.current) return;

    switch (stage) {
      case "initial":
        bottomSheetRef.current.snapToIndex(0);
        break;
      case "input":
        bottomSheetRef.current.snapToIndex(3);
        break;
      case "confirm":
      case "search":
      case "paired":
      case "arrived":
      case "trip":
        bottomSheetRef.current.snapToIndex(0);
        break;
    }
  }, [stage]);

  useMapRegionManager(mapRef);
  useSocket();

  useEffect(() => {
    setMapRef(mapRef);
    setBottomSheetRef(bottomSheetRef);
    setSocketRef(socketRef);
  }, [setMapRef, setBottomSheetRef, setSocketRef]);

  useEffect(() => {
    if (userLocation?.coords) {
      setMapLoading(false);
    }
  }, [userLocation, setMapLoading]);



  return (
    <HideKeyboardOnTouch>
      <View style={homeStyles.container}>
        <MapView
          ref={mapRef}
          showsMyLocationButton={false}
          provider={PROVIDER_GOOGLE}
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
          <MapContent />
        </MapView>

        <Animated.View
          entering={FadeIn.delay(200)}
          style={homeStyles.buttonContainer}
        >
          <MapControls geocodingLoading={geocodingLoading} />
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
            {stage === "initial" && <InitialStage />}

            {stage === "input" && (
              <InputStage geocodingLoading={geocodingLoading} />
            )}

            {stage === "confirm" && <ConfirmStage />}

            {stage === "search" && (
              <SearchStage geocodingLoading={geocodingLoading} />
            )}

            {(stage === "paired" || stage === "arrived") && driver && (
              <PairedArrivedStage />
            )}

            {stage === "trip" && driver && (
              <TripStage geocodingLoading={geocodingLoading} />
            )}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </HideKeyboardOnTouch>
  );
};

export default HomeScreen;
