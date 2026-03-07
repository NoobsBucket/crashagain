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
  isFirst?: boolean;   // passed from parent — removes top padding on first section
};

export default function ProductCard({ title = "Featured Collection", products, isFirst = false }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [added, setAdded] = useState<Record<number, boolean>>({});

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

  if (products.length === 0) return null;

  return (
    <section
      className={style.section}
      style={isFirst ? { paddingTop: 56 } : { paddingTop: 32 }}
    >
      <div className={style.header}>
        <h2 className={style.sectionTitle}>{title}</h2>
      </div>

      <div className={style.trackWrapper}>
        <div className={style.track}>
          {products.map((p) => (
            <article
              className={style.card}
              key={p.id}
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
                  loading="lazy"
                />
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
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/products/${p.id}`);
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}