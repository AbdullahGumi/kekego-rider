import BackButton from "@/components/common/BackButton";
import CustomText from "@/components/common/CustomText";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

const TermsScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: scale(16),
          paddingTop: scale(10),
          paddingBottom: scale(10),
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.inputBackground,
        }}
      >
        <BackButton />
        <CustomText
          fontWeight="Bold"
          style={{
            fontSize: scaleText(18),
            color: COLORS.text,
            textAlign: "center",
            flex: 1,
            marginRight: scale(40), // Balance the BackButton width
          }}
        >
          Terms & Conditions
        </CustomText>
      </View>

      <WebView
        source={{ uri: "https://kekego.ng/terms/rider" }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: COLORS.background,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      />
    </View>
  );
};

export default TermsScreen;
