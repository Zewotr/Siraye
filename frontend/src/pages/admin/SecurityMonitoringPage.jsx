import { useQuery } from "@tanstack/react-query";

import { getSecurityLogs } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatDateTime } from "../../utils/format";

export default function SecurityMonitoringPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "security"], queryFn: getSecurityLogs });

  if (isLoading) return <LoadingSpinner label="Loading security logs" />;

  const logs = data?.results || data || [];

  return (
    <article className="overflow-x-auto rounded-2xl bg-white p-4 shadow-soft">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-slate-500">
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Event</th>
            <th className="px-3 py-2">User</th>
            <th className="px-3 py-2">IP</th>
            <th className="px-3 py-2">Path</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr className="border-b border-slate-100" key={log.id}>
              <td className="px-3 py-3 text-slate-700">{formatDateTime(log.created_at)}</td>
              <td className="px-3 py-3 font-semibold text-slate-900">{log.event_type}</td>
              <td className="px-3 py-3 text-slate-700">{log.user_email || "Anonymous"}</td>
              <td className="px-3 py-3 text-slate-700">{log.ip_address || "-"}</td>
              <td className="px-3 py-3 text-slate-700">{log.path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
