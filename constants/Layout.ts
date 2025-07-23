import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  APP_PADDING: 16,
  window: {
    width,
    height,
  },
};

export const scale = (size: number) => (width / 375) * size; // Base width: 375px (iPhone 14)

export const scaleText = (size: number) => (width / 375) * size;
