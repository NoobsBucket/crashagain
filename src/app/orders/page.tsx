"use client";

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Navbar from "@/components/navbar";

type OrderItem = { id: number; product_name: string; price: number; quantity: number };
type Order = {
  id: number;
  total: number;
  status: string;
  address: string;
  city: string;
  phone: string;
  created_at: string;
  items: OrderItem[];
};

const STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color: "#e8a838", bg: "rgba(232,168,56,0.1)",   border: "rgba(232,168,56,0.25)",   label: "Pending" },
  confirmed: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.25)",   label: "Confirmed" },
  shipped:   { color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.25)",  label: "Shipped" },
  delivered: { color: "#7c9e87", bg: "rgba(124,158,135,0.12)", border: "rgba(124,158,135,0.3)",   label: "Delivered" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)",  label: "Cancelled" },
};

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      // 1. Check Supabase session (auth only)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsSignedIn(false);
        setLoading(false);
        return;
      }

      setIsSignedIn(true);

      // 2. Fetch orders from your D1 API route (same as before)
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const data = await res.json() as { results: Order[] };
          setOrders(data.results || []);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }

      setLoading(false);
    };

    init();

    // 3. Listen for sign-out
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsSignedIn(false);
        setOrders([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const toggle = (id: number) => setExpanded(prev => prev === id ? null : id);

  /* ── Checking auth ── */
  if (isSignedIn === null) return null;

  /* ── Not signed in ── */
  if (!isSignedIn) return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="page">
        <div className="solo-card anim-1">
          <span className="chip">My Orders</span>
          <h2 className="display-lg" style={{ marginTop: 16 }}>Sign in to continue</h2>
          <p className="muted-body">View your order history and track deliveries.</p>
          <div className="btn-row" style={{ marginTop: 36 }}>
            <button className="btn-primary" onClick={() => router.push("/login")}>Sign In</button>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="page">
        <div className="page-header anim-1">
          <span className="chip">My Orders</span>
          <h1 className="display-xl">Your Orders</h1>
        </div>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </>
  );

  /* ── Empty ── */
  if (orders.length === 0) return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="page">
        <div className="solo-card anim-1">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <span className="chip" style={{ marginTop: 20 }}>My Orders</span>
          <h2 className="display-lg" style={{ marginTop: 12 }}>Nothing here yet</h2>
          <p className="muted-body">You haven't placed any orders. Start exploring our collection.</p>
          <div className="btn-row" style={{ marginTop: 36 }}>
            <button className="btn-primary" onClick={() => router.push("/")}>Browse Collection</button>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Orders list ── */
  return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="page">

        <div className="page-header anim-1">
          <span className="chip">My Orders</span>
          <h1 className="display-xl">Your Orders</h1>
          <p className="header-sub">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
        </div>

        <div className="orders-list">
          {orders.map((order, idx) => {
            const s = STATUS[order.status] || STATUS.pending;
            const isOpen = expanded === order.id;
            const stepIdx = STATUS_STEPS.indexOf(order.status);
            const isCancelled = order.status === "cancelled";

            return (
              <div key={order.id} className="order-card anim-card" style={{ animationDelay: `${idx * 0.07}s` }}>

                <button className="order-header" onClick={() => toggle(order.id)}>
                  <div className="order-meta">
                    <span className="order-id">#{String(order.id).padStart(6, "0")}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="order-center">
                    <span className="status-pill" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="order-right">
                    <span className="order-total">${order.total.toFixed(2)}</span>
                    <span className={`chevron ${isOpen ? "open" : ""}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </button>

                {!isCancelled && stepIdx >= 0 && (
                  <div className="progress-wrap">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= stepIdx;
                      const active = i === stepIdx;
                      return (
                        <div key={step} className="progress-step">
                          <div className={`progress-dot ${done ? "done" : ""} ${active ? "active" : ""}`} />
                          <span className={`progress-label ${done ? "done" : ""}`}>{STATUS[step].label}</span>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`progress-line ${i < stepIdx ? "done" : ""}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className={`order-body ${isOpen ? "open" : ""}`}>
                  <div className="order-body-inner">
                    <div className="items-section">
                      <div className="section-label">Items ordered</div>
                      {order.items.map(item => (
                        <div key={item.id} className="item-row">
                          <div className="item-dot" />
                          <span className="item-name">{item.product_name}</span>
                          <span className="item-qty">×{item.quantity}</span>
                          <span className="item-price">RS {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="delivery-section">
                      <div className="section-label">Delivery details</div>
                      <div className="delivery-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>{order.address}, {order.city}</span>
                      </div>
                      <div className="delivery-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.64a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
                        <span>{order.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600;700&display=swap');

  :root {
    --bg:          #0f1117;
    --surface:     #181c26;
    --surface2:    #1e2333;
    --border:      rgba(255,255,255,0.07);
    --border-hi:   rgba(255,255,255,0.15);
    --accent:      #7c9e87;
    --accent-dim:  rgba(124,158,135,0.15);
    --accent-glow: rgba(124,158,135,0.25);
    --text:        #e8eaf0;
    --text-2:      #8b9099;
    --text-3:      #545a66;
    --display:     'Jost', sans-serif;
    --body:        'Jost', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); font-family: var(--body); -webkit-font-smoothing: antialiased; color: var(--text); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }

  .anim-1    { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
  .anim-card { opacity: 0; animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) forwards; }

  .page { min-height: 100vh; background: radial-gradient(ellipse 60% 50% at 20% 0%, rgba(124,158,135,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 80% 100%, rgba(100,120,180,0.06) 0%, transparent 70%), var(--bg); padding: 64px 20px 100px; font-family: var(--body); }
  .page-header { max-width: 780px; margin: 0 auto 36px; }
  .display-xl { font-family: var(--display); font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 300; color: var(--text); line-height: 1.0; letter-spacing: -0.03em; margin-top: 10px; }
  .display-lg { font-family: var(--display); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 300; color: var(--text); line-height: 1.0; letter-spacing: -0.03em; }
  .header-sub { margin-top: 10px; font-size: 0.83rem; color: var(--text-3); letter-spacing: 0.04em; }
  .chip { display: inline-flex; align-items: center; padding: 5px 13px; background: var(--accent-dim); border: 1px solid rgba(124,158,135,0.3); border-radius: 100px; font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; color: var(--accent); text-transform: uppercase; }
  .solo-card { max-width: 500px; margin: 60px auto 0; background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 48px; position: relative; overflow: hidden; }
  .solo-card::before { content: ''; position: absolute; inset: 0; border-radius: 24px; background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 55%); pointer-events: none; }
  .empty-icon { width: 60px; height: 60px; border-radius: 50%; border: 1.5px solid var(--border-hi); display: flex; align-items: center; justify-content: center; color: var(--text-3); }
  .btn-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .btn-primary { padding: 13px 28px; background: var(--accent); color: #0f1117; border: none; border-radius: 100px; font-family: var(--body); font-weight: 600; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px var(--accent-glow); }
  .muted-body { font-size: 0.92rem; color: var(--text-2); line-height: 1.75; margin-top: 12px; max-width: 360px; }
  .skeleton-card { height: 80px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; margin-bottom: 14px; animation: pulse 1.6s ease-in-out infinite; }
  .orders-list { max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
  .order-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; transition: border-color 0.2s; }
  .order-card:hover { border-color: var(--border-hi); }
  .order-header { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 24px; background: transparent; border: none; cursor: pointer; text-align: left; flex-wrap: wrap; }
  .order-meta { display: flex; flex-direction: column; gap: 3px; min-width: 120px; }
  .order-id { font-family: var(--display); font-size: 1rem; font-weight: 600; color: var(--text); letter-spacing: 0.04em; }
  .order-date { font-size: 0.72rem; color: var(--text-3); letter-spacing: 0.06em; }
  .order-center { flex: 1; display: flex; justify-content: center; }
  .status-pill { display: inline-flex; align-items: center; padding: 5px 14px; border-radius: 100px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
  .order-right { display: flex; align-items: center; gap: 16px; }
  .order-total { font-family: var(--display); font-size: 1.1rem; font-weight: 600; color: var(--text); letter-spacing: -0.01em; }
  .chevron { color: var(--text-3); transition: transform 0.25s ease; display: flex; align-items: center; }
  .chevron.open { transform: rotate(180deg); }
  .progress-wrap { display: flex; align-items: flex-start; padding: 0 24px 20px; gap: 0; }
  .progress-step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
  .progress-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--surface2); border: 1.5px solid var(--border-hi); transition: background 0.3s, border-color 0.3s; z-index: 1; flex-shrink: 0; }
  .progress-dot.done { background: var(--accent); border-color: var(--accent); }
  .progress-dot.active { box-shadow: 0 0 0 4px var(--accent-glow); }
  .progress-label { font-size: 0.62rem; color: var(--text-3); letter-spacing: 0.08em; margin-top: 6px; text-transform: uppercase; text-align: center; white-space: nowrap; transition: color 0.3s; }
  .progress-label.done { color: var(--accent); }
  .progress-line { position: absolute; top: 4px; left: 50%; width: 100%; height: 1.5px; background: var(--border-hi); transition: background 0.3s; z-index: 0; }
  .progress-line.done { background: var(--accent); }
  .order-body { max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(.22,1,.36,1); }
  .order-body.open { max-height: 600px; }
  .order-body-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 20px 24px 24px; border-top: 1px solid var(--border); }
  .section-label { font-size: 0.65rem; font-weight: 500; letter-spacing: 0.16em; color: var(--text-3); text-transform: uppercase; margin-bottom: 14px; }
  .item-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .item-row:last-child { border-bottom: none; }
  .item-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); opacity: 0.6; flex-shrink: 0; }
  .item-name { flex: 1; font-size: 0.87rem; color: var(--text); font-weight: 400; }
  .item-qty  { font-size: 0.75rem; color: var(--text-3); letter-spacing: 0.04em; }
  .item-price { font-family: var(--display); font-size: 0.9rem; font-weight: 600; color: var(--text); }
  .delivery-row { display: flex; align-items: flex-start; gap: 9px; padding: 8px 0; font-size: 0.83rem; color: var(--text-2); line-height: 1.5; border-bottom: 1px solid var(--border); }
  .delivery-row:last-child { border-bottom: none; }
  .delivery-row svg { flex-shrink: 0; margin-top: 2px; color: var(--text-3); }

  @media (max-width: 520px) {
    .order-body-inner { grid-template-columns: 1fr; }
    .order-header { flex-wrap: wrap; gap: 10px; }
    .order-center { justify-content: flex-start; }
    .progress-wrap { display: none; }
  }
  @media (max-width: 600px) {
    .page { padding: 40px 14px 80px; }
    .solo-card { padding: 32px 20px; margin-top: 32px; }
    .display-xl { font-size: 2rem; }
    .order-header { padding: 16px 18px; }
    .order-body-inner { padding: 16px 18px 18px; }
    .progress-wrap { padding: 0 18px 16px; }
  }
`;