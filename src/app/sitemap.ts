import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { id: number; created_at?: string }[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`);
    const data = await res.json() as { results: { id: number; created_at?: string }[] };
    products = data.results ?? [];
  } catch (err) {
    console.error("Sitemap fetch failed:", err);
  }

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.id}`,
    lastModified: product.created_at ? new Date(product.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticUrls, ...productUrls];
}