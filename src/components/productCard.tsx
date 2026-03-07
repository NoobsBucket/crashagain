"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import style from "../styles/productCard.module.css";
import { useCart } from "./CartContext";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  tag?: string;
};

type Props = {
  title?: string;
  products: Product[];
};

export default function ProductCard({ title = "Featured Collection", products }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const trackRef     = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLElement | null>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [added,    setAdded]    = useState<Record<number, boolean>>({});

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
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1800);
  };

  if (products.length === 0) return null;

  return (
    <section className={style.section}>
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
                {/* Image */}
                <div className={style.imgWrap}>
                  {p.tag && <span className={style.tag}>{p.tag}</span>}
                  <img
                    src={p.image_url || "https://placehold.co/600x400?text=No+Image"}
                    alt={p.name}
                    className={style.img}
                  />
                </div>

                {/* Info + always-visible buttons */}
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
  );
}