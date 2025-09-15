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
import { useSocket } from "@/hooks/home/useSocket";
import { useAppStore } from "@/stores/useAppStore";
import { homeStyles } from "@/styles/home-styles";

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Keyboard, View } from "react-native";
import MapView from "react-native-maps";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Socket } from "socket.io-client";

const HomeScreen = () => {
  const rideState = useAppStore((state) => state.rideState);
  const userLocation = useAppStore((state) => state.userLocation);

  const { setMapLoading, setRideStage } = useAppStore();

  const { mapLoading, stage, driver } = rideState;

  const mapRef = useRef<MapView>(null);
  const setMapRef = useAppStore((state) => state.setMapRef);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const setBottomSheetRef = useAppStore((state) => state.setBottomSheetRef);

  const socketRef = useRef<Socket | null>(null);
  const setSocketRef = useAppStore((state) => state.setSocketRef);

  const snapPoints = useMemo(() => ["55%", "70%", "80%", "90%"], []);

  const { geocodingLoading } = useLocation();

  useEffect(() => {
    setMapRef(mapRef);
    setBottomSheetRef(bottomSheetRef);
    setSocketRef(socketRef);
  }, [setMapRef, setBottomSheetRef, setSocketRef]);

  useMapRegionManager(mapRef);

  useSocket();

  useEffect(() => {
    if (userLocation?.coords) {
      setMapLoading(false);
    }
  }, [userLocation, setMapLoading]);

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
          <MapContent />
        </MapView>
      )}

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

          {stage === "confirm" && (
            <ConfirmStage geocodingLoading={geocodingLoading} />
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
