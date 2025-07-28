import apiService from "../client/apiService";

export const riderApi = {
  
  calculateFare: async (data: {
    distanceInKm: number;
    durationInMinutes: number;
    promoCode?: string;
  }) => {
    return await apiService.post("/rider/calculate-fare", data);
  },
  requestRide: async (data: {
    pickupLocation: { latitude: number; longitude: number };
    dropoffLocation: { latitude: number; longitude: number };
    paymentMethod: string;
    distanceInKm: number,
    durationInMinutes: number,
    promoCode?: string;
  }) => {
    return await apiService.post("/rider/request-ride", data);
  },

  scheduleRide: async (data: {
    pickupLocation: { latitude: number; longitude: number };
    dropoffLocation: { latitude: number; longitude: number };
    paymentMethod: string;
    scheduledTime: string;
    promoCode?: string;
  }) => {
    return await apiService.post("/rider/schedule-ride", data);
  },

  getRideStatus: async (rideId: string) => {
    return await apiService.get(`/rider/ride-status/${rideId}`);
  },

  trackRide: async (rideId: string) => {
    return await apiService.get(`/rider/ride/${rideId}/track`);
  },

  rateDriver: async (rideId: string, data: { rating: number; review?: string }) => {
    return await apiService.post(`/rider/ride/${rideId}/rate`, data);
  },

  topUpWallet: async (data: { amount: number; email?: string }) => {
    return await apiService.post("/rider/wallet/top-up", data);
  },

  getHistory: async () => {
    return await apiService.get("/rider/history");
  },

  completeRide: async (rideId: string) => {
    return await apiService.post(`/rider/ride/${rideId}/complete`, {});
  },

  cancelRide: async (rideId: string) => {
    return await apiService.post(`/rider/ride/${rideId}/cancel`, {});
  },

  getNearbyDrivers: async (data: { latitude: number; longitude: number }) => {
    return await apiService.get("/rider/nearby-drivers", { latitude: data.latitude, longitude: data.longitude });
  },
};