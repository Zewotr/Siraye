import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-soft">
      <h1 className="font-heading text-4xl text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">Page not found.</p>
      <Link className="mt-5 inline-flex rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white" to="/">
        Go home
      </Link>
    </div>
  );
}
