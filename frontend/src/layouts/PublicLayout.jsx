import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="font-heading text-2xl text-brand-800">
          Siraye
        </Link>
        <Link
          to="/login"
          className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Log in
        </Link>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
