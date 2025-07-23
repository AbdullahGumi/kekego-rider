import { ChevronIcon } from "@/assets/svg";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomText from "@/components/CustomText";
import Header from "@/components/Header";
import { COLORS } from "@/constants/Colors";
import { CONSTANTS } from "@/constants/constants";
import { scale, scaleText } from "@/constants/Layout";
import useApi from "@/hooks/useApi";
import { useAppStore } from "@/stores/useAppStore";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const { phone } = useLocalSearchParams();

  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const router = useRouter();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["20%"], []);
  const setUser = useAppStore((state) => state.setUser);

  const { fetchData, loading } = useApi();

  const handlePresentModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
    setBottomSheetOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    bottomSheetModalRef.current?.close();
    setBottomSheetOpen(false);
  }, []);

  const validateInputs = () => {
    const newErrors: any = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!gender) newErrors.gender = "Gender is required";

    // Email validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfile = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const { data } = await fetchData("post", `/auth/register`, {
        email,
        name: `${firstName} ${lastName}`,
        gender,
        phone,
        role: CONSTANTS.USER_ROLE,
      });
      if (data.token) {
        setUser(data.user);
        router.push(`/(tabs)`);
      }
    } catch (err: any) {
      console.log("err", err.response.data.error);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={handleCloseModal}>
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <KeyboardAwareScrollView
            enableOnAndroid={true}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingHorizontal: scale(16) }}>
              <Header />
              <CustomText
                fontWeight="Medium"
                style={{
                  fontSize: scaleText(30),
                  color: COLORS.text,
                  paddingTop: scale(32),
                }}
              >
                Ready to ride?
              </CustomText>
              <CustomText
                fontWeight="Medium"
                style={{
                  fontSize: scaleText(14),
                  color: COLORS.secondaryText,
                  paddingTop: scale(8),
                }}
              >
                Tell us a bit about yourself!
              </CustomText>

              <View style={{ marginTop: scale(32) }}>
                <CustomInput
                  editable={isBottomSheetOpen ? false : true}
                  placeholder="Enter first name"
                  placeholderTextColor={"#E2E2E2"}
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={errors.firstName}
                  required
                />
                <CustomInput
                  editable={isBottomSheetOpen ? false : true}
                  placeholder="Enter last name"
                  placeholderTextColor={"#E2E2E2"}
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  error={errors.lastName}
                  required
                  containerStyle={{ marginTop: scale(8) }}
                />
                <CustomInput
                  editable={isBottomSheetOpen ? false : true}
                  placeholder="Enter your email (optional)"
                  placeholderTextColor={"#E2E2E2"}
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  containerStyle={{ marginTop: scale(8) }}
                />

                <Pressable onPress={handlePresentModal}>
                  <CustomInput
                    editable={isBottomSheetOpen ? false : true}
                    placeholder="Select gender"
                    required
                    placeholderTextColor={"#E2E2E2"}
                    label="Gender"
                    value={
                      gender === "male"
                        ? "Male"
                        : gender === "female"
                        ? "Female"
                        : ""
                    }
                    suffix={
                      <View
                        style={{
                          marginRight: scale(16),
                          width: scale(9),
                          height: scale(14),
                          transform: [{ rotate: "90deg" }],
                        }}
                      >
                        <ChevronIcon color="#757575" />
                      </View>
                    }
                    onPress={handlePresentModal}
                    caretHidden
                    showSoftInputOnFocus={false}
                    error={errors.gender}
                    containerStyle={{ marginTop: scale(8) }}
                  />
                </Pressable>
              </View>
            </View>
          </KeyboardAwareScrollView>
          <View
            style={{
              backgroundColor: "white",
              paddingVertical: scale(16),
              paddingHorizontal: scale(21),
              marginTop: "auto",
            }}
          >
            <CustomButton
              title="Continue"
              onPress={updateProfile}
              loading={loading}
              disabled={loading || !firstName || !lastName || !gender}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          onDismiss={handleCloseModal}
          handleIndicatorStyle={{ backgroundColor: "#E2E2E2" }}
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 10,
              height: 10,
            },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 10,
            backgroundColor: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <View
            style={{
              paddingHorizontal: scale(21),
              paddingVertical: scale(16),
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setGender("male");
                handleCloseModal();
              }}
              style={{
                padding: scale(10),
                backgroundColor: COLORS.background,
                marginBottom: scale(5),
                borderRadius: 8,
              }}
            >
              <CustomText fontWeight="Medium">Male</CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setGender("female");
                handleCloseModal();
              }}
              style={{
                padding: scale(10),
                backgroundColor: COLORS.background,
                marginBottom: scale(5),
                borderRadius: 8,
              }}
            >
              <CustomText fontWeight="Medium">Female</CustomText>
            </TouchableOpacity>
          </View>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </>
  );
};

export default RegisterScreen;
