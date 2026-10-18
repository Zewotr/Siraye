import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { completeTask, createTask, getTasks } from "../api/tasks";
import { useWorkspace } from "../hooks/useWorkspace";
import { formatDate } from "../utils/format";
import Icon from "./Icon";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export default function NextTasksSidebar({ open, onClose, onSelectTaskId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace, projects } = useWorkspace();
  const [taskLimit, setTaskLimit] = useState(() => Number(localStorage.getItem("siraye:next_limit")) || 4);
  const [quickTitle, setQuickTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem("siraye:next_limit", String(taskLimit));
  }, [taskLimit]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "next-sidebar", activeWorkspace?.id],
    queryFn: () => getTasks({ completed: "false", page_size: 150 }),
    enabled: open,
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const quickAddMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setQuickTitle("");
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const allTasks = data?.results || data || [];

  const nextTasks = useMemo(() => {
    const list = [...allTasks].filter((t) => !t.status?.is_done && t.status?.category !== "done");

    list.sort((a, b) => {
      const aInProgress = a.status?.category === "in_progress" ? 0 : 1;
      const bInProgress = b.status?.category === "in_progress" ? 0 : 1;
      if (aInProgress !== bInProgress) return aInProgress - bInProgress;

      const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;

      const aPriority = PRIORITY_ORDER[a.priority] ?? 4;
      const bPriority = PRIORITY_ORDER[b.priority] ?? 4;
      if (aPriority !== bPriority) return aPriority - bPriority;

      return (a.position ?? 0) - (b.position ?? 0);
    });

    return list.slice(0, taskLimit);
  }, [allTasks, taskLimit]);

  function handleQuickAdd(e) {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const defaultProject = projects?.[0];
    const defaultStatus = defaultProject?.statuses?.find((s) => s.category === "todo") || defaultProject?.statuses?.[0];

    quickAddMutation.mutate({
      title: quickTitle.trim(),
      project: defaultProject?.id,
      status_id: defaultStatus?.id,
      priority: "high",
    });
  }

  function handleStartTimer(task) {
    onClose();
    navigate(`/timer?taskId=${task.id}`);
  }

  function handleCardClick(task) {
    if (onSelectTaskId) {
      onSelectTaskId(task.id);
    } else {
      navigate(`/tasks/${task.id}/edit`);
    }
  }

  return (
    <>
      {open ? (
        <button
          aria-label="Close next tasks sidebar"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
          type="button"
        />
      ) : null}

      <aside
        className={`scrollbar-subtle fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-800 dark:bg-[#171822] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <Icon name="sidebar" size={17} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Next Up</h2>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-300">
                  {nextTasks.length} queued
                </span>
              </div>
              <p className="text-xs text-slate-400">Immediate focus queue</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Limit selector */}
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  className={`rounded px-2 py-0.5 text-xs font-bold transition ${
                    taskLimit === num
                      ? "bg-brand-700 text-white"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                  onClick={() => setTaskLimit(num)}
                  title={`Show next ${num} tasks`}
                  type="button"
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              aria-label="Close sidebar"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              onClick={onClose}
              type="button"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </header>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : nextTasks.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                <Icon name="checkCircle" size={24} />
              </span>
              <h3 className="mt-3 font-heading text-base font-semibold text-slate-800 dark:text-slate-200">
                You're all caught up!
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                No active tasks waiting in your queue. Great job!
              </p>
            </div>
          ) : (
            nextTasks.map((task, index) => {
              const isOverdue = task.due_date && new Date(task.due_date).getTime() < Date.now();
              const isDueToday =
                task.due_date &&
                new Date(task.due_date).toDateString() === new Date().toDateString();

              return (
                <div
                  key={task.id}
                  className="group relative rounded-xl border border-slate-200/90 bg-slate-50/50 p-3.5 transition hover:border-brand-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-brand-500/40 dark:hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {index + 1}
                      </span>
                      {task.project_name ? (
                        <span className="truncate text-[11px] font-semibold text-slate-400">
                          {task.project_name}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === "urgent"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                            : task.priority === "high"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                            : task.priority === "medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {task.priority || "none"}
                      </span>
                    </div>
                  </div>

                  <h4
                    className="mt-2 cursor-pointer font-medium text-slate-800 transition hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-300"
                    onClick={() => handleCardClick(task)}
                  >
                    {task.title}
                  </h4>

                  {task.due_date ? (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                      <Icon
                        className={
                          isOverdue
                            ? "text-rose-500"
                            : isDueToday
                            ? "text-amber-500"
                            : "text-slate-400"
                        }
                        name="clock"
                        size={13}
                      />
                      <span
                        className={
                          isOverdue
                            ? "font-semibold text-rose-600 dark:text-rose-400"
                            : isDueToday
                            ? "font-semibold text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                        }
                      >
                        {isOverdue ? "Overdue: " : isDueToday ? "Due today: " : "Due: "}
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  ) : null}

                  {/* Quick action buttons */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                      onClick={() => handleStartTimer(task)}
                      title="Focus on this task with Pomodoro Timer"
                      type="button"
                    >
                      <Icon name="clock" size={13} />
                      Focus
                    </button>

                    <button
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-700 hover:text-white dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-700 dark:hover:text-white"
                      disabled={completeMutation.isPending}
                      onClick={() => completeMutation.mutate(task.id)}
                      title="Mark as completed"
                      type="button"
                    >
                      <Icon name="check" size={13} />
                      Done
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Quick Add */}
        <footer className="border-t border-slate-100 p-4 dark:border-slate-800">
          {isAdding ? (
            <form onSubmit={handleQuickAdd} className="space-y-2">
              <input
                autoFocus
                className="w-full rounded-xl border border-brand-300 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="What's next? (Press Enter)"
                value={quickTitle}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  className="rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setIsAdding(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-brand-700 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                  disabled={!quickTitle.trim() || quickAddMutation.isPending}
                  type="submit"
                >
                  {quickAddMutation.isPending ? "Adding…" : "Add to queue"}
                </button>
              </div>
            </form>
          ) : (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
              onClick={() => setIsAdding(true)}
              type="button"
            >
              <Icon name="plus" size={14} />
              Quick add next task
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

