export default async function sitemap() {
  
  // Fetch all products from your API
const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`);
const data = await res.json() as { results: { id: number; created_at?: string }[] };

const products = data.results ?? [];

  // Dynamic product URLs — matches your /product/[id] route
  const productUrls = products.map((product: { id: number; created_at?: string }) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.id}`,
    lastModified: product.created_at ? new Date(product.created_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Static pages
  const staticUrls = [
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
  ];

  return [...staticUrls, ...productUrls];
}
