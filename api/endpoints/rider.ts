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

  getRideStatus: async (rideId: string) => {
    return await apiService.get(`/rider/ride-status/${rideId}`);
  },

  cancelRide: async (rideId: string) => {
    return await apiService.post(`/rider/ride/${rideId}/cancel`, {});
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
};
