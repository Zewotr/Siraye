import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createTask, getTask, updateTask } from "../../api/tasks";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";

const initialState = {
  title: "",
  description: "",
  priority: "none",
  start_time: "",
  end_time: "",
  status: "pending",
};

export default function TaskFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);

  const { data, isLoading } = useQuery({
    queryKey: ["task", id, user?.id],
    queryFn: () => getTask(id),
    enabled: editing,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      title: data.title,
      description: data.description,
      priority: data.priority,
      start_time: data.start_time.slice(0, 16),
      end_time: data.end_time.slice(0, 16),
      status: data.status,
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload) => (editing ? updateTask(id, payload) : createTask(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate("/tasks");
    },
  });

  if (editing && isLoading) return <LoadingSpinner label="Loading task" />;

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-3xl text-slate-900">{editing ? "Edit task" : "Create task"}</h1>
        <Link className="text-sm text-brand-700" to="/tasks">
          Back to tasks
        </Link>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="title">
            Title
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            id="title"
            name="title"
            onChange={handleChange}
            required
            value={form.title}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="description">
            Description
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            id="description"
            name="description"
            onChange={handleChange}
            rows={4}
            value={form.description}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="priority">
              Priority
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              id="priority"
              name="priority"
              onChange={handleChange}
              value={form.priority}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="status">
              Status
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              id="status"
              name="status"
              onChange={handleChange}
              value={form.status}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="start_time">
              Start time
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              id="start_time"
              name="start_time"
              onChange={handleChange}
              required
              type="datetime-local"
              value={form.start_time}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="end_time">
              End time
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              id="end_time"
              name="end_time"
              onChange={handleChange}
              required
              type="datetime-local"
              value={form.end_time}
            />
          </div>
        </div>

        <button
          className="rounded-full bg-brand-700 px-5 py-2 font-semibold text-white"
          disabled={mutation.isPending}
          type="submit"
        >
          {mutation.isPending ? "Saving..." : editing ? "Update task" : "Create task"}
        </button>

        {mutation.isError ? (
          <p className="text-sm text-rose-700">{mutation.error.response?.data?.detail || "Failed to save task."}</p>
        ) : null}
      </form>
    </div>
  );
}
