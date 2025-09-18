import { Storage } from "@/utility/asyncStorageHelper";
import BottomSheet from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { RefObject } from "react";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import MapView from "react-native-maps";
import { Socket } from "socket.io-client";
import { create } from "zustand";

type User = {
  id: string;
  phone: string;
  name: string;
  email: string;
  gender: string;
  role: string;
};

export type Driver = {
  id: string;
  name: string;
  vehicle: {
    plateNumber: string;
    vehicleNumber: string;
  };
  location: { latitude: number; longitude: number };
  profilePicture: string;
  phone: string;
  rating?: number;
};

type LocationData = {
  address: string;
  coords: { latitude: string; longitude: string };
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

  // Ride State
  rideState: RideState;

  // Chat State
  messages: IMessage[];

  // Actions
  setUserLocation: (location: Location.LocationObject | null) => void;
  setPickupLocation: (location: LocationData) => void;
  setDestinationLocation: (location: LocationData) => void;
  updateDriverLocation: (location: {
    latitude: number;
    longitude: number;
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

  // Chat Actions
  setMessages: (messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;

  // Bulk actions
  updateRideState: (updates: Partial<RideState>) => void;

  // Utils
  resetRideState: () => void;
};

type AppActions = {
  setUser: (user: User | null, token?: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  resetStore: () => Promise<void>;
};

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  token: null,

  mapRef: null,
  setMapRef: (ref) => set({ mapRef: ref }),

  bottomSheetRef: null,
  setBottomSheetRef: (ref) => set({ bottomSheetRef: ref }),

  socketRef: null,
  setSocketRef: (ref) => set({ socketRef: ref }),

  // Location state initialization
  userLocation: null,
  pickupLocation: { address: "", coords: { latitude: "", longitude: "" } },
  destinationLocation: { address: "", coords: { latitude: "", longitude: "" } },

  // Ride state initialization
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

  // Chat state initialization
  messages: [],

  // Location actions
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

  // Ride state actions
  setRideStage: (stage) =>
    set((state) => ({
      rideState: { ...state.rideState, stage },
    })),
  setDriver: (driver) =>
    set((state) => ({
      rideState: { ...state.rideState, driver },
    })),
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

  // Chat actions
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: GiftedChat.append(state.messages, [message]),
    })),

  // Bulk actions
  updateRideState: (updates) =>
    set((state) => ({
      rideState: { ...state.rideState, ...updates },
    })),

  // Utils
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
      messages: [], // also reset messages when ride ends
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
      set({ user: null, token: null, messages: [] });
    } catch (err) {
      console.error("Failed to reset store", err);
    }
  },
}));
