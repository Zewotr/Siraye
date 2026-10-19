import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { createTask, getTask, updateTask } from "../../api/tasks";
import Icon from "../../components/Icon";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";

function formatDateTimeForInput(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function formatError(err, fallback = "Failed to save task.") {
  if (!err) return fallback;
  const data = err.response?.data;
  if (!data) return err.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      if (Array.isArray(val)) return `${firstKey}: ${val[0]}`;
      if (typeof val === "string") return `${firstKey}: ${val}`;
    }
  }
  return fallback;
}

export default function TaskFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { projects } = useWorkspace();

  const queryProjectId = searchParams.get("project");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    project: queryProjectId || "",
    status_id: "",
    status: "todo",
    due_date: "",
    start_time: "",
    end_time: "",
  });
  const [error, setError] = useState("");

  const { data: taskData, isLoading } = useQuery({
    queryKey: ["task", id, user?.id],
    queryFn: () => getTask(id),
    enabled: editing,
  });

  // When editing, populate form from existing task
  useEffect(() => {
    if (!taskData) return;
    setForm({
      title: taskData.title || "",
      description: taskData.description || "",
      priority: taskData.priority || "none",
      project: String(taskData.project?.id || taskData.project || ""),
      status_id: String(taskData.status?.id || ""),
      status: taskData.status?.category || taskData.status?.key || "todo",
      due_date: formatDateTimeForInput(taskData.due_date),
      start_time: formatDateTimeForInput(taskData.start_time),
      end_time: formatDateTimeForInput(taskData.end_time),
    });
  }, [taskData]);

  // Set default project if creating and not yet selected
  useEffect(() => {
    if (!editing && !form.project && projects.length > 0) {
      const defaultProj = projects[0];
      setForm((prev) => ({
        ...prev,
        project: String(defaultProj.id),
        status_id: String(defaultProj.statuses?.find((s) => s.category === "todo")?.id || defaultProj.statuses?.[0]?.id || ""),
      }));
    }
  }, [editing, form.project, projects]);

  const selectedProject = projects.find((p) => String(p.id) === String(form.project)) || null;

  const mutation = useMutation({
    mutationFn: (payload) => (editing ? updateTask(id, payload) : createTask(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/tasks");
    },
    onError: (err) => {
      setError(formatError(err, "Failed to save task. Please check the fields and try again."));
    },
  });

  if (editing && isLoading) return <LoadingSpinner label="Loading task" />;

  function handleChange(event) {
    const { name, value } = event.target;
    setError("");
    setForm((current) => {
      const updated = { ...current, [name]: value };
      // If project changed, update status_id to matching project's default status
      if (name === "project") {
        const proj = projects.find((p) => String(p.id) === String(value));
        if (proj?.statuses?.length) {
          const todoStatus = proj.statuses.find((s) => s.category === "todo") || proj.statuses[0];
          updated.status_id = String(todoStatus.id);
        } else {
          updated.status_id = "";
        }
      }
      return updated;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
    };

    if (form.project) {
      payload.project = Number(form.project);
    }
    if (form.status_id) {
      payload.status_id = Number(form.status_id);
    }
    if (form.start_time) {
      payload.start_time = new Date(form.start_time).toISOString();
    } else {
      payload.start_time = null;
    }
    if (form.end_time) {
      payload.end_time = new Date(form.end_time).toISOString();
    } else {
      payload.end_time = null;
    }
    if (form.due_date) {
      payload.due_date = new Date(form.due_date).toISOString();
    } else if (payload.end_time) {
      payload.due_date = payload.end_time;
    } else if (payload.start_time) {
      payload.due_date = payload.start_time;
    } else {
      payload.due_date = null;
    }

    setError("");
    mutation.mutate(payload);
  }

  return (
    <div className="mx-auto max-w-3xl animate-enter">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-[#171822] sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {editing ? "Edit Task" : "Create Task"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {editing ? "Update details for this task." : "Plan work with priorities, timelines, and projects."}
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            to="/tasks"
          >
            <Icon name="list" size={14} /> Back to tasks
          </Link>
        </div>

        {error ? (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300">
            <Icon className="mt-0.5 shrink-0 text-rose-500" name="activity" size={15} />
            <span className="flex-1 leading-5">{error}</span>
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="title">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-900"
              id="title"
              name="title"
              onChange={handleChange}
              placeholder="e.g. Redesign navigation bar"
              required
              value={form.title}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="description">
              Description
            </label>
            <textarea
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
              id="description"
              name="description"
              onChange={handleChange}
              placeholder="Add extra context, acceptance criteria, or notes…"
              rows={4}
              value={form.description}
            />
          </div>

          {/* Project & Status Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="project">
                Project
              </label>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
                id="project"
                name="project"
                onChange={handleChange}
                value={form.project}
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.key ? `[${proj.key}] ` : ""}{proj.name}
                  </option>
                ))}
                {projects.length === 0 ? <option value="">General Project (auto-created)</option> : null}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="status_id">
                Status
              </label>
              {selectedProject?.statuses?.length ? (
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="status_id"
                  name="status_id"
                  onChange={handleChange}
                  value={form.status_id}
                >
                  {selectedProject.statuses.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
                  id="status"
                  name="status"
                  onChange={handleChange}
                  value={form.status}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed / Done</option>
                </select>
              )}
            </div>
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="priority">
                Priority
              </label>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
                id="priority"
                name="priority"
                onChange={handleChange}
                value={form.priority}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">No priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="due_date">
                Due Date (Optional)
              </label>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
                id="due_date"
                name="due_date"
                onChange={handleChange}
                type="datetime-local"
                value={form.due_date}
              />
            </div>
          </div>

          {/* Start and End Times Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="start_time">
                Start Time (Optional)
              </label>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
                id="start_time"
                name="start_time"
                onChange={handleChange}
                type="datetime-local"
                value={form.start_time}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="end_time">
                End Time (Optional)
              </label>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-brand-400 dark:focus:bg-slate-900"
                id="end_time"
                name="end_time"
                onChange={handleChange}
                type="datetime-local"
                value={form.end_time}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <Link
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              to="/tasks"
            >
              Cancel
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? (
                <>
                  <Icon className="animate-spin" name="activity" size={16} />
                  Saving…
                </>
              ) : editing ? (
                "Update task"
              ) : (
                "Create task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
