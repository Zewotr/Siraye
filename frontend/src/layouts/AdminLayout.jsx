import { NavLink, Outlet } from "react-router-dom";

function tabClass({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-semibold ${
    isActive ? "bg-brand-700 text-white" : "bg-brand-100 text-brand-800"
  }`;
}

export default function AdminLayout() {
  return (
    <div className="space-y-5">
      <h1 className="font-heading text-3xl text-slate-900">Admin Dashboard</h1>
      <nav className="flex flex-wrap gap-2">
        <NavLink className={tabClass} to="/admin">
          Analytics
        </NavLink>
        <NavLink className={tabClass} to="/admin/users">
          Users
        </NavLink>
        <NavLink className={tabClass} to="/admin/security">
          Security
        </NavLink>
        <NavLink className={tabClass} to="/admin/storage">
          Storage
        </NavLink>
        <NavLink className={tabClass} to="/admin/backups">
          Backups
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
