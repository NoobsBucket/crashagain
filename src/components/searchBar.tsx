"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import style from "../styles/searchBar.module.css";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category_name: string;
};

// ✅ ADD THIS
type SearchResponse = {
  results: Product[];
};

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);

        // ✅ FIX — tell TS what API returns
        const data = (await res.json()) as SearchResponse;

        setSuggestions((data.results || []).slice(0, 6));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (product: Product) => {
    setShowSuggestions(false);
    setSearchQuery("");
    router.push(`/products/${product.id}`);
  };

  const handleViewAll = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <form className={style.searchBar} onSubmit={handleSearch}>
        <img src="/icons/search.svg" alt="Search" className={style.searchIcon} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className={style.searchInput}
          autoComplete="off"
        />
        {loading && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: "2px solid #ddd", borderTop: "2px solid #1a1a18", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          zIndex: 200, overflow: "hidden", border: "1px solid #f0f0f0"
        }}>
          {suggestions.map((product, i) => (
            <div
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "1px solid #f5f5f5" : "none",
                transition: "background 0.15s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f9f8f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              <img
                src={product.image_url || "https://placehold.co/48x36?text=?"}
                alt={product.name}
                style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1a1a18", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {product.name}
                </div>
                {product.category_name && (
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>{product.category_name}</div>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#c8824a", flexShrink: 0 }}>
                RS {product.price.toFixed(2)}
              </div>
            </div>
          ))}

          {/* View all results */}
          <div
            onClick={handleViewAll}
            style={{
              padding: "10px 14px", textAlign: "center", fontSize: "0.85rem",
              color: "#1a1a18", fontWeight: 600, cursor: "pointer",
              background: "#f9f8f6", borderTop: "1px solid #eee"
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f0ede8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f9f8f6")}
          >
            View all results for "{searchQuery}"
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}