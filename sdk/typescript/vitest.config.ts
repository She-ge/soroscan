import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      // Remap .js imports to .ts for NodeNext compatibility in tests
      { find: /^(\.\.?\/.*)\.js$/, replacement: "$1.ts" },
    ],
  },
  test: {
    environment: "node",
  },
});