import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://lardon.masmeert.com",
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
      fallbacks: ["cursive"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
