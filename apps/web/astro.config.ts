import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

import { websiteUrl } from "@lardon/brand";

export default defineConfig({
  site: websiteUrl,
  output: "static",
  build: { format: "file" },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Eczar",
      cssVariable: "--font-eczar",
      weights: [600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Georgia", "serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Reenie Beanie",
      cssVariable: "--font-reenie-beanie",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      display: "block",
      fallbacks: ["cursive"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
