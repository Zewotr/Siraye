import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import LoadingSpinner from "../../components/LoadingSpinner";
import StatCard from "../../components/StatCard";
import { getTasks } from "../../api/tasks";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "dashboard"],
    queryFn: () => getTasks({ page_size: 200 }),
  });

  if (isLoading) return <LoadingSpinner label="Loading dashboard" />;

  const tasks = data?.results || data || [];
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;

  const chartData = [
    { name: "Pending", value: pending },
    { name: "In Progress", value: inProgress },
    { name: "Completed", value: completed },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl text-slate-900">Your Workspace</h1>
          <p className="text-sm text-slate-600">Priority-first planning with automatic reminders.</p>
        </div>
        <Link className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white" to="/tasks/new">
          New task
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total tasks" value={tasks.length} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="In progress" value={inProgress} />
      </div>

      <article className="rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="font-heading text-2xl text-slate-900">Task status overview</h2>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3d8d81" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
