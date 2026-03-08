import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@utils": path.resolve(__dirname, "src/utils"),
      config: path.resolve(__dirname, "src/config"),
      utils: path.resolve(__dirname, "src/utils"),
      middlewares: path.resolve(__dirname, "src/middlewares"),
      modules: path.resolve(__dirname, "src/modules"),
      "generated/prisma": path.resolve(__dirname, "src/generated/prisma"),
    },
  },
});
