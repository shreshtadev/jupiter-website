import netlify from "@astrojs/netlify";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://shreshtasmg.in",
  output: "server",
  vite: {
    plugins: [tailwindcss()],
  },

  adapter: netlify({
    edgeMiddleware: true,
  }),
});
