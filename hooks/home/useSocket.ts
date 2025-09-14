import { CONFIG } from "@/constants/home";
import { useAppStore } from "@/stores/useAppStore";
import { logError } from "@/utility";
import { Storage } from "@/utility/asyncStorageHelper";
import { RefObject, useEffect, useRef } from "react";
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
       

        socketRef.current.on("ride:accepted", ()=> {});
        socketRef.current.on("ride:arrived", ()=> {});
        socketRef.current.on("ride:started", ()=> {});
        socketRef.current.on("ride:completed", ()=> {});
        socketRef.current.on("ride:cancelled", ()=> {});

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
    pickupLocation,
    setEta,
    bottomSheetRef,
  ]);

  return socketRef;
};
