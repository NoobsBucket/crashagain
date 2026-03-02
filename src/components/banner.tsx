"use client";
import { useEffect, useState } from "react";
import style from "../styles/banner.module.css";

type Banner = {
  id: number;
  image_url: string;
  heading: string;
  button_text: string;
  sort_order: number;
  link_to?: string;
};

// 👇 ADD THIS
type BannerResponse = {
  results: Banner[];
};

const headingStyles = [style.headingSide, style.headingTop, style.headingTop, style.headingTop];
const divClasses = [style.div1, style.div3, style.div5, style.div4];

const scrollToCategory = (slug?: string) => {
  if (!slug) return;
  const el = document.getElementById(`category-${slug}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function Banner() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      const res = await fetch("/api/banners");
      const data = (await res.json()) as BannerResponse; // ✅ FIX

      setBanners(data.results || []);
    };

    fetchBanners();
  }, []);

  const displayBanners =
    banners.length > 0
      ? banners.slice(0, 4)
      : [
          { id: 1, image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", heading: "Explore\nThe Wild", button_text: "Discover", sort_order: 0 },
          { id: 2, image_url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80", heading: "Horizons", button_text: "Journey", sort_order: 1 },
          { id: 3, image_url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80", heading: "Forest", button_text: "Wander", sort_order: 2 },
          { id: 4, image_url: "https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=600&q=80", heading: "Cosmos", button_text: "Stargaze", sort_order: 3 },
        ];

  return (
    <section className={style.wrapper}>
      <div className={style.parent}>
        {displayBanners.map((banner, i) => (
          <div key={banner.id} className={divClasses[i] || style.div4}>
            <img src={banner.image_url} alt={banner.heading} className={style.bgImage} />
            <div className={style.overlay} />

            <h2 className={`${style.heading} ${headingStyles[i] || style.headingTop}`}>
              {banner.heading.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  {j < banner.heading.split("\n").length - 1 && <br />}
                </span>
              ))}
            </h2>

            <button className={style.btn} onClick={() => scrollToCategory(banner.link_to)}>
              {banner.button_text}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}