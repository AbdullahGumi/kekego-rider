import { BottomSheetFlatListMethods } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import MapView from "react-native-maps";

export const useMapState = () => {
  const [mapLoading, setMapLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<{ snapToIndex: (index: number) => void; current?: any } | null>(null);
  const flatListRef = useRef<BottomSheetFlatListMethods | null>(null);

  const stopMapLoading = () => {
    setMapLoading(false);
  };

  const setError = (error: string | null) => {
    setLocationError(error);
  };

  return {
    // State
    mapLoading,
    locationError,

    // Refs
    mapRef,
    bottomSheetRef,
    flatListRef,

    // Actions
    stopMapLoading,
    setError,
    setLocationError,
  };
};
