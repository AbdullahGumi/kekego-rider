import { CONFIG } from "@/constants/home";
import { useAppStore } from "@/stores/useAppStore";
import { logError } from "@/utility";
import { Storage } from "@/utility/asyncStorageHelper";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";
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
  } = useAppStore();

  const { rideId } = rideState;

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
        socketRef.current = io(CONFIG.SOCKET_URL, {
          auth: {
            token: token,
          },
        });

        socketRef.current.on("ride:accepted", (data) => {
          console.log("ride:accepted", data);

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
        });

        socketRef.current.on(`driver:location-update`, (data) => {
          updateDriverLocation({
            latitude: data.coordinates?.latitude,
            longitude: data.coordinates?.longitude,
          });
        });

        socketRef.current.on("ride:arrived", (data) => {
          console.log("ride:arrived", data);
          setRideStage("arrived");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:started", (data) => {
          console.log("ride:started", data);

          setRideStage("trip");

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:completed", (data) => {
          console.log("ride:completed", data);
          router.push("/rating");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:cancelled", (data) => {
          console.log("ride:cancelled", data);

          resetRideState();

          Alert.alert("Ride Cancelled", data.reason);
        });

        socketRef.current.on("connect_error", (error) => {
          logError("Socket Connection", error);
        });

        return () => {
          socketRef.current?.off("ride:accepted");
          socketRef.current?.off("ride:arrived");
          socketRef.current?.off("ride:started");
          socketRef.current?.off("ride:completed");
          socketRef.current?.off("ride:cancelled");
          socketRef.current?.disconnect();
        };
      } catch (error) {
        logError("Socket Initialization", error);
      }
    };

    initializeSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId, pickupLocation, bottomSheetRef, socketRef]);

  return socketRef;
};
