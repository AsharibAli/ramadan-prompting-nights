import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default"],
    environment: "node",
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
