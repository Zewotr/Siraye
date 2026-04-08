import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../hooks/useAuth";

function navClass({ isActive }) {
  return `block w-full rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
  }`;
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-slate-200/90 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
          <Link className="font-heading text-2xl text-slate-900" to="/dashboard">
            Siraye
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm lg:sticky lg:top-24">
          <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-800">{user?.email}</p>
          </div>
          <nav className="space-y-2">
            <NavLink className={navClass} to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={navClass} to="/tasks">
              Tasks
            </NavLink>
            <NavLink className={navClass} to="/tasks/new">
              Create Task
            </NavLink>
            <NavLink className={navClass} to="/profile">
              Profile
            </NavLink>
            {user?.role === "admin" ? (
              <NavLink className={navClass} to="/admin">
                Admin
              </NavLink>
            ) : null}
          </nav>
        </aside>

        <section className="space-y-5 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
