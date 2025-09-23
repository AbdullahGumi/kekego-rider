// api/apiClient.ts
import { Storage } from "@/utility/asyncStorageHelper";
import axios from "axios";

const apiClient = axios.create({
  // baseURL: "http://172.20.10.2:3000/api",
  baseURL: "https://api.betterkaduna.com/api",
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
      await Storage.remove("access_token");
      // TODO: Logout or redirect user
    }
    return Promise.reject(error);
  }
);

export default apiClient;
