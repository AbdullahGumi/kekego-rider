// Home Screen Types
export interface LocationData {
  address: string;
  coords: { latitude: string; longitude: string };
}

export interface RecentDestination {
  id: string;
  address: string;
  coords: { latitude: string; longitude: string };
}

// Stage types for ride lifecycle
export type RideStage =
  | "initial"
  | "input"
  | "confirm"
  | "search"
  | "paired"
  | "arrived"
  | "trip"
  | "chat";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  profilePicture: string;
}

export interface RideLocation {
  address: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface ActiveRideResponse {
  id: string;
  status: string;
  actualFare: number | null;
  estimatedFare: number;
  cancellationReason: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
  driver: Driver;
  pickupLocation: RideLocation;
  dropoffLocation: RideLocation;
  paymentMethod: string;
  messages: any[];
  myRating: number | null;
}
