import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://lardon.masmeert.com",
  output: "static",
  build: { format: "file" },
});
