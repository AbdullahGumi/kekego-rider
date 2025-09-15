import { CONFIG } from "@/constants/home";
import { useAppStore } from "@/stores/useAppStore";
import { logError } from "@/utility";
import { Storage } from "@/utility/asyncStorageHelper";
import * as Haptics from "expo-haptics";
import { RefObject, useEffect, useRef } from "react";
import { Alert } from "react-native";
import io, { Socket } from "socket.io-client";

export const useSocket = (
  bottomSheetRef: RefObject<any>
) => {

   const rideState = useAppStore((state) => state.rideState);
    const pickupLocation = useAppStore((state) => state.pickupLocation);

    const {
      setEta,
      setRideStage,
      setDriver,
      setFare,
      resetRideState,
    } = useAppStore();

  const { rideId } = rideState;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = await Storage.get("access_token");
        socketRef.current = io(CONFIG.SOCKET_URL, {
          auth: {
            token: token,
          },
        });


        socketRef.current.on("ride:accepted", (data) => {
          logError("ride:accepted", data);

          if (data.driver) {
            setDriver(data.driver);
          }

          if (data.eta) {
            setEta(data.eta);
          }

          if (data.fare) {
            setFare(data.fare);
          }

          setRideStage("paired");

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:arrived", (data) => {
          logError("ride:arrived", data);

          setRideStage("arrived");

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:started", (data) => {
          logError("ride:started", data);

          if (data.eta) {
            setEta(data.eta);
          }

          setRideStage("trip");

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:completed", (data) => {
          logError("ride:completed", data);

          resetRideState();

          Alert.alert("Ride Completed", "Your ride has been completed successfully.");

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
        socketRef.current.on("ride:cancelled", (data) => {
          logError("ride:cancelled", data);

          resetRideState();

          Alert.alert("Ride Cancelled", "Your ride has been cancelled by the driver.");
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
  }, [
    rideId,
    setRideStage,
    setDriver,
    setEta,
    setFare,
    resetRideState,
    pickupLocation,
    bottomSheetRef,
  ]);

  return socketRef;
};
