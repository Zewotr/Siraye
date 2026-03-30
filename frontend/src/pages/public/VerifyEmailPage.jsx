import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyEmail } from "../../api/auth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    async function runVerification() {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await verifyEmail(token);
        setStatus("success");
        setMessage(response.detail || "Email verified.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.detail || "Verification failed.");
      }
    }

    runVerification();
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-soft">
      <h1 className="font-heading text-3xl text-slate-900">Email Verification</h1>
      <p className={`mt-4 text-sm ${status === "success" ? "text-brand-700" : "text-slate-700"}`}>{message}</p>
      <Link className="mt-6 inline-flex rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white" to="/login">
        Back to login
      </Link>
    </div>
  );
}
