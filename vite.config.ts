import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  base: "/vibe-beach/", // GitHub Pages base URL
  define: {
    "import.meta.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
  },
});
