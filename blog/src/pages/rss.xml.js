import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE, postUrl, url } from "../lib/site";

export async function GET() {
  const posts = (await getCollection("posts", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: `${SITE.url}${url()}`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post.id),
    })),
    customData: "<language>pt-BR</language>",
  });
}
