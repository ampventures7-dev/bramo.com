import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/owner",
          "/owner/*",
          "/booking/summary*",
          "/api/*",
        ],
      },
    ],
    sitemap: "https://bhramo.com/sitemap.xml",
    host: "https://bhramo.com",
  };
}
