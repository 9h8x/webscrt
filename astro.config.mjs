// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    build: {
      outDir: "dist",
      target: "esnext",
    },
    preview: {
      port: 3000,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    server: {
      cors: {
        origin: ["https://development.jns.net.ar", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"],
      },
      allowedHosts: ["development.jns.net.ar"], //added this
    },

    plugins: [tailwindcss()],
  },

  output: "server",
});
