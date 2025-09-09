import { riderApi } from "@/api/endpoints/rider";
import { KekeImage } from "@/assets/images/Index";
import { MenuIcon } from "@/assets/svg";
import CustomText from "@/components/common/CustomText";
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
  Image,
  Keyboard,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
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
  const [userId] = useState<string>("rider1");

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

  // Map region and directions management
  useEffect(() => {
    if (mapLoading || !mapRef.current) return;
    try {
      if (stage === "initial" || stage === "input") {
        if (userLocation?.coords) {
          mapRef.current.animateToRegion(
            {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            1000
          );
        }
      } else if (stage === "confirm" || stage === "search") {
        if (
          pickupLocation.coords.latitude &&
          destinationLocation.coords.latitude
        ) {
          mapRef.current.fitToCoordinates(
            [
              {
                latitude: Number(pickupLocation.coords.latitude),
                longitude: Number(pickupLocation.coords.longitude),
              },
              {
                latitude: Number(destinationLocation.coords.latitude),
                longitude: Number(destinationLocation.coords.longitude),
              },
            ],
            {
              edgePadding: {
                top: scale(100),
                bottom: scale(200),
                right: scale(20),
                left: scale(20),
              },
              animated: true,
            }
          );
        }
      } else if (stage === "paired") {
        if (driver?.coordinates && pickupLocation.coords.latitude) {
          mapRef.current.fitToCoordinates(
            [
              {
                latitude: driver.coordinates.latitude,
                longitude: driver.coordinates.longitude,
              },
              {
                latitude: Number(pickupLocation.coords.latitude),
                longitude: Number(pickupLocation.coords.longitude),
              },
            ],
            {
              edgePadding: {
                top: scale(100),
                bottom: scale(200),
                right: scale(20),
                left: scale(20),
              },
              animated: true,
            }
          );
        }
      } else if (stage === "arrived") {
        if (driver?.coordinates && pickupLocation.coords.latitude) {
          mapRef.current.animateToRegion(
            {
              latitude:
                (driver.coordinates.latitude +
                  Number(pickupLocation.coords.latitude)) /
                2,
              longitude:
                (driver.coordinates.longitude +
                  Number(pickupLocation.coords.longitude)) /
                2,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            },
            1000
          );
        }
      } else if (stage === "trip" || stage === "chat") {
        if (
          driver?.coordinates &&
          pickupLocation.coords.latitude &&
          destinationLocation.coords.latitude
        ) {
          mapRef.current.fitToCoordinates(
            [
              {
                latitude: driver.coordinates.latitude,
                longitude: driver.coordinates.longitude,
              },
              {
                latitude: Number(destinationLocation.coords.latitude),
                longitude: Number(destinationLocation.coords.longitude),
              },
            ],
            {
              edgePadding: {
                top: scale(100),
                bottom: scale(200),
                right: scale(20),
                left: scale(20),
              },
              animated: true,
            }
          );
        }
      }
    } catch (error) {
      logError("Map Region Update", error);
      Alert.alert("Error", "Failed to update map view.");
    }
  }, [
    stage,
    userLocation,
    pickupLocation,
    destinationLocation,
    driver,
    mapLoading,
  ]);

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
          {["confirm", "search"].includes(stage) &&
            pickupLocation.coords.latitude &&
            destinationLocation.coords.latitude && (
              <>
                <MapViewDirections
                  origin={{
                    latitude: Number(pickupLocation.coords.latitude),
                    longitude: Number(pickupLocation.coords.longitude),
                  }}
                  destination={{
                    latitude: Number(destinationLocation.coords.latitude),
                    longitude: Number(destinationLocation.coords.longitude),
                  }}
                  apikey={CONFIG.GOOGLE_MAPS_API_KEY}
                  strokeWidth={Platform.OS === "android" ? 3 : 4}
                  strokeColor={COLORS.primary}
                  onReady={async (result) => {
                    try {
                      setDestinationDistance(result.distance);
                      setDestinationDuration(result.duration);
                      const response = await riderApi.calculateFare({
                        distanceInKm: result.distance,
                        durationInMinutes: result.duration,
                        promoCode: "",
                      });
                      if (
                        !response.data?.estimatedFare ||
                        !response.data?.durationInMinutes
                      ) {
                        throw new Error("Invalid fare response");
                      }
                      setFare(response.data.estimatedFare);
                      setTripDuration(response.data.durationInMinutes);
                    } catch (error) {
                      logError("MapViewDirections onReady", error);
                      Alert.alert(
                        "Error",
                        "Unable to calculate fare. Please try again."
                      );
                      setFare(null);
                      setTripDuration(null);
                    }
                  }}
                  onError={(error) => {
                    logError("MapViewDirections", error);
                    Alert.alert("Error", "Failed to load directions.");
                  }}
                />
                <Marker
                  coordinate={{
                    latitude: Number(pickupLocation.coords.latitude),
                    longitude: Number(pickupLocation.coords.longitude),
                  }}
                  title="Pickup Location"
                >
                  <Image
                    source={{ uri: CONFIG.MARKER_ICONS.pickup }}
                    style={homeStyles.markerIcon}
                  />
                </Marker>
                <Marker
                  coordinate={{
                    latitude: Number(destinationLocation.coords.latitude),
                    longitude: Number(destinationLocation.coords.longitude),
                  }}
                  title="Destination"
                >
                  <Image
                    source={{ uri: CONFIG.MARKER_ICONS.destination }}
                    style={homeStyles.markerIcon}
                  />
                </Marker>
              </>
            )}
          {stage === "paired" &&
            driver?.coordinates &&
            pickupLocation.coords.latitude && (
              <>
                <MapViewDirections
                  origin={{
                    latitude: driver.coordinates.latitude,
                    longitude: driver.coordinates.longitude,
                  }}
                  destination={{
                    latitude: Number(pickupLocation.coords.latitude),
                    longitude: Number(pickupLocation.coords.longitude),
                  }}
                  apikey={CONFIG.GOOGLE_MAPS_API_KEY}
                  strokeWidth={Platform.OS === "android" ? 3 : 4}
                  strokeColor={COLORS.primary}
                  onReady={(result) => {
                    setEta(`${Math.ceil(result.duration)} min`);
                  }}
                  onError={(error) => {
                    logError("MapViewDirections Paired", error);
                    Alert.alert("Error", "Failed to load driver directions.");
                  }}
                />
                <Marker
                  coordinate={{
                    latitude: Number(pickupLocation.coords.latitude),
                    longitude: Number(pickupLocation.coords.longitude),
                  }}
                  title="Pickup Location"
                >
                  <Image
                    source={{ uri: CONFIG.MARKER_ICONS.pickup }}
                    style={homeStyles.markerIcon}
                  />
                </Marker>
                <Marker
                  coordinate={{
                    latitude: driver.coordinates.latitude,
                    longitude: driver.coordinates.longitude,
                  }}
                  title={driver.name}
                  description={`${driver.vehicle} • ${driver.vehicleNumber}`}
                >
                  <Image source={KekeImage} style={homeStyles.tricycleMarker} />
                </Marker>
              </>
            )}
          {(stage === "arrived" || stage === "trip" || stage === "chat") &&
            driver?.coordinates &&
            pickupLocation.coords.latitude &&
            destinationLocation.coords.latitude && (
              <>
                <MapViewDirections
                  origin={{
                    latitude: driver.coordinates.latitude,
                    longitude: driver.coordinates.longitude,
                  }}
                  destination={{
                    latitude: Number(destinationLocation.coords.latitude),
                    longitude: Number(destinationLocation.coords.longitude),
                  }}
                  apikey={CONFIG.GOOGLE_MAPS_API_KEY}
                  strokeWidth={Platform.OS === "android" ? 3 : 4}
                  strokeColor={COLORS.primary}
                  onReady={(result) => {
                    if (stage !== "arrived") {
                      setEta(`${Math.ceil(result.duration)} min`);
                    }
                  }}
                  onError={(error) => {
                    logError("MapViewDirections Trip", error);
                    Alert.alert("Error", "Failed to load trip directions.");
                  }}
                />
                <Marker
                  coordinate={{
                    latitude: Number(pickupLocation.coords.latitude),
                    longitude: Number(pickupLocation.coords.longitude),
                  }}
                  title="Pickup Location"
                >
                  <Image
                    source={{ uri: CONFIG.MARKER_ICONS.pickup }}
                    style={homeStyles.markerIcon}
                  />
                </Marker>
                <Marker
                  coordinate={{
                    latitude: Number(destinationLocation.coords.latitude),
                    longitude: Number(destinationLocation.coords.longitude),
                  }}
                  title="Destination"
                >
                  <Image
                    source={{ uri: CONFIG.MARKER_ICONS.destination }}
                    style={homeStyles.markerIcon}
                  />
                </Marker>
                <Marker
                  coordinate={{
                    latitude: driver.coordinates.latitude,
                    longitude: driver.coordinates.longitude,
                  }}
                  title={driver.name}
                  description={`${driver.vehicle} • ${driver.vehicleNumber}`}
                >
                  <Image source={KekeImage} style={homeStyles.tricycleMarker} />
                </Marker>
              </>
            )}
          {["initial", "input"].includes(stage) &&
            nearbyDrivers.map((driver) => (
              <Marker
                key={driver.id}
                coordinate={{
                  latitude: driver.coordinates.latitude,
                  longitude: driver.coordinates.longitude,
                }}
                title={driver.name}
                description={`${driver.vehicle} • ${driver.vehicleNumber}`}
              >
                <Image source={KekeImage} style={homeStyles.tricycleMarker} />
              </Marker>
            ))}
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
