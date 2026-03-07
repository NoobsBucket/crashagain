"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import style from "../styles/productCard.module.css";
import { useCart } from "./CartContext";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description?: string;
  tag?: string;
};

type Props = {
  title?: string;
  products: Product[];
  isFirst?: boolean;
};

/* ── Lightbox ────────────────────────────────────────────────── */
type LbState = { open: boolean; product: Product | null };

function Lightbox({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleDetails = () => {
    onClose();
    router.push(`/products/${product.id}`);
  };

  return createPortal(
    <div
      className={style.lbOverlay}
      onClick={onClose}          /* click outside → close */
    >
      <div
        className={style.lbBox}
        onClick={e => e.stopPropagation()}   /* click inside → don't close */
      >
        {/* close button */}
        <button className={style.lbClose} onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6"  y2="18" />
            <line x1="6"  y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* full image — object-fit: contain so nothing is cropped */}
        <div className={style.lbImgWrap}>
          <img
            src={product.image_url || "https://placehold.co/600x800?text=No+Image"}
            alt={product.name}
            className={style.lbImg}
          />
        </div>

        {/* info panel */}
        <div className={style.lbInfo}>
          {product.tag && <span className={style.lbTag}>{product.tag}</span>}

          <h2 className={style.lbTitle}>{product.name}</h2>
          <p className={style.lbPrice}>RS {product.price.toFixed(2)}</p>

          <div className={style.lbDivider} />

          {product.description ? (
            <p className={style.lbDesc}>{product.description}</p>
          ) : (
            <p className={style.lbDesc} style={{ opacity: 0.4 }}>
              No description available.
            </p>
          )}

          <div className={style.lbBtnGroup}>
            <button
              className={`${style.lbBtnCart} ${added ? style.lbBtnCartAdded : ""}`}
              onClick={handleAdd}
            >
              {added ? "✓ Added to Cart" : "Add to Cart"}
            </button>
            <button className={style.lbBtnDetails} onClick={handleDetails}>
              View Full Details
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── ProductCard ─────────────────────────────────────────────── */
export default function ProductCard({
  title = "Featured Collection",
  products,
  isFirst = false,
}: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const trackRef     = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLElement | null>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [added,    setAdded]    = useState<Record<number, boolean>>({});
  const [lb,       setLb]       = useState<LbState>({ open: false, product: null });

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    setTimeout(updateArrows, 150);
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  const scroll = (dir: "left" | "right") => {
    const track = trackRef.current;
    const card  = firstCardRef.current;
    if (!track || !card) return;
    const step = card.getBoundingClientRect().width + 12;
    track.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  const handleAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1800);
  };

  const openLightbox = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setLb({ open: true, product });
  };

  if (products.length === 0) return null;

  return (
    <>
      <section
        className={style.section}
        style={isFirst ? { paddingTop: 56 } : { paddingTop: 32 }}
      >
        <div className={style.header}>
          <h2 className={style.sectionTitle}>{title}</h2>
        </div>

        <div className={style.carouselOuter}>

          {/* LEFT arrow */}
          <button
            className={`${style.arrowOverlay} ${style.arrowLeft} ${!canLeft ? style.arrowHidden : ""}`}
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* RIGHT arrow */}
          <button
            className={`${style.arrowOverlay} ${style.arrowRight} ${!canRight ? style.arrowHidden : ""}`}
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className={style.trackWrapper}>
            <div className={style.track} ref={trackRef}>
              {products.map((p, i) => (
                <article
                  className={style.card}
                  key={p.id}
                  ref={el => { if (i === 0) firstCardRef.current = el; }}
                  onClick={() => router.push(`/products/${p.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Image — click opens lightbox */}
                  <div
                    className={style.imgWrap}
                    onClick={e => openLightbox(e, p)}
                  >
                    {p.tag && <span className={style.tag}>{p.tag}</span>}
                    <img
                      src={p.image_url || "https://placehold.co/600x800?text=No+Image"}
                      alt={p.name}
                      className={style.img}
                      loading="lazy"
                    />
                    {/* zoom hint */}
                    <div className={style.zoomHint}>
                      <div className={style.zoomIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          <line x1="11" y1="8"  x2="11" y2="14" />
                          <line x1="8"  y1="11" x2="14" y2="11" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info + buttons */}
                  <div className={style.info}>
                    <h3 className={style.title}>{p.name}</h3>
                    <p className={style.price}>RS {p.price.toFixed(2)}</p>
                    <div className={style.btnGroup}>
                      <button
                        className={`${style.btnCart} ${added[p.id] ? style.btnCartAdded : ""}`}
                        onClick={e => handleAdd(e, p)}
                      >
                        {added[p.id] ? "✓ Added" : "Add to Cart"}
                      </button>
                      <button
                        className={style.btnLearn}
                        onClick={e => { e.stopPropagation(); router.push(`/products/${p.id}`); }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Lightbox — rendered via portal so it's always on top */}
      {lb.open && lb.product && (
        <Lightbox
          product={lb.product}
          onClose={() => setLb({ open: false, product: null })}
        />
      )}
    </>
  );
}