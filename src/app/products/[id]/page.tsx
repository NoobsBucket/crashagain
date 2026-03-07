"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";

type ProductResponse  = { product: Product };
type ReviewsResponse  = { results: Review[] };
type ErrorResponse    = { error?: string };

type ProductImage = { id: number; image_url: string; sort_order: number };
type Product = {
  id: number; name: string; price: number;
  description: string; category_id: number; images: ProductImage[];
};
type Review = {
  id: number; user_id: string; user_name: string;
  rating: number; comment: string; created_at: string;
};

function StarRating({ value, onChange, size = "1.4rem" }: { value: number; onChange?: (v: number) => void; size?: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{ fontSize: size, cursor: onChange ? "pointer" : "default", color: star <= (hovered || value) ? "#c8824a" : "#e0d8d0", transition: "color 0.15s, transform 0.15s", display: "inline-block", transform: hovered === star ? "scale(1.2)" : "scale(1)" }}>★</span>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  // ── Supabase ──
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<User | null>(null);
  const isSignedIn = !!user;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Product & reviews ──
  const [product, setProduct]   = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded]       = useState(false);
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const reviewsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products?id=${id}`)
      .then(r => r.json() as Promise<ProductResponse>)
      .then(d => setProduct(d.product));
  }, [id]);

  const fetchReviews = () => {
    if (!id) return;
    fetch(`/api/reviews?product_id=${id}`, { credentials: "include" })
      .then(r => r.json() as Promise<ReviewsResponse>)
      .then(d => setReviews(d.results || []));
  };

  useEffect(() => { fetchReviews(); }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.images?.[0]?.image_url || "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.images?.[0]?.image_url || "" });
    router.push("/checkout");
  };

  const submitReview = async () => {
    if (!rating) return alert("Please select a rating");
    if (!comment.trim()) return alert("Please write a comment");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: Number(id), rating, comment }),
      });
      const data = await res.json() as ErrorResponse;
      if (res.ok) { setRating(0); setComment(""); fetchReviews(); }
      else alert(data.error || "Failed");
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const deleteReview = async (reviewId: number) => {
    if (!confirm("Delete your review?")) return;
    await fetch("/api/reviews", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: reviewId }) });
    fetchReviews();
  };

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (!product) return (
    <>
      <Navbar />
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e0d8d0", borderTop: "3px solid #1a1a18", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#999", fontFamily: "var(--font-body, sans-serif)", fontSize: "0.9rem" }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  const images = product.images?.length
    ? product.images
    : [{ id: 0, image_url: "https://placehold.co/800x800?text=No+Image", sort_order: 0 }];

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .pd-wrap { animation: fadeUp 0.45s ease forwards; }
        .pd-thumb:hover { opacity: 1 !important; border-color: #1a1a18 !important; }
        .pd-add:hover { background: #2a2a26 !important; }
        .pd-buy:hover { background: #b8722a !important; }
        .pd-back:hover { color: #1a1a18 !important; }
        .pd-review:hover { border-color: #c8824a !important; }
        .pd-grid { display: flex; flex-direction: row; gap: 56px; align-items: flex-start; }
        .pd-img-col { flex: 1 1 420px; position: sticky; top: 24px; }
        .pd-info-col { flex: 1 1 320px; }
        .pd-reviews-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) {
          .pd-grid { flex-direction: column !important; gap: 0 !important; }
          .pd-img-col { position: relative !important; top: 0 !important; flex: none !important; width: 100% !important; }
          .pd-info-col { flex: none !important; width: 100% !important; }
          .pd-reviews-grid { grid-template-columns: 1fr !important; }
          .pd-btns { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .pd-main-img { aspect-ratio: 4/3 !important; border-radius: 0 !important; }
          .pd-thumbs { padding: 0 16px !important; }
          .pd-info-inner { padding: 20px 16px !important; }
        }
      `}</style>

      <div style={{ background: "#faf8f5", minHeight: "100vh" }}>
        <div className="pd-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>

          <button className="pd-back" onClick={() => router.back()} style={{
            background: "none", border: "none", cursor: "pointer", color: "#bbb",
            fontSize: "0.82rem", marginBottom: 28, padding: 0, display: "flex",
            alignItems: "center", gap: 6, fontFamily: "var(--font-body, sans-serif)",
            transition: "color 0.2s", letterSpacing: "0.05em"
          }}>← Back</button>

          <div className="pd-grid">
            {/* ── Image Column ── */}
            <div className="pd-img-col">
              <div className="pd-main-img" style={{ width: "100%", aspectRatio: "1/1", borderRadius: 20, overflow: "hidden", background: "#ede9e3", boxShadow: "0 4px 40px rgba(0,0,0,0.08)" }}>
                <img key={images[activeImg].image_url} src={images[activeImg].image_url} alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.3s" }} />
              </div>
              {images.length > 1 && (
                <div className="pd-thumbs" style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  {images.map((img, i) => (
                    <div key={img.id} className="pd-thumb" onClick={() => setActiveImg(i)} style={{
                      width: 64, height: 64, borderRadius: 10, overflow: "hidden", cursor: "pointer",
                      border: activeImg === i ? "2.5px solid #1a1a18" : "2.5px solid #e0dbd4",
                      opacity: activeImg === i ? 1 : 0.5, transition: "all 0.2s", flexShrink: 0
                    }}>
                      <img src={img.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info Column ── */}
            <div className="pd-info-col">
              <div className="pd-info-inner" style={{ padding: "4px 0" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#c8824a", fontWeight: 700, marginBottom: 10 }}>Product</div>
                <h1 style={{ margin: "0 0 14px", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontFamily: "var(--font-display, 'Playfair Display', serif)", color: "#1a1a18", lineHeight: 1.18, letterSpacing: "-0.02em" }}>
                  {product.name}
                </h1>
                {reviews.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, cursor: "pointer" }}
                    onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}>
                    <StarRating value={Math.round(avgRating)} size="0.95rem" />
                    <span style={{ fontSize: "0.82rem", color: "#999" }}>{avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#1a1a18", marginBottom: 20, letterSpacing: "-0.02em" }}>RS {product.price.toFixed(2)}</div>
                <div style={{ height: 1, background: "linear-gradient(to right, #ddd8d0, transparent)", marginBottom: 20 }} />
                {product.description && (
                  <p style={{ margin: "0 0 24px", color: "#6b6560", lineHeight: 1.8, fontSize: "0.93rem" }}>{product.description}</p>
                )}
                <div className="pd-btns" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  <button className="pd-buy" onClick={handleBuyNow} style={{ width: "100%", padding: "14px 24px", background: "#c8824a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.03em" }}>Buy Now</button>
                  <button className="pd-add" onClick={handleAdd} style={{ width: "100%", padding: "14px 24px", background: added ? "#2d7a45" : "#1a1a18", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.03em" }}>
                    {added ? "✓ Added to Cart" : "Add to Cart"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "16px 0", borderTop: "1px solid #ede9e3" }}>
                  {[["🚚", "Fast Delivery"], ["🔄", "Easy Returns"], ["🔒", "Secure"]].map(([icon, label]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.76rem", color: "#999" }}>
                      <span>{icon}</span><span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Reviews ── */}
          <div ref={reviewsRef} style={{ marginTop: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display, serif)", fontSize: "1.6rem", color: "#1a1a18", letterSpacing: "-0.02em" }}>Reviews</h2>
              {reviews.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", background: "#ede9e3", borderRadius: 50 }}>
                  <StarRating value={Math.round(avgRating)} size="0.85rem" />
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a1a18" }}>{avgRating.toFixed(1)}</span>
                  <span style={{ color: "#aaa", fontSize: "0.78rem" }}>({reviews.length})</span>
                </div>
              )}
            </div>

            {/* Write review */}
            <div style={{ marginBottom: 32 }}>
              {isSignedIn ? (
                <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #ede9e3", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ margin: "0 0 18px", fontSize: "0.95rem", fontWeight: 700, color: "#1a1a18" }}>Write a Review</h3>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", marginBottom: 8, fontSize: "0.75rem", color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>Rating</label>
                    <StarRating value={rating} onChange={setRating} size="1.7rem" />
                  </div>
                  <textarea placeholder="What did you think of this product?" value={comment} onChange={e => setComment(e.target.value)}
                    style={{ width: "100%", minHeight: 100, padding: "12px 14px", borderRadius: 10, border: "1px solid #e0dbd4", fontSize: "0.88rem", resize: "vertical", boxSizing: "border-box", fontFamily: "var(--font-body, sans-serif)", background: "#faf8f5", outline: "none", color: "#1a1a18" }} />
                  <button onClick={submitReview} disabled={submitting} style={{ marginTop: 12, padding: "10px 24px", background: "#1a1a18", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1, fontFamily: "var(--font-body, sans-serif)", fontSize: "0.88rem" }}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 16, padding: 28, textAlign: "center", border: "1px solid #ede9e3" }}>
                  <p style={{ margin: "0 0 14px", color: "#888", fontSize: "0.9rem" }}>Sign in to leave a review</p>
                  <button onClick={() => router.push("/login")} style={{ padding: "10px 24px", background: "#1a1a18", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body, sans-serif)" }}>
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
                <div style={{ fontSize: "2rem", marginBottom: 10 }}>✦</div>
                <p style={{ margin: 0, fontSize: "0.88rem" }}>No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="pd-reviews-grid">
                {reviews.map(review => (
                  <div key={review.id} className="pd-review" style={{ padding: 20, border: "1px solid #ede9e3", borderRadius: 14, background: "#fff", transition: "border-color 0.2s", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a18", marginBottom: 5 }}>{review.user_name}</div>
                        <StarRating value={review.rating} size="0.9rem" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ color: "#ccc", fontSize: "0.72rem" }}>{new Date(review.created_at).toLocaleDateString()}</span>
                        {/* Match by Supabase user id */}
                        {user?.id === review.user_id && (
                          <button onClick={() => deleteReview(review.id)} style={{ background: "none", border: "none", color: "#e33", cursor: "pointer", fontSize: "0.72rem", padding: 0 }}>Delete</button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, color: "#666", lineHeight: 1.7, fontSize: "0.86rem" }}>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}