"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import style from "../styles/navBar.module.css";
import FloatingCart from "./floatingCart";
import HamburgerMenu from "./hamburgerMenu";
export default function Navbar() {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [isMobile,  setIsMobile]  = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com"];
  const isAdmin = !!user?.primaryEmailAddress?.emailAddress &&
    ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu  = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

          {/* Admin only */}
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

        {/* ── Auth ── */}
        <div className="cc-auth">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="cc-btn cc-btn--ghost">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="cc-btn cc-btn--primary">Sign Up</button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            {!isMobile && <UserButton afterSignOutUrl="/" />}
          </SignedIn>
        </div>

        {/* ── Hamburger ── */}
        <button
          className={`${style.hamburger} ${menuOpen ? style.active : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {menuOpen && (
        <div className={style.overlay} onClick={closeMenu} aria-hidden="true" />
      )}

      <HamburgerMenu isOpen={menuOpen} closeMenu={closeMenu} />
      <FloatingCart />
    </>
  );
}

/* ── Navbar CSS ─────────────────────────────────────────── */
const navCss = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');

  .cc-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    font-family: 'Jost', sans-serif;
    background: rgba(15, 17, 23, 0.75);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }

  .cc-nav--scrolled {
    background: rgba(15, 17, 23, 0.92);
    border-bottom-color: rgba(255,255,255,0.09);
    box-shadow: 0 4px 32px rgba(0,0,0,0.35);
  }

  /* ── Logo ── */
  .cc-logo {
    display: flex;
    align-items: center;
    gap: 9px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-decoration: none;
    flex-shrink: 0;
  }

  .cc-logo__icon {
    width: 32px; height: 32px;
    background: rgba(255,62,14,0.12);
    border: 1px solid rgba(255,62,14,0.3);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff3e0e;
    transition: background 0.2s, transform 0.2s;
  }

  .cc-logo:hover .cc-logo__icon {
    background: rgba(255,62,14,0.22);
    transform: rotate(-4deg);
  }

  .cc-logo__text {
    font-size: 1.05rem;
    font-weight: 600;
    color: #ff3e0e;
    letter-spacing: -0.02em;
  }

  /* ── Desktop links ── */
  .cc-links {
    display: flex;
    align-items: center;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .cc-link {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Jost', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    color: #8b9099;
    letter-spacing: 0.02em;
    border-radius: 10px;
    transition: color 0.18s, background 0.18s;
  }

  .cc-link:hover {
    color: #e8eaf0;
    background: rgba(255,255,255,0.06);
  }

  .cc-link svg {
    opacity: 0.6;
    transition: opacity 0.18s;
    flex-shrink: 0;
  }

  .cc-link:hover svg { opacity: 1; }

  /* Admin link — subtle amber tint */
  .cc-link--admin {
    color: #c9a84c;
  }
  .cc-link--admin svg { color: #c9a84c; opacity: 0.7; }
  .cc-link--admin:hover {
    color: #e8c36a;
    background: rgba(201,168,76,0.1);
  }
  .cc-link--admin:hover svg { opacity: 1; }

  /* ── Auth area ── */
  .cc-auth {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* Ghost button — Sign In */
  .cc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 18px;
    font-family: 'Jost', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    border-radius: 100px;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
  }

  .cc-btn--ghost {
    background: transparent;
    color: #8b9099;
    border: 1px solid rgba(255,255,255,0.12);
  }
  .cc-btn--ghost:hover {
    color: #e8eaf0;
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.05);
  }

  /* Primary button — Sign Up */
  .cc-btn--primary {
    background: #7c9e87;
    color: #0f1117;
    border: 1px solid transparent;
    font-weight: 600;
  }
  .cc-btn--primary:hover {
    background: #8fb09a;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(124,158,135,0.35);
  }

  /* Hide desktop links + auth on mobile, show hamburger */
  @media (max-width: 1024px) {
    .cc-links { display: none; }
    .cc-auth  { display: none; }
    .cc-nav   { padding: 0 18px; }
  }
`;