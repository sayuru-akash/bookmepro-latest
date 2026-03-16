export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: ["/sitemap.xml"],
    host: process.env.NEXT_PUBLIC_SITE_URL || "https://bookmepro.com.au",
  };
}
