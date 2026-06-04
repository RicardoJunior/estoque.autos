import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// App é SSR puro (sem ISR/SSG revalidate hoje), então não precisa de cache
// incremental em R2. Se um dia usar `revalidate`/`use cache`, adicione:
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
//   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
export default defineCloudflareConfig({});
