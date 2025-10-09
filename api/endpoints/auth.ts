import apiService from "../client/apiService";

export const authApi = {
  requestOtp: async (phone: string) => {
    return await apiService.post("/auth/request-otp", { phone });
  },
  verifyOtp: async (
    phone: string,
    otp: string,
    deviceToken: string,
    platform: string
  ) => {
    return await apiService.post("/auth/verify-otp", {
      phone,
      otp,
      deviceToken,
      platform,
    });
  },
  checkPhone: async (phone: string, role: string) => {
    return await apiService.post("/auth/check-phone", { phone, role });
  },
  register: async (data: {
    email?: string;
    name: string;
    gender: string;
    phone: string;
    role: string;
    deviceToken: string;
    platform: string;
  }) => {
    return await apiService.post("/auth/register", data);
  },
  registerDeviceToken: async (
    deviceToken: string,
    platform: "ios" | "android"
  ) => {
    return await apiService.post("/auth/register-device-token", {
      deviceToken,
      platform,
    });
  },
  removeDeviceToken: async (deviceToken: string) => {
    return await apiService.post("/auth/remove-device-token", {
      deviceToken,
    });
  },
};
