import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Icon from "./Icon";

export default function CommandPalette({ open, onClose, projects = [], onCreateTask }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const items = useMemo(
    () => [
      { label: "Create a task", hint: "C", icon: "plus", action: onCreateTask },
      { label: "Go to dashboard", hint: "G D", icon: "grid", action: () => navigate("/dashboard") },
      { label: "Open My tasks", hint: "G M", icon: "checkSquare", action: () => navigate("/my-tasks") },
      { label: "Open calendar", hint: "G C", icon: "calendar", action: () => navigate("/calendar") },
      { label: "Browse projects", hint: "G P", icon: "folder", action: () => navigate("/projects") },
      ...projects.map((project) => ({
        label: `Open ${project.name}`,
        hint: project.key,
        icon: "layers",
        action: () => navigate(`/projects/${project.id}`),
      })),
    ],
    [navigate, onCreateTask, projects]
  );
  const visibleItems = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  function run(action) {
    onClose();
    action?.();
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-slate-950/30 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={onClose}>
      <section
        aria-label="Command palette"
        className="animate-enter w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <Icon className="text-slate-400" name="search" />
          <input
            autoFocus
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command or search projects…"
            value={query}
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700">ESC</kbd>
        </div>
        <div className="scrollbar-subtle max-h-[360px] overflow-y-auto p-2">
          <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Quick actions</p>
          {visibleItems.map((item) => (
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-violet-50 dark:hover:bg-slate-800"
              key={item.label}
              onClick={() => run(item.action)}
              type="button"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-100">{item.label}</span>
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{item.hint}</kbd>
            </button>
          ))}
          {visibleItems.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No matching commands.</p> : null}
        </div>
      </section>
    </div>
  );
}
