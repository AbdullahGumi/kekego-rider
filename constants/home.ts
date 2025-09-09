export const CONFIG = {
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  DEFAULT_COORDS: { latitude: "6.5244", longitude: "3.3792" },
  INITIAL_REGION: {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  MARKER_ICONS: {
    pickup: "https://img.icons8.com/color/48/000000/marker.png",
    destination: "https://img.icons8.com/color/48/000000/flag.png",
    pin: "https://img.icons8.com/ios/50/000000/pin.png",
    user: "https://img.icons8.com/ios/50/000000/user.png",
    star: "https://img.icons8.com/color/24/000000/star.png",
  },
  SOCKET_URL: "http://172.20.10.2:3000",
  RECENT_DESTINATIONS: [
    {
      id: "1",
      address: "Lekki Phase 1, Lagos",
      coords: { latitude: "6.4412", longitude: "3.4584" },
    },
    {
      id: "2",
      address: "Ikeja City Mall, Lagos",
      coords: { latitude: "6.6148", longitude: "3.3576" },
    },
    {
      id: "3",
      address: "Victoria Island, Lagos",
      coords: { latitude: "6.4299", longitude: "3.4219" },
    },
  ],
} as const;
