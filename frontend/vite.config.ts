import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Load `.env` from monorepo root (parent of `frontend/`), not only `frontend/.env`.
  envDir: path.resolve(__dirname, ".."),
  plugins: [react()],
  server: {
    port: 5173
  }
});
