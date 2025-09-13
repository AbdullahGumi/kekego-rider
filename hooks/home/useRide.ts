import { riderApi } from "@/api/endpoints/rider";
import { LocationData, Message, RideStage } from "@/types/home";
import { logError } from "@/utility";
import * as Haptics from "expo-haptics";
import { RefObject, useCallback, useState } from "react";
import { Alert } from "react-native";
import { Socket } from "socket.io-client";

export const useRide = (
  pickupLocation: LocationData,
  destinationLocation: LocationData,
  setRideStage: (stage: RideStage) => void,
  setRideId: React.Dispatch<React.SetStateAction<string | null>>,
  setMessages: (messages: Message[]) => void,
  setEta: (eta: string) => void,
  bottomSheetRef: RefObject<any>,
  socketRef: RefObject<Socket | null>,
  destinationDistance: number,
  destinationDuration: number
) => {
  const [bookingLoading, setBookingLoading] = useState(false);
  const [rideId, localSetRideId] = useState<string | null>(null); // Local state for consistency

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
      localSetRideId(responseRideId);
      setRideId(responseRideId);

          socketRef.current?.emit("joinRide", responseRideId, (response: any) => {
            console.log("Join ride callback response:", response);
            if (response.success) {
              console.log(`✅ Successfully joined ride ${responseRideId}`);
              setRideStage("search");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              console.error("Failed to join ride:", response.error);
              Alert.alert("Error", `Failed to join ride: ${response.error}`);
            }
          });
    } catch (error: any) {
      Alert.alert("Error", error.response.data.error.message || "Failed to book ride.");
    } finally {
      setBookingLoading(false);
    }
  }, [
    destinationLocation,
    pickupLocation,
    destinationDistance,
    destinationDuration,
    setRideStage,
    setRideId,
    socketRef,
  ]);

  const handleCancelRide = useCallback(
    async (stage: string) => {
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
                setRideStage("initial");
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
                Alert.alert(
                  "Error",
                  "Failed to cancel ride. Please try again."
                );
              } finally {
                setBookingLoading(false);
              }
            },
          },
        ]
      );
    },
    [rideId, setRideStage, setRideId, setMessages, setEta, bottomSheetRef]
  );

  return { bookingLoading, handleBookRide, handleCancelRide };
};
