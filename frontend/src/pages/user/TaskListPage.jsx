import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { completeTask, deleteTask, getTasks } from "../../api/tasks";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../utils/format";

export default function TaskListPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "list", user?.id],
    queryFn: getTasks,
  });

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  if (isLoading) return <LoadingSpinner label="Loading tasks" />;

  const tasks = data?.results || data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-slate-900">Tasks</h1>
        <Link className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white" to="/tasks/new">
          Create task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Create your first task to start planning." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <article key={task.id} className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl text-slate-900">{task.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{task.description || "No description"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-brand-100 px-2 py-1 text-brand-800">{task.priority}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{task.status}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                      {formatDateTime(task.start_time)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    className="rounded-full border border-brand-700 px-3 py-1 text-sm font-semibold text-brand-700"
                    to={`/tasks/${task.id}/edit`}
                  >
                    Edit
                  </Link>
                  {task.status !== "completed" ? (
                    <button
                      className="rounded-full bg-brand-700 px-3 py-1 text-sm font-semibold text-white"
                      onClick={() => completeMutation.mutate(task.id)}
                      type="button"
                    >
                      Complete
                    </button>
                  ) : null}
                  <button
                    className="rounded-full bg-rose-600 px-3 py-1 text-sm font-semibold text-white"
                    onClick={() => deleteMutation.mutate(task.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
