import { CONFIG } from "@/constants/home";
import { useAppStore } from "@/stores/useAppStore";
import { logError } from "@/utility";
import { Storage } from "@/utility/asyncStorageHelper";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect } from "react";
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
        socketRef.current = io(CONFIG.SOCKET_URL, {
          auth: {
            token: token,
          },
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
          Toast.show({
            type: "customToast",
            text1: `New message from driver`,
          });
        });

        socketRef.current.on(`driver:location-update`, (data) => {
          updateDriverLocation({
            latitude: data.coords?.latitude,
            longitude: data.coords?.longitude,
          });
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

        socketRef.current.on("connect_error", (error) => {
          logError("Socket Connection", error);
        });

        return () => {
          socketRef.current?.off("ride:accepted");
          socketRef.current?.off("ride:arrived");
          socketRef.current?.off("ride:started");
          socketRef.current?.off("ride:completed");
          socketRef.current?.off("ride:cancelled");
          socketRef.current?.off("message:receive");
          socketRef.current?.off("driver:location-update");
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
