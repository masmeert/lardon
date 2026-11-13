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
      name: "Hanken Grotesk",
      cssVariable: "--font-hanken-grotesk",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
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
    {
      provider: fontProviders.fontsource(),
      name: "La Belle Aurore",
      cssVariable: "--font-la-belle-aurore",
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
