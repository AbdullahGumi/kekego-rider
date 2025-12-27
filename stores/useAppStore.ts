import { Storage } from "@/utility/asyncStorageHelper";
import BottomSheet from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { router } from "expo-router";
import { RefObject } from "react";
import MapView from "react-native-maps";
import { Socket } from "socket.io-client";
import { create } from "zustand";

export interface IMessage {
  _id: string | number;
  text: string;
  createdAt: Date | number;
  user: {
    _id: string | number;
    name?: string;
    avatar?: string | number;
  };
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  quickReplies?: any;
}

type User = {
  id: string;
  phone: string;
  name: string;
  email: string;
  gender: string;
  role: string;
  profilePicture?: string;
};

export type Driver = {
  id: string;
  name: string;
  vehicle: {
    plateNumber: string;
    vehicleNumber: string;
  };
  location: { latitude: number; longitude: number; heading?: number };
  profilePicture: string;
  phone: string;
  averageRating?: number;
};

type LocationData = {
  address: string;
  coords: { latitude: string; longitude: string };
};

export type DirectionsData = {
  distance: number;
  duration: number;
  coordinates: { latitude: number; longitude: number }[];
  legs: {
    distance: number;
    duration: number;
    startLocation: { latitude: number; longitude: number };
    endLocation: { latitude: number; longitude: number };
    instructions: string;
    polyline: { lat: number; lng: number }[];
  }[];
  waypointOrder: number[];
};

type RideStage =
  | "initial"
  | "input"
  | "confirm"
  | "search"
  | "paired"
  | "arrived"
  | "trip"
  | "chat";

type RideState = {
  stage: RideStage;
  driver: Driver | null;
  eta: string;
  fare: number | null;
  tripDuration: number | null;
  destinationDistance: number;
  destinationDuration: number;
  rideId: string | null;
  mapLoading: boolean;
};

