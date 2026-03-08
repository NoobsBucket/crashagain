"use client";
export const dynamic = 'force-dynamic'
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_name: string;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Record<number, boolean>>({});

type SearchResponse = {
  results: any[];
};

useEffect(() => {
  if (!query) {
    setLoading(false);
    return;
  }

  const search = async () => {
    setLoading(true);

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = (await res.json()) as SearchResponse;

    setResults(data.results || []);
    setLoading(false);
  };

  search();
}, [query]);
  const handleAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1800);
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px", fontFamily: "var(--font-body, sans-serif)" }}>

        <h1 style={{ fontFamily: "var(--font-display, serif)", color: "#1a1a18", marginBottom: 8 }}>
          {loading ? "Searching..." : `Results for "${query}"`}
        </h1>
        <p style={{ color: "#999", marginBottom: 32, fontSize: "0.9rem" }}>
          {!loading && `${results.length} product${results.length !== 1 ? "s" : ""} found`}
        </p>

        {loading ? (
          <div style={{ textAlign: "center", color: "#999", marginTop: 60 }}>Searching...</div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
            <p style={{ color: "#555", marginBottom: 8 }}>No products found for <strong>"{query}"</strong></p>
            <p style={{ color: "#999", fontSize: "0.85rem", marginBottom: 24 }}>Try a different spelling or browse our categories</p>
            <button onClick={() => router.push("/")} style={{ padding: "10px 24px", background: "#1a1a18", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
              Browse All Products
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            {results.map(product => (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.id}`)}
                style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", cursor: "pointer", overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 36px rgba(0,0,0,0.15)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#f0ede8" }}>
                  <img
                    src={product.image_url || "https://placehold.co/400x300?text=No+Image"}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {product.category_name && (
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", fontWeight: 600 }}>
                      {product.category_name}
                    </span>
                  )}
                  <h3 style={{ margin: "4px 0 6px", fontSize: "0.95rem", fontWeight: 600, color: "#1a1a18", lineHeight: 1.3 }}>
                    {product.name}
                  </h3>
                  <p style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: "#c8824a" }}>
                    RS {product.price.toFixed(2)}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={e => handleAdd(e, product)}
                      style={{ flex: 1, padding: "8px", background: added[product.id] ? "#2d7a45" : "#1a1a18", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer", transition: "background 0.2s" }}
                    >
                      {added[product.id] ? "✓ Added" : "Add to Cart"}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
                      style={{ flex: 1, padding: "8px", background: "transparent", color: "#1a1a18", border: "1.5px solid #1a1a18", borderRadius: 8, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", color: "#999", marginTop: 120, fontFamily: "sans-serif" }}>
        Searching...
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}