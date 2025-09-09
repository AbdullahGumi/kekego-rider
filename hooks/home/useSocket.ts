import { CONFIG } from "@/constants/home";
import { Driver, LocationData, Message, RideStage } from "@/types/home";
import { logError } from "@/utility";
import { Storage } from "@/utility/asyncStorageHelper";
import * as Haptics from "expo-haptics";
import { RefObject, useEffect, useRef } from "react";
import { Alert } from "react-native";
import io, { Socket } from "socket.io-client";

export const useSocket = (
  rideId: string | null,
  setStage: (stage: RideStage) => void,
  setDriver: React.Dispatch<React.SetStateAction<Driver | null>>,
  pickupLocation: LocationData,
  setMessages: (messages: Message[]) => void,
  setEta: (eta: string) => void,
  bottomSheetRef: RefObject<any>
) => {
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
        if (rideId) {
          socketRef.current.emit("joinRide", rideId);
        }

        socketRef.current.on("connect_error", (error) => {
          logError("Socket Connection", error);
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
                      longitude:
                        Number(pickupLocation.coords.longitude) + 0.001,
                    },
                    profilePicture:
                      data.driver.profilePicture || CONFIG.MARKER_ICONS.user,
                    phone: data.driver.phone,
                    rating: data.driver.rating,
                    vehicleNumber: "1234-KEK",
                  });
                  setStage("paired");
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
                    setDriver((prev: Driver | null) =>
                      prev
                        ? {
                            ...prev,
                            coordinates: {
                              latitude: data.coordinates!.latitude,
                              longitude: data.coordinates!.longitude,
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
                              latitude: data.coordinates!.latitude,
                              longitude: data.coordinates!.longitude,
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
                  setDriver(null);
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
    };

    initializeSocket();
  }, [
    rideId,
    setStage,
    setDriver,
    pickupLocation,
    setMessages,
    setEta,
    bottomSheetRef,
  ]);

  return socketRef;
};
