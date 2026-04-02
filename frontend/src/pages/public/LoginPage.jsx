import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const googleConfigured =
    googleClientId.length > 0 &&
    !/your-google-client-id|your-google-oauth-client-id|<google-client-id>/i.test(googleClientId);

  const redirectTo = location.state?.from || "/dashboard";

  async function handleEmailSubmit(event) {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      setError("");
      setInfo("");
      setIsSubmittingEmail(true);
      const response = await loginWithEmail(email.trim());
      if (response.requires_email_verification) {
        setInfo("Check your inbox to verify email before full access.");
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "No account found. Create account with Google below.");
    } finally {
      setIsSubmittingEmail(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setError("");
      setInfo("");
      const response = await loginWithGoogle(credentialResponse.credential);
      if (response.requires_email_verification) {
        setInfo("Check your inbox to verify email before full access.");
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed.");
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-soft">
      <h1 className="font-heading text-3xl text-slate-900">Sign in to Siraye</h1>
      <p className="mt-2 text-sm text-slate-600">Use your registered email or continue with Google.</p>

      <form className="mt-6 space-y-3" onSubmit={handleEmailSubmit}>
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-brand-400 transition focus:border-brand-600 focus:ring-2"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <button
          className="w-full rounded-full bg-brand-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmittingEmail}
          type="submit"
        >
          {isSubmittingEmail ? "Checking account..." : "Login with Email"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Or use Google</p>

      <div className="mt-3">
        {googleConfigured ? (
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed.")} />
        ) : (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Google OAuth is not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in{" "}
            <code>frontend/.env</code> and restart the frontend server.
          </p>
        )}
      </div>

      {info ? <p className="mt-4 rounded-lg bg-brand-100 p-3 text-sm text-brand-900">{info}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
