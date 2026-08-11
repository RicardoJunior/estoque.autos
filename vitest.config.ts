import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // legacy/ é a v1 de referência — as suítes dela usam jest/supertest
    // que não estão instalados aqui.
    exclude: ["**/node_modules/**", "legacy/**", "blog/**"],
  },
});
