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
