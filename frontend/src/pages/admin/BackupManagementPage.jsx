import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getBackups, runBackup } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatBytes, formatDateTime } from "../../utils/format";

export default function BackupManagementPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "backups"], queryFn: getBackups });

  const runBackupMutation = useMutation({
    mutationFn: runBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "backups"] }),
  });

  if (isLoading) return <LoadingSpinner label="Loading backups" />;

  const backups = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-slate-900">Backup Management</h2>
        <button
          className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => runBackupMutation.mutate()}
          type="button"
        >
          Run backup now
        </button>
      </div>

      <article className="overflow-x-auto rounded-2xl bg-white p-4 shadow-soft">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Download</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((backup) => (
              <tr className="border-b border-slate-100" key={backup.id}>
                <td className="px-3 py-3 text-slate-700">{formatDateTime(backup.created_at)}</td>
                <td className="px-3 py-3 text-slate-700">{backup.file_name}</td>
                <td className="px-3 py-3 text-slate-700">{formatBytes(backup.size_bytes)}</td>
                <td className="px-3 py-3 font-semibold text-slate-900">{backup.status}</td>
                <td className="px-3 py-3 text-slate-700">
                  {backup.public_url ? (
                    <a className="text-brand-700 underline" href={backup.public_url} rel="noreferrer" target="_blank">
                      Download
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
