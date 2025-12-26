import { useAppStore } from "@/stores/useAppStore";
import { logError } from "@/utility";
import { Storage } from "@/utility/asyncStorageHelper";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import Toast from "react-native-toast-message";
import io from "socket.io-client";

export const useSocket = () => {
  const rideState = useAppStore((state) => state.rideState);
  const pickupLocation = useAppStore((state) => state.pickupLocation);
  const bottomSheetRef = useAppStore((state) => state.bottomSheetRef);
  const socketRef = useAppStore((state) => state.socketRef);

  const {
    setRideStage,
    setDriver,
    updateDriverLocation,
    resetRideState,
    addMessage,
    setPickupDirections,
    setDestinationDirections,
    setEta,
  } = useAppStore();
  const { rideId, driver, stage } = rideState;

  // // Ask the server for current rooms
  // socketRef?.current?.emit("ride:get-rooms", (rooms) => {
  //   console.log("Rider is in rooms:", rooms);
  // });

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        if (!socketRef) {
          // ref not set in store yet
          return;
        }
        if (socketRef.current) {
          // socket already exists, skip initialization
          return;
        }

        const token = await Storage.get("access_token");
        socketRef.current = io(process.env.EXPO_PUBLIC_BASE_URL, {
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          auth: {
            token: token,
          },
        });

        // Force reconnect on app foreground if disconnected
        const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
          if (nextAppState === "active" && socketRef.current?.disconnected) {
            console.log(
              "App foregrounded: Disconnected socket detected. Reconnecting..."
            );
            socketRef.current.connect();
          }
        });


        socketRef.current.on("connect", () => {
          console.log("Socket connected");
          const { rideState } = useAppStore.getState();
          const { rideId, stage } = rideState;

          if (
            rideId &&
            stage !== "initial" &&
            stage !== "input" &&
            stage !== "confirm"
          ) {
            console.log("Re-joining ride room on reconnect:", rideId);
            socketRef.current?.emit("ride:join-room", { rideId });
          }
        });

        socketRef.current.on("ride:accepted", (data) => {
          console.log("ride:accepted", data);
          Toast.show({
            type: "customToast",
            text1: `${data.driver.name} is on the way!`,
          });

          if (data.driver) {
            setDriver(data.driver);
          }

          setRideStage("paired");

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });

        socketRef.current.on("ride:join-room", ({ rideId }) => {
          socketRef.current?.emit("ride:join-room", { rideId }); // Client emits back for server to handle
        });

        socketRef.current.on("message:receive", (msg) => {
          addMessage(msg);
          // Only show toast if the message is NOT from the current user
          const currentUser = useAppStore.getState().user;
          if (msg.user._id !== currentUser?.id) {
            Toast.show({
              type: "customToast",
              text1: `New message from driver`,
            });
          }
        });

        socketRef.current.on(`driver:location-update`, (data) => {
          console.log("driver:location-update", data);
          updateDriverLocation({
            latitude: data.coords?.latitude,
            longitude: data.coords?.longitude,
            heading: data.heading,
          });
        });

        socketRef.current.on("driver:route-updated", (data) => {
          console.log("driver:route-updated", data.newDirections);
          //data === routeType can either be "pickup" | "destination"
          if (data.routeType === "pickup") {
            setPickupDirections(data.newDirections);
            setEta(`${Math.ceil(data.newDirections.duration)} min`);
          } else if (data.routeType === "destination") {
            setDestinationDirections(data.newDirections);
            // Don't override ETA during active trip
            if (stage === "arrived") {
              setEta(`${Math.ceil(data.newDirections.duration)} min`);
            }
          }
        });

        socketRef.current.on("ride:arrived", (data) => {
          console.log("ride:arrived", data);
          Toast.show({
            type: "customToast",
            text1: `Driver is at pickup location!`,
          });
          setRideStage("arrived");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:started", (data) => {
          console.log("ride:started", data);
          Toast.show({
            type: "customToast",
            text1: `Your trip has started!`,
          });
          setRideStage("trip");

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:completed", (data) => {
          console.log("ride:completed", data);
          Toast.show({
            type: "customToast",
            text1: `You've arrived at your destination!`,
          });
          router.push("/rating");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:cancelled", (data) => {
          console.log("ride:cancelled", data);

          resetRideState();
          Toast.show({
            type: "customToast",
            text1: "Ride Cancelled",
            text2: data.reason,
          });
        });
        socketRef.current.on("trip:driver-to-pickup-directions", (data) => {
          if (data.directions) {
            setPickupDirections(data.directions);
            setEta(`${Math.ceil(data.directions.duration)} min`);
          }
        });

        socketRef.current.on(
          "trip:driver-to-destination-directions",
          (data) => {
            if (data.directions) {
              setDestinationDirections(data.directions);
              // Don't override ETA during active trip
              if (stage === "arrived") {
                setEta(`${Math.ceil(data.directions.duration)} min`);
              }
            }
          }
        );
        socketRef.current.on("connect_error", (error) => {
          logError("Socket Connection", error);
        });

        return () => {
          subscription.remove();
          socketRef.current?.off("connect");
          socketRef.current?.off("ride:accepted");
          socketRef.current?.off("ride:arrived");
          socketRef.current?.off("ride:started");
          socketRef.current?.off("ride:completed");
          socketRef.current?.off("ride:cancelled");
          socketRef.current?.off("message:receive");
          socketRef.current?.off("driver:location-update");
          socketRef.current?.off("trip:driver-to-pickup-directions");
          socketRef.current?.off("trip:driver-to-destination-directions");
          socketRef.current?.disconnect();
        };
      } catch (error: any) {
        logError("Socket Initialization", error.response?.data);
      }
    };

    initializeSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rideId,
    pickupLocation,
    bottomSheetRef,
    socketRef,
    driver?.location.latitude,
  ]);

  // Join ride room for active rides
  useEffect(() => {
    if (
      socketRef?.current &&
      rideId &&
      stage !== "initial" &&
      stage !== "input" &&
      stage !== "confirm"
    ) {
      console.log("Joining ride room for active ride:", rideId);
      socketRef.current.emit("ride:join-room", { rideId });
    }
  }, [rideId, stage, socketRef]);

  return socketRef;
};
