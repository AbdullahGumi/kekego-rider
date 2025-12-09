import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Cap the width for scaling calculations to avoid huge elements on iPad
const SCALE_WIDTH = Math.min(width, 500);

export const Layout = {
  APP_PADDING: 16,
  window: {
    width,
    height,
  },
};

export const scale = (size: number) => (SCALE_WIDTH / 375) * size; // Base width: 375px (iPhone 14)

export const scaleText = (size: number) => (SCALE_WIDTH / 375) * size;
