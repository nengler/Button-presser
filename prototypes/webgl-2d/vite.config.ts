import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@game": path.join(repo, "src/game"),
    },
  },
  server: {
    port: 5174,
    fs: { allow: [repo] },
  },
});
