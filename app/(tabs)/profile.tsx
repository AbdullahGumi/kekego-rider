import { riderApi } from "@/api/endpoints/rider";
import CustomInput from "@/components/common/CustomInput";
import CustomText from "@/components/common/CustomText";
import DrawerButton from "@/components/common/DrawerButton";
import { COLORS } from "@/constants/Colors";
import { scale, scaleText } from "@/constants/Layout";
import { useAppStore } from "@/stores/useAppStore";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ChevronIcon } from "@/assets/svg";
import Toast from "react-native-toast-message";

// Cloudinary configuration
const cld = {
  cloudName: "dob19lapx",
  uploadPreset: "quiick-ride-upload",
};

interface ProfileData {
  id: string;
  phone: string;
  name: string;
  email: string;
  gender: string;
  profilePicture: string;
  verificationStatus: string;
  status: string;
  isOnline: boolean;
  createdAt: string;
  vehicle?: {
    id: string;
    plateNumber: string;
    vehicleNumber: string;
  };
  rating?: {
    averageRating: number;
  };
}

interface EditFormData {
  name: string;
  email: string;
  gender: string;
  profilePicture?: string;
}

const ProfileScreen = () => {
  const { user, updateUserProfile } = useAppStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: "",
    email: "",
    gender: "",
    profilePicture: "",
  });

  // BottomSheet refs
  const genderBottomSheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);

  // Memoized snap points
  const genderSnapPoints = useMemo(() => ["25%"], []);
  const imageSourceSnapPoints = useMemo(() => ["30%"], []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await riderApi.getProfile();
      if (response.data.success) {
        const profileData = response.data.data.profile;
        setProfile(profileData);
        setEditForm({
          name: profileData.name || "",
          email: profileData.email || "",
          gender: profileData.gender || "",
          profilePicture: profileData.profilePicture || "",
        });
      }
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      Alert.alert(
        "Error",
        "Failed to load profile information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // Cloudinary upload function
  const uploadImageToCloudinary = useCallback(async (imageUri: string) => {
    try {
      const data: any = new FormData();
      data.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: `profile_${Date.now()}.jpg`,
      });
      data.append("upload_preset", cld.uploadPreset);
      data.append("cloud_name", cld.cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cld.cloudName}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();
      if (result.secure_url) {
        return result.secure_url;
      } else {
        throw new Error("Failed to upload image to Cloudinary");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }, []);

  // Image picker handlers
  const pickImageFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      await updateProfilePicture(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    handleCloseImageSourceModal();
  }, []);

  const snapImageWithCamera = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take a photo"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.8,
    });

    if (!result.canceled) {
      await updateProfilePicture(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    handleCloseImageSourceModal();
  }, []);

  const updateProfilePicture = useCallback(
    async (imageUri: string) => {
      try {
        setUploadingImage(true);

        // Upload to Cloudinary
        const profilePictureUrl = await uploadImageToCloudinary(imageUri);

        // Update profile via API
        const response = await riderApi.updateProfile({
          profilePicture: profilePictureUrl,
        });

        if (response.data.success) {
          setProfile(response.data.data.profile);
          if (user) {
            updateUserProfile({
              profilePicture: profilePictureUrl,
            });
          }

          // Update edit form if currently editing
          if (isEditing) {
            setEditForm((prev) => ({
              ...prev,
              profilePicture: profilePictureUrl,
            }));
          }
          Toast.show({
            type: "customToast",
            text1: "Success",
            text2: "Profile picture updated successfully",
          });
        }
      } catch (error: any) {
        console.error("Profile picture update error:", error);
        Alert.alert(
          "Update Failed",
          error.message || "Failed to update profile picture. Please try again."
        );
      } finally {
        setUploadingImage(false);
      }
    },
    [uploadImageToCloudinary, isEditing, user, updateUserProfile]
  );

  const handleProfilePictureUpdate = useCallback(() => {
    handlePresentImageSourceModal();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const updateData: any = {};

      // Validate form data
      if (!editForm.name.trim()) {
        Alert.alert("Validation Error", "Name is required");
        return;
      }

      if (editForm.email && !/\S+@\S+\.\S+/.test(editForm.email)) {
        Alert.alert("Validation Error", "Please enter a valid email address");
        return;
      }

      // Check what fields have changed
      if (editForm.name.trim() !== (profile?.name || "")) {
        updateData.name = editForm.name.trim();
      }
      if (editForm.email.trim() !== (profile?.email || "")) {
        updateData.email = editForm.email.trim();
      }
      if (editForm.gender !== (profile?.gender || "")) {
        updateData.gender = editForm.gender;
      }
      if (editForm.profilePicture !== (profile?.profilePicture || "")) {
        updateData.profilePicture = editForm.profilePicture;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await riderApi.updateProfile(updateData);
      if (response.data.success) {
        const updatedProfile = response.data.data.profile;
        setProfile(updatedProfile);
        if (user) {
          updateUserProfile({
            name: updatedProfile.name,
            email: updatedProfile.email,
            profilePicture: updatedProfile.profilePicture,
          });
        }

        setIsEditing(false);
        Toast.show({
          type: "customToast",
          text1: "Success",
          text2: "Profile updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      const message =
        error.response?.data?.message || "Failed to update profile";
      Alert.alert("Update Failed", message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: profile?.name || "",
      email: profile?.email || "",
      gender: profile?.gender || "",
      profilePicture: profile?.profilePicture || "",
    });
    setIsEditing(false);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return COLORS.green;
      case "pending":
        return "#FFA500";
      case "rejected":
        return COLORS.error;
      default:
        return COLORS.secondaryText;
    }
  };

  const getVerificationStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return "Verified";
      case "pending":
        return "Pending Verification";
      case "rejected":
        return "Verification Rejected";
      default:
        return "Not Verified";
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Modal handlers
  const handlePresentGenderModal = useCallback(() => {
    genderBottomSheetRef.current?.present();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleCloseGenderModal = useCallback(() => {
    genderBottomSheetRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePresentImageSourceModal = useCallback(() => {
    imageSourceSheetRef.current?.present();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleCloseImageSourceModal = useCallback(() => {
    imageSourceSheetRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          paddingHorizontal: scale(16),
        }}
      >
        <DrawerButton />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: scale(20),
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <CustomText
            style={{
              marginTop: scale(15),
              color: COLORS.secondaryText,
              fontSize: 16,
            }}
          >
            Loading profile...
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <BottomSheetModalProvider>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: scale(16),
                paddingTop: scale(10),
              }}
            >
              {/* Left: Drawer button */}
              <DrawerButton />

              {/* Center: Title */}
              <CustomText
                fontWeight="Bold"
                style={{
                  fontSize: scaleText(20),
                  color: COLORS.text,
                  textAlign: "center",
                  flex: 1,
                }}
              >
                Profile
              </CustomText>
              <View style={{ width: scale(50) }} />
            </View>
            <View
              style={{
                padding: scale(16),
              }}
            >
              {/* Profile Picture Section */}
              <View style={{ alignItems: "center", marginBottom: scale(30) }}>
                <TouchableOpacity
                  onPress={handleProfilePictureUpdate}
                  disabled={uploadingImage}
                  style={{
                    position: "relative",
                    marginBottom: scale(15),
                  }}
                >
                  <View
                    style={{
                      width: scale(100),
                      height: scale(100),
                      borderRadius: scale(50),
                      backgroundColor: COLORS.inputBackground,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: COLORS.primary,
                    }}
                  >
                    {profile?.profilePicture ? (
                      <Image
                        source={{ uri: profile.profilePicture }}
                        style={{
                          width: scale(100),
                          height: scale(100),
                          borderRadius: scale(50),
                        }}
                      />
                    ) : (
                      <Ionicons
                        name="person"
                        size={scale(40)}
                        color={COLORS.secondaryText}
                      />
                    )}
                  </View>

                  {/* Edit Icon Overlay */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: scale(8),
                      right: scale(8),
                      backgroundColor: COLORS.primary,
                      borderRadius: scale(15),
                      padding: scale(6),
                    }}
                  >
                    <Ionicons
                      name="camera"
                      size={scale(16)}
                      color={COLORS.white}
                    />
                  </View>

                  {uploadingImage && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.3)",
                        borderRadius: scale(50),
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>

                <CustomText fontWeight="SemiBold" size={20}>
                  {profile?.name}
                </CustomText>

                <CustomText
                  style={{
                    fontSize: scaleText(14),
                    fontFamily: "Urbanist-Medium",
                    color: COLORS.secondaryText,
                    marginRight: scale(4),
                  }}
                >
                  ⭐ {profile?.rating?.averageRating?.toFixed(1) || "5.0"}
                </CustomText>
              </View>

              {/* Edit/Save Buttons */}
              <View style={{ flexDirection: "row", marginBottom: scale(20) }}>
                {!isEditing ? (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.primary,
                      paddingVertical: scale(12),
                      borderRadius: scale(8),
                      alignItems: "center",
                    }}
                    onPress={() => setIsEditing(true)}
                  >
                    <CustomText
                      fontWeight="SemiBold"
                      style={{ color: COLORS.white }}
                    >
                      Edit Profile
                    </CustomText>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.error,
                        paddingVertical: scale(12),
                        borderRadius: scale(8),
                        alignItems: "center",
                        marginRight: scale(10),
                      }}
                      onPress={handleCancelEdit}
                      disabled={updating}
                    >
                      <CustomText
                        fontWeight="SemiBold"
                        style={{ color: COLORS.white }}
                      >
                        Cancel
                      </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.green,
                        paddingVertical: scale(12),
                        borderRadius: scale(8),
                        alignItems: "center",
                        marginLeft: scale(10),
                      }}
                      onPress={handleUpdateProfile}
                      disabled={updating}
                    >
                      <CustomText
                        fontWeight="SemiBold"
                        style={{ color: COLORS.white }}
                      >
                        {updating ? "Saving..." : "Save Changes"}
                      </CustomText>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Profile Information */}
              <View
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: scale(12),
                  padding: scale(20),
                }}
              >
                <CustomText
                  fontWeight="Bold"
                  size={18}
                  style={{ marginBottom: scale(20) }}
                >
                  Personal Information
                </CustomText>

                {/* Name */}
                <View style={{ marginBottom: scale(20) }}>
                  <CustomText
                    size={14}
                    style={{
                      marginBottom: scale(5),
                      color: COLORS.secondaryText,
                    }}
                  >
                    Full Name
                  </CustomText>
                  {isEditing ? (
                    <CustomInput
                      label=""
                      value={editForm.name}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, name: text })
                      }
                      placeholder="Enter your full name"
                      style={{ backgroundColor: COLORS.white }}
                      containerStyle={{ marginBottom: 0 }}
                    />
                  ) : (
                    <CustomText fontWeight="Medium">
                      {profile?.name || "Not provided"}
                    </CustomText>
                  )}
                </View>

                {/* Email */}
                <View style={{ marginBottom: scale(20) }}>
                  <CustomText
                    size={14}
                    style={{
                      marginBottom: scale(5),
                      color: COLORS.secondaryText,
                    }}
                  >
                    Email Address
                  </CustomText>
                  {isEditing ? (
                    <CustomInput
                      label=""
                      value={editForm.email}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, email: text })
                      }
                      placeholder="Enter your email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{ backgroundColor: COLORS.white }}
                      containerStyle={{ marginBottom: 0 }}
                    />
                  ) : (
                    <CustomText fontWeight="Medium">
                      {profile?.email || "Not provided"}
                    </CustomText>
                  )}
                </View>

                {/* Phone (Read-only) */}
                <View style={{ marginBottom: scale(20) }}>
                  <CustomText
                    size={14}
                    style={{
                      marginBottom: scale(5),
                      color: COLORS.secondaryText,
                    }}
                  >
                    Phone Number
                  </CustomText>
                  <CustomText fontWeight="Medium">
                    {profile?.phone || "Not provided"}
                  </CustomText>
                </View>

                {/* Gender */}
                <View style={{ marginBottom: scale(20) }}>
                  <CustomText
                    size={14}
                    style={{
                      marginBottom: scale(5),
                      color: COLORS.secondaryText,
                    }}
                  >
                    Gender
                  </CustomText>
                  {isEditing ? (
                    <Pressable onPress={handlePresentGenderModal} accessible>
                      <CustomInput
                        editable={false}
                        placeholder="Select gender"
                        placeholderTextColor={COLORS.secondaryText}
                        label=""
                        value={
                          editForm.gender === "male"
                            ? "Male"
                            : editForm.gender === "female"
                            ? "Female"
                            : ""
                        }
                        onPress={handlePresentGenderModal}
                        suffix={
                          <View
                            style={{
                              marginRight: scale(16),
                              transform: [{ rotate: "90deg" }],
                            }}
                          >
                            <ChevronIcon color={COLORS.secondaryText} />
                          </View>
                        }
                        caretHidden
                        showSoftInputOnFocus={false}
                        error={""}
                        containerStyle={{
                          marginBottom: scale(16),
                        }}
                      />
                    </Pressable>
                  ) : (
                    <CustomText fontWeight="Medium">
                      {profile?.gender || "Not provided"}
                    </CustomText>
                  )}
                </View>

                {/* Account Status */}
                <View style={{ marginBottom: scale(20) }}>
                  <CustomText
                    size={14}
                    style={{
                      marginBottom: scale(5),
                      color: COLORS.secondaryText,
                    }}
                  >
                    Account Status
                  </CustomText>
                  <CustomText fontWeight="Medium">
                    {profile?.status === "active"
                      ? "Active"
                      : profile?.status || "Unknown"}
                  </CustomText>
                </View>

                {/* Member Since */}
                <View style={{ marginBottom: scale(0) }}>
                  <CustomText
                    size={14}
                    style={{
                      marginBottom: scale(5),
                      color: COLORS.secondaryText,
                    }}
                  >
                    Member Since
                  </CustomText>
                  <CustomText fontWeight="Medium">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </CustomText>
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
        <BottomSheetModal
          ref={genderBottomSheetRef}
          snapPoints={genderSnapPoints}
          enableDynamicSizing={false}
          onDismiss={handleCloseGenderModal}
          handleIndicatorStyle={{ backgroundColor: "#E2E2E2" }}
          backgroundStyle={{
            backgroundColor: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 10, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          <View
            style={{ paddingHorizontal: scale(16), paddingVertical: scale(12) }}
          >
            {["male", "female"].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => {
                  setEditForm({ ...editForm, gender: g });
                  handleCloseGenderModal();
                }}
                style={{
                  padding: scale(12),
                  backgroundColor: COLORS.inputBackground,
                  borderRadius: 8,
                  marginBottom: scale(8),
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                accessible
              >
                <CustomText
                  fontWeight="Medium"
                  style={{ fontSize: scaleText(16), color: COLORS.text }}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetModal>
        <BottomSheetModal
          ref={imageSourceSheetRef}
          snapPoints={imageSourceSnapPoints}
          enableDynamicSizing={false}
          onDismiss={handleCloseImageSourceModal}
          handleIndicatorStyle={{ backgroundColor: "#E2E2E2" }}
          backgroundStyle={{
            backgroundColor: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 10, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          <View
            style={{ paddingHorizontal: scale(16), paddingVertical: scale(12) }}
          >
            <TouchableOpacity
              onPress={pickImageFromGallery}
              style={{
                padding: scale(12),
                backgroundColor: COLORS.inputBackground,
                borderRadius: 8,
                marginBottom: scale(8),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
              accessible
            >
              <CustomText
                fontWeight="Medium"
                style={{ fontSize: scaleText(16), color: COLORS.text }}
              >
                Choose from Gallery
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={snapImageWithCamera}
              style={{
                padding: scale(12),
                backgroundColor: COLORS.inputBackground,
                borderRadius: 8,
                marginBottom: scale(8),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
              accessible
            >
              <CustomText
                fontWeight="Medium"
                style={{ fontSize: scaleText(16), color: COLORS.text }}
              >
                Take a Photo
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCloseImageSourceModal}
              style={{
                padding: scale(12),
                backgroundColor: COLORS.inputBackground,
                borderRadius: 8,
                marginBottom: scale(8),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
              accessible
            >
              <CustomText
                fontWeight="Medium"
                style={{ fontSize: scaleText(16), color: COLORS.text }}
              >
                Cancel
              </CustomText>
            </TouchableOpacity>
          </View>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
};

export default ProfileScreen;
