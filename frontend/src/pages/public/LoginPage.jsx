import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import Icon from "../../components/Icon";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage({ initialMode = "login" }) {
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get("mode") || (initialMode === "signup" ? "signup" : "login");
  const [mode, setMode] = useState(urlMode);

  // Sign in state
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const googleConfigured =
    googleClientId.length > 0 &&
    !/your-google-client-id|your-google-oauth-client-id|<google-client-id>/i.test(googleClientId);

  const redirectTo = location.state?.from || "/dashboard";

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode === "signup" ? "signup" : "login");
    }
  }, [initialMode]);

  function switchMode(nextMode) {
    setError("");
    setMode(nextMode);
  }

  function formatError(err, fallbackMessage) {
    if (!err) return fallbackMessage;
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data?.detail) return data.detail;
    if (typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
        if (typeof val === "string") return `${firstKey}: ${val}`;
      }
    }
    return err.message || fallbackMessage;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    if (!identifier.trim() || !loginPassword) return;

    try {
      setError("");
      setIsSubmitting(true);
      const res = await login(identifier.trim(), loginPassword);
      if (res?.user?.onboarding_completed === false) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(formatError(err, "Login failed. Please check your credentials."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !signupEmail.trim() || !signupPassword) return;

    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await register(name.trim(), signupEmail.trim().toLowerCase(), signupPassword, confirmPassword);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(formatError(err, "Sign up failed. Please check your information."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setError("");
      const res = await loginWithGoogle(credentialResponse.credential);
      if (res?.user?.onboarding_completed === false) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(formatError(err, "Google sign-in failed."));
    }
  }

  return (
    <div className="mx-auto max-w-md animate-enter">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-float dark:border-slate-800 dark:bg-[#171822] sm:p-9">
        {/* Brand Header */}
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-800 text-white shadow-lg shadow-brand-700/25">
            <Icon name="sparkles" size={24} />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {mode === "login"
              ? "Sign in with your name, email, or Google to continue."
              : "Start organizing your projects, tasks, and momentum."}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="mt-6 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
            onClick={() => switchMode("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
            onClick={() => switchMode("signup")}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300">
            <Icon className="mt-0.5 shrink-0 text-rose-500" name="activity" size={15} />
            <span className="flex-1 leading-5">{error}</span>
          </div>
        ) : null}

        {/* SIGN IN FORM */}
        {mode === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="login-identifier">
                Name or Email
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icon name="user" size={16} />
                </span>
                <input
                  autoComplete="username"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="login-identifier"
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="e.g. Alex or alex@example.com"
                  required
                  type="text"
                  value={identifier}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="login-password">
                  Password
                </label>
              </div>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icon name="lock" size={16} />
                </span>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="login-password"
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                />
                <button
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  tabIndex={-1}
                  type="button"
                >
                  <Icon name={showLoginPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </div>

            <button
              className="mt-2 w-full rounded-xl bg-brand-700 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form className="mt-6 space-y-4" onSubmit={handleSignupSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="signup-name">
                Your Name
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icon name="user" size={16} />
                </span>
                <input
                  autoComplete="name"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="signup-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Morgan"
                  required
                  type="text"
                  value={name}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="signup-email">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icon name="mail" size={16} />
                </span>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="signup-email"
                  onChange={(event) => setSignupEmail(event.target.value)}
                  placeholder="alex@example.com"
                  required
                  type="email"
                  value={signupEmail}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="signup-password">
                Password
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icon name="lock" size={16} />
                </span>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="signup-password"
                  minLength={8}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                />
                <button
                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  onClick={() => setShowSignupPassword((prev) => !prev)}
                  tabIndex={-1}
                  type="button"
                >
                  <Icon name={showSignupPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="signup-confirm-password">
                Confirm Password
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Icon name="lock" size={16} />
                </span>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="signup-confirm-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  required
                  type={showSignupPassword ? "text" : "password"}
                  value={confirmPassword}
                />
              </div>
            </div>

            <button
              className="mt-2 w-full rounded-xl bg-brand-700 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:bg-[#171822]">
            Or continue with
          </span>
        </div>

        {/* Google OAuth Section */}
        <div className="flex justify-center">
          {googleConfigured ? (
            <div className="w-full flex justify-center">
              <GoogleLogin
                onError={() => setError("Google sign-in was cancelled or failed. Please try again.")}
                onSuccess={handleGoogleSuccess}
                shape="rectangular"
                size="large"
                text={mode === "login" ? "signin_with" : "signup_with"}
                theme="outline"
                width="360"
              />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-slate-800">
              Google OAuth is optional. Set <code>VITE_GOOGLE_CLIENT_ID</code> to enable.
            </p>
          )}
        </div>

        {/* Toggle Footer */}
        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {mode === "login" ? (
            <p>
              Don't have an account yet?{" "}
              <button
                className="font-bold text-brand-700 hover:underline dark:text-brand-400"
                onClick={() => switchMode("signup")}
                type="button"
              >
                Sign up for free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                className="font-bold text-brand-700 hover:underline dark:text-brand-400"
                onClick={() => switchMode("login")}
                type="button"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
