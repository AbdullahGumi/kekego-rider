import { chatApi } from "@/api/endpoints/chat";
import { riderApi } from "@/api/endpoints/rider";
import { KekeImage } from "@/assets/images/Index";
import { MenuIcon } from "@/assets/svg";
import CustomText from "@/components/common/CustomText";
import LocationInput from "@/components/feature/home/LocationInput";
import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
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
import io from "socket.io-client";
import { homeStyles } from "../../styles/home-styles";

interface LocationData {
  address: string;
  coords: { latitude: string; longitude: string };
}

interface RideOption {
  id: string;
  type: string;
  description: string;
  price: string;
  duration: string;
}

interface RecentDestination {
  id: string;
  address: string;
  coords: { latitude: string; longitude: string };
}

interface Driver {
  id: string;
  name: string;
  vehicle: string;
  coordinates: { latitude: number; longitude: number };
  picture?: string;
  rating?: number;
  vehicleNumber?: string;
}

interface Message {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  Sender: { id: string; name: string };
  Receiver: { id: string; name: string };
}

const GOOGLE_MAPS_API_KEY = "AIzaSyCEgN-LLuqFBE7nDzqa2zdgE-iYq-bKhQE";
const TRICYCLE_OPTION: RideOption = {
  id: "3",
  type: "Tricycle",
  description: "Local tricycle (Keke)",
  price: "₦1,500",
  duration: "25 min",
};
const RECENT_DESTINATIONS: RecentDestination[] = [
  {
    id: "1",
    address: "Lekki Phase 1, Lagos",
    coords: { latitude: "6.4412", longitude: "3.4584" },
  },
  {
    id: "2",
    address: "Ikeja City Mall, Lagos",
    coords: { latitude: "6.6148", longitude: "3.3576" },
  },
  {
    id: "3",
    address: "Victoria Island, Lagos",
    coords: { latitude: "6.4299", longitude: "3.4219" },
  },
];
const DEFAULT_COORDS = { latitude: "6.5244", longitude: "3.3792" };
const INITIAL_REGION = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};
const MARKER_ICONS = {
  pickup: "https://img.icons8.com/color/48/000000/marker.png",
  destination: "https://img.icons8.com/color/48/000000/flag.png",
  pin: "https://img.icons8.com/ios/50/000000/pin.png",
  user: "https://img.icons8.com/ios/50/000000/user.png",
  star: "https://img.icons8.com/color/24/000000/star.png",
};

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
  const [pickupLocation, setPickupLocation] = useState<LocationData>({
    address: "Fetching your location...",
    coords: DEFAULT_COORDS,
  });
  const [destinationLocation, setDestinationLocation] = useState<LocationData>({
    address: "",
    coords: { latitude: "", longitude: "" },
  });
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [eta, setEta] = useState("");
  const [mapLoading, setMapLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [rideId, setRideId] = useState<string | null>(null);
  const [userId] = useState("rider1");

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<BottomSheetFlatListMethods>(null);
  const socketRef = useRef<any>(null);
  const snapPoints = useMemo(() => ["55%", "70%", "80%", "90%"], []);

  // Initialize Socket.IO
  useEffect(() => {
    socketRef.current = io("http://172.20.10.2:3000");
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Join ride room when driver is assigned
  useEffect(() => {
    if (rideId && ["paired", "arrived", "trip", "chat"].includes(stage)) {
      socketRef.current?.emit("join", rideId);
      socketRef.current?.on("newMessage", (message: Message) => {
        setMessages((prev) => [...prev, message]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      });
    }
    return () => {
      socketRef.current?.off("newMessage");
    };
  }, [rideId, stage]);

  // Fetch messages when entering chat stage
  useEffect(() => {
    if (stage === "chat" && rideId) {
      const fetchMessages = async () => {
        setChatLoading(true);
        try {
          const response = await chatApi.getMessages(rideId);
          setMessages(response.data || []);
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            100
          );
        } catch (error) {
          console.error("Failed to fetch messages:", error);
          Alert.alert(
            "Error",
            "Failed to load chat messages. Please try again."
          );
        } finally {
          setChatLoading(false);
        }
      };
      fetchMessages();
    }
  }, [stage, rideId]);

  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(
          "Location permission denied. Please enable location services."
        );
        setPickupLocation({
          address: "Location unavailable",
          coords: DEFAULT_COORDS,
        });
        setMapLoading(false);
        setGeocodingLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(location);
      setPickupLocation((prev) => ({
        ...prev,
        coords: {
          latitude: String(location.coords.latitude),
          longitude: String(location.coords.longitude),
        },
      }));
    } catch (error) {
      console.error("Failed to fetch location:", error);
      setLocationError("Failed to fetch location. Using default location.");
      setPickupLocation({
        address: "Location unavailable",
        coords: DEFAULT_COORDS,
      });
      setMapLoading(false);
      setGeocodingLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      setGeocodingLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&components=country:NG&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        setPickupLocation({
          address: data.results?.[0]?.formatted_address || "Unknown Location",
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
        setPickupLocation({
          address: "Unable to fetch address",
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });
      } finally {
        setMapLoading(false);
        setGeocodingLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (userLocation?.coords) {
      riderApi
        .getNearbyDrivers({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        })
        .then((res) => {
          const drivers: Driver[] = res.data.map((driver: any) => ({
            id: driver.id,
            name: driver.name,
            vehicle: driver.vehicle.model,
            vehicleNumber: driver.vehicle.plateNumber,
            coordinates: {
              latitude: driver.coordinates.latitude,
              longitude: driver.coordinates.longitude,
            },
            picture: MARKER_ICONS.user,
            rating: 4.5,
          }));
          setNearbyDrivers(drivers);
        })
        .catch((err) => {
          console.log("err", err.response?.data || err.message);
        });
    }
  }, [userLocation?.coords]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (userLocation?.coords)
      reverseGeocode(
        userLocation.coords.latitude,
        userLocation.coords.longitude
      );
  }, [userLocation?.coords, reverseGeocode]);

  useEffect(() => {
    if (
      !["confirm", "search", "paired", "arrived", "trip"].includes(stage) ||
      !pickupLocation.coords.latitude ||
      !destinationLocation.coords.latitude
    )
      return;
    const coords = [
      {
        latitude: Number(pickupLocation.coords.latitude),
        longitude: Number(pickupLocation.coords.longitude),
      },
      {
        latitude: Number(destinationLocation.coords.latitude),
        longitude: Number(destinationLocation.coords.longitude),
      },
    ];
    if (driver?.coordinates && ["paired", "arrived", "trip"].includes(stage)) {
      coords.push({
        latitude: Number(driver.coordinates.latitude),
        longitude: Number(driver.coordinates.longitude),
      });
    }
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: {
        top: scale(100),
        bottom: scale(200),
        right: scale(20),
        left: scale(20),
      },
      animated: true,
    });
  }, [
    stage,
    pickupLocation.coords,
    destinationLocation.coords,
    driver?.coordinates,
  ]);

  useEffect(() => {
    let timer: any;
    if (stage === "search") {
      setBookingLoading(true);
      timer = setTimeout(() => {
        setDriver({
          id: "driver1",
          name: "Abdullah Gumi",
          vehicle: "Tricycle",
          coordinates: {
            latitude: Number(pickupLocation.coords.latitude) + 0.001,
            longitude: Number(pickupLocation.coords.longitude) + 0.001,
          },
          picture: MARKER_ICONS.user,
          rating: 4.8,
          vehicleNumber: "1234-KEK",
        });
        setRideId("ride123");
        setStage("paired");
        setBookingLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
    } else if (stage === "paired") {
      timer = setTimeout(() => {
        setStage("arrived");
        setDriver((prev) =>
          prev
            ? {
                ...prev,
                coordinates: {
                  latitude: Number(pickupLocation.coords.latitude),
                  longitude: Number(pickupLocation.coords.longitude),
                },
              }
            : null
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 3000);
    } else if (stage === "arrived") {
      timer = setTimeout(() => {
        setStage("trip");
        setEta(TRICYCLE_OPTION.duration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
    } else if (stage === "trip") {
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
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [stage, pickupLocation.coords]);

  const handleWhereTo = useCallback(() => {
    setStage("input");
    bottomSheetRef.current?.snapToIndex(1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleSelectRecentDestination = useCallback(
    (destination: RecentDestination) => {
      setDestinationLocation(destination);
      setStage("confirm");
      bottomSheetRef.current?.snapToIndex(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    []
  );

  const handleDestinationSelected = useCallback((destination: LocationData) => {
    if (
      destination.address &&
      destination.coords.latitude &&
      destination.coords.longitude
    ) {
      setDestinationLocation(destination);
      setStage("confirm");
      bottomSheetRef.current?.snapToIndex(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleBookRide = useCallback(() => {
    setBookingLoading(true);
    setTimeout(() => {
      setBookingLoading(false);
      setStage("search");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  }, []);

  const handleBack = useCallback(() => {
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
  }, [stage, driver, eta]);

  const handleCancelRide = useCallback(() => {
    if (stage === "trip") {
      Alert.alert(
        "Cannot Cancel Ride",
        "The ride is in progress and cannot be canceled at this stage.",
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel your ride? You may be charged a cancellation fee.",
      [
        { text: "No, Keep Ride", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            setStage("initial");
            setDestinationLocation({
              address: "",
              coords: { latitude: "", longitude: "" },
            });
            setDriver(null);
            setRideId(null);
            setMessages([]);
            setEta("");
            bottomSheetRef.current?.snapToIndex(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(
              "Ride Cancelled",
              "Your ride has been cancelled successfully.",
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  }, [stage]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !rideId) return;
    setChatLoading(true);
    try {
      await chatApi.sendMessage(rideId, { content: newMessage });
      setNewMessage("");
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }, [newMessage, rideId]);

  const renderRecentDestination = useCallback(
    ({ item }: { item: RecentDestination }) => (
      <TouchableOpacity
        style={homeStyles.recentDestinationCard}
        onPress={() => handleSelectRecentDestination(item)}
        activeOpacity={0.7}
      >
        <Animated.View entering={ZoomIn.delay(100 * Number(item.id))}>
          <View style={homeStyles.recentDestinationContent}>
            <Image
              source={{ uri: MARKER_ICONS.pin }}
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
    ),
    [handleSelectRecentDestination]
  );

  const renderLocationCard = useCallback(
    () => (
      <View style={homeStyles.locationCard}>
        <View style={homeStyles.locationRow}>
          <Image
            source={{ uri: MARKER_ICONS.pickup }}
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
            source={{ uri: MARKER_ICONS.destination }}
            style={homeStyles.locationIcon}
          />
          <CustomText style={homeStyles.locationText}>
            {destinationLocation.address}
          </CustomText>
        </View>
      </View>
    ),
    [pickupLocation.address, destinationLocation.address, geocodingLoading]
  );

  const renderDriverInfo = useCallback(
    () => (
      <View style={homeStyles.confirmCard}>
        <View style={homeStyles.rideOptionHeader}>
          <Image
            source={{ uri: driver!.picture }}
            style={homeStyles.driverPicture}
          />
          <View style={homeStyles.driverInfoContainer}>
            <CustomText fontWeight="Bold" style={homeStyles.rideOptionTitle}>
              {driver!.name}
            </CustomText>
            <View style={homeStyles.ratingContainer}>
              <Image
                source={{ uri: MARKER_ICONS.star }}
                style={homeStyles.starIcon}
              />
              <CustomText style={homeStyles.rideOptionDescription}>
                {driver!.rating?.toFixed(1)}
              </CustomText>
            </View>
            <CustomText style={homeStyles.rideOptionDescription}>
              {driver!.vehicle} (Keke) • {driver!.vehicleNumber}
            </CustomText>
          </View>
        </View>
        <CustomText style={homeStyles.rideOptionDescription}>
          {stage === "paired"
            ? "Arriving in approximately 2-3 minutes"
            : "Your driver is at the pickup location"}
        </CustomText>
      </View>
    ),
    [driver, stage]
  );

  const renderContactButtons = useCallback(
    () => (
      <View style={homeStyles.contactButtonContainer}>
        <TouchableOpacity
          style={[homeStyles.contactButton, { marginRight: scale(8) }]}
          activeOpacity={0.7}
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
          onPress={() => {
            setStage("chat");
            bottomSheetRef.current?.snapToIndex(3);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
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
    ),
    []
  );

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
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
          {item.senderId === userId ? "You" : item.Sender.name}
        </CustomText>
        <CustomText style={homeStyles.messageText}>{item.content}</CustomText>
        <CustomText style={homeStyles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </CustomText>
      </Animated.View>
    ),
    [userId]
  );

  const renderChat = useCallback(
    () => (
      <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
        <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
          Chat with {driver?.name}
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
              renderItem={renderMessage}
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
    ),
    [driver, messages, newMessage, chatLoading, handleSendMessage]
  );

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
                  latitudeDelta: 0.003810113049217634,
                  longitudeDelta: 0.001899674534795892,
                }
              : INITIAL_REGION
          }
          showsUserLocation={stage === "initial" || stage === "input"}
          style={homeStyles.map}
        >
          {(stage === "confirm" ||
            stage === "search" ||
            stage === "paired" ||
            stage === "arrived" ||
            stage === "trip") &&
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
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={Platform.OS === "android" ? 3 : 4}
                  strokeColor={COLORS.primary}
                  onReady={(result) => {
                    console.log(result);
                    console.log(`Distance: ${result.distance} km`);
                    console.log(`Duration: ${result.duration} min`);
                  }}
                />
                <Marker
                  coordinate={{
                    latitude: Number(pickupLocation.coords.latitude),
                    longitude: Number(pickupLocation.coords.longitude),
                  }}
                >
                  <Image
                    source={{ uri: MARKER_ICONS.pickup }}
                    style={homeStyles.markerIcon}
                  />
                </Marker>
                <Marker
                  coordinate={{
                    latitude: Number(destinationLocation.coords.latitude),
                    longitude: Number(destinationLocation.coords.longitude),
                  }}
                >
                  <Image
                    source={{ uri: MARKER_ICONS.destination }}
                    style={homeStyles.markerIcon}
                  />
                </Marker>
              </>
            )}
          {driver?.coordinates &&
            ["paired", "arrived", "trip"].includes(stage) && (
              <Marker
                coordinate={{
                  latitude: Number(driver.coordinates.latitude),
                  longitude: Number(driver.coordinates.longitude),
                }}
              >
                <Image source={KekeImage} style={homeStyles.tricycleMarker} />
              </Marker>
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
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            activeOpacity={0.7}
            style={homeStyles.menuButton}
          >
            <MenuIcon />
          </TouchableOpacity>
        ) : stage === "input" || stage === "confirm" || stage === "chat" ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={homeStyles.backButton}
          >
            <CustomText fontWeight="Bold" style={homeStyles.backButtonText}>
              Back
            </CustomText>
          </TouchableOpacity>
        ) : stage === "search" || stage === "paired" || stage === "arrived" ? (
          <TouchableOpacity
            onPress={handleCancelRide}
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
                data={RECENT_DESTINATIONS}
                renderItem={renderRecentDestination}
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
              {renderLocationCard()}
              <View style={homeStyles.confirmCard}>
                <View style={homeStyles.rideOptionHeader}>
                  <Image source={KekeImage} style={homeStyles.rideOptionIcon} />
                  <View>
                    <CustomText
                      fontWeight="Bold"
                      style={homeStyles.rideOptionTitle}
                    >
                      {TRICYCLE_OPTION.type}
                    </CustomText>
                    <CustomText style={homeStyles.rideOptionDescription}>
                      {TRICYCLE_OPTION.description}
                    </CustomText>
                  </View>
                </View>
                <View style={homeStyles.rideOptionDetails}>
                  <CustomText
                    fontWeight="Bold"
                    style={homeStyles.rideOptionPrice}
                  >
                    {TRICYCLE_OPTION.price}
                  </CustomText>
                  <CustomText style={homeStyles.rideOptionDuration}>
                    {TRICYCLE_OPTION.duration}
                  </CustomText>
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
              {renderLocationCard()}
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
              {renderLocationCard()}
              {renderDriverInfo()}
              {renderContactButtons()}
            </Animated.View>
          )}

          {stage === "trip" && driver && (
            <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
              <CustomText fontWeight="Bold" style={homeStyles.sectionTitle}>
                Trip started
              </CustomText>
              {renderLocationCard()}
              <View style={homeStyles.tripCard}>
                <View style={homeStyles.driverHeader}>
                  <Image
                    source={{ uri: driver.picture }}
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
                        source={{ uri: MARKER_ICONS.star }}
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
                      {TRICYCLE_OPTION.price}
                    </CustomText>
                  </View>
                </View>
              </View>
              {renderContactButtons()}
            </Animated.View>
          )}

          {stage === "chat" && driver && renderChat()}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};
export default memo(HomeScreen);
