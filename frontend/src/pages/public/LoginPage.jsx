import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/dashboard";

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setError("");
      const response = await login(credentialResponse.credential);
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
      <p className="mt-2 text-sm text-slate-600">Use your Google account for secure access.</p>

      <div className="mt-6">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed.")} />
      </div>

      {info ? <p className="mt-4 rounded-lg bg-brand-100 p-3 text-sm text-brand-900">{info}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
