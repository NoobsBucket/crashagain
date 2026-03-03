"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import style from "../styles/navBar.module.css";
import FloatingCart from "./floatingCart";
import HamburgerMenu from "./hamburgerMenu";

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com", "halayjan18@gmail.com"];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const userInitial = (user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase();
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
  };

  return (
    <>
      <style>{navCss}</style>
      <nav className={`cc-nav ${scrolled ? "cc-nav--scrolled" : ""}`}>
        <button className="cc-logo" onClick={() => router.push("/")} aria-label="Go to home">
          <span className="cc-logo__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </span>
          <span className="cc-logo__text">CrashCart</span>
        </button>

        <ul className="cc-links">
          <li>
            <button className="cc-link" onClick={() => router.push("/")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </button>
          </li>
          <li>
            <button className="cc-link" onClick={() => router.push("/orders")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Orders
            </button>
          </li>
          {isAdmin && (
            <li>
              <button className="cc-link cc-link--admin" onClick={() => router.push("/admin")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin
              </button>
            </li>
          )}
        </ul>

        <div className="cc-auth">
          {!user ? (
            <>
              <button className="cc-btn cc-btn--ghost" onClick={() => router.push("/login")}>Sign In</button>
              <button className="cc-btn cc-btn--primary" onClick={() => router.push("/register")}>Sign Up</button>
            </>
          ) : (
            !isMobile && (
              <div className="cc-user" ref={dropdownRef}>
                <button className="cc-avatar" onClick={() => setDropdownOpen(o => !o)} aria-label="User menu">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="cc-avatar__img" />
                  ) : (
                    <span className="cc-avatar__initial">{userInitial}</span>
                  )}
                  <svg className={`cc-avatar__chevron ${dropdownOpen ? "cc-avatar__chevron--open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {dropdownOpen && (
                  <div className="cc-dropdown">
                    <div className="cc-dropdown__header">
                      <span className="cc-dropdown__name">{userName}</span>
                      <span className="cc-dropdown__email">{user.email}</span>
                    </div>
                    <div className="cc-dropdown__divider" />
                    <button className="cc-dropdown__item" onClick={() => { router.push("/orders"); setDropdownOpen(false); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                      My Orders
                    </button>
                    {isAdmin && (
                      <button className="cc-dropdown__item cc-dropdown__item--admin" onClick={() => { router.push("/admin"); setDropdownOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Admin Panel
                      </button>
                    )}
                    <div className="cc-dropdown__divider" />
                    <button className="cc-dropdown__item cc-dropdown__item--danger" onClick={handleSignOut}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        <button
          className={`${style.hamburger} ${menuOpen ? style.active : ""}`}
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span/><span/><span/>
        </button>
      </nav>

      {menuOpen && <div className={style.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <HamburgerMenu isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
      <FloatingCart />
    </>
  );
}

const navCss = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');

  .cc-nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 100; height: 62px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    font-family: 'Jost', sans-serif;
    background: rgba(15,17,23,0.75);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .cc-nav--scrolled {
    background: rgba(15,17,23,0.92);
    border-bottom-color: rgba(255,255,255,0.09);
    box-shadow: 0 4px 32px rgba(0,0,0,0.35);
  }
  .cc-logo {
    display: flex; align-items: center; gap: 9px;
    background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0;
  }
  .cc-logo__icon {
    width: 32px; height: 32px;
    background: rgba(255,62,14,0.12); border: 1px solid rgba(255,62,14,0.3);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
    color: #ff3e0e; transition: background 0.2s, transform 0.2s;
  }
  .cc-logo:hover .cc-logo__icon { background: rgba(255,62,14,0.22); transform: rotate(-4deg); }
  .cc-logo__text { font-size: 1.05rem; font-weight: 600; color: #ff3e0e; letter-spacing: -0.02em; }
  .cc-links {
    display: flex; align-items: center; gap: 4px;
    list-style: none; margin: 0; padding: 0;
    position: absolute; left: 50%; transform: translateX(-50%);
  }
  .cc-link {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 14px; background: none; border: none; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500;
    color: #8b9099; letter-spacing: 0.02em; border-radius: 10px;
    transition: color 0.18s, background 0.18s;
  }
  .cc-link:hover { color: #e8eaf0; background: rgba(255,255,255,0.06); }
  .cc-link svg { opacity: 0.6; transition: opacity 0.18s; flex-shrink: 0; }
  .cc-link:hover svg { opacity: 1; }
  .cc-link--admin { color: #c9a84c; }
  .cc-link--admin svg { color: #c9a84c; opacity: 0.7; }
  .cc-link--admin:hover { color: #e8c36a; background: rgba(201,168,76,0.1); }
  .cc-auth { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .cc-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 8px 18px; font-family: 'Jost', sans-serif; font-size: 0.78rem;
    font-weight: 500; letter-spacing: 0.06em; border-radius: 100px;
    cursor: pointer; transition: all 0.18s ease; white-space: nowrap;
  }
  .cc-btn--ghost {
    background: transparent; color: #8b9099; border: 1px solid rgba(255,255,255,0.12);
  }
  .cc-btn--ghost:hover { color: #e8eaf0; border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
  .cc-btn--primary { background: #7c9e87; color: #0f1117; border: 1px solid transparent; font-weight: 600; }
  .cc-btn--primary:hover { background: #8fb09a; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,158,135,0.35); }

  /* ── User avatar + dropdown ── */
  .cc-user { position: relative; }
  .cc-avatar {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px; padding: 4px 10px 4px 4px;
    cursor: pointer; transition: background 0.18s, border-color 0.18s;
  }
  .cc-avatar:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.18); }
  .cc-avatar__img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }
  .cc-avatar__initial {
    width: 26px; height: 26px; border-radius: 50%;
    background: #7c9e87; color: #0f1117;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700; font-family: 'Jost', sans-serif;
  }
  .cc-avatar__chevron { color: #8b9099; transition: transform 0.2s; }
  .cc-avatar__chevron--open { transform: rotate(180deg); }

  .cc-dropdown {
    position: absolute; top: calc(100% + 10px); right: 0;
    min-width: 200px;
    background: #181c26; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px; padding: 6px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    animation: dropIn 0.18s cubic-bezier(.22,1,.36,1) both;
    z-index: 200;
  }
  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .cc-dropdown__header { padding: 10px 12px 8px; }
  .cc-dropdown__name { display: block; font-size: 0.85rem; font-weight: 600; color: #e8eaf0; font-family: 'Jost', sans-serif; }
  .cc-dropdown__email { display: block; font-size: 0.72rem; color: #545a66; font-family: 'Jost', sans-serif; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
  .cc-dropdown__divider { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 0; }
  .cc-dropdown__item {
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 9px 12px; background: none; border: none;
    border-radius: 9px; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 400;
    color: #8b9099; text-align: left; transition: background 0.15s, color 0.15s;
  }
  .cc-dropdown__item:hover { background: rgba(255,255,255,0.06); color: #e8eaf0; }
  .cc-dropdown__item--admin { color: #c9a84c; }
  .cc-dropdown__item--admin:hover { background: rgba(201,168,76,0.1); color: #e8c36a; }
  .cc-dropdown__item--danger { color: #f87171; }
  .cc-dropdown__item--danger:hover { background: rgba(248,113,113,0.1); color: #fca5a5; }

  @media (max-width: 1024px) {
    .cc-links { display: none; }
    .cc-auth  { display: none; }
    .cc-nav   { padding: 0 18px; }
  }
`;