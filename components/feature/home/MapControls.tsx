import { COLORS } from "@/constants/Colors";
import { scale } from "@/constants/Layout";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { TouchableOpacity, View } from "react-native";

interface MapControlsProps {
  stage: string;
  onBack: (geocodingLoading?: boolean) => void;
  onCenterMap: () => void;
  geocodingLoading: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  stage,
  onBack,
  onCenterMap,
  geocodingLoading,
}) => {
  const navigation = useNavigation<any>();

  const handleDrawer = () => navigation.toggleDrawer();

  if (stage === "initial") {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={handleDrawer}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            marginLeft: scale(16),
          }}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCenterMap}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            borderWidth: 1,
            borderColor: COLORS.primary,
            marginRight: scale(16),
          }}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  if (["input", "confirm", "chat"].includes(stage)) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => onBack(geocodingLoading)}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            marginLeft: scale(16),
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCenterMap}
          activeOpacity={0.7}
          style={{
            width: scale(50),
            height: scale(50),
            borderRadius: scale(25),
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            borderWidth: 1,
            borderColor: COLORS.primary,
            marginRight: scale(16),
          }}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  // Return null for other stages - they handle their own controls
  return null;
};
