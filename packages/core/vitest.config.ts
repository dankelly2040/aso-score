import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Snapshot diffs should stay readable when a scoring tweak changes
    // only one bullet inside a 300-line check list.
    expect: { poll: { timeout: 0 } },
  },
});
