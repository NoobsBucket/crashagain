"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com", "halayjan18@gmail.com"];

type ProductResponse = { product: Product };
type ReviewsResponse = { results: Review[] };
type ErrorResponse   = { error?: string };
type ProductImage    = { id: number; image_url: string; sort_order: number };
type Product = {
  id: number; name: string; price: number;
  description: string; category_id: number; images: ProductImage[];
};
type Review = {
  id: number; user_id: string; user_name: string;
  rating: number; comment: string; created_at: string;
};

/* ════════════════════════════════════════
   STAR RATING
════════════════════════════════════════ */
function StarRating({ value, onChange, size = "1.4rem" }: {
  value: number; onChange?: (v: number) => void; size?: string;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: size, cursor: onChange ? "pointer" : "default",
            color: star <= (hovered || value) ? "#c8824a" : "#e0d8d0",
            transition: "color 0.15s, transform 0.15s", display: "inline-block",
            transform: hovered === star ? "scale(1.2)" : "scale(1)",
          }}>★</span>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   IMAGE LIGHTBOX (portal — always on top)
   Same style as product card lightbox.
   Shows full image + thumbnail gallery.
════════════════════════════════════════ */
function ImageLightbox({ images, activeIndex, productName, onClose }: {
  images: ProductImage[];
  activeIndex: number;
  productName: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(activeIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setCurrent(c => Math.min(c + 1, images.length - 1));
      if (e.key === "ArrowLeft")  setCurrent(c => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, images.length]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10,9,7,0.90)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "20px 20px 100px",
        animation: "lbFadeIn 0.22s ease both",
      }}
    >
      {/* close */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 18, right: 18, zIndex: 10,
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "rgba(255,255,255,0.12)", color: "#fff",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center",
          transition: "background 0.18s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6"  y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* prev / next arrows */}
      {current > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setCurrent(c => c - 1); }}
          style={{
            position: "fixed", left: 18, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.18s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {current < images.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); setCurrent(c => c + 1); }}
          style={{
            position: "fixed", right: 18, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.18s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* main image */}
      <img
        src={images[current].image_url}
        alt={productName}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "88vw", maxHeight: "75vh",
          objectFit: "contain", borderRadius: 12,
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          animation: "lbScale 0.25s cubic-bezier(0.22,0.68,0,1.2) both",
          cursor: "default",
        }}
      />

      {/* counter */}
      {images.length > 1 && (
        <p style={{
          color: "rgba(255,255,255,0.4)", fontSize: "0.75rem",
          fontFamily: "Jost, sans-serif", letterSpacing: "0.08em",
          margin: "14px 0 10px", pointerEvents: "none",
        }}>
          {current + 1} / {images.length}
        </p>
      )}

      {/* thumbnail strip */}
      {images.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "fixed", bottom: 20,
            display: "flex", gap: 8, flexWrap: "wrap",
            justifyContent: "center", padding: "0 20px",
          }}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              onClick={() => setCurrent(i)}
              style={{
                width: 52, height: 52, borderRadius: 8, overflow: "hidden",
                cursor: "pointer", flexShrink: 0,
                border: current === i
                  ? "2.5px solid #fff"
                  : "2.5px solid rgba(255,255,255,0.2)",
                opacity: current === i ? 1 : 0.5,
                transition: "all 0.2s",
              }}
            >
              <img src={img.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}

      <p style={{
        color: "rgba(255,255,255,0.25)", fontSize: "0.72rem",
        fontFamily: "Jost, sans-serif", letterSpacing: "0.06em",
        margin: 0, pointerEvents: "none",
      }}>
        ESC to close · ← → to navigate
      </p>
    </div>,
    document.body
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { id }         = useParams();
  const router         = useRouter();
  const { addToCart }  = useCart();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [user, setUser] = useState<User | null>(null);
  const isAdmin    = ADMIN_EMAILS.includes(user?.email ?? "");
  const isSignedIn = !!user;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const [product,      setProduct]      = useState<Product | null>(null);
  const [activeImg,    setActiveImg]    = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [added,        setAdded]        = useState(false);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [rating,       setRating]       = useState(0);
  const [comment,      setComment]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
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
    if (!rating)        return alert("Please select a rating");
    if (!comment.trim()) return alert("Please write a comment");
    setSubmitting(true);
    try {
      const res  = await fetch("/api/reviews", {
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
    if (!confirm("Delete this review?")) return;
    await fetch("/api/reviews", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ id: reviewId }),
    });
    fetchReviews();
  };

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  /* ── Loading state ── */
  if (!product) return (
    <>
      <Navbar />
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf8f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e0d8d0", borderTop: "3px solid #1a1a18", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#999", fontFamily: "Jost, sans-serif", fontSize: "0.9rem" }}>Loading...</p>
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
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbScale  { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        .pd-wrap { animation: fadeUp 0.45s ease forwards; }
        .pd-thumb:hover  { opacity: 1 !important; border-color: #1a1a18 !important; }
        .pd-add:hover    { background: #2a2a26 !important; }
        .pd-buy:hover    { background: #b8722a !important; }
        .pd-back:hover   { color: #1a1a18 !important; }
        .pd-review:hover { border-color: #c8824a !important; }

        /* main image */
        .pd-main-img-wrap {
          position: relative; width: 100%;
          aspect-ratio: 4 / 5; border-radius: 20px;
          overflow: hidden; background: #ede9e3;
          box-shadow: 0 4px 40px rgba(0,0,0,0.08);
          cursor: zoom-in;
        }
        .pd-main-img-wrap img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: top; display: block;
          transition: transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .pd-main-img-wrap:hover img { transform: scale(1.03); }

        /* zoom hint badge */
        .pd-zoom-hint {
          position: absolute; bottom: 14px; right: 14px; z-index: 4;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.88);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s ease; pointer-events: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .pd-main-img-wrap:hover .pd-zoom-hint { opacity: 1; }

        .pd-grid { display: flex; flex-direction: row; gap: 56px; align-items: flex-start; }
        .pd-img-col  { flex: 1 1 420px; position: sticky; top: 24px; }
        .pd-info-col { flex: 1 1 320px; }
        .pd-reviews-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        @media (max-width: 768px) {
          .pd-grid         { flex-direction: column !important; gap: 0 !important; }
          .pd-img-col      { position: relative !important; top: 0 !important; flex: none !important; width: 100% !important; }
          .pd-info-col     { flex: none !important; width: 100% !important; }
          .pd-reviews-grid { grid-template-columns: 1fr !important; }
          .pd-btns         { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .pd-main-img-wrap { border-radius: 0 !important; }
          .pd-thumbs        { padding: 0 16px !important; }
          .pd-info-inner    { padding: 20px 16px !important; }
        }
      `}</style>

      <div style={{ background: "#faf8f5", minHeight: "100vh" }}>
        <div className="pd-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>

          <button className="pd-back" onClick={() => router.back()} style={{
            background: "none", border: "none", cursor: "pointer", color: "#bbb",
            fontSize: "0.82rem", marginBottom: 28, padding: 0,
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "Jost, sans-serif", transition: "color 0.2s", letterSpacing: "0.05em",
          }}>← Back</button>

          <div className="pd-grid">

            {/* ── Image Column ── */}
            <div className="pd-img-col">
              {/* main image — click opens lightbox */}
              <div
                className="pd-main-img-wrap"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  key={images[activeImg].image_url}
                  src={images[activeImg].image_url}
                  alt={product.name}
                />
                <span className="pd-zoom-hint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#18180f" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8"  x2="11" y2="14" />
                    <line x1="8"  y1="11" x2="14" y2="11" />
                  </svg>
                </span>
              </div>

              {/* thumbnails */}
              {images.length > 1 && (
                <div className="pd-thumbs" style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  {images.map((img, i) => (
                    <div key={img.id} className="pd-thumb"
                      onClick={() => setActiveImg(i)}
                      style={{
                        width: 64, height: 64, borderRadius: 10, overflow: "hidden", cursor: "pointer",
                        border: activeImg === i ? "2.5px solid #1a1a18" : "2.5px solid #e0dbd4",
                        opacity: activeImg === i ? 1 : 0.5,
                        transition: "all 0.2s", flexShrink: 0,
                      }}
                    >
                      <img src={img.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info Column ── */}
            <div className="pd-info-col">
              <div className="pd-info-inner" style={{ padding: "4px 0" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#c8824a", fontWeight: 700, marginBottom: 10 }}>Product</div>
                <h1 style={{ margin: "0 0 14px", fontSize: "clamp(1.6rem,4vw,2.2rem)", fontFamily: "var(--font-display,'Playfair Display',serif)", color: "#1a1a18", lineHeight: 1.18, letterSpacing: "-0.02em" }}>
                  {product.name}
                </h1>

                {reviews.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, cursor: "pointer" }}
                    onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}>
                    <StarRating value={Math.round(avgRating)} size="0.95rem" />
                    <span style={{ fontSize: "0.82rem", color: "#999" }}>
                      {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#1a1a18", marginBottom: 20, letterSpacing: "-0.02em" }}>
                  RS {product.price.toFixed(2)}
                </div>

                <div style={{ height: 1, background: "linear-gradient(to right, #ddd8d0, transparent)", marginBottom: 20 }} />

                {product.description && (
                  <p style={{ margin: "0 0 24px", color: "#6b6560", lineHeight: 1.8, fontSize: "0.93rem" }}>
                    {product.description}
                  </p>
                )}

                <div className="pd-btns" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  <button className="pd-buy" onClick={handleBuyNow} style={{ width: "100%", padding: "14px 24px", background: "#c8824a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s", fontFamily: "Jost, sans-serif", letterSpacing: "0.03em" }}>
                    Buy Now
                  </button>
                  <button className="pd-add" onClick={handleAdd} style={{ width: "100%", padding: "14px 24px", background: added ? "#2d7a45" : "#1a1a18", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s", fontFamily: "Jost, sans-serif", letterSpacing: "0.03em" }}>
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

          {/* ════════════════════════════════════════
              REVIEWS
          ════════════════════════════════════════ */}
          <div ref={reviewsRef} style={{ marginTop: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display,serif)", fontSize: "1.6rem", color: "#1a1a18", letterSpacing: "-0.02em" }}>Reviews</h2>
              {reviews.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", background: "#ede9e3", borderRadius: 50 }}>
                  <StarRating value={Math.round(avgRating)} size="0.85rem" />
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a1a18" }}>{avgRating.toFixed(1)}</span>
                  <span style={{ color: "#aaa", fontSize: "0.78rem" }}>({reviews.length})</span>
                </div>
              )}
            </div>

            {/* write review */}
            <div style={{ marginBottom: 32 }}>
              {isSignedIn ? (
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #ede9e3", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ margin: "0 0 18px", fontSize: "0.95rem", fontWeight: 700, color: "#1a1a18" }}>Write a Review</h3>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", marginBottom: 8, fontSize: "0.75rem", color: "#aaa", letterSpacing: "0.08em", textTransform: "uppercase" }}>Rating</label>
                    <StarRating value={rating} onChange={setRating} size="1.7rem" />
                  </div>
                  <textarea
                    placeholder="What did you think of this product?"
                    value={comment} onChange={e => setComment(e.target.value)}
                    style={{ width: "100%", minHeight: 100, padding: "12px 14px", borderRadius: 10, border: "1px solid #e0dbd4", fontSize: "0.88rem", resize: "vertical", boxSizing: "border-box", fontFamily: "Jost, sans-serif", background: "#faf8f5", outline: "none", color: "#1a1a18" }}
                  />
                  <button onClick={submitReview} disabled={submitting}
                    style={{ marginTop: 12, padding: "10px 24px", background: "#1a1a18", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1, fontFamily: "Jost, sans-serif", fontSize: "0.88rem" }}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 16, padding: 28, textAlign: "center", border: "1px solid #ede9e3" }}>
                  <p style={{ margin: "0 0 14px", color: "#888", fontSize: "0.9rem" }}>Sign in to leave a review</p>
                  <button onClick={() => router.push("/login")}
                    style={{ padding: "10px 24px", background: "#1a1a18", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "Jost, sans-serif" }}>
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* reviews list */}
            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
                <div style={{ fontSize: "2rem", marginBottom: 10 }}>✦</div>
                <p style={{ margin: 0, fontSize: "0.88rem" }}>No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="pd-reviews-grid">
                {reviews.map(review => (
                  <div key={review.id} className="pd-review"
                    style={{ padding: 20, border: "1px solid #ede9e3", borderRadius: 14, background: "#fff", transition: "border-color 0.2s", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a18", marginBottom: 5 }}>{review.user_name}</div>
                        <StarRating value={review.rating} size="0.9rem" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ color: "#ccc", fontSize: "0.72rem" }}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                        {/* show delete if own review OR admin */}
                        {(user?.id === review.user_id || isAdmin) && (
                          <button
                            onClick={() => deleteReview(review.id)}
                            style={{
                              background: "none", border: "1px solid rgba(227,51,51,0.2)",
                              color: "#e33", cursor: "pointer", fontSize: "0.7rem",
                              padding: "3px 10px", borderRadius: 100,
                              fontFamily: "Jost, sans-serif", fontWeight: 600,
                              letterSpacing: "0.06em", transition: "background 0.18s, color 0.18s",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "#e33";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "none";
                              e.currentTarget.style.color = "#e33";
                            }}
                          >
                            {isAdmin && user?.id !== review.user_id ? "Delete (Admin)" : "Delete"}
                          </button>
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

      {/* ── Image Lightbox portal ── */}
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          activeIndex={activeImg}
          productName={product.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}