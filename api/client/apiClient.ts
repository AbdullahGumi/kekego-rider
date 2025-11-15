// api/apiClient.ts
import { Storage } from "@/utility/asyncStorageHelper";
import axios from "axios";

import { useAppStore } from "@/stores/useAppStore";

const apiClient = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await Storage.get<string>("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAppStore.getState().resetStore();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
