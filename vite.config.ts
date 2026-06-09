import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const eventsPath = require.resolve("events/");
const bufferPath = require.resolve("buffer/");

const nodeBuiltinAliasPlugin = {
  name: "node-builtin-alias",
  enforce: "pre" as const,
  resolveId(source: string) {
    if (source === "node:events" || source === "events") {
      return { id: eventsPath, moduleSideEffects: false };
    }
    if (source === "node:buffer" || source === "buffer") {
      return { id: bufferPath, moduleSideEffects: false };
    }
  },
};

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [nodeBuiltinAliasPlugin, netlify()],
  },
});
