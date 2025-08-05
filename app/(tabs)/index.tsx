import { chatApi } from "@/api/endpoints/chat";
import { riderApi } from "@/api/endpoints/rider";
import { KekeImage } from "@/assets/images/Index";
import { MenuIcon } from "@/assets/svg";
import CustomText from "@/components/common/CustomText";
import LocationInput from "@/components/feature/home/LocationInput";
import { COLORS } from "@/constants/Colors";
import { CONSTANTS } from "@/constants/constants";
import { scale } from "@/constants/Layout";
import { formatDuration, numberWithCommas } from "@/utility";
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
import io, { Socket } from "socket.io-client";
import { homeStyles } from "../../styles/home-styles";

// Global error logging utility
const logError = (context: string, error: any) => {
  console.error(`${context} Error:`, {
    message: error.message,
    stack: error.stack,
    response: error.response?.data,
    code: error.code,
    timestamp: new Date().toISOString(),
  });
};

interface LocationData {
  address: string;
  coords: { latitude: string; longitude: string };
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
  profilePicture: string;
  phone: string;
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

const CONFIG = {
  GOOGLE_MAPS_API_KEY: "AIzaSyCEgN-LLuqFBE7nDzqa2zdgE-iYq-bKhQE",
  DEFAULT_COORDS: { latitude: "6.5244", longitude: "3.3792" },
  INITIAL_REGION: {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  MARKER_ICONS: {
    pickup: "https://img.icons8.com/color/48/000000/marker.png",
    destination: "https://img.icons8.com/color/48/000000/flag.png",
    pin: "https://img.icons8.com/ios/50/000000/pin.png",
    user: "https://img.icons8.com/ios/50/000000/user.png",
    star: "https://img.icons8.com/color/24/000000/star.png",
  },
  SOCKET_URL: "http://172.20.10.2:3000",
  RECENT_DESTINATIONS: [
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
  ],
} as const;

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
    address: "",
    coords: CONFIG.DEFAULT_COORDS,
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
  const [fare, setFare] = useState<number | null>(null);
  const [tripDuration, setTripDuration] = useState<number | null>(null);
  const [destinationDistance, setDestinationDistance] = useState(0);
  const [destinationDuration, setDestinationDuration] = useState(0);
  const [userId, setUserId] = useState<string>("rider1"); // Initialize userId

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<BottomSheetFlatListMethods>(null);
  const socketRef = useRef<Socket | null>(null);
  const snapPoints = useMemo(() => ["55%", "70%", "80%", "90%"], []);

  // Initialize Socket.IO with error handling
  useEffect(() => {
    try {
      socketRef.current = io(CONFIG.SOCKET_URL, { transports: ["websocket"] });
      if (rideId) {
        socketRef.current.emit("joinRide", rideId);
      }

      socketRef.current.on("connect_error", (error) => {
        logError("Socket Connection", error);
        Alert.alert(
          "Connection Error",
          "Failed to connect to server. Please check your network."
        );
      });

      socketRef.current.on(
        "ride:status-update",
        (data: {
          rideId: string;
          status: string;
          driver?: {
            driverId: string;
            phone: string;
            name: string;
            profilePicture: string;
            rating: number;
          };
          coordinates?: { latitude: number; longitude: number };
        }) => {
          try {
            if (data.rideId !== rideId) return;
            switch (data.status) {
              case "accepted":
                if (!data.driver) throw new Error("Driver data missing");
                setDriver({
                  id: data.driver.driverId,
                  name: data.driver.name,
                  vehicle: "Tricycle",
                  coordinates: {
                    latitude: Number(pickupLocation.coords.latitude) + 0.001,
                    longitude: Number(pickupLocation.coords.longitude) + 0.001,
                  },
                  profilePicture:
                    data.driver.profilePicture || CONFIG.MARKER_ICONS.user,
                  phone: data.driver.phone,
                  rating: data.driver.rating,
                  vehicleNumber: "1234-KEK",
                });
                setStage("paired");
                setBookingLoading(false);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                Alert.alert(
                  "Ride Accepted",
                  `Your ride has been accepted by ${data.driver.name}!`
                );
                break;
              case "arrived":
                setStage("arrived");
                if (data.driver?.driverId && data.coordinates) {
                  setDriver((prev) =>
                    prev
                      ? {
                          ...prev,
                          coordinates: {
                            latitude: data.coordinates.latitude,
                            longitude: data.coordinates.longitude,
                          },
                        }
                      : null
                  );
                }
                bottomSheetRef.current?.snapToIndex(2);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                Alert.alert(
                  "Driver Arrived",
                  `Your driver ${data.driver?.name || "has"} arrived!`
                );
                break;
              case "in_progress":
                setStage("trip");
                if (data.driver?.driverId && data.coordinates) {
                  setDriver((prev) =>
                    prev
                      ? {
                          ...prev,
                          coordinates: {
                            latitude: data.coordinates.latitude,
                            longitude: data.coordinates.longitude,
                          },
                        }
                      : null
                  );
                }
                bottomSheetRef.current?.snapToIndex(2);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                Alert.alert(
                  "Trip Started",
                  `Your trip with ${
                    data.driver?.name || "the driver"
                  } has started!`
                );
                break;
              case "cancelled":
              case "completed":
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
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                Alert.alert(
                  "Ride Update",
                  data.status === "cancelled"
                    ? "Your ride was cancelled."
                    : "Your ride has completed."
                );
                break;
              default:
                logError(
                  "Unknown Ride Status",
                  new Error(`Invalid status: ${data.status}`)
                );
            }
          } catch (error) {
            logError("Ride Status Update", error);
            Alert.alert("Error", "Failed to process ride status update.");
          }
        }
      );

      return () => {
        socketRef.current?.off("ride:status-update");
        socketRef.current?.disconnect();
      };
    } catch (error) {
      logError("Socket Initialization", error);
      Alert.alert("Error", "Failed to initialize server connection.");
    }
  }, [rideId]);

  // Fetch messages with error handling
  useEffect(() => {
    if (stage !== "chat" || !rideId) return;
    const fetchMessages = async () => {
      setChatLoading(true);
      try {
        const response = await chatApi.getMessages(rideId);
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid messages response format");
        }
        setMessages(response.data);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      } catch (error) {
        logError("Fetch Messages", error);
        Alert.alert("Error", "Failed to load chat messages. Please try again.");
        setMessages([]);
      } finally {
        setChatLoading(false);
      }
    };
    fetchMessages();
  }, [stage, rideId]);

