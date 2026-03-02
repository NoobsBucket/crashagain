"use client";

import React from "react";
import { useRouter } from "next/navigation";
import style from "../styles/hamburgerMenu.module.css";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  useUser,
  UserButton,
} from "@clerk/nextjs";

interface HamburgerMenuProps {
  isOpen: boolean;
  closeMenu: () => void;
}

const ADMIN_EMAILS = ["nbdotwork@gmail.com", "msdotxd1@gmail.com"];

export default function HamburgerMenu({ isOpen, closeMenu }: HamburgerMenuProps) {
  const { user } = useUser();
  const router   = useRouter();

  const isAdmin = !!user?.primaryEmailAddress?.emailAddress &&
    ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress);

  const go = (path: string) => { router.push(path); closeMenu(); };

  return (
    <>
      <style>{css}</style>
      <div className={`${style.mobileMenu} ${isOpen ? style.active : ""} hm-wrap`}>
        <ul className="hm-list">

          {/* ── Nav Links ── */}
          <li>
            <button className="hm-link" onClick={() => go("/")}>
              <span className="hm-link__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </span>
              Home
            </button>
          </li>

          <li>
            <button className="hm-link" onClick={() => go("/orders")}>
              <span className="hm-link__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </span>
              Orders
            </button>
          </li>

          {/* Admin only */}
          {isAdmin && (
            <li>
              <button className="hm-link hm-link--admin" onClick={() => go("/admin")}>
                <span className="hm-link__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </span>
                Admin
                <span className="hm-admin-badge">DEV</span>
              </button>
            </li>
          )}

          {/* ── Divider ── */}
          <li className="hm-divider" />

          {/* ── Auth ── */}
          <li>
            <SignedOut>
              <div className="hm-auth">
                <SignInButton mode="modal">
                  <button className="hm-btn hm-btn--ghost" onClick={closeMenu}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="hm-btn hm-btn--primary" onClick={closeMenu}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="hm-user">
                <UserButton afterSignOutUrl="/" />
                <div className="hm-user__info">
                  <span className="hm-user__name">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || user?.username || "User"}
                  </span>
                  <span className="hm-user__email">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
                {isAdmin && <span className="hm-admin-tag">Admin</span>}
              </div>
            </SignedIn>
          </li>

        </ul>
      </div>
    </>
  );
}

const css = `
  .hm-wrap {
    font-family: 'Jost', sans-serif;
  }

  .hm-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* ── Nav links ── */
  .hm-link {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 13px 16px;
    background: none;
    border: none;
    border-radius: 12px;
    font-family: 'Jost', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #8b9099;
    cursor: pointer;
    text-align: left;
    letter-spacing: 0.01em;
    transition: color 0.18s, background 0.18s;
  }

  .hm-link:hover {
    color: #e8eaf0;
    background: rgba(255,255,255,0.05);
  }

  .hm-link__icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 9px;
    flex-shrink: 0;
    transition: background 0.18s, border-color 0.18s;
  }

  .hm-link:hover .hm-link__icon {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.12);
  }

  /* Admin link */
  .hm-link--admin { color: #c9a84c; }
  .hm-link--admin .hm-link__icon {
    background: rgba(201,168,76,0.1);
    border-color: rgba(201,168,76,0.2);
    color: #c9a84c;
  }
  .hm-link--admin:hover { color: #e8c36a; background: rgba(201,168,76,0.07); }
  .hm-link--admin:hover .hm-link__icon { background: rgba(201,168,76,0.18); }

  .hm-admin-badge {
    margin-left: auto;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #c9a84c;
    background: rgba(201,168,76,0.12);
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 100px;
    padding: 2px 8px;
  }

  /* ── Divider ── */
  .hm-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent);
    margin: 8px 0;
  }

  /* ── Auth buttons ── */
  .hm-auth {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px 0;
  }

  .hm-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px 20px;
    border-radius: 100px;
    font-family: 'Jost', sans-serif;
    font-size: 0.83rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
    border: none;
  }

  .hm-btn:hover { opacity: 0.85; transform: translateY(-1px); }

  .hm-btn--ghost {
    background: transparent;
    color: #8b9099;
    border: 1px solid rgba(255,255,255,0.12);
  }
  .hm-btn--ghost:hover { color: #e8eaf0; border-color: rgba(255,255,255,0.25); }

  .hm-btn--primary {
    background: #7c9e87;
    color: #0f1117;
  }
  .hm-btn--primary:hover { box-shadow: 0 6px 20px rgba(124,158,135,0.3); }

  /* ── Signed-in user row ── */
  .hm-user {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
  }

  .hm-user__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .hm-user__name {
    font-size: 0.88rem;
    font-weight: 600;
    color: #e8eaf0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hm-user__email {
    font-size: 0.72rem;
    color: #545a66;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
  }

  .hm-admin-tag {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #c9a84c;
    background: rgba(201,168,76,0.12);
    border: 1px solid rgba(201,168,76,0.25);
    border-radius: 100px;
    padding: 3px 9px;
    flex-shrink: 0;
    text-transform: uppercase;
  }
`;