import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));
const projectDist = fileURLToPath(new URL("../dist", import.meta.url));

export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  },
  build: {
    outDir: projectDist,
    emptyOutDir: true
  }
});
