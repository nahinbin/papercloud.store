export const siteConfig = {
  name: "PaperCloud Store",
  description: "Discover premium stationery, art supplies, and lifestyle products curated by PaperCloud.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://papercloud.store",
  ogImage: "/fav.png",
  keywords: [
    "PaperCloud",
    "stationery",
    "art supplies",
    "premium notebooks",
    "creative gifts",
    "PaperCloud store",
  ],
  socials: {
    twitter: "@papercloud",
  },
};

export type SiteConfig = typeof siteConfig;


