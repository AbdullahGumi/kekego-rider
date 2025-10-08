import apiService from "../client/apiService";

export const authApi = {
  requestOtp: async (phone: string) => {
    return await apiService.post("/auth/request-otp", { phone });
  },
  verifyOtp: async (phone: string, otp: string) => {
    return await apiService.post("/auth/verify-otp", { phone, otp });
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
  removeDeviceToken: async () => {
    return await apiService.delete("/auth/remove-device-token");
  },
};
