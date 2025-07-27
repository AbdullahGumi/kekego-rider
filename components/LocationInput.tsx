import CustomInput from "@/components/CustomInput";
import CustomText from "@/components/CustomText";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
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
            suffix={
              type === "pickup" && isPickupLoading ? (
                <View style={{ marginRight: scale(12) }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
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
                    <Pressable
                      style={commonItemStyles}
                      onPress={() => handleSuggestionSelect(item, type)}
                    >
                      <CustomText style={commonTextStyles}>
                        {item.description}
                      </CustomText>
                    </Pressable>
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
  suggestionsContainer: {
    position: "absolute",
    top: scale(70),
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    maxHeight: scale(150),
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  suggestionsList: {
    width: "100%",
  },
  loader: {
    marginTop: scale(16),
  },
});