  // Fetch user location with error handling
  const fetchLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (!location?.coords) {
        throw new Error("Invalid location data");
      }
      setUserLocation(location);
      setPickupLocation((prev) => ({
        ...prev,
        coords: {
          latitude: String(location.coords.latitude),
          longitude: String(location.coords.longitude),
        },
      }));
    } catch (error) {
      logError("Fetch Location", error);
      setLocationError("Failed to fetch location. Using default location.");
      setPickupLocation({ address: "", coords: CONFIG.DEFAULT_COORDS });
    } finally {
      setMapLoading(false);
      setGeocodingLoading(false);
    }
  }, []);

  // Reverse geocode with error handling
  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      setGeocodingLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`
        );
        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.status !== "OK") {
          throw new Error(`Geocoding failed: ${data.status}`);
        }
        setPickupLocation({
          address: data.results?.[0]?.formatted_address || "Unknown Location",
          coords: { latitude: String(latitude), longitude: String(longitude) },
        });
      } catch (error) {
        logError("Reverse Geocode", error);
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

  // Fetch nearby drivers with error handling
  useEffect(() => {
    if (!userLocation?.coords) return;
    const fetchNearbyDrivers = async () => {
      try {
        const res = await riderApi.getNearbyDrivers({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
        if (!Array.isArray(res.data)) {
          throw new Error("Invalid nearby drivers response format");
        }
        const drivers: Driver[] = res.data.map((driver: any) => ({
          id: driver.id || `driver-${Math.random()}`,
          name: driver.name || "Unknown Driver",
          vehicle: driver.vehicle?.model || "Tricycle",
          vehicleNumber: driver.vehicle?.plateNumber || "N/A",
          coordinates: {
            latitude:
              driver.coordinates?.latitude ||
              Number(CONFIG.DEFAULT_COORDS.latitude),
            longitude:
              driver.coordinates?.longitude ||
              Number(CONFIG.DEFAULT_COORDS.longitude),
          },
          profilePicture: driver.profilePicture || CONFIG.MARKER_ICONS.user,
          rating: driver.rating || 4.5,
          phone: driver.phone || "",
        }));
        setNearbyDrivers(drivers);
      } catch (error) {
        logError("Fetch Nearby Drivers", error);
        setNearbyDrivers([]);
      }
    };
    fetchNearbyDrivers();
  }, [userLocation?.coords]);

  // Initial location fetch
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Geocode user location
  useEffect(() => {
    if (userLocation?.coords) {
      reverseGeocode(
        userLocation.coords.latitude,
        userLocation.coords.longitude
      );
    }
  }, [userLocation?.coords, reverseGeocode]);

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
    userLocation?.coords,
    pickupLocation.coords,
    destinationLocation.coords,
    driver?.coordinates,
    mapLoading,
  ]);

  // ETA timer for trip stage
  useEffect(() => {
    let timer: any = null;
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
  }, [stage, eta]);

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

  const handleBookRide = useCallback(async () => {
    if (
      !pickupLocation.coords.latitude ||
      !destinationLocation.coords.latitude
    ) {
      Alert.alert(
        "Error",
        "Please select valid pickup and destination locations."
      );
      return;
    }
    setBookingLoading(true);
    try {
      const response = await riderApi.requestRide({
        pickupLocation: {
          address: pickupLocation.address,
          latitude: Number(pickupLocation.coords.latitude),
          longitude: Number(pickupLocation.coords.longitude),
        },
        dropoffLocation: {
          address: destinationLocation.address,
          latitude: Number(destinationLocation.coords.latitude),
          longitude: Number(destinationLocation.coords.longitude),
        },
        distanceInKm: Number(destinationDistance),
        durationInMinutes: Number(destinationDuration),
        paymentMethod: "cash",
        promoCode: "",
      });
      if (response?.status !== 201 || !response.data?.ride?.id) {
        throw new Error("Invalid response from ride request");
      }
      const responseRideId = response.data.ride.id;
      setRideId(responseRideId);
      socketRef.current?.emit("joinRide", responseRideId);
      setStage("search");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      logError("Book Ride", error);
      Alert.alert("Error", "Failed to book ride. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }, [
    destinationLocation,
    pickupLocation,
    destinationDistance,
    destinationDuration,
  ]);

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

  const handleCancelRide = useCallback(async () => {
    if (stage === "trip") {
      Alert.alert(
        "Cannot Cancel Ride",
        "The ride is in progress and cannot be canceled at this stage.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!rideId) {
      Alert.alert("Error", "No active ride to cancel.");
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
          onPress: async () => {
            try {
              setBookingLoading(true);
              const { status } = await riderApi.cancelRide(rideId);
              if (status !== 200) {
                throw new Error("Failed to cancel ride");
              }
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
                "Your ride has been cancelled successfully."
              );
            } catch (error) {
              logError("Cancel Ride", error);
              Alert.alert("Error", "Failed to cancel ride. Please try again.");
            } finally {
              setBookingLoading(false);
            }
          },
        },
      ]
    );
  }, [stage, rideId]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !rideId) return;
    setChatLoading(true);
    try {
      await chatApi.sendMessage(rideId, { content: newMessage });
      setNewMessage("");
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      logError("Send Message", error);
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
    ),
    [handleSelectRecentDestination]
  );

  const renderLocationCard = useCallback(
    () => (
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
    ),
    [pickupLocation.address, destinationLocation.address, geocodingLoading]
  );

  const renderDriverInfo = useCallback(
    () => (
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
    ),
    [driver, stage]
  );

  const renderContactButtons = useCallback(
    () => (
      <View style={homeStyles.contactButtonContainer}>
        <TouchableOpacity
          style={[homeStyles.contactButton, { marginRight: scale(8) }]}
          activeOpacity={0.7}
          onPress={() => {
            try {
              // Implement call functionality here if needed
              Alert.alert("Call", "Calling driver is not implemented yet.");
            } catch (error) {
              logError("Initiate Call", error);
              Alert.alert("Error", "Failed to initiate call.");
            }
          }}
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
            try {
              setStage("chat");
              bottomSheetRef.current?.snapToIndex(3);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
              logError("Open Chat", error);
              Alert.alert("Error", "Failed to open chat.");
            }
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
    ),
    [userId]
  );

  const renderChat = useCallback(
    () => (
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
              onPress={() => {
                try {
                  navigation.toggleDrawer();
                } catch (error) {
                  logError("Toggle Drawer", error);
                  Alert.alert("Error", "Failed to open navigation menu.");
                }
              }}
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
                data={CONFIG.RECENT_DESTINATIONS}
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
