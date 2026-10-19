import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { completeTask, deleteTask, getTasks } from "../../api/tasks";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../utils/format";

const STATUS_STYLES = {
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

const STATUS_LABELS = {
  pending: "Todo",
  todo: "Todo",
  in_progress: "In progress",
  in_review: "In review",
  completed: "Completed",
  done: "Completed",
};

const PRIORITY_STYLES = {
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  low: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  none: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const PRIORITY_LABELS = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

function getStatusCategory(status) {
  if (!status) return "pending";
  if (typeof status === "string") {
    const s = status.toLowerCase();
    if (s === "done" || s === "completed") return "completed";
    if (s === "in_progress" || s === "inprogress") return "in_progress";
    return "pending";
  }
  if (status.is_done || status.category === "done") return "completed";
  if (status.category === "in_progress") return "in_progress";
  return "pending";
}

function getStatusLabel(status) {
  if (!status) return "Todo";
  if (typeof status === "string") return STATUS_LABELS[status.toLowerCase()] || status;
  return status.name || STATUS_LABELS[status.category] || "Todo";
}

export default function TaskListPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "list", user?.id],
    queryFn: () => getTasks({ page_size: 200 }),
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err) => setError(err?.response?.data?.detail || "Could not complete task."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err) => setError(err?.response?.data?.detail || "Could not delete task."),
  });

  if (isLoading) return <LoadingSpinner label="Loading tasks" />;

  const tasks = data?.results || data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-slate-900 dark:text-white">My Tasks</h1>
        <Link className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800" to="/tasks/new">
          Create task
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}{" "}
          <button className="ml-2 underline" onClick={() => setError(null)} type="button">
            Dismiss
          </button>
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Create your first task to start planning." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const category = getStatusCategory(task.status);
            const isCompleted = category === "completed";
            const statusLabel = getStatusLabel(task.status);
            const priorityLabel = PRIORITY_LABELS[task.priority] || task.priority || "None";
            const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.none;
            const statusStyle = STATUS_STYLES[category] || STATUS_STYLES.pending;

            return (
              <article key={task.id} className="rounded-2xl bg-white p-5 shadow-soft dark:bg-[#171822]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`font-heading text-xl text-slate-900 dark:text-white ${isCompleted ? "line-through opacity-60" : ""}`}>
                        {task.title}
                      </h2>
                      {task.project_name ? (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {task.project_name}
                        </span>
                      ) : null}
                    </div>
                    {task.description ? (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-1 font-semibold capitalize ${priorityStyle}`}>
                        {priorityLabel}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 font-semibold ${statusStyle}`}>
                        {statusLabel}
                      </span>
                      {task.due_date || task.start_time ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {formatDateTime(task.due_date || task.start_time)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="rounded-full border border-brand-700 px-3 py-1 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:border-brand-600 dark:hover:bg-brand-700/10"
                      to={`/tasks/${task.id}/edit`}
                    >
                      Edit
                    </Link>
                    {!isCompleted ? (
                      <button
                        className="rounded-full bg-brand-700 px-3 py-1 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50"
                        disabled={completeMutation.isPending}
                        onClick={() => {
                          setError(null);
                          completeMutation.mutate(task.id);
                        }}
                        type="button"
                      >
                        {completeMutation.isPending ? "Saving…" : "Complete"}
                      </button>
                    ) : null}
                    <button
                      className="rounded-full bg-rose-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        setError(null);
                        deleteMutation.mutate(task.id);
                      }}
                      type="button"
                    >
                      {deleteMutation.isPending ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
