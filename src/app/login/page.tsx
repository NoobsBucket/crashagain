"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const login = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    const { error: e } = await sb.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    router.push("/");
  };

  const oauth = async (provider: "google" | "github") => {
    setLoading(true);
    await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };

  return (
    <>
      <style>{css}</style>
      <div className="ap">
        <div className="ac">
          <div className="al">
            <span className="ali"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span>
            <span className="alt">CrashCart</span>
          </div>
          <h1 className="at">Welcome back</h1>
          <p className="as">Sign in to your account</p>
          <div className="ao">
            <button className="aob" onClick={() => oauth("google")} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <button className="aob" onClick={() => oauth("github")} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
            </button>
          </div>
          <div className="ad"><span>or</span></div>
          <div className="af">
            {error && <div className="ae"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
            <div className="afd"><label className="afl">Email</label><input className="afi" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter"&&login()}/></div>
            <div className="afd"><label className="afl">Password</label><input className="afi" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter"&&login()}/></div>
            <button className="asb" onClick={login} disabled={loading}>{loading?<span className="asp"/>:"Sign In"}</button>
          </div>
          <p className="asw">Don&apos;t have an account? <button className="asl" onClick={() => router.push("/register")}>Sign up</button></p>
        </div>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
  .ap{min-height:100vh;background:radial-gradient(ellipse 60% 40% at 15% 0%,rgba(124,158,135,.07) 0%,transparent 70%),#0f1117;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Jost',sans-serif}
  .ac{width:100%;max-width:420px;background:#181c26;border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:40px 36px;box-shadow:0 24px 80px rgba(0,0,0,.5);animation:ci .4s cubic-bezier(.22,1,.36,1) both}
  @keyframes ci{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .al{display:flex;align-items:center;gap:9px;margin-bottom:28px}
  .ali{width:36px;height:36px;background:rgba(255,62,14,.12);border:1px solid rgba(255,62,14,.3);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#ff3e0e}
  .alt{font-size:1.1rem;font-weight:600;color:#ff3e0e;letter-spacing:-.02em}
  .at{font-size:1.6rem;font-weight:600;color:#e8eaf0;letter-spacing:-.03em;margin-bottom:6px}
  .as{font-size:.85rem;color:#545a66;margin-bottom:28px}
  .ao{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
  .aob{display:flex;align-items:center;justify-content:center;gap:10px;padding:11px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;font-family:'Jost',sans-serif;font-size:.85rem;font-weight:500;color:#e8eaf0;cursor:pointer;transition:background .18s}
  .aob:hover{background:rgba(255,255,255,.08)}
  .aob:disabled{opacity:.5;cursor:not-allowed}
  .ad{display:flex;align-items:center;gap:12px;margin-bottom:20px;color:#545a66;font-size:.75rem}
  .ad::before,.ad::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07)}
  .af{display:flex;flex-direction:column;gap:16px}
  .ae{display:flex;align-items:center;gap:8px;padding:11px 14px;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.25);border-radius:10px;font-size:.82rem;color:#f87171}
  .afd{display:flex;flex-direction:column;gap:7px}
  .afl{font-size:.7rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:#545a66}
  .afi{padding:11px 14px;background:#1e2333;border:1px solid rgba(255,255,255,.07);border-radius:10px;font-family:'Jost',sans-serif;font-size:.88rem;color:#e8eaf0;transition:border-color .2s,box-shadow .2s;outline:none;width:100%;box-sizing:border-box}
  .afi:focus{border-color:#7c9e87;box-shadow:0 0 0 3px rgba(124,158,135,.2)}
  .afi::placeholder{color:#545a66}
  .asb{display:flex;align-items:center;justify-content:center;padding:12px;background:#7c9e87;color:#0f1117;border:none;border-radius:12px;font-family:'Jost',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;transition:background .18s,transform .18s;margin-top:4px;width:100%}
  .asb:hover:not(:disabled){background:#8fb09a;transform:translateY(-1px)}
  .asb:disabled{opacity:.5;cursor:not-allowed}
  .asp{width:16px;height:16px;border:2px solid rgba(15,17,23,.3);border-top-color:#0f1117;border-radius:50%;animation:sp .65s linear infinite;display:inline-block}
  @keyframes sp{to{transform:rotate(360deg)}}
  .asw{text-align:center;font-size:.82rem;color:#545a66;margin-top:24px}
  .asl{background:none;border:none;color:#7c9e87;cursor:pointer;font-family:'Jost',sans-serif;font-size:.82rem;font-weight:500;text-decoration:underline}
`;