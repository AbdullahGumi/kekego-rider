const { getDefaultConfig } = require("@expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add websocket polyfill
config.resolver.nodeModulesPaths = [
  "node_modules",
  ...(config.resolver.nodeModulesPaths || []),
];

// WebSocket polyfill for React Native
config.resolver.alias = {
  ...config.resolver.alias,
  ws: require.resolve("ws"),
};

module.exports = config;
