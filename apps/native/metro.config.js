const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { withVarlockMetroConfig } = require("@varlock/expo-integration/metro-config");
const { getDefaultConfig } = require("expo/metro-config");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.cacheVersion = createHash("sha256")
  .update(process.env.APP_ENV ?? "development")
  .update(readFileSync(path.join(__dirname, ".env.schema"), "utf8"))
  .digest("hex");

const blockList = config.resolver.blockList ?? [];

config.resolver.blockList = [
  ...(Array.isArray(blockList) ? blockList : [blockList]),
  /[/\\]packages[/\\]infra[/\\]\.alchemy(?:[/\\]|$)/,
];

module.exports = withVarlockMetroConfig(
  withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
    cssEntryFile: "./src/_app/styles/global.css",
    dtsFile: "./uniwind-types.d.ts",
  }),
);
