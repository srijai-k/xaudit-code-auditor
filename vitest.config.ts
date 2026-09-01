import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node", // the analysis engine must never require a DOM/browser to run
        include: ["tests/**/*.test.ts"],
        globals: false,
    },
});
