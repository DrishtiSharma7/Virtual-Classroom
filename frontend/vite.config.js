import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router-dom") || id.includes("react-router")) {
              return "vendor-router";
            }
            if (id.includes("@reduxjs") || id.includes("react-redux") || id.includes("/redux/")) {
              return "vendor-redux";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("lucide-react") || id.includes("react-icons")) {
              return "vendor-icons";
            }
            if (id.includes("socket.io-client")) {
              return "vendor-socket";
            }
            if (
              id.includes("react/") ||
              id.includes("react-dom/") ||
              id.includes("/scheduler/")
            ) {
              return "vendor-react";
            }
          }
        },
      },
    },
  },
});
