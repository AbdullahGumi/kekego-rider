import apiService from "../client/apiService";

export const riderApi = {
  calculateFare: async (data: {
    distanceInKm: number;
    durationInMinutes: number;
  }) => {
    return await apiService.post("/rider/calculate-fare", data);
  },
  requestRide: async (data: {
    pickupLocation: {
      address: string;
      coords: {
        latitude: number;
        longitude: number;
      };
    };
    dropoffLocation: {
      address: string;
      coords: {
        latitude: number;
        longitude: number;
      };
    };
    paymentMethod: string;
    distanceInKm: number;
    durationInMinutes: number;
  }) => {
    return await apiService.post("/rider/request-ride", data);
  },

  cancelRide: async (rideId: string, reason: string) => {
    return await apiService.post(`/rider/cancel-ride`, { rideId, reason });
  },

  getNearbyDrivers: async (data: {
    coords: {
      latitude: number;
      longitude: number;
    };
  }) => {
    return await apiService.post("/rider/nearby-drivers", {
      pickupLocation: {
        coords: {
          latitude: data.coords.latitude,
          longitude: data.coords.longitude,
        },
      },
    });
  },

  submitRating: async (rideId: string, rating: number, feedback: string) => {
    return await apiService.post(`/rider/submit-rating`, {
      rideId,
      rating,
      feedback,
    });
  },

  getRideMessages: async (rideId: string) => {
    return await apiService.get(`/rider/messages/${rideId}`);
  },

  getRideHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    return await apiService.get("/rider/rides", params);
  },

  getWalletBalance: async () => {
    return await apiService.get("rider/wallet/balance");
  },
  getWalletTransactions: async (params?: { page?: number; limit?: number }) => {
    return await apiService.get("rider/wallet/transactions", params);
  },
  initiateWalletTopUp: async (amount: string, callbackUrl: string) => {
    return await apiService.post("rider/wallet/topup/initiate", {
      amount,
      callbackUrl,
    });
  },
  completeWalletTopUp: async (reference: string) => {
    return await apiService.post("rider/wallet/topup/complete", { reference });
  },
};
