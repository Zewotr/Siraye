import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import Avatar from "../components/Avatar";
import CommandPalette from "../components/CommandPalette";
import Icon from "../components/Icon";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";

const primaryNavigation = [
  { label: "Overview", to: "/dashboard", icon: "grid" },
  { label: "My tasks", to: "/my-tasks", icon: "checkSquare" },
  { label: "Calendar", to: "/calendar", icon: "calendar" },
];

function navClass({ isActive }) {
  return `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
  }`;
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { activeWorkspace, projects, setActiveWorkspace, workspaces } = useWorkspace();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("siraye:theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("siraye:theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function startTask() {
    setPaletteOpen(false);
    if (projects[0]) navigate(`/projects/${projects[0].id}?new=1`);
    else navigate("/projects?new=1");
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900 dark:bg-[#10111a] dark:text-slate-100">
      {sidebarOpen ? <button aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setSidebarOpen(false)} type="button" /> : null}
      <aside
        className={`scrollbar-subtle fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-slate-200/80 bg-white px-3 py-4 transition-transform dark:border-slate-800 dark:bg-[#171822] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-5 flex items-center justify-between px-2">
          <button className="flex items-center gap-2" onClick={() => navigate("/dashboard")} type="button">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-violet-700 text-white shadow-lg shadow-violet-500/25">
              <Icon name="sparkles" size={19} />
            </span>
            <span className="font-heading text-xl font-bold tracking-tight">siraye</span>
          </button>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(false)} type="button">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="relative mb-5 px-1">
          <button
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-violet-200 hover:bg-violet-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10"
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
            type="button"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: activeWorkspace?.color || "#635BFF" }}>
              {(activeWorkspace?.name || "S").slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{activeWorkspace?.name || "Your workspace"}</span>
              <span className="block truncate text-[11px] text-slate-400">{activeWorkspace?.current_role || "Choose workspace"}</span>
            </span>
            <Icon className="text-slate-400" name="chevronDown" size={16} />
          </button>
          {workspaceMenuOpen ? (
            <div className="absolute left-1 right-1 top-[calc(100%+6px)] z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-float dark:border-slate-700 dark:bg-slate-900">
              {workspaces.map((workspace) => (
                <button
                  className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    workspace.id === activeWorkspace?.id ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "text-slate-600 dark:text-slate-300"
                  }`}
                  key={workspace.id}
                  onClick={() => {
                    setActiveWorkspace(workspace);
                    setWorkspaceMenuOpen(false);
                  }}
                  type="button"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: workspace.color }} />
                  <span className="truncate">{workspace.name}</span>
                </button>
              ))}
              {workspaces.length === 0 ? <p className="px-2 py-3 text-xs text-slate-500">Create a workspace to begin.</p> : null}
            </div>
          ) : null}
        </div>

        <button
          className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500 transition hover:border-violet-200 hover:text-violet-700 dark:border-slate-800 dark:text-slate-400 dark:hover:border-violet-500/40 dark:hover:text-violet-300"
          onClick={() => setPaletteOpen(true)}
          type="button"
        >
          <Icon name="search" size={16} />
          <span className="flex-1 text-left">Search or command</span>
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800">⌘ K</kbd>
        </button>

        <nav className="space-y-1 px-1">
          {primaryNavigation.map((item) => (
            <NavLink className={navClass} key={item.to} onClick={() => setSidebarOpen(false)} to={item.to}>
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-7 px-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Projects</p>
            <button className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800" onClick={() => navigate("/projects?new=1")} title="New project" type="button">
              <Icon name="plus" size={15} />
            </button>
          </div>
          <div className="scrollbar-subtle max-h-[calc(100vh-480px)] space-y-1 overflow-y-auto">
            {projects.map((project) => (
              <NavLink
                className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${isActive ? "bg-violet-50 font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
                key={project.id}
                onClick={() => setSidebarOpen(false)}
                to={`/projects/${project.id}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="truncate">{project.name}</span>
              </NavLink>
            ))}
            {projects.length === 0 ? <p className="px-2 py-2 text-xs leading-5 text-slate-400">Projects you join will appear here.</p> : null}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-100 px-1 pt-4 dark:border-slate-800">
          <NavLink className={navClass} to="/profile">
            <Icon name="settings" size={18} />
            Settings
          </NavLink>
          {user?.role === "admin" ? (
            <NavLink className={navClass} to="/admin">
              <Icon name="activity" size={18} />
              Administration
            </NavLink>
          ) : null}
          <button className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" onClick={handleLogout} type="button">
            <Icon name="logOut" size={18} />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[272px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-[#f8f9fc]/85 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#10111a]/85 sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(true)} type="button">
              <Icon name="menu" />
            </button>
            <p className="hidden text-sm font-medium text-slate-400 sm:block">Build momentum, one meaningful task at a time.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-violet-600 dark:hover:bg-slate-800 dark:hover:text-violet-300 sm:inline-flex" onClick={() => setDarkMode((value) => !value)} title="Toggle theme" type="button">
              <Icon name={darkMode ? "sun" : "moon"} size={18} />
            </button>
            <NotificationBell />
            <button className="hidden rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 sm:inline-flex sm:items-center sm:gap-1.5" onClick={startTask} type="button">
              <Icon name="plus" size={17} /> New task
            </button>
            <button className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white dark:hover:bg-slate-800" onClick={() => navigate("/profile")} type="button">
              <Avatar size="sm" user={user} />
              <Icon className="hidden text-slate-400 sm:block" name="chevronDown" size={14} />
            </button>
          </div>
        </header>
        <section className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8">
          <Outlet />
        </section>
      </main>
      <CommandPalette onClose={() => setPaletteOpen(false)} onCreateTask={startTask} open={paletteOpen} projects={projects} />
    </div>
  );
}
