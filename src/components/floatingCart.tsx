"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import style from "../styles/floatingCart.module.css";

export default function FloatingCart() {
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleCheckout = () => {
    setIsOpen(false);
    router.push("/checkout");
  };

  return (
    <>
      <button
        className={style.floatingCart}
        onClick={() => setIsOpen(true)}
        aria-label="Shopping cart"
        style={{ display: "flex" }}
      >
        <img src="/icons/cart.svg" alt="Cart" />
        {totalItems > 0 && (
          <span className={style.badge}>{totalItems}</span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 99, transition: "opacity 0.3s"
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: "fixed", top: 0, right: isOpen ? 0 : "-420px", width: "100%", maxWidth: 420,
        height: "100vh", background: "#fff", zIndex: 100, boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        transition: "right 0.3s ease", display: "flex", flexDirection: "column",
        fontFamily: "var(--font-body, sans-serif)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #eee" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "var(--font-display, serif)" }}>
            Your Cart{" "}
            {totalItems > 0 && (
              <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#999" }}>
                ({totalItems} item{totalItems !== 1 ? "s" : ""})
              </span>
            )}
          </h2>
          <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666", lineHeight: 1 }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", marginTop: 60 }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🛒</div>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <img
                    src={item.image_url || "https://placehold.co/80x60?text=?"}
                    alt={item.name}
                    style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div style={{ color: "#c8824a", fontWeight: 700, fontSize: "0.9rem" }}>RS {item.price.toFixed(2)}</div>
                  </div>
                  {/* Quantity controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >−</button>
                    <span style={{ minWidth: 20, textAlign: "center", fontWeight: 600 }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1.2rem", marginLeft: 4 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "#1a1a18" }}>RS {totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              style={{
                width: "100%", padding: "14px", background: "#1a1a18", color: "#fff",
                border: "none", borderRadius: 10, fontWeight: 700, fontSize: "1rem",
                cursor: "pointer", transition: "background 0.2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#333")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1a1a18")}
            >
              Checkout — RS {totalPrice.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}