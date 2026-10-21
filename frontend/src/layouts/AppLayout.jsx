import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import Avatar from "../components/Avatar";
import CommandPalette from "../components/CommandPalette";
import Icon from "../components/Icon";
import NextTasksSidebar from "../components/NextTasksSidebar";
import NotificationBell from "../components/NotificationBell";
import TaskDetailPanel from "../components/TaskDetailPanel";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import { applyThemeColor } from "../utils/theme";

const primaryNavigation = [
  { label: "Overview", to: "/dashboard", icon: "grid" },
  { label: "My tasks", to: "/my-tasks", icon: "checkSquare" },
  { label: "Schedule", to: "/schedule", icon: "calendarCheck" },
  { label: "Calendar", to: "/calendar", icon: "calendar" },
  { label: "Tracker", to: "/tracker", icon: "trendingUp" },
  { label: "Timer", to: "/timer", icon: "clock" },
  { label: "Projects", to: "/projects", icon: "layers" },
];

function navClass({ isActive }) {
  return `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? "bg-brand-700 text-white shadow-lg shadow-brand-700/20"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
  }`;
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { activeWorkspace, projects, setActiveWorkspace, workspaces } = useWorkspace();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [nextTasksOpen, setNextTasksOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("siraye:theme") === "dark");

  useEffect(() => {
    const currentColor = user?.accent_color || activeWorkspace?.color || localStorage.getItem("siraye:color") || "#255A54";
    applyThemeColor(currentColor);
  }, [user?.accent_color, activeWorkspace?.color]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-800 text-white shadow-lg shadow-brand-700/25">
              <Icon name="sparkles" size={19} />
            </span>
            <span className="font-heading text-xl font-bold tracking-tight">siraye</span>
          </button>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(false)} type="button">
            <Icon name="x" size={18} />
          </button>
        </div>

        <button
          className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-800 dark:text-slate-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300"
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
            <button className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" onClick={() => navigate("/projects?new=1")} title="New project" type="button">
              <Icon name="plus" size={15} />
            </button>
          </div>
          <div className="scrollbar-subtle max-h-[calc(100vh-480px)] space-y-1 overflow-y-auto">
            {projects.map((project) => (
              <NavLink
                className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${isActive ? "bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
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
            <button
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10"
              onClick={() => setNextTasksOpen(true)}
              title="Next tasks queue (shows next 3-5 tasks)"
              type="button"
            >
              <Icon name="sidebar" size={16} />
              <span className="hidden sm:inline">Next tasks</span>
            </button>
            <button className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-300 sm:inline-flex" onClick={() => setDarkMode((value) => !value)} title="Toggle theme" type="button">
              <Icon name={darkMode ? "sun" : "moon"} size={18} />
            </button>
            <NotificationBell />
            <button className="hidden rounded-xl bg-brand-700 px-3.5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800 sm:inline-flex sm:items-center sm:gap-1.5" onClick={startTask} type="button">
              <Icon name="plus" size={17} /> New task
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                data-testid="user-menu-button"
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                type="button"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <Avatar size="sm" user={user} />
                <span className="hidden text-xs font-semibold text-slate-700 dark:text-slate-300 md:inline max-w-[120px] truncate">
                  {user?.name || user?.username || "Account"}
                </span>
                <Icon className={`hidden text-slate-400 transition-transform duration-200 sm:block ${userMenuOpen ? "rotate-180" : ""}`} name="chevronDown" size={14} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  {/* User Profile Summary */}
                  <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800/80">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {user?.name || user?.username || "User"}
                    </p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="inline-block rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 capitalize">
                        {user?.role || "Member"}
                      </span>
                      {activeWorkspace && (
                        <span className="truncate text-[10px] text-slate-400">
                          • {activeWorkspace.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1.5 space-y-0.5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/profile");
                      }}
                    >
                      <Icon name="settings" size={15} />
                      Profile & Settings
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/schedule");
                      }}
                    >
                      <Icon name="calendarCheck" size={15} />
                      Weekly Planner
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/tracker");
                      }}
                    >
                      <Icon name="trendingUp" size={15} />
                      Punctuality Tracker
                    </button>

                    {user?.role === "admin" && (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate("/admin");
                        }}
                      >
                        <Icon name="activity" size={15} />
                        Administration
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 pb-1 dark:border-slate-800/80">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setDarkMode((v) => !v)}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon name={darkMode ? "sun" : "moon"} size={15} />
                        Theme
                      </span>
                      <span className="text-[10px] text-slate-400">{darkMode ? "Dark" : "Light"}</span>
                    </button>
                  </div>

                  {/* Prominent Sign Out */}
                  <div className="border-t border-slate-100 pt-1.5 dark:border-slate-800/80">
                    <button
                      type="button"
                      data-testid="sign-out-button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <Icon name="logOut" size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <section className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8">
          <Outlet />
        </section>
      </main>
      <CommandPalette onClose={() => setPaletteOpen(false)} onCreateTask={startTask} open={paletteOpen} projects={projects} />
      <NextTasksSidebar onClose={() => setNextTasksOpen(false)} onSelectTaskId={(id) => setDetailTaskId(id)} open={nextTasksOpen} />
      <TaskDetailPanel onClose={() => setDetailTaskId(null)} taskId={detailTaskId} />
    </div>
  );
}
