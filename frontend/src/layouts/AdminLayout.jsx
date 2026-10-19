import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";

const ADMIN_TABS = [
  { to: "/admin", label: "Analytics & Overview", icon: "activity", exact: true },
  { to: "/admin/users", label: "User Management", icon: "users" },
  { to: "/admin/security", label: "Security & Audits", icon: "shield" },
  { to: "/admin/storage", label: "Storage & Assets", icon: "folder" },
  { to: "/admin/backups", label: "System Backups", icon: "refreshCw" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <Icon name="shield" size={13} />
              SYSTEM CONSOLE
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Admin Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time platform analytics, user demographics, security event logs, and system operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
          >
            <Icon name="sparkles" size={14} />
            User Dashboard
          </button>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-none dark:border-slate-800">
        <div className="flex gap-2 pb-2">
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.exact}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  isActive
                    ? "bg-brand-700 text-white shadow-md shadow-brand-700/20"
                    : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                }`
              }
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Admin Content Area */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}
