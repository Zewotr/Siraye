import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getSystemStats } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatCard from "../../components/StatCard";
import { formatBytes } from "../../utils/format";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: getSystemStats });

  if (isLoading) return <LoadingSpinner label="Loading admin analytics" />;

  const chartData = [
    { key: "Total Users", value: data.total_users },
    { key: "Active Users", value: data.active_users },
    { key: "Tasks Created", value: data.tasks_created },
    { key: "Completed Today", value: data.tasks_completed_today },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={data.total_users} />
        <StatCard label="Active users" value={data.active_users} />
        <StatCard label="Tasks created" value={data.tasks_created} />
        <StatCard label="Storage usage" value={formatBytes(data.system_storage_usage_bytes)} />
      </div>

      <article className="rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="font-heading text-xl text-slate-900">Platform Snapshot</h2>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="key" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#3d8d81" fill="#d9efea" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
