import CustomInput from "@/components/common/CustomInput";
import CustomText from "@/components/common/CustomText";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

interface Location {
  address: string;
  coords: { latitude: string; longitude: string };
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

interface LocationState {
  input: string;
  suggestions: PlaceSuggestion[];
  showSuggestions: boolean;
  coords?: { latitude: string; longitude: string };
}

interface LocationInputProps {
  setPickupLocation: (location: Location) => void;
  setDestinationLocation: (location: Location) => void;
  initialPickup?: string;
  initialDestination?: string;
  isPickupLoading?: boolean;
}

export default function LocationInput({
  setPickupLocation,
  setDestinationLocation,
  initialPickup = "",
  initialDestination = "",
  isPickupLoading = false,
}: LocationInputProps) {
  const [state, setState] = useState({
    pickup: {
      input: initialPickup,
      suggestions: [],
      showSuggestions: false,
    } as LocationState,
    destination: {
      input: initialDestination,
      suggestions: [],
      showSuggestions: false,
    } as LocationState,
    error: "",
    loading: false,
  });

  const { pickup, destination, error, loading } = state;
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<{ pickup: string; destination: string }>({
    pickup: initialPickup,
    destination: initialDestination,
  });

  const fetchSuggestions = useRef(
    debounce(
      async (
        input: string,
        type: "pickup" | "destination",
        setSuggestions: (suggestions: PlaceSuggestion[]) => void
      ) => {
        if (!input.trim()) {
          setSuggestions([]);
          return;
        }

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
              input
            )}&components=country:NG&key=AIzaSyCEgN-LLuqFBE7nDzqa2zdgE-iYq-bKhQE`,
            { signal: abortControllerRef.current.signal }
          );
          const data = await response.json();
          if (inputRef.current[type] === input) {
            setSuggestions(data.status === "OK" ? data.predictions : []);
          }
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            console.error("Failed to fetch suggestions:", err);
            setSuggestions([]);
            setState((prev) => ({
              ...prev,
              error: "Failed to fetch suggestions. Please try again.",
            }));
          }
        }
      },
      500
    )
  ).current;

  useEffect(() => {
    return () => {
      fetchSuggestions.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = useCallback(
    (text: string, type: "pickup" | "destination") => {
      inputRef.current[type] = text;
      setState((prev) => ({
        ...prev,
        [type]: { ...prev[type], input: text, showSuggestions: true },
        error: "",
      }));
      fetchSuggestions(text, type, (suggestions) =>
        setState((prev) => ({
          ...prev,
          [type]: { ...prev[type], suggestions },
        }))
      );
    },
    []
  );

  const handleLocationSelect = useCallback(
    async (type: "pickup" | "destination", value: string, placeId?: string) => {
      if (!value.trim()) {
        setState((prev) => ({
          ...prev,
          error: `Please enter a ${type} location`,
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const url = placeId
          ? `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=AIzaSyCEgN-LLuqFBE7nDzqa2zdgE-iYq-bKhQE`
          : `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              value
            )}&components=country:NG&key=AIzaSyCEgN-LLuqFBE7nDzqa2zdgE-iYq-bKhQE`;
        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });
        const data = await response.json();

        const locationData = placeId ? data.result : data.results?.[0];
        if (locationData) {
          const { lat, lng } = locationData.geometry.location;
          const location = {
            address: locationData.formatted_address,
            coords: { latitude: String(lat), longitude: String(lng) },
          };

          setState((prev) => ({
            ...prev,
            [type]: {
              ...prev[type],
              input: location.address,
              showSuggestions: false,
              coords: location.coords,
            },
            error: "",
            loading: false,
          }));

          if (type === "pickup") {
            setPickupLocation(location);
          } else {
            setDestinationLocation(location);
          }
        } else {
          setState((prev) => ({
            ...prev,
            error: `Invalid ${type} location. Please try again.`,
            loading: false,
          }));
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            error: `Failed to fetch ${type} location. Please try again.`,
            loading: false,
          }));
        }
      }
    },
    [setPickupLocation, setDestinationLocation]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: PlaceSuggestion, type: "pickup" | "destination") => {
      handleLocationSelect(type, suggestion.description, suggestion.place_id);
    },
    [handleLocationSelect]
  );

  const handleCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState((prev) => ({
          ...prev,
          error: "Location permission denied. Please enable location services.",
        }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=AIzaSyCEgN-LLuqFBE7nDzqa2zdgE-iYq-bKhQE`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        const pickupLocation = {
          address,
          coords: {
            latitude: String(location.coords.latitude),
            longitude: String(location.coords.longitude),
          },
        };
        setState((prev) => ({
          ...prev,
          pickup: {
            ...prev.pickup,
            input: address,
            showSuggestions: false,
            coords: pickupLocation.coords,
          },
          error: "",
        }));
        setPickupLocation(pickupLocation);
      } else {
        setState((prev) => ({
          ...prev,
          error: "Unable to determine your current location.",
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Failed to get current location. Please try again.",
      }));
    }
  }, [setPickupLocation]);

  const handleClearInput = useCallback((type: "pickup" | "destination") => {
    inputRef.current[type] = "";
    setState((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        input: "",
        suggestions: [],
        showSuggestions: false,
      },
    }));
  }, []);

  const commonItemStyles = {
    padding: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondaryText,
  };

  const commonTextStyles = {
    fontSize: scaleText(14),
    color: COLORS.text,
  };

  return (
    <View style={styles.inputContainer}>
      {(["pickup", "destination"] as const).map((type) => (
        <View key={type} style={styles.inputWrapper}>
          <CustomInput
            placeholder={`Enter ${type} location`}
            placeholderTextColor={COLORS.secondaryText}
            label={type === "pickup" ? "Pickup Location" : "Destination"}
            value={state[type].input}
            onChangeText={(text) => handleInputChange(text, type)}
            style={styles.input}
            onSubmitEditing={() =>
              handleLocationSelect(type, state[type].input)
            }
            onFocus={() =>
              setState((prev) => ({
                ...prev,
                [type]: { ...prev[type], showSuggestions: true },
                error: "",
              }))
            }
            editable={type === "pickup" ? !isPickupLoading : true}
            prefix={
              type === "pickup" ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.locationButton}
                  onPress={handleCurrentLocation}
                  accessibilityLabel="Use current location"
                >
                  <Ionicons name="locate" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              ) : undefined
            }
            suffix={
              type === "pickup" && isPickupLoading ? (
                <View style={{ marginRight: scale(12) }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : state[type].input.length > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.clearButton}
                  onPress={() => handleClearInput(type)}
                  accessibilityLabel="Clear input"
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.secondaryText}
                  />
                </TouchableOpacity>
              ) : undefined
            }
          />
          {state[type].showSuggestions &&
            state[type].suggestions.length > 0 && (
              <Animated.View
                entering={ZoomIn}
                style={styles.suggestionsContainer}
              >
                <FlatList
                  data={state[type].suggestions}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={commonItemStyles}
                      onPress={() => handleSuggestionSelect(item, type)}
                    >
                      <View style={styles.suggestionItem}>
                        <Ionicons
                          name="location"
                          size={16}
                          color={COLORS.secondaryText}
                          style={styles.suggestionIcon}
                        />
                        <CustomText style={commonTextStyles} numberOfLines={2}>
                          {item.description}
                        </CustomText>
                      </View>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.place_id}
                  showsVerticalScrollIndicator={false}
                  style={styles.suggestionsList}
                />
              </Animated.View>
            )}
        </View>
      ))}
      {loading && (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
    gap: scale(12),
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingRight: scale(40), // Space for loading indicator
  },
  locationButton: {
    paddingLeft: scale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    paddingRight: scale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsContainer: {
    position: "absolute",
    top: scale(70),
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    maxHeight: scale(200),
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  suggestionsList: {
    width: "100%",
    paddingHorizontal: scale(4),
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  suggestionIcon: {
    marginRight: scale(8),
    marginTop: scale(2),
  },
  loader: {
    marginTop: scale(16),
  },
});
