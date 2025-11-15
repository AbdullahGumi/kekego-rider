export const CONFIG = {
  DEFAULT_COORDS: { latitude: "10.5105", longitude: "7.4165" },
  INITIAL_REGION: {
    latitude: 10.5105,
    longitude: 7.4165,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  MARKER_ICONS: {
    pickup: "https://img.icons8.com/color/48/000000/marker.png",
    destination: "https://img.icons8.com/color/48/000000/flag.png",
    pin: "https://img.icons8.com/ios/50/000000/pin.png",
    user: "https://cdn-icons-png.flaticon.com/128/456/456212.png",
    star: "https://img.icons8.com/color/24/000000/star.png",
  },
  RECENT_DESTINATIONS: [
    {
      id: "1",
      address: "Kaduna City Center",
      coords: { latitude: "10.5105", longitude: "7.4165" },
    },
    {
      id: "3",
      address: "Murtala Square, Kaduna",
      coords: { latitude: "10.5189", longitude: "7.4386" },
    },
  ],
} as const;
