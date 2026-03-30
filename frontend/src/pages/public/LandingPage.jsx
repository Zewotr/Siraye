import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="grid gap-10 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <section>
        <p className="mb-3 inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Cloud task management for focused teams
        </p>
        <h1 className="max-w-xl font-heading text-5xl leading-tight text-slate-900">
          Plan your time, prioritize with clarity, and ship faster with Siraye.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-slate-600">
          Siraye combines scheduling, priorities, reminders, and security monitoring in one SaaS platform ready for production teams.
        </p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded-full bg-brand-700 px-5 py-3 font-semibold text-white" to="/login">
            Continue with Google
          </Link>
          <Link
            className="rounded-full border border-brand-700 px-5 py-3 font-semibold text-brand-700"
            to="/dashboard"
          >
            Open dashboard
          </Link>
        </div>
      </section>
      <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-soft">
        <h2 className="font-heading text-2xl">What you get</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-200">
          <li>Google OAuth with JWT + email verification</li>
          <li>Priority-based scheduling and reminder notifications</li>
          <li>Admin analytics, security logs, and storage insights</li>
          <li>Automated daily backups and cloud asset storage</li>
        </ul>
      </section>
    </div>
  );
}
