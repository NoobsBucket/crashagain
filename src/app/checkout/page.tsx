"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  // ── Auth state (replaces useUser from Clerk) ───────────────────────────
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsSignedIn(!!data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsSignedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const placeOrder = async () => {
    if (!address.trim() || !city.trim() || !phone.trim())
      return alert("Please fill all fields");
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address: address.trim(),
          city: city.trim(),
          phone: phone.trim(),
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { orderId: number; error?: string };
      if (res.ok) {
        clearCart();
        setOrderId(data.orderId);
        setSuccess(true);
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setPlacing(false);
    }
  };

  /* ── Success ── */
  if (success)
    return (
      <>
        <Navbar />
        <style>{css}</style>
        <div className="page">
          <div className="solo-card anim-1">
            <div className="check-ring">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="chip">Order Confirmed</span>
            <h1 className="display-lg" style={{ marginTop: 16 }}>Thank you.</h1>
            <p className="muted-body">Your order is on its way to being prepared. We'll keep you updated every step.</p>
            <p className="order-num">#{String(orderId).padStart(6, "0")}</p>
            <div className="btn-row">
              <button className="btn-primary" onClick={() => router.push("/orders")}>View Orders</button>
              <button className="btn-ghost" onClick={() => router.push("/")}>Keep Shopping</button>
            </div>
          </div>
        </div>
      </>
    );

  /* ── Auth loading ── */
  if (isSignedIn === null)
    return (
      <>
        <Navbar />
        <style>{css}</style>
        <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#7c9e87" }} />
        </div>
      </>
    );

  /* ── Not signed in ── */
  if (!isSignedIn)
    return (
      <>
        <Navbar />
        <style>{css}</style>
        <div className="page">
          <div className="solo-card anim-1">
            <span className="chip">Checkout</span>
            <h2 className="display-lg" style={{ marginTop: 16 }}>Sign in to continue</h2>
            <p className="muted-body">You'll need an account to securely place your order.</p>
            <div className="btn-row" style={{ marginTop: 36 }}>
              {/* Replaced Clerk's <SignInButton> with a plain router.push */}
              <button className="btn-primary" onClick={() => router.push("/login")}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </>
    );

  /* ── Empty cart ── */
  if (items.length === 0)
    return (
      <>
        <Navbar />
        <style>{css}</style>
        <div className="page">
          <div className="solo-card anim-1">
            <span className="chip">Your Cart</span>
            <h2 className="display-lg" style={{ marginTop: 16 }}>Nothing here yet</h2>
            <p className="muted-body">Add items to your cart before heading to checkout.</p>
            <div className="btn-row" style={{ marginTop: 36 }}>
              <button className="btn-primary" onClick={() => router.push("/")}>Explore Products</button>
            </div>
          </div>
        </div>
      </>
    );

  /* ── Main Checkout ── */
  return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="page">
        <div className="page-header anim-1">
          <span className="chip">Secure Checkout</span>
          <h1 className="display-xl">Complete your order</h1>
        </div>

        <div className="checkout-grid">
          {/* ─ LEFT ─ */}
          <div className="panel anim-2">
            <div className="panel-header">
              <span className="step-num">01</span>
              <div>
                <div className="panel-eyebrow">Delivery</div>
                <h2 className="panel-title">Where should we send it?</h2>
              </div>
            </div>

            <div className="fields">
              <div className="field-full">
                <label className="field-label">Full Address</label>
                <textarea
                  className="field-input"
                  placeholder="Street, building, apartment number..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="field-row">
                <div>
                  <label className="field-label">City</label>
                  <input className="field-input" placeholder="Karachi" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Phone</label>
                  <input className="field-input" placeholder="03001234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="trust-row">
              {[["🔒", "SSL Encrypted"], ["📦", "Fast Delivery"], ["↩", "Easy Returns"]].map(([icon, label]) => (
                <div className="trust-badge" key={label}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─ RIGHT ─ */}
          <div className="panel anim-3">
            <div className="panel-header">
              <span className="step-num">02</span>
              <div>
                <div className="panel-eyebrow">Summary</div>
                <h2 className="panel-title">Your selection</h2>
              </div>
            </div>

            <div className="items-list">
              {items.map((item) => (
                <div className="item-row" key={item.id}>
                  <div className="item-dot" />
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-meta">Qty {item.quantity} · ${item.price.toFixed(2)} each</span>
                  </div>
                  <span className="item-price">RS {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="totals">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="totals-row">
                <span>Shipping</span>
                <span className="italic">Calculated at dispatch</span>
              </div>
              <div className="totals-final">
                <span>Total</span>
                <span>RS {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              className={`btn-primary btn-full ${placing ? "btn-loading" : ""}`}
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? (
                <><span className="spinner" /> Processing…</>
              ) : (
                `Place Order — ${totalPrice.toFixed(2)}`
              )}
            </button>

            <p className="fine-print">Encrypted & secure · By ordering you agree to our terms of service</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   CSS — unchanged from original
═══════════════════════════════════════════ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600;700&display=swap');

  :root {
    --bg:         #0f1117;
    --surface:    #181c26;
    --surface2:   #1e2333;
    --border:     rgba(255,255,255,0.07);
    --border-hi:  rgba(255,255,255,0.15);
    --accent:     #7c9e87;
    --accent-dim: rgba(124,158,135,0.15);
    --accent-glow:rgba(124,158,135,0.25);
    --text:       #e8eaf0;
    --text-2:     #8b9099;
    --text-3:     #545a66;
    --display:    'Jost', sans-serif;
    --body:       'Jost', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    font-family: var(--body);
    -webkit-font-smoothing: antialiased;
    color: var(--text);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .anim-1 { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
  .anim-2 { animation: fadeUp 0.55s 0.08s cubic-bezier(.22,1,.36,1) both; opacity: 0; animation-fill-mode: forwards; }
  .anim-3 { animation: fadeUp 0.55s 0.16s cubic-bezier(.22,1,.36,1) both; opacity: 0; animation-fill-mode: forwards; }

  .page {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 60% 50% at 20% 0%, rgba(124,158,135,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 80% 100%, rgba(100,120,180,0.06) 0%, transparent 70%),
      var(--bg);
    padding: 64px 20px 100px;
    font-family: var(--body);
  }

  .page-header { max-width: 980px; margin: 0 auto 40px; }

  .display-xl {
    font-family: var(--display); font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 300; color: var(--text); line-height: 1.0;
    letter-spacing: -0.04em; margin-top: 10px;
  }
  .display-lg {
    font-family: var(--display); font-size: clamp(1.9rem, 4vw, 2.8rem);
    font-weight: 300; color: var(--text); line-height: 1.0; letter-spacing: -0.04em;
  }

  .chip {
    display: inline-flex; align-items: center; padding: 5px 13px;
    background: var(--accent-dim); border: 1px solid rgba(124,158,135,0.3);
    border-radius: 100px; font-size: 0.7rem; font-weight: 500;
    letter-spacing: 0.1em; color: var(--accent); text-transform: uppercase;
  }

  .checkout-grid {
    max-width: 980px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 400px;
    gap: 20px; align-items: start;
  }
  @media (max-width: 800px) { .checkout-grid { grid-template-columns: 1fr; } }

  .panel {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 32px; position: relative; overflow: hidden;
  }
  .panel::before {
    content: ''; position: absolute; inset: 0; border-radius: 20px;
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
    pointer-events: none;
  }

  .panel-header {
    display: flex; align-items: flex-start; gap: 16px;
    margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--border);
  }
  .step-num {
    font-family: var(--display); font-weight: 200; font-size: 2rem;
    line-height: 1; color: var(--accent); opacity: 0.8;
    flex-shrink: 0; margin-top: 2px; letter-spacing: -0.02em;
  }
  .panel-eyebrow {
    font-size: 0.68rem; letter-spacing: 0.18em; color: var(--text-3);
    text-transform: uppercase; margin-bottom: 4px; font-weight: 500;
  }
  .panel-title {
    font-family: var(--display); font-size: 1.35rem; font-weight: 500;
    color: var(--text); letter-spacing: -0.02em; line-height: 1.2;
  }

  .fields { display: flex; flex-direction: column; gap: 20px; }
  .field-full { display: flex; flex-direction: column; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 480px) { .field-row { grid-template-columns: 1fr; } }

  .field-label {
    font-size: 0.68rem; font-weight: 500; letter-spacing: 0.14em;
    color: var(--text-3); text-transform: uppercase; margin-bottom: 8px; display: block;
  }
  .field-input {
    width: 100%; padding: 13px 16px; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 12px;
    font-family: var(--body); font-size: 0.9rem; font-weight: 300;
    color: var(--text); transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; resize: none;
  }
  .field-input::placeholder { color: var(--text-3); }
  .field-input:focus {
    outline: none; border-color: var(--accent);
    background: rgba(124,158,135,0.05); box-shadow: 0 0 0 4px var(--accent-glow);
  }

  .trust-row {
    display: flex; flex-wrap: wrap; gap: 20px;
    margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border);
  }
  .trust-badge { display: flex; align-items: center; gap: 7px; font-size: 0.72rem; color: var(--text-3); letter-spacing: 0.04em; }

  .items-list { display: flex; flex-direction: column; gap: 0; margin-bottom: 8px; }
  .item-row { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .item-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); opacity: 0.6; flex-shrink: 0; }
  .item-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .item-name { font-size: 0.9rem; font-weight: 500; color: var(--text); letter-spacing: 0.01em; }
  .item-meta { font-size: 0.72rem; color: var(--text-3); letter-spacing: 0.06em; }
  .item-price { font-family: var(--display); font-size: 0.95rem; color: var(--text); font-weight: 600; letter-spacing: -0.01em; }

  .totals { padding: 20px 0 24px; }
  .totals-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-2); padding: 6px 0; letter-spacing: 0.02em; }
  .italic { font-style: italic; }
  .totals-final { display: flex; justify-content: space-between; align-items: baseline; margin-top: 14px; padding-top: 16px; border-top: 1px solid var(--border-hi); }
  .totals-final > span:first-child { font-size: 0.8rem; font-weight: 500; color: var(--text-2); letter-spacing: 0.08em; text-transform: uppercase; }
  .totals-final > span:last-child { font-family: var(--display); font-size: 2rem; font-weight: 300; color: var(--text); letter-spacing: -0.04em; }

  .btn-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .btn-primary {
    padding: 14px 28px; background: var(--accent); color: #0f1117;
    border: none; border-radius: 100px; font-family: var(--body);
    font-weight: 600; font-size: 0.8rem; letter-spacing: 0.08em;
    text-transform: uppercase; cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,158,135,0.35); }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-full { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 28px; font-size: 0.82rem; }
  .btn-ghost {
    padding: 14px 28px; background: transparent; color: var(--text-2);
    border: 1px solid var(--border-hi); border-radius: 100px;
    font-family: var(--body); font-weight: 500; font-size: 0.8rem;
    letter-spacing: 0.06em; cursor: pointer; transition: border-color 0.18s, color 0.18s, transform 0.18s;
  }
  .btn-ghost:hover { border-color: var(--text-2); color: var(--text); transform: translateY(-1px); }

  .spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(15,17,23,0.2); border-top-color: #0f1117;
    border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
  }

  .fine-print { margin-top: 14px; text-align: center; font-size: 0.68rem; color: var(--text-3); letter-spacing: 0.04em; line-height: 1.6; }
  .muted-body { font-size: 0.93rem; color: var(--text-2); line-height: 1.75; margin-top: 12px; max-width: 380px; }
  .order-num { font-size: 0.75rem; letter-spacing: 0.2em; color: var(--text-3); margin: 10px 0 40px; }

  .solo-card {
    max-width: 500px; margin: 60px auto 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 48px; position: relative; overflow: hidden;
  }
  .solo-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 24px;
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 55%);
    pointer-events: none;
  }

  .check-ring {
    width: 60px; height: 60px; border-radius: 50%;
    border: 1.5px solid var(--accent); display: flex;
    align-items: center; justify-content: center;
    color: var(--accent); margin-bottom: 20px;
  }

  @media (max-width: 600px) {
    .page { padding: 40px 14px 80px; }
    .panel { padding: 24px 20px; }
    .solo-card { padding: 32px 24px; margin-top: 32px; }
    .display-xl { font-size: 2rem; }
    .display-lg { font-size: 1.8rem; }
  }
`;