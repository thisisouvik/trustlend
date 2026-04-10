"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  PENDING_ROLE_KEY,
  getDashboardPath,
  isUserRole,
  normalizeUserRole,
  type UserRole,
} from "@/lib/auth/roles";

type EmailMode = "sign-in" | "sign-up";

const ROLE_META: Record<UserRole, { label: string; emoji: string; tagline: string; color: string }> = {
  borrower: {
    label: "Borrower",
    emoji: "💸",
    tagline: "Access micro-loans built on your real financial behavior",
    color: "var(--purple)",
  },
  lender: {
    label: "Lender",
    emoji: "📈",
    tagline: "Earn transparent returns by funding verified borrowers",
    color: "#22cf9d",
  },
};

export function AuthPageClient() {
  const params = useSearchParams();
  const router = useRouter();

  const paramRole = params.get("role");
  const initialRole: UserRole = isUserRole(paramRole) ? paramRole : "borrower";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [emailMode, setEmailMode] = useState<EmailMode>("sign-up");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const meta = ROLE_META[role];

  const persistRole = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PENDING_ROLE_KEY, role);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setMessage(null);

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." });
      setGoogleLoading(false);
      return;
    }

    persistRole();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/complete` },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setGoogleLoading(false);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setMessage({ type: "error", text: "Unable to start Google sign-in." });
    setGoogleLoading(false);
  };

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured." });
      setIsLoading(false);
      return;
    }

    if (!email || !password) {
      setMessage({ type: "error", text: "Email and password are required." });
      setIsLoading(false);
      return;
    }

    if (emailMode === "sign-up" && password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      setIsLoading(false);
      return;
    }

    persistRole();

    if (emailMode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/complete`,
          data: { account_type: role },
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        setMessage({ type: "info", text: "Check your email to confirm your account, then sign in." });
        setIsLoading(false);
        return;
      }

      const nextRole = normalizeUserRole(data.user?.user_metadata?.account_type);
      router.push(getDashboardPath(nextRole));
      return;
    }

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setIsLoading(false);
      return;
    }

    let nextRole: UserRole = role;
    const currentMetaRole = data.user?.user_metadata?.account_type;

    if (isUserRole(currentMetaRole)) {
      nextRole = currentMetaRole;
    } else {
      await supabase.auth.updateUser({
        data: { ...data.user?.user_metadata, account_type: role },
      });
    }

    router.push(getDashboardPath(nextRole));
  };

  return (
    <main className="auth-page-shell">
      {/* Left panel — branding */}
      <div className="auth-page-left" aria-hidden="true">
        <div className="auth-page-left-inner">
          <a href="/" className="auth-page-logo">
            <span className="site-logo-orb" />
            <span className="font-display auth-page-logo-text">TrustLend</span>
          </a>

          <div className="auth-page-left-body">
            <div className="auth-page-role-badge" style={{ background: role === "lender" ? "rgba(34,207,157,0.12)" : "rgba(127,47,209,0.12)", borderColor: role === "lender" ? "rgba(34,207,157,0.35)" : "rgba(127,47,209,0.35)" }}>
              <span className="auth-page-role-emoji">{meta.emoji}</span>
              <span className="auth-page-role-badge-label" style={{ color: role === "lender" ? "#17a87a" : "#6e2fc1" }}>
                Joining as {meta.label}
              </span>
            </div>

            <p className="auth-page-left-tagline">{meta.tagline}</p>

            <ul className="auth-page-trust-list" aria-label="Platform highlights">
              <li>
                <span className="auth-page-trust-dot" />
                Behavior-based reputation score
              </li>
              <li>
                <span className="auth-page-trust-dot" />
                No collateral required
              </li>
              <li>
                <span className="auth-page-trust-dot" />
                Transparent on-chain audit trail
              </li>
              <li>
                <span className="auth-page-trust-dot" />
                Role dashboard from day one
              </li>
            </ul>
          </div>

          {/* Decorative orbs */}
          <div className="auth-left-orb auth-left-orb-1" />
          <div className="auth-left-orb auth-left-orb-2" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-page-right">
        <div className="auth-page-form-wrap">
          {/* Back link */}
          <a href="/" className="auth-page-back">
            <ArrowLeft size={14} />
            Back to home
          </a>

          {/* Role picker */}
          <div className="auth-page-role-picker" role="group" aria-label="Choose your role">
            <p className="auth-page-section-label">I am a</p>
            <div className="auth-page-role-tabs">
              {(["borrower", "lender"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  id={`role-tab-${r}`}
                  className={`auth-page-role-tab${role === r ? " auth-page-role-tab--active" : ""}`}
                  onClick={() => { setRole(r); setMessage(null); }}
                  aria-pressed={role === r}
                >
                  <span className="auth-page-role-tab-emoji">{ROLE_META[r].emoji}</span>
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="auth-page-mode-toggle">
            <button
              type="button"
              id="mode-signin"
              className={`auth-page-mode-btn${emailMode === "sign-in" ? " auth-page-mode-btn--active" : ""}`}
              onClick={() => { setEmailMode("sign-in"); setMessage(null); }}
            >
              Sign in
            </button>
            <button
              type="button"
              id="mode-signup"
              className={`auth-page-mode-btn${emailMode === "sign-up" ? " auth-page-mode-btn--active" : ""}`}
              onClick={() => { setEmailMode("sign-up"); setMessage(null); }}
            >
              Create account
            </button>
          </div>

          <h1 className="auth-page-title font-display">
            {emailMode === "sign-up" ? `Join as ${meta.label}` : `Welcome back`}
          </h1>
          <p className="auth-page-subtitle">
            {emailMode === "sign-up"
              ? "Create your account and start building trust."
              : `Sign in to your ${meta.label.toLowerCase()} dashboard.`}
          </p>

          {/* Google button */}
          <button
            type="button"
            id="google-auth-btn"
            className="auth-page-google-btn"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isLoading}
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="auth-page-divider" aria-hidden="true">
            <span>or continue with email</span>
          </div>

          {/* Email form */}
          <form className="auth-page-form" onSubmit={handleEmailSubmit} noValidate>
            <div className="auth-page-field">
              <label className="auth-page-label" htmlFor="auth-email">
                Email address
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="auth-page-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="auth-page-field">
              <div className="auth-page-label-row">
                <label className="auth-page-label" htmlFor="auth-password">
                  Password
                </label>
                {emailMode === "sign-in" && (
                  <a href="#" className="auth-page-forgot">Forgot password?</a>
                )}
              </div>
              <div className="auth-page-input-wrap">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={emailMode === "sign-in" ? "current-password" : "new-password"}
                  required
                  className="auth-page-input auth-page-input--padded"
                  placeholder={emailMode === "sign-up" ? "At least 8 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="auth-page-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Feedback */}
            {message && (
              <p
                className={message.type === "error" ? "auth-page-error" : "auth-page-info"}
                role="alert"
              >
                {message.type === "error" ? "⚠ " : "✉ "}{message.text}
              </p>
            )}

            <button
              type="submit"
              id="auth-submit-btn"
              className="auth-page-submit"
              disabled={isLoading || googleLoading}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Mail size={16} />
              )}
              {emailMode === "sign-up" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="auth-page-footnote">
            By continuing, you agree to TrustLend&apos;s{" "}
            <a href="#" className="auth-page-footnote-link">Terms</a> and{" "}
            <a href="#" className="auth-page-footnote-link">Privacy Policy</a>.
            Role decides your dashboard — you can switch later.
          </p>
        </div>
      </div>
    </main>
  );
}
