import { Alert, Linking } from "react-native";

export const useCallHandler = () => {
  const handleCall = async (phoneNumber?: string) => {
    try {
      if (!phoneNumber) {
        Alert.alert("Call", "Calling driver is not implemented yet.");
        return;
      }

      // Validate phone number format
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      if (cleanedNumber.length < 10) {
        Alert.alert("Error", "Invalid phone number format");
        return;
      }

      // Add country code if not present
      const formattedNumber = cleanedNumber.startsWith('234')
        ? cleanedNumber
        : `234${cleanedNumber}`;

      const url = `tel:+${formattedNumber}`;

      // Check if device supports phone calls
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Phone calls are not supported on this device");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to make phone call. Please try again.");
    }
  };

  return {
    handleCall,
  };
};

/**
 * Hook for handling driver call with enhanced functionality
 * Supports both placeholder and full phone call implementation
 */
export const useDriverCallHandler = () => {
  const handleDriverCall = (driverName?: string, phoneNumber?: string) => {
    try {
      if (!driverName || !phoneNumber) {
        Alert.alert("Call", "Calling driver is not implemented yet.");
        return;
      }

      Alert.alert(
        `Call ${driverName}`,
        `Are you sure you want to call ${driverName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Call",
            onPress: () => handleCall(phoneNumber)
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to initiate call. Please try again.");
    }
  };

  const handleCall = async (phoneNumber?: string) => {
    try {
      if (!phoneNumber) {
        return;
      }

      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      if (cleanedNumber.length < 10) {
        Alert.alert("Error", "Invalid phone number format");
        return;
      }

      const formattedNumber = cleanedNumber.startsWith('234')
        ? cleanedNumber
        : `234${cleanedNumber}`;

      const url = `tel:+${formattedNumber}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Phone calls are not supported on this device");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to make phone call. Please try again.");
    }
  };

  return {
    handleDriverCall,
  };
};
