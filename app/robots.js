export default function robots() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://bookmepro.com.au";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: [`${siteUrl}/sitemap.xml`],
    host: siteUrl,
  };
}
