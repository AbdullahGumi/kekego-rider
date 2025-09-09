import { riderApi } from "@/api/endpoints/rider";
import { KekeImage } from "@/assets/images/Index";
import { MenuIcon } from "@/assets/svg";
import CustomText from "@/components/common/CustomText";
import LocationInput from "@/components/feature/home/LocationInput";
import { COLORS } from "@/constants/Colors";
import { CONSTANTS } from "@/constants/constants";
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
import { formatDuration, logError, numberWithCommas } from "@/utility";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetFlatList,
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from "react-native-reanimated";
import { homeStyles } from "../../styles/home-styles";

// Components

// Sub-Components
const RecentDestinationItem = memo(
  ({
    item,
    onSelect,
  }: {
    item: RecentDestination;
    onSelect: (destination: RecentDestination) => void;
  }) => (
    <TouchableOpacity
      style={homeStyles.recentDestinationCard}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Animated.View entering={ZoomIn.delay(100 * Number(item.id))}>
        <View style={homeStyles.recentDestinationContent}>
          <Image
            source={{ uri: CONFIG.MARKER_ICONS.pin }}
            style={homeStyles.recentDestinationIcon}
          />
          <View>
            <CustomText
              fontWeight="Medium"
              style={homeStyles.recentDestinationText}
            >
              {item.address}
            </CustomText>
            <CustomText style={homeStyles.recentDestinationSubText}>
              Recent Trip
            </CustomText>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
);

RecentDestinationItem.displayName = "RecentDestinationItem";

const LocationCard = memo(
  ({
    pickupLocation,
    destinationLocation,
    geocodingLoading,
  }: {
    pickupLocation: LocationData;
    destinationLocation: LocationData;
    geocodingLoading: boolean;
  }) => (
    <View style={homeStyles.locationCard}>
      <View style={homeStyles.locationRow}>
        <Image
          source={{ uri: CONFIG.MARKER_ICONS.pickup }}
          style={homeStyles.locationIcon}
        />
        <CustomText style={homeStyles.locationText}>
          {pickupLocation.address || "Current Location"}
        </CustomText>
        {geocodingLoading && (
          <ActivityIndicator size="small" color={COLORS.primary} />
        )}
      </View>
      <View style={homeStyles.locationDivider} />
      <View style={homeStyles.locationRow}>
        <Image
          source={{ uri: CONFIG.MARKER_ICONS.destination }}
          style={homeStyles.locationIcon}
        />
        <CustomText style={homeStyles.locationText}>
          {destinationLocation.address || "Select Destination"}
        </CustomText>
      </View>
    </View>
  )
);

LocationCard.displayName = "LocationCard";

const DriverInfo = memo(
  ({ driver, stage }: { driver: Driver; stage: string }) => (
    <View style={homeStyles.confirmCard}>
      <View style={homeStyles.rideOptionHeader}>
        <Image
          source={{ uri: driver?.profilePicture || CONFIG.MARKER_ICONS.user }}
          style={homeStyles.driverPicture}
        />
        <View style={homeStyles.driverInfoContainer}>
          <CustomText fontWeight="Bold" style={homeStyles.rideOptionTitle}>
            {driver?.name || "Unknown Driver"}
          </CustomText>
          <View style={homeStyles.ratingContainer}>
            <Image
              source={{ uri: CONFIG.MARKER_ICONS.star }}
              style={homeStyles.starIcon}
            />
            <CustomText style={homeStyles.rideOptionDescription}>
              {driver?.rating?.toFixed(1) || "N/A"}
            </CustomText>
          </View>
          <CustomText style={homeStyles.rideOptionDescription}>
            {driver?.vehicle || "Tricycle"} (Keke) •{" "}
            {driver?.vehicleNumber || "N/A"}
          </CustomText>
        </View>
      </View>
      <CustomText style={homeStyles.rideOptionDescription}>
        {stage === "paired"
          ? "Arriving in approximately 2-3 minutes"
          : "Your driver is at the pickup location"}
      </CustomText>
    </View>
  )
);

DriverInfo.displayName = "DriverInfo";

const ContactButtons = memo(
  ({ onCall, onChat }: { onCall: () => void; onChat: () => void }) => (
    <View style={homeStyles.contactButtonContainer}>
      <TouchableOpacity
        style={[homeStyles.contactButton, { marginRight: scale(8) }]}
        activeOpacity={0.7}
        onPress={onCall}
      >
        <Ionicons
          name="call"
          size={23}
          color="white"
          style={{ marginRight: scale(8) }}
        />
        <CustomText fontWeight="Bold" style={homeStyles.contactButtonText}>
          Call
        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        style={homeStyles.contactButton}
        activeOpacity={0.7}
        onPress={onChat}
      >
        <Ionicons
          name="chatbubble"
          size={23}
          color="white"
          style={{ marginRight: scale(8) }}
        />
        <CustomText fontWeight="Bold" style={homeStyles.contactButtonText}>
          Chat
        </CustomText>
      </TouchableOpacity>
    </View>
  )
);

ContactButtons.displayName = "ContactButtons";

const MessageItem = memo(
  ({ item, userId }: { item: Message; userId: string }) => (
    <Animated.View
      entering={FadeIn}
      style={[
        homeStyles.messageBubble,
        item.senderId === userId
          ? homeStyles.sentMessage
          : homeStyles.receivedMessage,
      ]}
    >
      <CustomText fontWeight="Medium" style={homeStyles.messageSender}>
        {item.senderId === userId ? "You" : item.Sender?.name || "Unknown"}
      </CustomText>
      <CustomText style={homeStyles.messageText}>{item.content}</CustomText>
      <CustomText style={homeStyles.messageTime}>
        {new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </CustomText>
    </Animated.View>
  )
);

MessageItem.displayName = "MessageItem";

const ChatView = memo(
  ({
    driver,
    messages,
    newMessage,
    setNewMessage,
    chatLoading,
    handleSendMessage,
    flatListRef,
  }: {
    driver: Driver | null;
    messages: Message[];
    newMessage: string;
    setNewMessage: (msg: string) => void;
    chatLoading: boolean;
    handleSendMessage: () => void;
    flatListRef: React.RefObject<BottomSheetFlatListMethods | null>;
  }) => (
    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
      <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
        Chat with {driver?.name || "Driver"}
      </CustomText>
      {chatLoading ? (
        <View style={homeStyles.chatLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <CustomText style={homeStyles.searchText}>
            Loading messages...
          </CustomText>
        </View>
      ) : (
        <>
          <BottomSheetFlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => (
              <MessageItem item={item} userId="rider1" />
            )}
            keyExtractor={(item) => item.id}
            style={homeStyles.chatList}
            contentContainerStyle={homeStyles.chatListContent}
            showsVerticalScrollIndicator={false}
          />
          <View style={homeStyles.chatInputContainer}>
            <TextInput
              style={homeStyles.chatInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.secondaryText}
              multiline
            />
            <TouchableOpacity
              style={[
                homeStyles.sendButton,
                !newMessage.trim() && homeStyles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || chatLoading}
              activeOpacity={0.7}
            >
              {chatLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </Animated.View>
  )
);

ChatView.displayName = "ChatView";

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
            <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
              <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
                Plan Your Ride
              </CustomText>
              <TouchableOpacity
                style={homeStyles.whereToButton}
                onPress={handleWhereTo}
                activeOpacity={0.7}
              >
                <CustomText
                  fontWeight="Bold"
                  style={homeStyles.whereToButtonText}
                >
                  Where to?
                </CustomText>
              </TouchableOpacity>
              <CustomText
                fontWeight="Medium"
                style={homeStyles.sectionSubTitle}
              >
                Recent Destinations
              </CustomText>
              <BottomSheetFlatList
                data={CONFIG.RECENT_DESTINATIONS}
                renderItem={({ item }) => (
                  <RecentDestinationItem
                    item={item}
                    onSelect={handleSelectRecentDestination}
                  />
                )}
                keyExtractor={(item) => item.id}
                style={homeStyles.recentDestinationsList}
                showsVerticalScrollIndicator={false}
              />
            </Animated.View>
          )}

          {stage === "input" && (
            <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
              <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
                Enter Your Destination
              </CustomText>
              <LocationInput
                setPickupLocation={setPickupLocation}
                setDestinationLocation={handleDestinationSelected}
                initialPickup={pickupLocation.address}
                initialDestination={destinationLocation.address}
                isPickupLoading={geocodingLoading}
              />
            </Animated.View>
          )}

          {stage === "confirm" && (
            <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
              <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
                Confirm Your Ride
              </CustomText>
              <LocationCard
                pickupLocation={pickupLocation}
                destinationLocation={destinationLocation}
                geocodingLoading={geocodingLoading}
              />
              <View style={homeStyles.confirmCard}>
                <View style={homeStyles.rideOptionHeader}>
                  <Image source={KekeImage} style={homeStyles.rideOptionIcon} />
                  <View>
                    <CustomText
                      fontWeight="Bold"
                      style={homeStyles.rideOptionTitle}
                    >
                      Tricycle
                    </CustomText>
                    <CustomText style={homeStyles.rideOptionDescription}>
                      Local tricycle (Keke)
                    </CustomText>
                  </View>
                </View>
                <View style={homeStyles.rideOptionDetails}>
                  {fare === null || tripDuration === null ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <CustomText
                        fontWeight="Bold"
                        style={homeStyles.rideOptionPrice}
                      >
                        {CONSTANTS.NAIRA_UNICODE}
                        {numberWithCommas(fare)}
                      </CustomText>
                      <CustomText style={homeStyles.rideOptionDuration}>
                        {formatDuration(tripDuration)}
                      </CustomText>
                    </>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[
                  homeStyles.bookButton,
                  bookingLoading && homeStyles.bookButtonDisabled,
                ]}
                onPress={handleBookRide}
                disabled={bookingLoading}
                activeOpacity={0.7}
              >
                <Animated.View entering={FadeIn}>
                  {bookingLoading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <CustomText
                      fontWeight="Bold"
                      style={homeStyles.bookButtonText}
                    >
                      Book Keke Ride
                    </CustomText>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {stage === "search" && (
            <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
              <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
                Finding Your Keke...
              </CustomText>
              <LocationCard
                pickupLocation={pickupLocation}
                destinationLocation={destinationLocation}
                geocodingLoading={geocodingLoading}
              />
              <Animated.View
                entering={ZoomIn}
                style={homeStyles.searchAnimation}
              >
                <ActivityIndicator size="large" color={COLORS.primary} />
                <CustomText style={homeStyles.searchText}>
                  Searching for nearby drivers...
                </CustomText>
              </Animated.View>
            </Animated.View>
          )}

          {(stage === "paired" || stage === "arrived") && driver && (
            <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
              <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
                {stage === "paired"
                  ? "Your Keke Driver"
                  : "Keke Driver Arrived"}
              </CustomText>
              <LocationCard
                pickupLocation={pickupLocation}
                destinationLocation={destinationLocation}
                geocodingLoading={geocodingLoading}
              />
              <DriverInfo driver={driver} stage={stage} />
              <ContactButtons onCall={handleCall} onChat={handleOpenChat} />
            </Animated.View>
          )}

          {stage === "trip" && driver && (
            <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
              <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
                Trip started
              </CustomText>
              <LocationCard
                pickupLocation={pickupLocation}
                destinationLocation={destinationLocation}
                geocodingLoading={geocodingLoading}
              />
              <View style={homeStyles.tripCard}>
                <View style={homeStyles.driverHeader}>
                  <Image
                    source={{ uri: driver.profilePicture }}
                    style={homeStyles.driverPicture}
                  />
                  <View style={homeStyles.driverInfoContainer}>
                    <CustomText
                      fontWeight="Bold"
                      style={homeStyles.rideOptionTitle}
                    >
                      {driver.name}
                    </CustomText>
                    <View style={homeStyles.ratingContainer}>
                      <Image
                        source={{ uri: CONFIG.MARKER_ICONS.star }}
                        style={homeStyles.starIcon}
                      />
                      <CustomText style={homeStyles.rideOptionDescription}>
                        {driver.rating?.toFixed(1)}
                      </CustomText>
                    </View>
                    <CustomText style={homeStyles.rideOptionDescription}>
                      {driver.vehicle} (Keke) • {driver.vehicleNumber}
                    </CustomText>
                  </View>
                </View>
                <View style={homeStyles.tripInfoContainer}>
                  <View style={homeStyles.tripInfoItem}>
                    <CustomText style={homeStyles.tripInfoLabel}>
                      Time of Arrival
                    </CustomText>
                    <CustomText
                      fontWeight="Bold"
                      style={homeStyles.tripInfoValue}
                    >
                      {eta}
                    </CustomText>
                  </View>
                  <View style={homeStyles.tripInfoDivider} />
                  <View style={homeStyles.tripInfoItem}>
                    <CustomText style={homeStyles.tripInfoLabel}>
                      Price
                    </CustomText>
                    <CustomText
                      fontWeight="Bold"
                      style={homeStyles.tripInfoValue}
                    >
                      {CONSTANTS.NAIRA_UNICODE}
                      {numberWithCommas(fare)}
                    </CustomText>
                  </View>
                </View>
              </View>
              <ContactButtons onCall={handleCall} onChat={handleOpenChat} />
            </Animated.View>
          )}

          {stage === "chat" && driver && (
            <ChatView
              driver={driver}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              chatLoading={chatLoading}
              handleSendMessage={handleSendMessage}
              flatListRef={flatListRef}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default memo(HomeScreen);
