import { useAppStore } from "@/stores/useAppStore";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

export const useAppState = () => {
    const appState = useRef(AppState.currentState);
    const { refreshActiveRide, token } = useAppStore();

    useEffect(() => {
        const subscription = AppState.addEventListener(
            "change",
            async (nextAppState: AppStateStatus) => {
                if (
                    appState.current.match(/inactive|background/) &&
                    nextAppState === "active"
                ) {
                    console.log("App has come to the foreground!");
                    if (token) {
                        await refreshActiveRide();
                    }
                }

                appState.current = nextAppState;
            }
        );

        return () => {
            subscription.remove();
        };
    }, [refreshActiveRide, token]);
};

export default useAppState;
