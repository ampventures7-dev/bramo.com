import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const disallowedPaths = [
    "/admin",
    "/admin/*",
    "/owner",
    "/owner/*",
    "/booking/summary*",
    "/api/*",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowedPaths,
      },
      // Explicit permissions for major AI Answer & Generative Search Engines
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "Applebot",
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "cohere-ai",
        ],
        allow: "/",
        disallow: disallowedPaths,
      },
    ],
    sitemap: "https://www.bhramo.com/sitemap.xml",
    host: "https://www.bhramo.com",
  };
}

