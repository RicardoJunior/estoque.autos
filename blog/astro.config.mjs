import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// O blog vive em estoque.autos/blog (o footer da landing já aponta pra cá).
// Para servir num subdomínio (blog.estoque.autos), troque `site` e remova `base`.
export default defineConfig({
  site: "https://estoque.autos",
  base: "/blog",
  integrations: [sitemap()],
});
