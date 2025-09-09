import { MenuIcon } from "@/assets/svg";
import CustomText from "@/components/common/CustomText";
import MapContent from "@/components/feature/home/MapContent";
import ChatStage from "@/components/feature/home/stages/ChatStage";
import ConfirmStage from "@/components/feature/home/stages/ConfirmStage";
import InitialStage from "@/components/feature/home/stages/InitialStage";
import InputStage from "@/components/feature/home/stages/InputStage";
import PairedArrivedStage from "@/components/feature/home/stages/PairedArrivedStage";
import SearchStage from "@/components/feature/home/stages/SearchStage";
import TripStage from "@/components/feature/home/stages/TripStage";
import { COLORS } from "@/constants/Colors";
import { CONFIG } from "@/constants/home";
import { scale } from "@/constants/Layout";
import { useChat } from "@/hooks/home/useChat";
import { useLocation } from "@/hooks/home/useLocation";
import { useMapRegionManager } from "@/hooks/home/useMapRegionManager";
import { useNearbyDrivers } from "@/hooks/home/useNearbyDrivers";
import { useRide } from "@/hooks/home/useRide";
import { useSocket } from "@/hooks/home/useSocket";
import type {
  Driver,
  LocationData,
  Message,
  RecentDestination,
} from "@/types/home";
import { logError } from "@/utility";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetFlatListMethods,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { homeStyles } from "../../styles/home-styles";

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [stage, setStage] = useState<
    | "initial"
    | "input"
    | "confirm"
    | "search"
    | "paired"
    | "arrived"
    | "trip"
    | "chat"
  >("initial");
  const [destinationLocation, setDestinationLocation] = useState<LocationData>({
    address: "",
    coords: { latitude: "", longitude: "" },
  });
  const [driver, setDriver] = useState<Driver | null>(null);
  const [eta, setEta] = useState("");
  const [mapLoading, setMapLoading] = useState(true);
  const [fare, setFare] = useState<number | null>(null);
  const [tripDuration, setTripDuration] = useState<number | null>(null);
  const [destinationDistance, setDestinationDistance] = useState(0);
  const [destinationDuration, setDestinationDuration] = useState(0);
  const [rideId, setRideId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<BottomSheetFlatListMethods | null>(null);
  const snapPoints = useMemo(() => ["55%", "70%", "80%", "90%"], []);

  const {
    userLocation,
    pickupLocation,
    setPickupLocation,
    geocodingLoading,
    locationError,
  } = useLocation();
  const nearbyDrivers = useNearbyDrivers(userLocation);
  // Create local setMessages to avoid closure issues
  const localSetMessages = (messages: Message[]) => setMessages(messages);

  const socketRef = useSocket(
    rideId,
    setStage,
    setDriver,
    pickupLocation,
    localSetMessages,
    setEta,
    bottomSheetRef
  );
  const {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    chatLoading,
    handleSendMessage,
  } = useChat(stage, rideId, flatListRef);
  const { bookingLoading, handleBookRide, handleCancelRide } = useRide(
    pickupLocation,
    destinationLocation,
    setStage,
    setRideId,
    setMessages,
    setEta,
    bottomSheetRef,
    socketRef,
    destinationDistance,
    destinationDuration
  );

  useEffect(() => {
    setMapLoading(false);
  }, [userLocation]);

  // Map region management
  useMapRegionManager({
    stage,
    mapLoading,
    mapRef,
    userLocation,
    pickupLocation,
    destinationLocation,
    driver,
  });

  // ETA timer for trip stage
  useEffect(() => {
    let timer: number | null = null;
    if (stage === "trip" && eta) {
      timer = setInterval(() => {
        setEta((prev) => {
          const [minutes] = prev.split(" ").map(Number);
          if (minutes <= 1) {
            setStage("initial");
            setDestinationLocation({
              address: "",
              coords: { latitude: "", longitude: "" },
            });
            setDriver(null);
            setRideId(null);
            setEta("");
            setMessages([]);
            bottomSheetRef.current?.snapToIndex(0);
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
  }, [
    stage,
    eta,
    setStage,
    setDestinationLocation,
    setDriver,
    setRideId,
    setEta,
    setMessages,
  ]);

  const handleWhereTo = useCallback(() => {
    try {
      setStage("input");
      bottomSheetRef.current?.snapToIndex(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      logError("Handle Where To", error);
      Alert.alert("Error", "Failed to open destination input.");
    }
  }, []);

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
    []
  );

  const handleDestinationSelected = useCallback((destination: LocationData) => {
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
  }, []);

  const handleBack = useCallback(() => {
    try {
      if (stage === "input") {
        setStage("initial");
        setDestinationLocation({
          address: "",
          coords: { latitude: "", longitude: "" },
        });
        bottomSheetRef.current?.snapToIndex(0);
      } else if (stage === "confirm") {
        setStage("input");
        bottomSheetRef.current?.snapToIndex(1);
      } else if (stage === "chat") {
        setStage(driver ? (eta ? "trip" : "arrived") : "paired");
        bottomSheetRef.current?.snapToIndex(2);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      logError("Handle Back", error);
      Alert.alert("Error", "Failed to navigate back.");
    }
  }, [stage, driver, eta]);

  const centerMapOnUser = useCallback(() => {
    try {
      if (!userLocation?.coords) {
        throw new Error("User location unavailable");
      }
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      logError("Center Map On User", error);
      Alert.alert("Error", "Failed to center map on your location.");
    }
  }, [userLocation]);

  const handleCall = useCallback(() => {
    // Implement call functionality here if needed
    Alert.alert("Call", "Calling driver is not implemented yet.");
  }, []);

  const handleOpenChat = useCallback(() => {
    setStage("chat");
    bottomSheetRef.current?.snapToIndex(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

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
        {stage === "initial" ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              activeOpacity={0.7}
              style={homeStyles.menuButton}
            >
              <MenuIcon />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={centerMapOnUser}
              activeOpacity={0.7}
              style={[
                homeStyles.menuButton,
                {
                  marginTop: scale(8),
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                },
              ]}
            >
              <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : stage === "input" || stage === "confirm" || stage === "chat" ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={homeStyles.backButton}
            >
              <CustomText fontWeight="Bold" style={homeStyles.backButtonText}>
                Back
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={centerMapOnUser}
              activeOpacity={0.7}
              style={[
                homeStyles.menuButton,
                {
                  marginTop: scale(8),
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                },
              ]}
            >
              <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : stage === "search" || stage === "paired" || stage === "arrived" ? (
          <TouchableOpacity
            onPress={() => handleCancelRide(stage)}
            activeOpacity={0.7}
            style={homeStyles.cancelButton}
          >
            <CustomText fontWeight="Bold" style={homeStyles.cancelButtonText}>
              Cancel Ride
            </CustomText>
          </TouchableOpacity>
        ) : null}
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
