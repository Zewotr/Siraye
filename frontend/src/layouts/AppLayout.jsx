import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../hooks/useAuth";

function navClass({ isActive }) {
  return `rounded-lg py-2 border-b-2 border-slate-200 text-sm font-semibold transition ${
    isActive ? "bg-brand-300 text-white  hover:bg-slate-100" : "text-slate-700 hover:bg-brand-100"
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
      <header className="border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
          <Link className="font-heading text-2xl text-brand-800" to="/dashboard">
            Siraye
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl bg-white p-4 shadow-soft h-[calc(100vh-40px)]">
          <p className="mb-4 text-xs uppercase tracking-wide text-slate-500">{user?.email}</p>
          <nav className="space-y-4 ">
            {/* <div className="border-b-2 border-slate-200 py-1 hover:bg-slate-100 rounded-lg"> */}
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
              <div  className="border-b-2 border-slate-200 py-1 hover:bg-slate-100 rounded-lg">
              <NavLink className={navClass} to="/admin">
                Admin
              </NavLink>
              </div>
            ) : null}
          </nav>
        </aside>

        <section className="space-y-5">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
