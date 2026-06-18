import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En dev, on proxy les appels API vers le backend Flask (port 5000)
// pour éviter les soucis de CORS. En prod, on utilise VITE_API_URL.
const API_TARGET = process.env.VITE_API_TARGET || "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/get_chat_response": API_TARGET,
      "/get_detect_response": API_TARGET,
      "/get_detect_chat": API_TARGET,
      "/transcribe": API_TARGET,
      "/reset_chat": API_TARGET,
      "/api": API_TARGET,
    },
  },
});
