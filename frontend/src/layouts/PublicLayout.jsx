import { Link, Outlet, useLocation } from "react-router-dom";
import Icon from "../components/Icon";
import { useAuth } from "../hooks/useAuth";

export default function PublicLayout() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900 dark:bg-[#10111a] dark:text-slate-100 flex flex-col justify-between">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f8f9fc]/85 backdrop-blur-xl dark:border-slate-800 dark:bg-[#10111a]/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-800 text-white shadow-md shadow-brand-700/25">
              <Icon name="sparkles" size={19} />
            </span>
            <span className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              siraye
            </span>
          </Link>

          {/* Center Navigation Links for Landing Page */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400">
            <a href="#features" className="transition hover:text-brand-700 dark:hover:text-brand-300">
              Features
            </a>
            <Link to="/schedule" className="transition hover:text-brand-700 dark:hover:text-brand-300">
              Weekly Planner
            </Link>
            <Link to="/timer" className="transition hover:text-brand-700 dark:hover:text-brand-300">
              Pomotroid Timer
            </Link>
            <Link to="/tracker" className="transition hover:text-brand-700 dark:hover:text-brand-300">
              Punctuality Tracker
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-700/20 transition hover:bg-brand-800 active:scale-95"
                >
                  <Icon name="sparkles" size={14} />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100 hover:border-rose-300 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/40"
                  title="Sign out of current session"
                >
                  <Icon name="logOut" size={14} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-700/20 transition hover:bg-brand-800 active:scale-95"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full ${isLanding ? "" : "mx-auto max-w-6xl px-4 py-10 sm:px-6"}`}>
        <Outlet />
      </main>
    </div>
  );
}
