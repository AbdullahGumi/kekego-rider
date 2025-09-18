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
