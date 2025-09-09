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

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  coordinates: { latitude: number; longitude: number };
  profilePicture: string;
  phone: string;
  rating?: number;
  vehicleNumber?: string;
}

export interface Message {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  Sender: { id: string; name: string };
  Receiver: { id: string; name: string };
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
