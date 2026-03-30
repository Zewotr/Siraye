import { useQuery } from "@tanstack/react-query";

import { getStorageStats } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatBytes } from "../../utils/format";

export default function StorageMonitoringPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "storage"], queryFn: getStorageStats });

  if (isLoading) return <LoadingSpinner label="Loading storage metrics" />;

  return (
    <div className="space-y-4">
      <article className="rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="font-heading text-xl text-slate-900">Storage Summary</h2>
        <p className="mt-2 text-sm text-slate-600">Total usage: {formatBytes(data.total_storage_usage_bytes)}</p>
        <p className="text-sm text-slate-600">Uploaded files: {data.uploaded_files}</p>
      </article>

      <article className="rounded-2xl bg-white p-5 shadow-soft">
        <h3 className="font-heading text-lg text-slate-900">Storage per user</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {Object.entries(data.storage_per_user || {}).map(([email, bytes]) => (
            <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2" key={email}>
              <span>{email}</span>
              <span className="font-semibold">{formatBytes(bytes)}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