type AppState = {
  user: User | null;
  token: string | null;
  fcmToken: string | null;

  mapRef: RefObject<MapView | null> | null;
  setMapRef: (ref: RefObject<MapView | null> | null) => void;

  bottomSheetRef: RefObject<BottomSheet | null> | null;
  setBottomSheetRef: (ref: RefObject<BottomSheet | null> | null) => void;

  socketRef: RefObject<Socket | null> | null;
  setSocketRef: (ref: RefObject<Socket | null> | null) => void;

  // Location State
  userLocation: Location.LocationObject | null;
  pickupLocation: LocationData;
  destinationLocation: LocationData;
  pickupDirections: DirectionsData | null;
  destinationDirections: DirectionsData | null;

  // Ride State
  rideState: RideState;

  // Chat State
  messages: IMessage[];

  // Actions
  setFcmToken: (token: string | null) => void;
  setUserLocation: (location: Location.LocationObject | null) => void;
  setPickupLocation: (location: LocationData) => void;
  setDestinationLocation: (location: LocationData) => void;
  updateDriverLocation: (location: {
    latitude: number;
    longitude: number;
    heading?: number;
  }) => void;

  // Ride State Actions
  setRideStage: (stage: RideStage) => void;
  setDriver: (driver: Driver | null) => void;
  setEta: (eta: string) => void;
  setFare: (fare: number | null) => void;
  setTripDuration: (duration: number | null) => void;
  setDestinationDistance: (distance: number) => void;
  setDestinationDuration: (duration: number) => void;
  setRideId: (rideId: string | null) => void;
  setMapLoading: (loading: boolean) => void;
  setPickupDirections: (directions: DirectionsData | null) => void;
  setDestinationDirections: (directions: DirectionsData | null) => void;

  // Chat Actions
  setMessages: (messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;

  // Bulk actions
  updateRideState: (updates: Partial<RideState>) => void;

  // Active ride handling
  setActiveRide: (activeRide: any) => void;
  refreshActiveRide: () => Promise<void>;

  // Utils
  resetRideState: () => void;
};

type AppActions = {
  setUser: (user: User | null, token?: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  resetStore: () => Promise<void>;
};

type AppStore = AppState & AppActions;

const initialDataState: AppState = {
  user: null,
  token: null,
  fcmToken: null,

  mapRef: null,
  setMapRef: () => { }, // Keep these as they are part of the state definition in the interface but will be overwritten by the store creator
  bottomSheetRef: null,
  setBottomSheetRef: () => { },
  socketRef: null,
  setSocketRef: () => { },

  userLocation: null,
  pickupLocation: { address: "", coords: { latitude: "", longitude: "" } },
  destinationLocation: { address: "", coords: { latitude: "", longitude: "" } },

  rideState: {
    stage: "initial",
    driver: null,
    eta: "",
    fare: null,
    tripDuration: null,
    destinationDistance: 0,
    destinationDuration: 0,
    rideId: null,
    mapLoading: true,
  },
  pickupDirections: null,
  destinationDirections: null,

  messages: [],

  setFcmToken: () => { },
  setUserLocation: () => { },
  setPickupLocation: () => { },
  setDestinationLocation: () => { },
  updateDriverLocation: () => { },

  setRideStage: () => { },
  setDriver: () => { },
  setEta: () => { },
  setFare: () => { },
  setTripDuration: () => { },
  setDestinationDistance: () => { },
  setDestinationDuration: () => { },
  setRideId: () => { },
  setMapLoading: () => { },
  setPickupDirections: () => { },
  setDestinationDirections: () => { },

  setMessages: () => { },
  addMessage: () => { },

  updateRideState: () => { },
  setActiveRide: () => { },
  refreshActiveRide: async () => { },
  resetRideState: () => { },
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialDataState,

  setMapRef: (ref) => set({ mapRef: ref }),
  setBottomSheetRef: (ref) => set({ bottomSheetRef: ref }),
  setSocketRef: (ref) => set({ socketRef: ref }),

  setFcmToken: (token) => set({ fcmToken: token }),

  setUserLocation: (location) => set({ userLocation: location }),
  setPickupLocation: (location) => set({ pickupLocation: location }),
  setDestinationLocation: (location) => set({ destinationLocation: location }),
  updateDriverLocation: (location) =>
    set((state) => ({
      rideState: {
        ...state.rideState,
        driver: state.rideState.driver
          ? {
            ...state.rideState.driver,
            location: location,
          }
          : null,
      },
    })),

  setRideStage: (stage) =>
    set((state) => ({
      rideState: { ...state.rideState, stage },
    })),
  setDriver: (driver) => {
    set((state) => ({
      rideState: { ...state.rideState, driver },
    }));
  },
  setEta: (eta) =>
    set((state) => ({
      rideState: { ...state.rideState, eta },
    })),
  setFare: (fare) =>
    set((state) => ({
      rideState: { ...state.rideState, fare },
    })),
  setTripDuration: (duration) =>
    set((state) => ({
      rideState: { ...state.rideState, tripDuration: duration },
    })),
  setDestinationDistance: (distance) =>
    set((state) => ({
      rideState: { ...state.rideState, destinationDistance: distance },
    })),
  setDestinationDuration: (duration) =>
    set((state) => ({
      rideState: { ...state.rideState, destinationDuration: duration },
    })),
  setRideId: (rideId) =>
    set((state) => ({
      rideState: { ...state.rideState, rideId },
    })),
  setMapLoading: (loading) =>
    set((state) => ({
      rideState: { ...state.rideState, mapLoading: loading },
    })),
  setPickupDirections: (directions) => set({ pickupDirections: directions }),
  setDestinationDirections: (directions) =>
    set({ destinationDirections: directions }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [message, ...state.messages],
    })),

  updateRideState: (updates) =>
    set((state) => ({
      rideState: { ...state.rideState, ...updates },
    })),

  setActiveRide: (activeRide) => {
    let stage: RideStage = "search";
    let shouldNavigateToRating = false;

    switch (activeRide.status) {
      case "requested":
        stage = "search";
        break;
      case "accepted":
        stage = "paired";
        break;
      case "arrived":
        stage = "arrived";
        break;
      case "in_progress":
      case "started":
        stage = "trip";
        break;
      case "completed":
        // For completed rides, we treat it as "trip" (or similar) to ensure data exists,
        // but flag for navigation.
        stage = "trip";
        shouldNavigateToRating = true;
        break;
      default:
        stage = "search";
    }

    // Perform side effect outside of the set function if possible,
    // or ensure it happens 
    if (shouldNavigateToRating) {
      router.replace("/rating");
    }

    const driver = activeRide.driver
      ? {
        id: activeRide.driver.id,
        name: activeRide.driver.name,
        phone: activeRide.driver.phone,
        profilePicture: activeRide.driver.profilePicture,
        vehicle: {
          plateNumber: activeRide.driver.vehicle.plateNumber,
          vehicleNumber: activeRide.driver.vehicle.vehicleNumber,
        },
        location: {
          latitude: activeRide.driver.location.coords.latitude,
          longitude: activeRide.driver.location.coords.longitude,
        },
        averageRating: activeRide.driver.averageRating,
      }
      : null;

    set((state) => ({
      pickupLocation: {
        address: activeRide.pickupLocation.address,
        coords: {
          latitude: activeRide.pickupLocation.coords.latitude.toString(),
          longitude: activeRide.pickupLocation.coords.longitude.toString(),
        },
      },
      destinationLocation: {
        address: activeRide.dropoffLocation.address,
        coords: {
          latitude: activeRide.dropoffLocation.coords.latitude.toString(),
          longitude: activeRide.dropoffLocation.coords.longitude.toString(),
        },
      },
      rideState: {
        ...state.rideState,
        stage,
        driver,
        fare: activeRide.actualFare || activeRide.estimatedFare,
        rideId: activeRide.id,
        mapLoading: false,
      },
    }));
  },

  refreshActiveRide: async () => {
    try {
      const { riderApi } = require("@/api/endpoints/rider");
      const response = await riderApi.getActiveRide();
      const activeRide = response.data.data.ride;
      if (activeRide) {
        get().setActiveRide(activeRide);
      } else {
        get().resetRideState();
      }
    } catch (error) {
      console.error("Failed to refresh active ride (Rider Store):", error);
    }
  },

  resetRideState: () =>
    set({
      rideState: {
        stage: "initial",
        driver: null,
        eta: "",
        fare: null,
        tripDuration: null,
        destinationDistance: 0,
        destinationDuration: 0,
        rideId: null,
        mapLoading: false,
      },
      messages: [],
    }),

  setUser: async (user, token) => {
    try {
      if (user && token) {
        await Storage.set("user", JSON.stringify(user));
        await Storage.set("access_token", token);
        set({ user, token });
      } else {
        await Storage.remove("user");
        await Storage.remove("access_token");
        set({ user: null, token: null });
      }
    } catch (err) {
      console.error("Failed to set user", err);
    }
  },
  updateUserProfile: async (updates) => {
    try {
      const currentState = get();
      if (currentState.user) {
        const updatedUser = { ...currentState.user, ...updates };
        await Storage.set("user", JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
    } catch (err) {
      console.error("Failed to update user profile", err);
    }
  },

  loadFromStorage: async () => {
    try {
      const user = await Storage.get<string>("user");
      const token = await Storage.get<string>("access_token");
      set({
        user: user ? JSON.parse(user) : null,
        token: token || null,
      });
    } catch (err) {
      console.error("Failed to load from storage", err);
    }
  },
  resetStore: async () => {
    try {
      await Promise.all([
        Storage.remove("user"),
        Storage.remove("access_token"),
      ]);
      // Only reset data properties, NOT actions
      set((state) => ({
        user: null,
        token: null,
        fcmToken: state.fcmToken, // preserve device token

        // Reset refs to null, but DO NOT overwrite the setter functions
        mapRef: null,
        bottomSheetRef: null,
        socketRef: null,

        userLocation: null,
        pickupLocation: { address: "", coords: { latitude: "", longitude: "" } },
        destinationLocation: { address: "", coords: { latitude: "", longitude: "" } },

        rideState: {
          stage: "initial",
          driver: null,
          eta: "",
          fare: null,
          tripDuration: null,
          destinationDistance: 0,
          destinationDuration: 0,
          rideId: null,
          mapLoading: true,
        },
        pickupDirections: null,
        destinationDirections: null,

        messages: [],
      }));
    } catch (err) {
      console.error("Failed to reset store", err);
    }
  },
}));
